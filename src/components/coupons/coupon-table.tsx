"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils/currency";
import { DataTable, type Column } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, ToggleLeft } from "lucide-react";
import { toggleCouponStatus } from "@/actions/coupons";

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  usageCount: number;
  maxUsageCount?: number | null;
  expiresAt?: string | null;
  status: string;
}

export default function CouponTable({
  coupons,
  currency = "CLP",
}: {
  coupons: Coupon[];
  currency?: string;
}) {
  const columns: Column<Coupon & Record<string, unknown>>[] = [
    {
      key: "code",
      header: "Código",
      sortable: true,
      render: (row) => (
        <Link
          href={`/dashboard/coupons/${row._id}`}
          className="font-mono font-medium hover:underline"
        >
          {row.code}
        </Link>
      ),
    },
    {
      key: "discountType",
      header: "Descuento",
      render: (row) =>
        row.discountType === "fixed"
          ? formatPrice(row.discountValue, currency)
          : `${row.discountValue}%`,
    },
    {
      key: "usageCount",
      header: "Usos",
      render: (row) =>
        row.maxUsageCount != null
          ? `${row.usageCount} / ${row.maxUsageCount}`
          : `${row.usageCount}`,
    },
    {
      key: "expiresAt",
      header: "Expira",
      render: (row) =>
        row.expiresAt
          ? new Date(row.expiresAt).toLocaleDateString("es-CL")
          : "Sin expiración",
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/dashboard/coupons/${row._id}`} />}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleCouponStatus(row._id)}
            >
              <ToggleLeft className="mr-2 h-4 w-4" />
              {row.status === "active" ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      data={coupons as (Coupon & Record<string, unknown>)[]}
      columns={columns}
      searchKey="code"
      searchPlaceholder="Buscar cupones..."
      filterKey="status"
      filterOptions={[
        { label: "Activo", value: "active" },
        { label: "Inactivo", value: "inactive" },
      ]}
      filterLabel="Estado"
    />
  );
}
