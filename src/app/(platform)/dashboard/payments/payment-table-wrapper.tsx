"use client";

import { DataTable, type Column } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";

interface TxRow {
  transactionId: string;
  orderId: string;
  amount: string;
  status: string;
  date: string;
}

const columns: Column<TxRow & Record<string, unknown>>[] = [
  {
    key: "transactionId",
    header: "ID",
    render: (row) => (
      <span className="font-mono text-xs">{row.transactionId}</span>
    ),
  },
  {
    key: "orderId",
    header: "Pedido",
    render: (row) => (
      <span className="font-mono text-xs">{row.orderId}</span>
    ),
  },
  { key: "amount", header: "Monto" },
  {
    key: "status",
    header: "Estado",
    render: (row) => <StatusBadge status={row.status} />,
  },
  { key: "date", header: "Fecha", sortable: true },
];

export function PaymentTableWrapper({
  transactions,
}: {
  transactions: TxRow[];
}) {
  return (
    <DataTable
      data={transactions as (TxRow & Record<string, unknown>)[]}
      columns={columns}
      searchKey="orderId"
      searchPlaceholder="Buscar por ID de pedido..."
      filterKey="status"
      filterOptions={[
        { label: "Capturado", value: "captured" },
        { label: "Pendiente", value: "pending" },
        { label: "Fallido", value: "failed" },
      ]}
    />
  );
}
