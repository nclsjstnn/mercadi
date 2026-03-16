"use client";

import { DataTable, type Column } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";

interface AdminOrderRow {
  orderId: string;
  tenantName: string;
  buyerName: string;
  total: string;
  commission: string;
  status: string;
  date: string;
}

const columns: Column<AdminOrderRow & Record<string, unknown>>[] = [
  {
    key: "orderId",
    header: "ID",
    render: (row) => (
      <span className="font-mono text-xs">{row.orderId}</span>
    ),
  },
  { key: "tenantName", header: "Negocio", sortable: true },
  { key: "buyerName", header: "Comprador" },
  { key: "total", header: "Total" },
  { key: "commission", header: "Comision" },
  {
    key: "status",
    header: "Estado",
    render: (row) => <StatusBadge status={row.status} />,
  },
  { key: "date", header: "Fecha", sortable: true },
];

export function AdminOrderTableWrapper({
  orders,
}: {
  orders: AdminOrderRow[];
}) {
  return (
    <DataTable
      data={orders as (AdminOrderRow & Record<string, unknown>)[]}
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
