"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { requireSuperAdmin } from "@/lib/auth/guards";

async function guard() {
  await requireSuperAdmin();
  await connectDB();
}

export async function setTenantStatus(
  tenantId: string,
  status: "active" | "inactive" | "pending"
) {
  await guard();
  await Tenant.findByIdAndUpdate(tenantId, { status });
  revalidatePath("/admin");
}

export async function setStoreEnabled(tenantId: string, enabled: boolean) {
  await guard();
  await Tenant.findByIdAndUpdate(tenantId, { "store.enabled": enabled });
  revalidatePath("/admin");
}

export async function setPaymentProvider(
  tenantId: string,
  provider: string,
  config: Record<string, string>
) {
  await guard();
  await Tenant.findByIdAndUpdate(tenantId, {
    "payment.provider": provider,
    "payment.providerConfig": config,
  });
  revalidatePath("/admin");
}

export async function setShippingOptionEnabled(
  tenantId: string,
  optionId: string,
  enabled: boolean
) {
  await guard();
  await Tenant.findOneAndUpdate(
    { _id: tenantId, "shipping.options.id": optionId },
    { $set: { "shipping.options.$.enabled": enabled } }
  );
  revalidatePath("/admin");
}

export async function setCommissionRate(tenantId: string, rate: number) {
  await guard();
  await Tenant.findByIdAndUpdate(tenantId, { commissionRate: rate });
  revalidatePath("/admin");
}

export async function setUcpEnabled(tenantId: string, enabled: boolean) {
  await guard();
  await Tenant.findByIdAndUpdate(tenantId, { ucpEnabled: enabled });
  revalidatePath("/admin");
}

export async function setAcpEnabled(tenantId: string, enabled: boolean) {
  await guard();
  await Tenant.findByIdAndUpdate(tenantId, { acpEnabled: enabled });
  revalidatePath("/admin");
}
