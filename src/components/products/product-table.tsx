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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Eye } from "lucide-react";

interface Product {
  _id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  status: string;
  category: string;
}

export default function ProductTable({
  products,
  currency = "CLP",
}: {
  products: Product[];
  currency?: string;
}) {
  const columns: Column<Product & Record<string, unknown>>[] = [
    {
      key: "title",
      header: "Titulo",
      sortable: true,
      render: (row) => (
        <Link
          href={`/dashboard/products/${row._id}`}
          className="font-medium hover:underline"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.sku}
        </span>
      ),
    },
    {
      key: "price",
      header: "Precio",
      sortable: true,
      render: (row) => (
        <span>
          {row.compareAtPrice && row.compareAtPrice > row.price && (
            <span className="mr-1 text-xs text-muted-foreground line-through">
              {formatPrice(row.compareAtPrice, currency)}
            </span>
          )}
          <span className="font-medium">{formatPrice(row.price, currency)}</span>
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
    },
    {
      key: "category",
      header: "Categoria",
      render: (row) => row.category || "—",
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
            <DropdownMenuItem render={<Link href={`/dashboard/products/${row._id}`} />}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`/dashboard/products/${row._id}/edit`} />}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      data={products as (Product & Record<string, unknown>)[]}
      columns={columns}
      searchKey="title"
      searchPlaceholder="Buscar productos..."
      filterKey="status"
      filterOptions={[
        { label: "Activo", value: "active" },
        { label: "Borrador", value: "draft" },
        { label: "Archivado", value: "archived" },
      ]}
      filterLabel="Estado"
    />
  );
}
