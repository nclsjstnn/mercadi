/**
 * Platform-managed integration (sandbox) credentials.
 *
 * Tenants on "integration" mode use these credentials — they never need to
 * supply their own API keys for testing. Only production mode requires
 * tenant-provided credentials.
 *
 * Set these in your .env.local / Vercel environment variables.
 */

export function getPlatformIntegrationConfig(
  provider: "transbank" | "mercadopago"
): Record<string, string> {
  if (provider === "transbank") {
    return {
      commerceCode:
        process.env.TBK_INTEGRATION_COMMERCE_CODE ?? "597055555532",
      apiKey:
        process.env.TBK_INTEGRATION_API_KEY ??
        "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C",
      environment: "integration",
    };
  }

  if (provider === "mercadopago") {
    const accessToken = process.env.MP_INTEGRATION_ACCESS_TOKEN ?? "";
    const publicKey = process.env.MP_INTEGRATION_PUBLIC_KEY ?? "";
    const webhookSecret = process.env.MP_INTEGRATION_WEBHOOK_SECRET ?? "";
    if (!accessToken || !publicKey || !webhookSecret) {
      throw new Error(
        "MercadoPago integration credentials not set. " +
          "Add MP_INTEGRATION_ACCESS_TOKEN, MP_INTEGRATION_PUBLIC_KEY, " +
          "and MP_INTEGRATION_WEBHOOK_SECRET to your environment."
      );
    }
    return { accessToken, publicKey, webhookSecret, environment: "integration" };
  }

  throw new Error(`No platform integration credentials for provider: ${provider}`);
}
