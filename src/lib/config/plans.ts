export const PLAN_LIMITS = {
  free: { maxTenants: 1, customDomain: false, removeBranding: false, maxCollaboratorsPerTenant: 0 },
  pro: { maxTenants: 3, customDomain: true, removeBranding: true, maxCollaboratorsPerTenant: 5 },
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
      "Tienda publica con branding Mercadi",
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
      "Tienda publica sin branding",
      "Dominio personalizado",
      "Hasta 5 colaboradores por negocio",
    ],
  },
} as const;
