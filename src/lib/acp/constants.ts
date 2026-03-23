export const ACP_API_VERSION = "2025-09-12";
export const ACP_SUPPORTED_PAYMENT_PROVIDERS = ["stripe", "adyen", "braintree"] as const;
export type AcpPaymentProvider = (typeof ACP_SUPPORTED_PAYMENT_PROVIDERS)[number];
export const ACP_SUPPORTED_PAYMENT_METHODS = ["card"] as const;
export const ACP_SESSION_TTL_MINUTES = 30;
export const ACP_SIGNATURE_MAX_AGE_SECONDS = 300; // 5 minutes replay protection
