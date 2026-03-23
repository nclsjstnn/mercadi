import { z } from "zod";

export const acpItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const acpAddressSchema = z.object({
  name: z.string().max(256),
  line_one: z.string().max(60),
  line_two: z.string().max(60).optional(),
  city: z.string().max(60),
  state: z.string(),
  country: z.string().length(2),
  postal_code: z.string().max(20),
  phone_number: z.string().optional(),
});

export const acpBuyerSchema = z.object({
  name: z.string().max(256),
  email: z.string().email().max(256),
  phone_number: z.string().optional(),
});

export const acpCreateSessionSchema = z.object({
  items: z.array(acpItemSchema).min(1),
  buyer: acpBuyerSchema.optional(),
  fulfillment_address: acpAddressSchema.optional(),
});

export const acpUpdateSessionSchema = z.object({
  items: z.array(acpItemSchema).optional(),
  buyer: acpBuyerSchema.optional(),
  fulfillment_address: acpAddressSchema.optional(),
  fulfillment_option_id: z.string().optional(),
});

export const acpPaymentDataSchema = z.object({
  token: z.string().min(1),
  provider: z.enum(["stripe", "adyen", "braintree"]),
  billing_address: acpAddressSchema.optional(),
});

export const acpCompleteSessionSchema = z.object({
  buyer: acpBuyerSchema,
  payment_data: acpPaymentDataSchema,
});
