import { z } from "zod";

export const storeThemeSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color hexadecimal inválido")
    .default("#2563eb"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color hexadecimal inválido")
    .default("#1e40af"),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color hexadecimal inválido")
    .default("#f59e0b"),
  logoUrl: z.string().url().or(z.literal("")).default(""),
  faviconUrl: z.string().url().or(z.literal("")).default(""),
});

export const storeSettingsSchema = z.object({
  enabled: z.boolean(),
  theme: storeThemeSchema,
  template: z.string().max(50000, "La plantilla no puede superar 50.000 caracteres").default(""),
});

export const customDomainSchema = z
  .string()
  .regex(
    /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/,
    "Formato de dominio inválido"
  );
