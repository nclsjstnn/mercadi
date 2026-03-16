import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { Product } from "@/lib/db/models/product";
import { ProductCard } from "@/components/store/product-card";

export default async function StorePLP({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await connectDB();

  const tenant = await Tenant.findOne({
    slug: tenantSlug,
    "store.enabled": true,
    status: "active",
  });
  if (!tenant) return notFound();

  const products = await Product.find({
    tenantId: tenant._id,
    status: "active",
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Productos</h1>
      {products.length === 0 ? (
        <p className="text-center text-gray-500">
          No hay productos disponibles en este momento.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product._id.toString()}
              id={product._id.toString()}
              title={product.title}
              price={product.price}
              compareAtPrice={product.compareAtPrice ?? undefined}
              currency={tenant.locale.currency}
              image={product.images?.[0]}
              category={product.category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
