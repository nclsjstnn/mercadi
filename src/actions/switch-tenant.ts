"use server";

import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { requireAuth } from "@/lib/auth/guards";

export async function switchTenant(tenantId: string) {
  const session = await requireAuth();

  await connectDB();

  // Verify the tenant belongs to this user
  const tenant = await Tenant.findOne({
    _id: tenantId,
    ownerId: session.user.id,
  });

  if (!tenant) {
    return { error: "Negocio no encontrado" };
  }

  // Update user's active tenant
  await User.findByIdAndUpdate(session.user.id, { tenantId: tenant._id });

  return { success: true };
}
