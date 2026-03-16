import { z } from "zod";

export const shippingOptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nombre requerido").max(100),
  price: z.number().int().min(0, "Precio no puede ser negativo"),
  type: z.enum(["shipping", "pickup"]),
  enabled: z.boolean().default(true),
});

export const shippingOptionsSchema = z
  .array(shippingOptionSchema)
  .max(5, "Maximo 5 opciones de envio");
