"use server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { requireAuth } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { name: string; email: string }) {
  const session = await requireAuth();
  await connectDB();

  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();

  if (!name) {
    return { error: "El nombre es requerido" };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email inválido" };
  }

  // Check email uniqueness if changed
  if (email !== session.user.email) {
    const existing = await User.findOne({
      email,
      _id: { $ne: session.user.id },
    });
    if (existing) {
      return { error: "Este email ya está en uso" };
    }
  }

  await User.findByIdAndUpdate(session.user.id, { name, email });

  revalidatePath("/profile");
  return { success: true };
}
