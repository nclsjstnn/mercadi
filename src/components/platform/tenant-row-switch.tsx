"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { switchTenant } from "@/actions/switch-tenant";
import { Badge } from "@/components/ui/badge";

interface TenantRowSwitchProps {
  tenantId: string;
  tenantName: string;
  activeTenantId: string;
}

export function TenantRowSwitch({
  tenantId,
  tenantName,
  activeTenantId,
}: TenantRowSwitchProps) {
  const { update: updateSession } = useSession();
  const [switching, setSwitching] = useState(false);

  const isActive = tenantId === activeTenantId;

  async function handleSwitch() {
    if (isActive) return;
    setSwitching(true);
    const result = await switchTenant(tenantId);
    if (result.success) {
      await updateSession({});
      window.location.href = "/dashboard";
      return;
    }
    setSwitching(false);
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSwitch}
        disabled={switching || isActive}
        className="hover:underline disabled:no-underline font-medium text-left"
      >
        {switching ? "Cambiando..." : tenantName}
      </button>
      {isActive && <Badge variant="secondary">Activo</Badge>}
    </span>
  );
}
