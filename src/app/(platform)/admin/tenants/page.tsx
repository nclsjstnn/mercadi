"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/platform/empty-state";
import { StatusBadge } from "@/components/platform/status-badge";
import { DataTable, type Column } from "@/components/platform/data-table";
import { Building2, Plus, ExternalLink } from "lucide-react";

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  rut: string;
  status: string;
  commissionRate: number;
  ucpEnabled: boolean;
  ownerPlan?: string;
  store?: { enabled?: boolean };
}

const PLAN_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  pro: "default",
  starter: "secondary",
  free: "outline",
};

const columns: Column<Tenant & Record<string, unknown>>[] = [
  {
    key: "name",
    header: "Nombre",
    sortable: true,
    render: (row) => (
      <div>
        <Link href={`/admin/tenants/${row._id}`} className="font-medium hover:underline">
          {row.name}
        </Link>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-muted-foreground font-mono">{row.slug}</span>
          <Link
            href={`/store/${row.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary"
            title="Ver tienda"
          >
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    ),
  },
  {
    key: "ownerPlan",
    header: "Plan",
    render: (row) => {
      const plan = (row.ownerPlan as string) || "free";
      return (
        <Badge variant={PLAN_VARIANT[plan] ?? "outline"} className="text-xs capitalize">
          {plan}
        </Badge>
      );
    },
  },
  {
    key: "rut",
    header: "RUT",
    render: (row) => (
      <span className="font-mono text-xs">{row.rut}</span>
    ),
  },
  {
    key: "status",
    header: "Estado",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "commissionRate",
    header: "Comision",
    render: (row) => `${(row.commissionRate * 100).toFixed(1)}%`,
  },
  {
    key: "ucpEnabled",
    header: "UCP",
    render: (row) => (
      <StatusBadge status={row.ucpEnabled ? "active" : "inactive"} />
    ),
  },
];

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((r) => r.json())
      .then((data) => setTenants(data.tenants || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Negocios"
        description="Gestiona los negocios registrados en la plataforma"
      >
        <Link href="/admin/tenants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Crear Negocio
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        data={tenants as (Tenant & Record<string, unknown>)[]}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Buscar negocios..."
        filterKey="status"
        filterOptions={[
          { label: "Activo", value: "active" },
          { label: "Pendiente", value: "pending" },
          { label: "Inactivo", value: "inactive" },
        ]}
        loading={loading}
        emptyState={
          <EmptyState
            icon={Building2}
            title="Sin negocios"
            description="No hay negocios registrados en la plataforma."
            action={
              <Link href="/admin/tenants/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Negocio
                </Button>
              </Link>
            }
          />
        }
      />
    </div>
  );
}
