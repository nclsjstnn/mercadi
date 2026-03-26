import { redirect } from "next/navigation";
import { auth } from "./index";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan?: string;
  tenantId?: string;
}

interface AuthSession {
  user: AuthUser;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session as AuthSession;
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    if (session.user.tenantId) redirect("/dashboard");
    redirect("/onboarding");
  }
  return session;
}

export async function requireSuperAdmin(): Promise<AuthSession> {
  const session = await requireAuth();
  const allowed = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes((session.user.email ?? "").toLowerCase())) {
    if (session.user.tenantId) redirect("/dashboard");
    redirect("/login");
  }
  return session;
}

export async function requireTenant(): Promise<AuthSession & { user: AuthUser & { tenantId: string } }> {
  const session = await requireAuth();
  if (session.user.role === "admin") {
    redirect("/admin");
  }
  if (!session.user.tenantId) {
    redirect("/onboarding");
  }
  return session as AuthSession & { user: AuthUser & { tenantId: string } };
}

export async function validateUCPApiKey(
  tenantSlug: string,
  apiKey: string | null
) {
  if (!apiKey) return null;

  await connectDB();
  const tenant = await Tenant.findOne({
    slug: tenantSlug,
    ucpApiKey: apiKey,
    ucpEnabled: true,
    status: "active",
  });

  return tenant;
}

export async function validateACPApiKey(
  tenantSlug: string,
  apiKey: string | null
) {
  if (!apiKey) return null;

  await connectDB();
  const tenant = await Tenant.findOne({
    slug: tenantSlug,
    acpApiKey: apiKey,
    acpEnabled: true,
    status: "active",
  });

  return tenant;
}
