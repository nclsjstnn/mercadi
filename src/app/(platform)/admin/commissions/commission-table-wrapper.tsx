"use client";

import { DataTable, type Column } from "@/components/platform/data-table";
import { Badge } from "@/components/ui/badge";

interface CommissionRow {
  tenantName: string;
  totalOrders: number;
  totalRevenue: string;
  totalCommission: string;
  pendingCommission: string;
  totalMerchantPayout: string;
}

const columns: Column<CommissionRow & Record<string, unknown>>[] = [
  {
    key: "tenantName",
    header: "Negocio",
    sortable: true,
    render: (row) => <span className="font-medium">{row.tenantName}</span>,
  },
  { key: "totalOrders", header: "Pedidos", sortable: true },
  { key: "totalRevenue", header: "Ingresos" },
  { key: "totalCommission", header: "Comision Total" },
  {
    key: "pendingCommission",
    header: "Pendiente",
    render: (row) => (
      <Badge variant="secondary">{row.pendingCommission}</Badge>
    ),
  },
  { key: "totalMerchantPayout", header: "Pago al Negocio" },
];

export function CommissionTableWrapper({
  commissions,
}: {
  commissions: CommissionRow[];
}) {
  return (
    <DataTable
      data={commissions as (CommissionRow & Record<string, unknown>)[]}
      columns={columns}
      searchKey="tenantName"
      searchPlaceholder="Buscar negocio..."
    />
  );
}
