import { requireTenant } from "@/lib/auth/guards";
import { PageHeader } from "@/components/platform/page-header";
import { ImportFlow } from "@/components/products/import-flow";

export default async function ImportProductsPage() {
  await requireTenant();

  return (
    <div>
      <PageHeader
        title="Importar Productos"
        description="Importa productos desde una hoja de Google Sheets"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Productos", href: "/dashboard/products" },
          { label: "Importar" },
        ]}
      />
      <ImportFlow />
    </div>
  );
}
