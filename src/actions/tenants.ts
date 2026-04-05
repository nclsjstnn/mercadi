"use server";

import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { requireAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { notifyStoreCreated } from "@/lib/emails/notifications";

export async function createTenant(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string).toLowerCase();
  const rut = formData.get("rut") as string;
  const legalName = formData.get("legalName") as string;
  const comuna = formData.get("comuna") as string;
  const region = formData.get("region") as string;
  const ownerId = formData.get("ownerId") as string;

  await Tenant.create({
    name,
    slug,
    rut,
    legalName,
    address: { comuna, region },
    ownerId,
    ucpApiKey: `ucp_${nanoid(32)}`,
    payment: { provider: "mock", providerConfig: {} },
  });

  const owner = await User.findById(ownerId).select("email name").lean();
  if (owner) {
    notifyStoreCreated({
      ownerEmail: owner.email,
      ownerName: owner.name,
      ownerId,
      storeName: name,
      storeSlug: slug,
    }).catch((err) => console.error("[emails] notifyStoreCreated failed:", err));
  }

  revalidatePath("/admin/tenants");
}

export async function updateTenant(tenantId: string, formData: FormData) {
  await requireAdmin();
  await connectDB();

  await Tenant.findByIdAndUpdate(tenantId, {
    name: formData.get("name"),
    commissionRate: parseFloat(formData.get("commissionRate") as string) / 100,
    status: formData.get("status"),
    ucpEnabled: formData.get("ucpEnabled") === "on",
  });

  revalidatePath("/admin/tenants");
}
