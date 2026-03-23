import { connectDB } from "@/lib/db/connect";
import { Product, type IProduct } from "@/lib/db/models/product";
import type { ITenant } from "@/lib/db/models/tenant";

interface AcpFeedItem {
  item_id: string;
  title: string;
  description: string;
  url: string;
  brand: string;
  image_url: string;
  additional_image_urls: string;
  price: string;
  sale_price?: string;
  availability: "in_stock" | "out_of_stock";
  target_countries: string;
  store_country: string;
  seller_name: string;
  seller_url: string;
  seller_privacy_policy: string;
  seller_tos: string;
  is_eligible_search: boolean;
  is_eligible_checkout: boolean;
}

function formatPrice(amount: number, currency: string): string {
  // ACP expects format like "15990 CLP" or "29.99 USD"
  const zeroDecimalCurrencies = ["CLP", "JPY", "KRW", "VND"];
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return `${amount} ${currency.toUpperCase()}`;
  }
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function getStoreUrl(tenant: ITenant): string {
  if (tenant.store?.customDomain && tenant.store.customDomainVerified) {
    return `https://${tenant.store.customDomain}`;
  }
  return `https://mercadi.cl/store/${tenant.slug}`;
}

export async function generateProductFeed(
  tenant: ITenant
): Promise<AcpFeedItem[]> {
  await connectDB();

  const products = await Product.find({
    tenantId: tenant._id,
    status: "active",
  });

  const storeUrl = getStoreUrl(tenant);

  return products.map((product: IProduct) => {
    const item: AcpFeedItem = {
      item_id: product.ucpItemId,
      title: product.title,
      description: product.description || product.title,
      url: `${storeUrl}/products/${product.ucpItemId}`,
      brand: product.brand || tenant.name,
      image_url: product.images[0] || "",
      additional_image_urls: product.images.slice(1).join(","),
      price: formatPrice(product.price, tenant.locale.currency),
      availability: product.stock > 0 ? "in_stock" : "out_of_stock",
      target_countries: tenant.locale.country,
      store_country: tenant.locale.country,
      seller_name: tenant.name,
      seller_url: storeUrl,
      seller_privacy_policy: tenant.acpLegalLinks?.privacyPolicy || "",
      seller_tos: tenant.acpLegalLinks?.termsOfService || "",
      is_eligible_search: product.acpEligibleSearch !== false,
      is_eligible_checkout: product.acpEligibleCheckout !== false,
    };

    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      item.sale_price = item.price;
      item.price = formatPrice(product.compareAtPrice, tenant.locale.currency);
    }

    return item;
  });
}

export function feedToCSV(items: AcpFeedItem[]): string {
  if (items.length === 0) return "";

  const headers = Object.keys(items[0]);
  const rows = items.map((item) =>
    headers
      .map((h) => {
        const val = String(item[h as keyof AcpFeedItem] ?? "");
        // Escape CSV values that contain commas, quotes, or newlines
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
