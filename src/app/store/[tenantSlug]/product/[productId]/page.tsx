import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { Product } from "@/lib/db/models/product";
import { formatPrice } from "@/lib/utils/currency";
import { AddToCartButton } from "@/components/store/add-to-cart-button";

export default async function StorePDP({
  params,
}: {
  params: Promise<{ tenantSlug: string; productId: string }>;
}) {
  const { tenantSlug, productId } = await params;
  await connectDB();

  const tenant = await Tenant.findOne({
    slug: tenantSlug,
    "store.enabled": true,
    status: "active",
  });
  if (!tenant) return notFound();

  const product = await Product.findOne({
    _id: productId,
    tenantId: tenant._id,
    status: "active",
  });
  if (!product) return notFound();

  const productData = {
    productId: product._id.toString(),
    ucpItemId: product.ucpItemId,
    title: product.title,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    image: product.images?.[0],
  };

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Image */}
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg
              className="h-24 w-24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col justify-center">
        {product.category && (
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-400">
            {product.category}
          </p>
        )}
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{product.title}</h1>
        <div className="mt-3 flex items-center gap-3">
          {hasDiscount && (
            <span className="text-xl text-gray-400 line-through">
              {formatPrice(product.compareAtPrice!, tenant.locale.currency)}
            </span>
          )}
          <span
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: "var(--store-primary)" }}
          >
            {formatPrice(product.price, tenant.locale.currency)}
          </span>
          {hasDiscount && (
            <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-sm font-bold text-white">
              -{discountPct}%
            </span>
          )}
        </div>
        {product.description && (
          <p className="mt-4 leading-relaxed text-gray-600">
            {product.description}
          </p>
        )}
        <div className="mt-4 text-sm text-gray-500">
          {product.stock > 0 ? (
            <span className="text-green-600">
              {product.stock} en stock
            </span>
          ) : (
            <span className="text-red-500">Sin stock</span>
          )}
        </div>
        <div className="mt-6">
          {product.stock > 0 && <AddToCartButton product={productData} />}
        </div>
      </div>
    </div>
  );
}
