"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { requireAuth } from "@/lib/auth/guards";

export async function upgradePlan() {
  const session = await requireAuth();

  if (session.user.plan === "pro") {
    return { error: "Ya tienes el plan Pro" };
  }

  await connectDB();

  // TODO: Insert payment verification here (Transbank/MercadoPago) before updating plan
  await User.findByIdAndUpdate(session.user.id, { plan: "pro" });

  revalidatePath("/plans");
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true };
}
