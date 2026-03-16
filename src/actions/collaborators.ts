"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { CollaborationInvite } from "@/lib/db/models/collaboration-invite";
import { requireAuth, requireTenant } from "@/lib/auth/guards";
import { getTenantAccessLevel } from "@/lib/auth/tenant-access";
import { inviteCollaboratorSchema } from "@/lib/validators/collaborator";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plans";

async function requireTenantOwner() {
  const session = await requireTenant();
  await connectDB();
  const level = await getTenantAccessLevel(session.user.id, session.user.tenantId);
  if (level !== "owner") {
    throw new Error("Solo el dueño puede realizar esta accion");
  }
  return session;
}

export async function inviteCollaborator(email: string) {
  const session = await requireTenantOwner();
  await connectDB();

  const parsed = inviteCollaboratorSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const normalizedEmail = parsed.data.email;

  // Prevent self-invite
  const owner = await User.findById(session.user.id).select("email plan").lean();
  if (!owner) return { error: "Usuario no encontrado" };
  if (owner.email === normalizedEmail) {
    return { error: "No puedes invitarte a ti mismo" };
  }

  // Check plan
  const plan = (owner.plan || "free") as PlanType;
  const maxCollabs = PLAN_LIMITS[plan].maxCollaboratorsPerTenant;
  if (maxCollabs === 0) {
    return { error: "Upgrade a Pro para invitar colaboradores" };
  }

  const tenant = await Tenant.findById(session.user.tenantId)
    .select("collaborators")
    .lean();
  if (!tenant) return { error: "Negocio no encontrado" };

  const currentCollabs = tenant.collaborators?.length || 0;
  const pendingInvites = await CollaborationInvite.countDocuments({
    tenantId: session.user.tenantId,
    status: "pending",
  });

  if (currentCollabs + pendingInvites >= maxCollabs) {
    return { error: `Maximo ${maxCollabs} colaboradores alcanzado` };
  }

  // Check if already a collaborator
  const existingUser = await User.findOne({ email: normalizedEmail }).select("_id").lean();
  if (existingUser && tenant.collaborators?.some((c) => c.toString() === existingUser._id.toString())) {
    return { error: "Este usuario ya es colaborador" };
  }

  // Check for existing pending invite
  const existingInvite = await CollaborationInvite.findOne({
    tenantId: session.user.tenantId,
    invitedEmail: normalizedEmail,
    status: "pending",
  });
  if (existingInvite) {
    return { error: "Ya existe una invitacion pendiente para este email" };
  }

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await CollaborationInvite.create({
    tenantId: session.user.tenantId,
    invitedEmail: normalizedEmail,
    invitedBy: session.user.id,
    token,
    status: "pending",
    expiresAt,
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://mercadi.cl";
  const inviteLink = `${baseUrl}/invite/${token}`;

  revalidatePath("/dashboard/settings");
  return { success: true, inviteLink };
}

export async function revokeCollaborator(userId: string) {
  const session = await requireTenantOwner();
  await connectDB();

  await Tenant.findByIdAndUpdate(session.user.tenantId, {
    $pull: { collaborators: userId },
  });

  // If the collaborator's active tenantId points to this tenant, clear it
  const user = await User.findById(userId).select("tenantId").lean();
  if (user?.tenantId?.toString() === session.user.tenantId) {
    await User.findByIdAndUpdate(userId, { $unset: { tenantId: 1 } });
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function cancelInvite(inviteId: string) {
  const session = await requireTenantOwner();
  await connectDB();

  await CollaborationInvite.findOneAndUpdate(
    { _id: inviteId, tenantId: session.user.tenantId, status: "pending" },
    { status: "revoked" }
  );

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function acceptInvite(token: string) {
  const session = await requireAuth();
  await connectDB();

  const invite = await CollaborationInvite.findOne({
    token,
    status: "pending",
  });

  if (!invite) {
    return { error: "Invitacion no encontrada o expirada" };
  }

  if (invite.expiresAt < new Date()) {
    return { error: "La invitacion ha expirado" };
  }

  // Check if already a collaborator or owner
  const tenant = await Tenant.findById(invite.tenantId)
    .select("ownerId collaborators")
    .lean();
  if (!tenant) return { error: "Negocio no encontrado" };

  if (tenant.ownerId.toString() === session.user.id) {
    return { error: "Ya eres el dueño de este negocio" };
  }
  if (tenant.collaborators?.some((c) => c.toString() === session.user.id)) {
    // Already a collaborator — just mark invite as accepted
    await CollaborationInvite.findByIdAndUpdate(invite._id, {
      status: "accepted",
      acceptedBy: session.user.id,
    });
    return { success: true };
  }

  // Add to collaborators
  await Tenant.findByIdAndUpdate(invite.tenantId, {
    $addToSet: { collaborators: session.user.id },
  });

  // Update invite
  await CollaborationInvite.findByIdAndUpdate(invite._id, {
    status: "accepted",
    acceptedBy: session.user.id,
  });

  // Set user's active tenant to this tenant
  await User.findByIdAndUpdate(session.user.id, {
    tenantId: invite.tenantId,
  });

  return { success: true };
}
