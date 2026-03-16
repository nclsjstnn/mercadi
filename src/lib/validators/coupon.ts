import { z } from "zod";

export const couponSchema = z
  .object({
    code: z
      .string()
      .min(1, "Código requerido")
      .max(20, "Máximo 20 caracteres")
      .transform((v) => v.toUpperCase().trim()),
    description: z.string().optional().default(""),
    discountType: z.enum(["fixed", "percentage"]),
    discountValue: z.number().int().positive("Valor debe ser positivo"),
    minimumOrderAmount: z.number().int().positive().nullable().optional().default(null),
    maxUsageCount: z.number().int().positive().nullable().optional().default(null),
    expiresAt: z.coerce.date().nullable().optional().default(null),
    status: z.enum(["active", "inactive"]).optional().default("active"),
  })
  .refine(
    (data) => data.discountType !== "percentage" || data.discountValue <= 100,
    {
      message: "Porcentaje de descuento no puede superar 100%",
      path: ["discountValue"],
    }
  );
