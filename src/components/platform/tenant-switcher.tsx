"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { switchTenant } from "@/actions/switch-tenant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown, Plus, Sparkles, Building2, Users, Lock } from "lucide-react";

interface TenantInfo {
  _id: string;
  name: string;
  slug: string;
  isOwner: boolean;
  status?: string;
}

interface TenantSwitcherProps {
  tenants: TenantInfo[];
  activeTenantId: string;
  canCreateMore: boolean;
  plan: string;
}

export function TenantSwitcher({
  tenants,
  activeTenantId,
  canCreateMore,
  plan,
}: TenantSwitcherProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [switching, setSwitching] = useState(false);

  const activeTenant = tenants.find((t) => t._id === activeTenantId);

  async function handleSwitch(tenantId: string) {
    if (tenantId === activeTenantId || switching) return;
    setSwitching(true);
    try {
      const result = await switchTenant(tenantId);
      if (result.success) {
        // Pass data to trigger JWT callback with trigger === "update"
        await updateSession({}).catch(() => {});
        window.location.href = "/dashboard";
        return;
      }
    } catch {
      // Server action failed — reset UI
    }
    setSwitching(false);
  }

  // Single tenant on free plan — just show name, no dropdown
  if (tenants.length <= 1 && !canCreateMore) {
    return (
      <div className="flex items-center gap-2 rounded-md border px-3 py-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="truncate text-sm font-medium">
          {activeTenant?.name || "Mi Negocio"}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
        disabled={switching}
      >
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-medium">
          {activeTenant?.name || "Mi Negocio"}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {tenants.map((tenant) => {
          const isInactive = tenant.status === "inactive";
          return (
            <DropdownMenuItem
              key={tenant._id}
              onClick={() => !isInactive && handleSwitch(tenant._id)}
              className={isInactive ? "opacity-60 cursor-default" : undefined}
            >
              <Check
                className={`mr-2 h-4 w-4 shrink-0 ${
                  tenant._id === activeTenantId ? "opacity-100" : "opacity-0"
                }`}
              />
              <span className="flex-1 truncate">{tenant.name}</span>
              {isInactive ? (
                <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Inactivo
                </span>
              ) : !tenant.isOwner ? (
                <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Colaborador
                </span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
        {canCreateMore && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/onboarding")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear otro negocio
            </DropdownMenuItem>
          </>
        )}
        {!canCreateMore && plan === "free" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/plans")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade a Pro
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
