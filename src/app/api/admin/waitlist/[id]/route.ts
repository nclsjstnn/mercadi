import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { WaitlistEntry } from "@/lib/db/models/waitlist-entry";
import { requireAdmin } from "@/lib/auth/guards";
import { generateInviteCode, inviteExpiresAt } from "@/lib/invitations";
import { sendInviteEmail } from "@/lib/invitations/email";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action, adminNotes } = await request.json();

    await connectDB();

    const entry = await WaitlistEntry.findById(id);
    if (!entry) {
      return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
    }

    if (action === "approve") {
      if (entry.status === "converted") {
        return NextResponse.json({ error: "Ya se convirtió en usuario" }, { status: 400 });
      }

      const code = generateInviteCode();
      const baseUrl = process.env.NEXTAUTH_URL ?? "https://mercadi.cl";
      const inviteUrl = `${baseUrl}/register?invite=${code}`;

      entry.status = "approved";
      entry.inviteCode = code;
      entry.inviteExpiresAt = inviteExpiresAt();
      entry.inviteSentAt = new Date();
      if (adminNotes) entry.adminNotes = adminNotes;
      await entry.save();

      try {
        await sendInviteEmail({ to: entry.email, name: entry.name, inviteUrl });
      } catch (emailError) {
        console.error("[waitlist] Email send failed:", emailError);
        // Don't fail the request — entry is already approved, admin can resend
      }

      return NextResponse.json({ success: true, inviteUrl });
    }

    if (action === "reject") {
      entry.status = "rejected";
      if (adminNotes) entry.adminNotes = adminNotes;
      await entry.save();
      return NextResponse.json({ success: true });
    }

    if (action === "note") {
      entry.adminNotes = adminNotes;
      await entry.save();
      return NextResponse.json({ success: true });
    }

    if (action === "resend") {
      if (entry.status !== "approved" || !entry.inviteCode) {
        return NextResponse.json({ error: "Solo se puede reenviar a entradas aprobadas" }, { status: 400 });
      }
      const baseUrl = process.env.NEXTAUTH_URL ?? "https://mercadi.cl";
      const inviteUrl = `${baseUrl}/register?invite=${entry.inviteCode}`;

      // Refresh expiry
      entry.inviteExpiresAt = inviteExpiresAt();
      entry.inviteSentAt = new Date();
      await entry.save();

      await sendInviteEmail({ to: entry.email, name: entry.name, inviteUrl });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (error) {
    console.error("[waitlist PATCH]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
