import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/platform/page-header";
import ProductForm from "@/components/products/product-form";
import { createProduct } from "@/actions/products";
import { redirect } from "next/navigation";

export default function NewProductPage() {
  async function handleCreate(formData: FormData) {
    "use server";
    await createProduct(formData);
    redirect("/dashboard/products");
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Nuevo Producto"
        description="Agrega un producto a tu catalogo"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Productos", href: "/dashboard/products" },
          { label: "Nuevo" },
        ]}
      />
      <Card>
        <CardContent className="pt-6">
          <ProductForm action={handleCreate} submitLabel="Crear Producto" />
        </CardContent>
      </Card>
    </div>
  );
}
