import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { PaymentTransaction } from "@/lib/db/models/payment-transaction";
import { requireTenant } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/utils/currency";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/platform/empty-state";
import { StatusBadge } from "@/components/platform/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet } from "lucide-react";
import { PaymentTableWrapper } from "./payment-table-wrapper";

export default async function PaymentsPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  const currency = tenant?.locale?.currency || "CLP";

  const transactions = await PaymentTransaction.find({
    tenantId: session.user.tenantId,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const serialized = transactions.map((tx) => ({
    transactionId: tx.transactionId,
    orderId: tx.orderId,
    amount: formatPrice(tx.amount, currency),
    status: tx.status,
    date: new Date(tx.createdAt).toLocaleDateString("es-CL"),
  }));

  const provider = tenant?.payment?.provider || "mock";

  return (
    <div>
      <PageHeader
        title="Pagos"
        description="Proveedor de pagos y transacciones"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pagos" },
        ]}
      />

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-base">Proveedor de Pago</CardTitle>
            <CardDescription>
              Configuracion actual de procesamiento de pagos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Proveedor:</span>
            <Badge variant="secondary" className="capitalize">
              {provider}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {serialized.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin transacciones"
          description="Las transacciones apareceran aqui cuando se procesen pagos."
        />
      ) : (
        <PaymentTableWrapper transactions={serialized} />
      )}
    </div>
  );
}
