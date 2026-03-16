import { z } from "zod";

export const lineItemSchema = z.object({
  ucpItemId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const createCheckoutSchema = z.object({
  line_items: z.array(lineItemSchema).min(1),
});

export const buyerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  rut: z.string().optional(),
});

export const fulfillmentSchema = z.object({
  type: z.enum(["shipping", "pickup"]),
  address: z
    .object({
      street: z.string().min(1),
      comuna: z.string().min(1),
      region: z.string().min(1),
      postalCode: z.string().optional(),
    })
    .optional(),
});

export const updateCheckoutSchema = z.object({
  buyer: buyerSchema.optional(),
  fulfillment: fulfillmentSchema.optional(),
});
