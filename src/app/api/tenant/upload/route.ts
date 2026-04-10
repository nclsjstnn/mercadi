import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/product";
import { Tenant } from "@/lib/db/models/tenant";
import {
  uploadQuerySchema,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_PRODUCT_IMAGES,
  mimeToExt,
  isVercelBlobUrl,
} from "@/lib/validators/upload";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const tenantId = session.user.tenantId as string;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;
    const productId = (formData.get("productId") as string) || undefined;

    // Validate query params
    const parsed = uploadQuerySchema.safeParse({ type, productId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Usa JPEG, PNG, WebP, GIF o AVIF." },
        { status: 415 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera el tamaño máximo de 4 MB." },
        { status: 413 }
      );
    }

    await connectDB();

    const ext = mimeToExt(file.type);

    if (parsed.data.type === "logo") {
      // Delete old logo blob if it's a Vercel Blob URL
      const tenant = await Tenant.findById(tenantId).select("store.theme.logoUrl").lean();
      const oldLogoUrl = tenant?.store?.theme?.logoUrl;
      if (oldLogoUrl && isVercelBlobUrl(oldLogoUrl)) {
        const { del } = await import("@vercel/blob");
        await del(oldLogoUrl);
      }

      const pathname = `tenants/${tenantId}/logo.${ext}`;
      const blob = await put(pathname, file, {
        access: "public",
        contentType: file.type,
        allowOverwrite: true,
      });

      return NextResponse.json({ url: blob.url });
    }

    // product-image
    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    const product = await Product.findOne({
      _id: productId,
      tenantId,
    }).select("images");

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 403 });
    }

    if (product.images.length >= MAX_PRODUCT_IMAGES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_PRODUCT_IMAGES} imágenes por producto.` },
        { status: 422 }
      );
    }

    const { randomUUID } = await import("crypto");
    const pathname = `tenants/${tenantId}/products/${productId}/${randomUUID()}.${ext}`;
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[upload] error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
