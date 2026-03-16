export const PLAN_LIMITS = {
  free: { maxTenants: 1 },
  pro: { maxTenants: 3 },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const PLAN_DETAILS = {
  free: {
    name: "Free",
    price: 0,
    currency: "CLP",
    period: "mes",
    features: [
      "1 negocio",
      "Productos ilimitados",
      "Catálogo UCP",
      "Proveedor de pago mock",
    ],
  },
  pro: {
    name: "Pro",
    price: 9990,
    currency: "CLP",
    period: "mes",
    features: [
      "Hasta 3 negocios",
      "Productos ilimitados",
      "Catálogo UCP",
      "Proveedores de pago reales (Transbank, MercadoPago)",
      "Soporte prioritario",
    ],
  },
} as const;
