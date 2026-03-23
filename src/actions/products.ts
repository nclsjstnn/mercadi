"use server";

import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/product";
import { requireTenant } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const session = await requireTenant();
  await connectDB();

  const title = formData.get("title") as string;
  const sku = formData.get("sku") as string;
  const price = parseInt(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string) || 0;
  const category = (formData.get("category") as string) || "";
  const description = (formData.get("description") as string) || "";
  const status = (formData.get("status") as string) || "draft";
  const intangible = formData.get("intangible") === "on";
  const compareAtPriceRaw = formData.get("compareAtPrice") as string;
  const compareAtPrice = compareAtPriceRaw ? parseInt(compareAtPriceRaw) || null : null;

  const brand = (formData.get("brand") as string) || "";
  const acpEligibleSearch = formData.get("acpEligibleSearch") === "on";
  const acpEligibleCheckout = formData.get("acpEligibleCheckout") === "on";

  await Product.create({
    tenantId: session.user!.tenantId,
    title,
    sku,
    ucpItemId: `item_${nanoid(12)}`,
    price,
    compareAtPrice,
    stock,
    category,
    description,
    intangible,
    brand,
    acpEligibleSearch,
    acpEligibleCheckout,
    status,
  });

  revalidatePath("/dashboard/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await requireTenant();
  await connectDB();

  await Product.findOneAndUpdate(
    { _id: productId, tenantId: session.user!.tenantId },
    {
      title: formData.get("title"),
      description: formData.get("description") || "",
      price: parseInt(formData.get("price") as string),
      compareAtPrice: formData.get("compareAtPrice")
        ? parseInt(formData.get("compareAtPrice") as string) || null
        : null,
      stock: parseInt(formData.get("stock") as string) || 0,
      category: formData.get("category") || "",
      intangible: formData.get("intangible") === "on",
      brand: formData.get("brand") || "",
      acpEligibleSearch: formData.get("acpEligibleSearch") === "on",
      acpEligibleCheckout: formData.get("acpEligibleCheckout") === "on",
      status: formData.get("status") || "draft",
    }
  );

  revalidatePath("/dashboard/products");
}

export async function deleteProduct(productId: string) {
  const session = await requireTenant();
  await connectDB();

  await Product.findOneAndDelete({
    _id: productId,
    tenantId: session.user!.tenantId,
  });

  revalidatePath("/dashboard/products");
}
