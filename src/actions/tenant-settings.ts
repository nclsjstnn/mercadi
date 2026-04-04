"use server";

import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { requireTenant } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

type SavePaymentProviderInput = {
  environment: "integration" | "production";
  // Transbank production credentials (ignored for integration)
  commerceCode?: string;
  apiKey?: string;
  // MercadoPago production credentials (ignored for integration)
  accessToken?: string;
  publicKey?: string;
  webhookSecret?: string;
};

export async function savePaymentProvider(
  provider: "transbank" | "mercadopago",
  input: SavePaymentProviderInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireTenant();
    await connectDB();

    const tenant = await Tenant.findById(session.user.tenantId);
    if (!tenant) return { success: false, error: "Negocio no encontrado" };

    if (!tenant.payments) tenant.payments = [];

    const idx = tenant.payments.findIndex(
      (p: { provider: string }) => p.provider === provider
    );

    const existing: Record<string, unknown> =
      idx >= 0 ? { ...(tenant.payments[idx].providerConfig as Record<string, unknown>) } : {};

    // Always update the environment field
    existing.environment = input.environment;

    // For production: validate and merge non-empty credential fields
    if (input.environment === "production") {
      if (provider === "transbank") {
        const hasExisting = !!(existing.commerceCode && existing.apiKey);
        const commerceCode = input.commerceCode?.trim();
        const apiKey = input.apiKey?.trim();

        if (!hasExisting && (!commerceCode || !apiKey)) {
          return { success: false, error: "Código de comercio y API Key son requeridos para producción" };
        }
        if (commerceCode) existing.commerceCode = commerceCode;
        if (apiKey) existing.apiKey = apiKey;
      }

      if (provider === "mercadopago") {
        const hasExisting = !!(existing.accessToken && existing.publicKey && existing.webhookSecret);
        const accessToken = input.accessToken?.trim();
        const publicKey = input.publicKey?.trim();
        const webhookSecret = input.webhookSecret?.trim();

        if (!hasExisting && (!accessToken || !publicKey || !webhookSecret)) {
          return { success: false, error: "Access Token, Public Key y Webhook Secret son requeridos para producción" };
        }
        if (accessToken) existing.accessToken = accessToken;
        if (publicKey) existing.publicKey = publicKey;
        if (webhookSecret) existing.webhookSecret = webhookSecret;
      }
    }
    // For integration: platform credentials are injected at payment time — nothing to store

    if (idx >= 0) {
      tenant.payments[idx].providerConfig = existing;
      // Auto-enable when first switching to production with valid creds
      if (input.environment === "production") {
        tenant.payments[idx].enabled = true;
      }
    } else {
      tenant.payments.push({
        provider,
        providerConfig: existing,
        enabled: true,
      });
    }

    tenant.markModified("payments");
    await tenant.save();

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al guardar configuración",
    };
  }
}

export async function togglePaymentProvider(
  provider: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireTenant();
    await connectDB();

    const tenant = await Tenant.findById(session.user.tenantId);
    if (!tenant) return { success: false, error: "Negocio no encontrado" };

    const entry = tenant.payments?.find(
      (p: { provider: string }) => p.provider === provider
    );
    if (!entry) {
      return { success: false, error: `Proveedor '${provider}' no configurado` };
    }

    entry.enabled = enabled;
    await tenant.save();

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al actualizar proveedor",
    };
  }
}
