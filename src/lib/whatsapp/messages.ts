import { formatPrice } from "@/lib/utils/currency";
import type { IProduct } from "@/lib/db/models/product";
import type { WaMessage } from "./client";

const PAGE_SIZE = 10;

export function mainMenuMessage(tenantName: string): WaMessage {
  return {
    type: "buttons",
    header: `🛍️ ${tenantName}`,
    body: "¡Hola! ¿En qué te puedo ayudar?",
    footer: "Responde con una opción",
    buttons: [
      { id: "btn_catalog", title: "Ver catálogo" },
      { id: "btn_search", title: "Buscar producto" },
      { id: "btn_store", title: "Ir a la tienda" },
    ],
  };
}

export function categoriesMessage(
  categories: string[],
  tenantName: string
): WaMessage {
  if (categories.length === 0) {
    return {
      type: "text",
      body: "No hay categorías disponibles por el momento.",
    };
  }

  const rows = categories.slice(0, 10).map((cat) => ({
    id: `cat_${cat}`,
    title: cat.slice(0, 24),
  }));

  return {
    type: "list",
    header: tenantName,
    body: "Elige una categoría para explorar:",
    footer: "Toca para seleccionar",
    buttonLabel: "Ver categorías",
    sections: [{ rows }],
  };
}

export function productListMessage(
  products: IProduct[],
  category: string,
  offset: number,
  total: number,
  currency: string
): WaMessage {
  const rows = products.map((p) => ({
    id: `prod_${p._id.toString()}`,
    title: p.title.slice(0, 24),
    description: `${formatPrice(p.price, currency)} · Stock: ${p.stock}`.slice(0, 72),
  }));

  const hasMore = offset + products.length < total;
  if (hasMore) {
    rows.push({
      id: `more_${offset + products.length}`,
      title: "Ver más ›",
      description: `${total - offset - products.length} producto(s) más`,
    });
  }

  return {
    type: "list",
    header: category,
    body: `${total} producto(s) en esta categoría:`,
    footer: "Toca un producto para ver detalles",
    buttonLabel: "Ver productos",
    sections: [{ rows }],
  };
}

export function productDetailMessage(
  product: IProduct,
  currency: string,
  storeUrl: string
): WaMessage {
  const price = formatPrice(product.price, currency);
  const compareAt =
    product.compareAtPrice
      ? ` (antes ${formatPrice(product.compareAtPrice, currency)})`
      : "";
  const stockText = product.stock > 0 ? `✅ En stock (${product.stock})` : "❌ Sin stock";

  return {
    type: "buttons",
    header: product.title.slice(0, 60),
    body: [
      product.description ? product.description.slice(0, 200) : "",
      "",
      `💰 ${price}${compareAt}`,
      stockText,
    ]
      .filter(Boolean)
      .join("\n"),
    footer: "Compra en nuestra tienda web",
    buttons: [
      { id: `buy_${product._id.toString()}`, title: "Comprar ahora" },
      { id: "btn_catalog", title: "Ver catálogo" },
    ],
  };
}

export function productImageMessage(imageUrl: string, title: string): WaMessage {
  return {
    type: "image",
    imageUrl,
    caption: title.slice(0, 1024),
  };
}

export function storeRedirectMessage(storeUrl: string, tenantName: string): WaMessage {
  return {
    type: "text",
    body: `🛒 Visita nuestra tienda para realizar tu compra:\n${storeUrl}`,
  };
}

export function searchPromptMessage(): WaMessage {
  return {
    type: "text",
    body: "🔍 Escribe el nombre o descripción del producto que buscas:",
  };
}

export function searchResultsMessage(
  products: IProduct[],
  query: string,
  currency: string
): WaMessage {
  if (products.length === 0) {
    return {
      type: "buttons",
      body: `No encontré productos para "${query}". ¿Qué deseas hacer?`,
      buttons: [
        { id: "btn_catalog", title: "Ver catálogo" },
        { id: "btn_search", title: "Buscar de nuevo" },
      ],
    };
  }

  const rows = products.slice(0, PAGE_SIZE).map((p) => ({
    id: `prod_${p._id.toString()}`,
    title: p.title.slice(0, 24),
    description: formatPrice(p.price, currency).slice(0, 72),
  }));

  return {
    type: "list",
    header: `Resultados para "${query.slice(0, 20)}"`,
    body: `Encontré ${products.length} producto(s):`,
    footer: "Toca para ver detalles",
    buttonLabel: "Ver resultados",
    sections: [{ rows }],
  };
}

export function unknownMessage(): WaMessage {
  return {
    type: "buttons",
    body: "No entendí tu mensaje. ¿Qué deseas hacer?",
    buttons: [
      { id: "btn_catalog", title: "Ver catálogo" },
      { id: "btn_search", title: "Buscar producto" },
      { id: "btn_store", title: "Ir a la tienda" },
    ],
  };
}

export { PAGE_SIZE };
