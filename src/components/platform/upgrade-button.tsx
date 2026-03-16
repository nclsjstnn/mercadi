"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { upgradePlan } from "@/actions/upgrade-plan";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UpgradeButton() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const result = await upgradePlan();
    if (result.success) {
      await updateSession();
      toast.success("Plan actualizado a Pro");
      router.refresh();
    } else if (result.error) {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button onClick={handleUpgrade} disabled={loading} className="w-full">
      {loading ? "Procesando..." : "Upgrade a Pro"}
    </Button>
  );
}
