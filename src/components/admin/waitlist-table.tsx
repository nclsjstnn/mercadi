"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface WaitlistEntry {
  _id: string;
  name: string;
  email: string;
  businessDescription?: string;
  status: "pending" | "approved" | "rejected" | "converted";
  inviteCode?: string;
  inviteExpiresAt?: string;
  inviteSentAt?: string;
  convertedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<WaitlistEntry["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  converted: "Convertido",
};

const STATUS_VARIANTS: Record<
  WaitlistEntry["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  converted: "secondary",
};

const FILTERS = ["all", "pending", "approved", "rejected", "converted"] as const;
type Filter = (typeof FILTERS)[number];

export function WaitlistTable({
  initialEntries,
}: {
  initialEntries: WaitlistEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const visible = entries.filter((e) => {
    const matchesFilter = filter === "all" || e.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.businessDescription?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  async function act(id: string, action: string, extra?: Record<string, string>) {
    setLoading((l) => ({ ...l, [id]: true }));
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Error desconocido");
        return;
      }
      const data = await res.json();
      setEntries((prev) =>
        prev.map((e) => {
          if (e._id !== id) return e;
          if (action === "approve")
            return { ...e, status: "approved", inviteSentAt: new Date().toISOString(), inviteCode: data.inviteUrl?.split("invite=")[1] };
          if (action === "reject") return { ...e, status: "rejected" };
          if (action === "resend") return { ...e, inviteSentAt: new Date().toISOString() };
          return e;
        })
      );
    } finally {
      setLoading((l) => ({ ...l, [id]: false }));
    }
  }

  function copyInviteLink(entry: WaitlistEntry) {
    if (!entry.inviteCode) return;
    const url = `${window.location.origin}/register?invite=${entry.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(entry._id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === "all" ? "Todos" : STATUS_LABELS[f as WaitlistEntry["status"]]}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        {visible.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Sin resultados
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Solicitante</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Descripción</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Fecha</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => {
                const isExpanded = expanded[entry._id];
                const busy = loading[entry._id];
                return (
                  <>
                    <tr
                      key={entry._id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-black">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-muted-foreground line-clamp-1 max-w-xs">
                          {entry.businessDescription || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANTS[entry.status]}>
                          {STATUS_LABELS[entry.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                        {new Date(entry.createdAt).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {entry.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => act(entry._id, "approve")}
                                className="gap-1 text-green-700 border-green-200 hover:bg-green-50"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => act(entry._id, "reject")}
                                className="gap-1 text-red-700 border-red-200 hover:bg-red-50"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Rechazar
                              </Button>
                            </>
                          )}
                          {entry.status === "approved" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => copyInviteLink(entry)}
                                className="gap-1"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                {copied === entry._id ? "¡Copiado!" : "Link"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => act(entry._id, "resend")}
                                className="gap-1"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Reenviar
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setExpanded((p) => ({ ...p, [entry._id]: !p[entry._id] }))
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${entry._id}-detail`} className="bg-muted/20 border-b last:border-0">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid gap-3 sm:grid-cols-3 text-sm">
                            {entry.inviteSentAt && (
                              <Detail
                                label="Invitación enviada"
                                value={new Date(entry.inviteSentAt).toLocaleString("es-CL")}
                              />
                            )}
                            {entry.inviteExpiresAt && (
                              <Detail
                                label="Expira"
                                value={new Date(entry.inviteExpiresAt).toLocaleString("es-CL")}
                              />
                            )}
                            {entry.convertedAt && (
                              <Detail
                                label="Convertido"
                                value={new Date(entry.convertedAt).toLocaleString("es-CL")}
                              />
                            )}
                            {entry.adminNotes && (
                              <div className="sm:col-span-3">
                                <Detail label="Notas" value={entry.adminNotes} />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {visible.length} de {entries.length} entradas
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-black">{value}</p>
    </div>
  );
}
