import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { WaitlistEntry } from "@/lib/db/models/waitlist-entry";
import { isInvitationsEnabled, isInviteExpired } from "@/lib/invitations";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, inviteCode } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    await connectDB();

    // ── Invitation gate ──────────────────────────────────────────────────────
    let waitlistEntry = null;
    if (isInvitationsEnabled()) {
      if (!inviteCode) {
        return NextResponse.json(
          { error: "Se requiere una invitación para registrarse" },
          { status: 403 }
        );
      }

      waitlistEntry = await WaitlistEntry.findOne({ inviteCode });
      if (!waitlistEntry) {
        return NextResponse.json(
          { error: "Código de invitación inválido" },
          { status: 403 }
        );
      }
      if (waitlistEntry.status === "converted") {
        return NextResponse.json(
          { error: "Esta invitación ya fue usada" },
          { status: 403 }
        );
      }
      if (
        waitlistEntry.inviteExpiresAt &&
        isInviteExpired(waitlistEntry.inviteExpiresAt)
      ) {
        return NextResponse.json(
          { error: "La invitación ha expirado. Solicita que te reenvíen el link." },
          { status: 403 }
        );
      }
    }

    // ── Duplicate check ──────────────────────────────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 409 }
      );
    }

    // ── Create user ──────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "tenant_owner",
    });

    // ── Mark waitlist entry as converted ─────────────────────────────────────
    if (waitlistEntry) {
      waitlistEntry.status = "converted";
      waitlistEntry.convertedAt = new Date();
      waitlistEntry.convertedUserId = user._id;
      await waitlistEntry.save();
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
