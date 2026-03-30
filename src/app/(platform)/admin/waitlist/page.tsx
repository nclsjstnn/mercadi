import { connectDB } from "@/lib/db/connect";
import { WaitlistEntry } from "@/lib/db/models/waitlist-entry";
import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/platform/page-header";
import { WaitlistTable } from "@/components/admin/waitlist-table";
import { isInvitationsEnabled } from "@/lib/invitations";
import { Badge } from "@/components/ui/badge";

export default async function WaitlistPage() {
  await requireAdmin();
  await connectDB();

  const [pending, approved, rejected, converted] = await Promise.all([
    WaitlistEntry.countDocuments({ status: "pending" }),
    WaitlistEntry.countDocuments({ status: "approved" }),
    WaitlistEntry.countDocuments({ status: "rejected" }),
    WaitlistEntry.countDocuments({ status: "converted" }),
  ]);

  const entries = await WaitlistEntry.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const invitationsEnabled = isInvitationsEnabled();

  return (
    <div>
      <PageHeader
        title="Lista de Espera"
        description="Gestiona las solicitudes de acceso a la plataforma"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Lista de Espera" },
        ]}
      >
        <Badge
          variant={invitationsEnabled ? "default" : "secondary"}
          className="text-sm"
        >
          Invitaciones {invitationsEnabled ? "activadas" : "desactivadas"}
        </Badge>
      </PageHeader>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pendientes" value={pending} color="amber" />
        <StatCard label="Aprobados" value={approved} color="blue" />
        <StatCard label="Rechazados" value={rejected} color="red" />
        <StatCard label="Convertidos" value={converted} color="green" />
      </div>

      <WaitlistTable
        initialEntries={entries.map((e) => ({
          _id: String(e._id),
          name: e.name,
          email: e.email,
          businessDescription: e.businessDescription,
          status: e.status,
          inviteCode: e.inviteCode,
          inviteExpiresAt: e.inviteExpiresAt?.toISOString(),
          inviteSentAt: e.inviteSentAt?.toISOString(),
          convertedAt: e.convertedAt?.toISOString(),
          adminNotes: e.adminNotes,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "amber" | "blue" | "red" | "green";
}) {
  const colors = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    red: "border-red-200 bg-red-50 text-red-700",
    green: "border-green-200 bg-green-50 text-green-700",
  };
  return (
    <div className={`rounded-xl border px-5 py-4 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-0.5 text-sm">{label}</p>
    </div>
  );
}
