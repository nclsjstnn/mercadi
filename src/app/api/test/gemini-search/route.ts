import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
} from "@google/generative-ai";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/product";
import { Tenant } from "@/lib/db/models/tenant";

const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_products",
    description:
      "Search for products in the tenant's catalog. Returns matching products with prices and availability.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Search query for products",
        },
        category: {
          type: SchemaType.STRING,
          description: "Optional category filter",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_checkout",
    description:
      "Create a new checkout session with selected products. Returns session ID and totals.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        items: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              ucpItemId: { type: SchemaType.STRING },
              quantity: { type: SchemaType.NUMBER },
            },
            required: ["ucpItemId", "quantity"],
          },
          description: "Products to add to checkout",
        },
      },
      required: ["items"],
    },
  },
  {
    name: "update_checkout",
    description:
      "Update checkout session with buyer info and fulfillment details.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        sessionId: { type: SchemaType.STRING },
        buyer: {
          type: SchemaType.OBJECT,
          properties: {
            email: { type: SchemaType.STRING },
            name: { type: SchemaType.STRING },
            phone: { type: SchemaType.STRING },
          },
          required: ["email", "name"],
        },
        fulfillment: {
          type: SchemaType.OBJECT,
          properties: {
            type: {
              type: SchemaType.STRING,
              format: "enum",
              enum: ["shipping", "pickup"],
            },
            address: {
              type: SchemaType.OBJECT,
              properties: {
                street: { type: SchemaType.STRING },
                comuna: { type: SchemaType.STRING },
                region: { type: SchemaType.STRING },
              },
            },
          },
          required: ["type"],
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "complete_checkout",
    description:
      "Complete the checkout session, process payment, and create the order.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        sessionId: { type: SchemaType.STRING },
      },
      required: ["sessionId"],
    },
  },
];

async function executeFunctionCall(
  name: string,
  args: Record<string, unknown>,
  tenantSlug: string,
  baseUrl: string,
  apiKey: string
) {
  const ucpBase = `${baseUrl}/api/ucp/${tenantSlug}/v1`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  switch (name) {
    case "search_products": {
      await connectDB();
      const tenant = await Tenant.findOne({ slug: tenantSlug });
      if (!tenant) return { error: "Tenant not found" };

      const filter: Record<string, unknown> = {
        tenantId: tenant._id,
        status: "active",
      };
      if (args.category) filter.category = args.category;

      const products = await Product.find(filter)
        .limit(20)
        .lean();

      const query = (args.query as string).toLowerCase();
      const matched = products.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );

      return {
        products: (matched.length > 0 ? matched : products).map((p) => ({
          ucpItemId: p.ucpItemId,
          title: p.title,
          description: p.description,
          price: p.price,
          currency: tenant.locale.currency,
          stock: p.stock,
          category: p.category,
        })),
      };
    }
    case "create_checkout": {
      const res = await fetch(`${ucpBase}/checkout-sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          line_items: (args.items as Array<{ ucpItemId: string; quantity: number }>).map((i) => ({
            ucpItemId: i.ucpItemId,
            quantity: i.quantity,
          })),
        }),
      });
      return await res.json();
    }
    case "update_checkout": {
      const res = await fetch(
        `${ucpBase}/checkout-sessions/${args.sessionId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            buyer: args.buyer,
            fulfillment: args.fulfillment,
          }),
        }
      );
      return await res.json();
    }
    case "complete_checkout": {
      const res = await fetch(
        `${ucpBase}/checkout-sessions/${args.sessionId}/complete`,
        { method: "POST", headers }
      );
      return await res.json();
    }
    default:
      return { error: `Unknown function: ${name}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, tenantSlug, history } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    await connectDB();
    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
      systemInstruction: `You are a shopping assistant for "${tenant.name}". Help customers find products, answer questions, and complete purchases. Prices are in ${tenant.locale.currency}. Always be helpful and speak in Spanish (Chile).`,
    });

    const chat = model.startChat({
      history: history || [],
    });

    const ucpExchanges: Array<{
      function: string;
      args: unknown;
      result: unknown;
    }> = [];
    let result = await chat.sendMessage(message);
    let response = result.response;

    // Handle function calls iteratively
    while (response.functionCalls()?.length) {
      const functionCalls = response.functionCalls()!;
      const functionResponses = [];

      for (const fc of functionCalls) {
        const fnResult = await executeFunctionCall(
          fc.name,
          fc.args as Record<string, unknown>,
          tenantSlug,
          new URL(request.url).origin,
          tenant.ucpApiKey
        );

        ucpExchanges.push({
          function: fc.name,
          args: fc.args,
          result: fnResult,
        });

        functionResponses.push({
          functionResponse: {
            name: fc.name,
            response: fnResult,
          },
        });
      }

      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

    return NextResponse.json({
      reply: response.text(),
      ucpExchanges,
    });
  } catch (error) {
    console.error("Gemini search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
