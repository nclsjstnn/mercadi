"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { requireTenant } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { revalidatePath } from "next/cache";

export interface GeneratedTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  borderRadius: string;
  headingFont: string;
  bodyFont: string;
}

const SYSTEM_PROMPT = `Eres un diseñador experto en tiendas online para pequeños negocios chilenos.
Dado el nombre y una descripción del negocio, genera una paleta de colores armoniosa y tipografía apropiada.
Responde SOLO con JSON válido (sin markdown, sin texto extra) con esta estructura:

{
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "accentColor": "#hex",
  "backgroundColor": "#hex",
  "surfaceColor": "#hex",
  "textColor": "#hex",
  "mutedColor": "#hex",
  "borderRadius": "Npx",
  "headingFont": "Nombre Google Font",
  "bodyFont": "Nombre Google Font"
}

Reglas de diseño:
- Todos los colores en formato hex exacto (#RRGGBB)
- primaryColor: color de marca principal (botones, links, precios)
- secondaryColor: variante más oscura de primaryColor (hover states)
- accentColor: color de acento contrastante (badges, highlights)
- backgroundColor: fondo de la página (generalmente claro o neutro)
- surfaceColor: fondo de cards y panels (ligeramente diferente a backgroundColor)
- textColor: color de texto principal (contraste AA mínimo sobre backgroundColor)
- mutedColor: texto secundario y etiquetas (más suave que textColor)
- borderRadius: entre "0px" (estilo angular) y "16px" (estilo redondeado)
- Paleta coherente y profesional que refleje la personalidad del negocio
- headingFont y bodyFont deben ser Google Fonts disponibles: Inter, Poppins, Nunito, DM Sans, Outfit, Raleway, Playfair Display, Lora, Merriweather, EB Garamond, Josefin Sans, Oswald, Caveat, Dancing Script, Roboto, Open Sans, Montserrat, Source Serif 4, Cormorant Garamond, Jost, Figtree
- Para negocios artesanales/premium: usa serif para headings
- Para negocios modernos/tech: usa sans-serif
- headingFont y bodyFont pueden ser distintos (complementarios) o el mismo`;

async function generateWithGemini(tenantName: string, prompt: string): Promise<GeneratedTheme> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: SYSTEM_PROMPT,
  });
  const result = await model.generateContent(
    `Nombre del negocio: "${tenantName}"\nDescripción: "${prompt}"`
  );
  return JSON.parse(result.response.text()) as GeneratedTheme;
}

async function generateWithOpenAI(tenantName: string, prompt: string): Promise<GeneratedTheme> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Nombre del negocio: "${tenantName}"\nDescripción: "${prompt}"`,
      },
    ],
  });
  return JSON.parse(completion.choices[0].message.content ?? "{}") as GeneratedTheme;
}

export async function generateStoreTheme(
  prompt: string
): Promise<{ ok: true; theme: GeneratedTheme } | { ok: false; error: string }> {
  const session = await requireTenant();

  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return { ok: false, error: "No hay proveedor IA disponible (configura GEMINI_API_KEY u OPENAI_API_KEY)" };
  }

  if (!prompt.trim()) {
    return { ok: false, error: "Describe tu tienda para generar el diseño" };
  }

  try {
    await connectDB();
    const tenant = await Tenant.findById(session.user.tenantId).select("name").lean();
    const tenantName = tenant?.name ?? "Mi tienda";

    let theme: GeneratedTheme;

    if (process.env.GEMINI_API_KEY) {
      try {
        theme = await generateWithGemini(tenantName, prompt.trim());
      } catch (geminiErr) {
        console.warn("[store-theme] Gemini failed, falling back to OpenAI:", geminiErr);
        if (!process.env.OPENAI_API_KEY) throw geminiErr;
        theme = await generateWithOpenAI(tenantName, prompt.trim());
      }
    } else {
      theme = await generateWithOpenAI(tenantName, prompt.trim());
    }

    // Validate required fields and basic hex format
    const colorFields = ["primaryColor", "secondaryColor", "accentColor", "backgroundColor", "surfaceColor", "textColor", "mutedColor"] as const;
    for (const field of colorFields) {
      if (!theme[field] || !/^#[0-9a-fA-F]{6}$/.test(theme[field])) {
        throw new Error(`Color inválido para ${field}: ${theme[field]}`);
      }
    }
    if (!theme.borderRadius || !theme.headingFont || !theme.bodyFont) {
      throw new Error("Respuesta incompleta de la IA");
    }

    // Persist to DB
    await Tenant.findByIdAndUpdate(session.user.tenantId, {
      $set: {
        "store.theme.primaryColor": theme.primaryColor,
        "store.theme.secondaryColor": theme.secondaryColor,
        "store.theme.accentColor": theme.accentColor,
        "store.theme.backgroundColor": theme.backgroundColor,
        "store.theme.surfaceColor": theme.surfaceColor,
        "store.theme.textColor": theme.textColor,
        "store.theme.mutedColor": theme.mutedColor,
        "store.theme.borderRadius": theme.borderRadius,
        "store.theme.headingFont": theme.headingFont,
        "store.theme.bodyFont": theme.bodyFont,
        "store.theme.themePrompt": prompt.trim(),
        "store.theme.themeGeneratedAt": new Date(),
      },
    });

    revalidatePath("/dashboard/store");
    return { ok: true, theme };
  } catch (err) {
    console.error("generateStoreTheme error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al generar el tema",
    };
  }
}

export async function resetStoreTheme(): Promise<void> {
  const session = await requireTenant();
  await connectDB();
  await Tenant.findByIdAndUpdate(session.user.tenantId, {
    $set: {
      "store.theme.primaryColor": "#2563eb",
      "store.theme.secondaryColor": "#1e40af",
      "store.theme.accentColor": "#f59e0b",
      "store.theme.backgroundColor": "",
      "store.theme.surfaceColor": "",
      "store.theme.textColor": "",
      "store.theme.mutedColor": "",
      "store.theme.borderRadius": "",
      "store.theme.headingFont": "",
      "store.theme.bodyFont": "",
      "store.theme.themePrompt": "",
      "store.theme.themeGeneratedAt": null,
    },
  });
}
