import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { WaitlistEntry } from "@/lib/db/models/waitlist-entry";

export async function POST(request: NextRequest) {
  try {
    const { name, email, businessDescription } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    await connectDB();

    const existing = await WaitlistEntry.findOne({ email: email.toLowerCase() });
    if (existing) {
      // Don't reveal too much — just acknowledge
      return NextResponse.json({ success: true }, { status: 200 });
    }

    await WaitlistEntry.create({ name, email, businessDescription });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
