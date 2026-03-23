"use client";

import { DataTable, type Column } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";
import { Badge } from "@/components/ui/badge";

interface OrderRow {
  orderId: string;
  buyerName: string;
  itemCount: number;
  total: string;
  merchantAmount: string;
  source: string;
  status: string;
  date: string;
}

const sourceLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ucp: { label: "UCP", variant: "default" },
  acp: { label: "ACP", variant: "secondary" },
  storefront: { label: "Tienda", variant: "outline" },
};

const columns: Column<OrderRow & Record<string, unknown>>[] = [
  {
    key: "orderId",
    header: "ID",
    render: (row) => (
      <span className="font-mono text-xs">{row.orderId}</span>
    ),
  },
  { key: "buyerName", header: "Comprador", sortable: true },
  {
    key: "source",
    header: "Origen",
    render: (row) => {
      const src = sourceLabels[row.source] || sourceLabels.ucp;
      return <Badge variant={src.variant}>{src.label}</Badge>;
    },
  },
  {
    key: "itemCount",
    header: "Productos",
    render: (row) => `${row.itemCount} items`,
  },
  { key: "total", header: "Total" },
  { key: "merchantAmount", header: "Tu Ingreso" },
  {
    key: "status",
    header: "Estado",
    render: (row) => <StatusBadge status={row.status} />,
  },
  { key: "date", header: "Fecha", sortable: true },
];

export function OrderTableWrapper({ orders }: { orders: OrderRow[] }) {
  return (
    <DataTable
      data={orders as (OrderRow & Record<string, unknown>)[]}
      columns={columns}
      searchKey="buyerName"
      searchPlaceholder="Buscar por comprador..."
      filterKey="status"
      filterOptions={[
        { label: "Pendiente", value: "pending" },
        { label: "Completado", value: "completed" },
        { label: "Cancelado", value: "cancelled" },
      ]}
    />
  );
}
