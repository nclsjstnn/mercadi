import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/product";
import { requireTenant } from "@/lib/auth/guards";
import { updateProduct } from "@/actions/products";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductForm from "@/components/products/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await requireTenant();
  await connectDB();

  const { productId } = await params;
  const product = await Product.findOne({
    _id: productId,
    tenantId: session.user.tenantId,
  }).lean();

  if (!product) {
    redirect("/dashboard/products");
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateProduct(productId, formData);
    redirect("/dashboard/products");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Editar Producto</h1>
      <Card>
        <CardHeader>
          <CardTitle>{product.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            action={handleUpdate}
            defaultValues={{
              title: product.title,
              sku: product.sku,
              description: product.description,
              price: product.price,
              compareAtPrice: product.compareAtPrice ?? null,
              stock: product.stock,
              category: product.category,
              intangible: product.intangible,
              status: product.status,
            }}
            submitLabel="Guardar Cambios"
          />
        </CardContent>
      </Card>
    </div>
  );
}
