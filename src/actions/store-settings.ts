"use server";

import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { requireTenant } from "@/lib/auth/guards";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plans";
import { revalidatePath } from "next/cache";
import { storeThemeSchema, customDomainSchema } from "@/lib/validators/store";

export async function updateStoreSettings(formData: FormData) {
  const session = await requireTenant();
  await connectDB();

  const enabled = formData.get("enabled") === "true";
  const theme = storeThemeSchema.parse({
    primaryColor: formData.get("primaryColor") || "#2563eb",
    secondaryColor: formData.get("secondaryColor") || "#1e40af",
    accentColor: formData.get("accentColor") || "#f59e0b",
    logoUrl: formData.get("logoUrl") || "",
    faviconUrl: formData.get("faviconUrl") || "",
  });

  await Tenant.findByIdAndUpdate(session.user.tenantId, {
    $set: {
      "store.enabled": enabled,
      "store.theme.primaryColor": theme.primaryColor,
      "store.theme.secondaryColor": theme.secondaryColor,
      "store.theme.accentColor": theme.accentColor,
      "store.theme.logoUrl": theme.logoUrl,
      "store.theme.faviconUrl": theme.faviconUrl,
    },
  });

  revalidatePath("/dashboard/store");
}

export async function updateStoreTemplate(template: string) {
  const session = await requireTenant();
  await connectDB();

  if (template.length > 50000) {
    throw new Error("La plantilla no puede superar 50.000 caracteres");
  }

  await Tenant.findByIdAndUpdate(session.user.tenantId, {
    "store.template": template,
  });

  revalidatePath("/dashboard/store");
}

export async function updateCustomDomain(domain: string) {
  const session = await requireTenant();
  await connectDB();

  // Check plan
  const user = await User.findById(session.user.id).select("plan").lean();
  const plan = (user?.plan || "free") as PlanType;
  if (!PLAN_LIMITS[plan].customDomain) {
    throw new Error("Dominio personalizado requiere plan Pro");
  }

  if (domain) {
    customDomainSchema.parse(domain);
  }

  await Tenant.findByIdAndUpdate(session.user.tenantId, {
    "store.customDomain": domain,
    "store.customDomainVerified": false,
  });

  revalidatePath("/dashboard/store");
}

export async function verifyCustomDomain() {
  const session = await requireTenant();
  await connectDB();

  // Placeholder: in production, verify DNS records
  await Tenant.findByIdAndUpdate(session.user.tenantId, {
    "store.customDomainVerified": true,
  });

  revalidatePath("/dashboard/store");
}
