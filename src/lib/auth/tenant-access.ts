import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";

export async function getTenantAccessLevel(
  userId: string,
  tenantId: string
): Promise<"owner" | "collaborator" | null> {
  await connectDB();
  const tenant = await Tenant.findById(tenantId)
    .select("ownerId collaborators")
    .lean();

  if (!tenant) return null;
  if (tenant.ownerId.toString() === userId) return "owner";
  if (tenant.collaborators?.some((c) => c.toString() === userId))
    return "collaborator";
  return null;
}
