import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plans";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/platform/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenants: { _id: string; name: string; slug: string }[] = [];
  let canCreateMore = false;
  let plan: PlanType = "free";

  if (session.user.role === "tenant_owner") {
    await connectDB();
    const dbUser = await User.findById(session.user.id).select("plan").lean();
    plan = ((dbUser?.plan as string) || "free") as PlanType;
    const rawTenants = await Tenant.find({ ownerId: session.user.id })
      .select("_id name slug")
      .lean();
    tenants = rawTenants.map((t) => ({
      _id: t._id.toString(),
      name: t.name,
      slug: t.slug,
    }));
    canCreateMore = tenants.length < PLAN_LIMITS[plan].maxTenants;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={session.user}
        tenants={tenants}
        activeTenantId={session.user.tenantId}
        canCreateMore={canCreateMore}
        plan={plan}
      />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium text-muted-foreground">
            Mercadi.cl
          </span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
