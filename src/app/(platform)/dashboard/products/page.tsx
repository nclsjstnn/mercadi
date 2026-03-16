import Link from "next/link";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/product";
import { Tenant } from "@/lib/db/models/tenant";
import { requireTenant } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/platform/empty-state";
import ProductTable from "@/components/products/product-table";
import { Package, Plus, Upload } from "lucide-react";

export default async function ProductsPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  const products = await Product.find({
    tenantId: session.user.tenantId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const serialized = products.map((p) => ({
    _id: p._id.toString(),
    title: p.title,
    sku: p.sku,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    stock: p.stock,
    status: p.status,
    category: p.category,
  }));

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Administra tu catalogo de productos"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Productos" },
        ]}
      >
        <div className="flex gap-2">
          <Link href="/dashboard/products/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar desde Google Sheets
            </Button>
          </Link>
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </Link>
        </div>
      </PageHeader>

      {serialized.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin productos"
          description="Crea tu primer producto para comenzar a vender a traves de agentes IA."
          action={
            <Link href="/dashboard/products/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Producto
              </Button>
            </Link>
          }
        />
      ) : (
        <ProductTable
          products={serialized}
          currency={tenant?.locale?.currency}
        />
      )}
    </div>
  );
}
