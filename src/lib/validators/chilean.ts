import { z } from "zod";
import { validateRut } from "@/lib/utils/rut";

export const rutSchema = z.string().refine(validateRut, {
  message: "RUT inválido",
});

export const chileanPhoneSchema = z
  .string()
  .regex(/^\+56[2-9]\d{8}$/, "Formato: +56XXXXXXXXX");

export const comunaSchema = z.string().min(2, "Comuna requerida");
export const regionSchema = z.string().min(2, "Región requerida");

export const chileanAddressSchema = z.object({
  street: z.string().optional(),
  comuna: comunaSchema,
  region: regionSchema,
});
