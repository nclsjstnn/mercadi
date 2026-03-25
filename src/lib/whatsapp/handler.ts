import mongoose from "mongoose";
import { WhatsAppConversation } from "@/lib/db/models/whatsapp-conversation";
import { Product } from "@/lib/db/models/product";
import type { ITenant } from "@/lib/db/models/tenant";
import { sendWhatsAppMessage, markAsRead } from "./client";
import {
  mainMenuMessage,
  categoriesMessage,
  productListMessage,
  productDetailMessage,
  productImageMessage,
  storeRedirectMessage,
  searchPromptMessage,
  searchResultsMessage,
  unknownMessage,
  PAGE_SIZE,
} from "./messages";

export interface IncomingMessage {
  messageId: string;
  from: string; // customer phone number
  type: string;
  text?: string;
  interactiveId?: string; // button_reply or list_reply id
  interactiveTitle?: string;
}

const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getStoreUrl(tenant: ITenant, baseUrl: string): string {
  return `${baseUrl}/store/${tenant.slug}`;
}

function ttl(): Date {
  return new Date(Date.now() + CONVERSATION_TTL_MS);
}

export async function handleIncomingMessage(
  msg: IncomingMessage,
  tenant: ITenant,
  baseUrl: string
): Promise<void> {
  const { phoneNumberId, accessToken } = tenant.whatsapp;
  const currency = tenant.locale?.currency ?? "CLP";

  // Mark as read
  await markAsRead(msg.messageId, phoneNumberId, accessToken);

  // Load or create conversation
  const conv = await WhatsAppConversation.findOneAndUpdate(
    { phoneNumber: msg.from, tenantId: tenant._id },
    { $setOnInsert: { phoneNumber: msg.from, tenantId: tenant._id, state: "idle", context: {}, expiresAt: ttl() } },
    { upsert: true, new: true }
  );

  const send = (message: ReturnType<typeof mainMenuMessage>) =>
    sendWhatsAppMessage(msg.from, message, phoneNumberId, accessToken);

  const interactiveId = msg.interactiveId ?? "";
  const text = (msg.text ?? "").trim().toLowerCase();

  // ─── Global shortcuts ────────────────────────────────────────────────────
  if (interactiveId === "btn_store") {
    await send(storeRedirectMessage(getStoreUrl(tenant, baseUrl), tenant.name));
    await WhatsAppConversation.updateOne(
      { _id: conv._id },
      { state: "main_menu", expiresAt: ttl() }
    );
    return;
  }

  if (interactiveId === "btn_catalog" || text === "catálogo" || text === "catalogo" || text === "menu" || text === "menú") {
    await gotoCategories(conv._id, msg.from, tenant, send, currency);
    return;
  }

  if (interactiveId === "btn_search" || text === "buscar" || text === "busca" || text === "search") {
    await send(searchPromptMessage());
    await WhatsAppConversation.updateOne(
      { _id: conv._id },
      { state: "search", expiresAt: ttl() }
    );
    return;
  }

  // ─── State-specific handling ─────────────────────────────────────────────
  switch (conv.state) {
    case "idle":
    case "main_menu": {
      await send(mainMenuMessage(tenant.name));
      await WhatsAppConversation.updateOne(
        { _id: conv._id },
        { state: "main_menu", expiresAt: ttl() }
      );
      break;
    }

    case "browsing": {
      if (interactiveId.startsWith("cat_")) {
        const category = interactiveId.slice(4);
        await gotoProductList(conv._id, msg.from, tenant, category, 0, send, currency);
      } else {
        await send(unknownMessage());
      }
      break;
    }

    case "product_list": {
      if (interactiveId.startsWith("prod_")) {
        const productId = interactiveId.slice(5);
        await gotoProductDetail(conv._id, msg.from, tenant, productId, send, currency, baseUrl);
      } else if (interactiveId.startsWith("more_")) {
        const newOffset = parseInt(interactiveId.slice(5), 10);
        const category = conv.context.selectedCategory ?? "";
        await gotoProductList(conv._id, msg.from, tenant, category, newOffset, send, currency);
      } else {
        await send(unknownMessage());
      }
      break;
    }

    case "product_detail": {
      if (interactiveId.startsWith("buy_")) {
        await send(storeRedirectMessage(getStoreUrl(tenant, baseUrl), tenant.name));
        await WhatsAppConversation.updateOne(
          { _id: conv._id },
          { state: "main_menu", expiresAt: ttl() }
        );
      } else if (interactiveId.startsWith("prod_")) {
        const productId = interactiveId.slice(5);
        await gotoProductDetail(conv._id, msg.from, tenant, productId, send, currency, baseUrl);
      } else {
        await send(unknownMessage());
      }
      break;
    }

    case "search": {
      const rawText = (msg.text ?? "").trim();
      if (!rawText) {
        await send(searchPromptMessage());
        break;
      }
      if (interactiveId.startsWith("prod_")) {
        const productId = interactiveId.slice(5);
        await gotoProductDetail(conv._id, msg.from, tenant, productId, send, currency, baseUrl);
        break;
      }
      // Free-text search: title regex or tag match
      const products = await Product.find({
        tenantId: tenant._id,
        status: "active",
        $or: [
          { title: { $regex: rawText, $options: "i" } },
          { tags: { $elemMatch: { $regex: rawText, $options: "i" } } },
          { description: { $regex: rawText, $options: "i" } },
        ],
      })
        .limit(PAGE_SIZE)
        .lean();

      await send(searchResultsMessage(products as never, rawText, currency));
      if (products.length > 0) {
        await WhatsAppConversation.updateOne(
          { _id: conv._id },
          { state: "product_list", "context.selectedCategory": `búsqueda: ${rawText}`, expiresAt: ttl() }
        );
      }
      break;
    }

    default:
      await send(mainMenuMessage(tenant.name));
      await WhatsAppConversation.updateOne(
        { _id: conv._id },
        { state: "main_menu", expiresAt: ttl() }
      );
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function gotoCategories(
  convId: mongoose.Types.ObjectId,
  from: string,
  tenant: ITenant,
  send: (m: ReturnType<typeof mainMenuMessage>) => Promise<void>,
  _currency: string
) {
  const categories: string[] = await Product.distinct("category", {
    tenantId: tenant._id,
    status: "active",
    category: { $ne: "" },
  });

  if (categories.length === 0) {
    // No categories — go straight to product list
    const products = await Product.find({ tenantId: tenant._id, status: "active" })
      .limit(PAGE_SIZE)
      .lean();
    const total = await Product.countDocuments({ tenantId: tenant._id, status: "active" });
    await send(productListMessage(products as never, "Todos los productos", 0, total, _currency));
    await WhatsAppConversation.updateOne(
      { _id: convId },
      { state: "product_list", "context.selectedCategory": "all", expiresAt: ttl() }
    );
  } else {
    await send(categoriesMessage(categories, tenant.name));
    await WhatsAppConversation.updateOne(
      { _id: convId },
      { state: "browsing", expiresAt: ttl() }
    );
  }
}

async function gotoProductList(
  convId: mongoose.Types.ObjectId,
  from: string,
  tenant: ITenant,
  category: string,
  offset: number,
  send: (m: ReturnType<typeof mainMenuMessage>) => Promise<void>,
  currency: string
) {
  const filter =
    category === "all"
      ? { tenantId: tenant._id, status: "active" }
      : { tenantId: tenant._id, status: "active", category };

  const [products, total] = await Promise.all([
    Product.find(filter).skip(offset).limit(PAGE_SIZE).lean(),
    Product.countDocuments(filter),
  ]);

  await send(productListMessage(products as never, category, offset, total, currency));
  await WhatsAppConversation.updateOne(
    { _id: convId },
    {
      state: "product_list",
      "context.selectedCategory": category,
      "context.productListOffset": offset,
      expiresAt: ttl(),
    }
  );
}

async function gotoProductDetail(
  convId: mongoose.Types.ObjectId,
  from: string,
  tenant: ITenant,
  productId: string,
  send: (m: ReturnType<typeof mainMenuMessage>) => Promise<void>,
  currency: string,
  baseUrl: string
) {
  const product = await Product.findOne({
    _id: productId,
    tenantId: tenant._id,
    status: "active",
  }).lean();

  if (!product) {
    await send({ type: "text", body: "Producto no encontrado." });
    return;
  }

  // Send image first if available
  if (product.images?.[0]) {
    await send(productImageMessage(product.images[0], product.title));
  }

  await send(productDetailMessage(product as never, currency, getStoreUrl(tenant, baseUrl)));
  await WhatsAppConversation.updateOne(
    { _id: convId },
    { state: "product_detail", "context.selectedProductId": productId, expiresAt: ttl() }
  );
}
