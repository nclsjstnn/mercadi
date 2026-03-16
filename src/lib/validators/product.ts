import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional().default(""),
  sku: z.string().min(1, "SKU requerido"),
  price: z.number().int().positive("Precio debe ser positivo"),
  compareAtPrice: z.number().int().positive().nullable().optional().default(null),
  images: z.array(z.string().url()).optional().default([]),
  category: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  stock: z.number().int().min(0).optional().default(0),
  intangible: z.boolean().optional().default(false),
  status: z.enum(["active", "draft", "archived"]).optional().default("draft"),
}).refine(
  (data) => !data.compareAtPrice || data.compareAtPrice > data.price,
  { message: "Precio original debe ser mayor al precio de venta", path: ["compareAtPrice"] }
);

/** Schema for CSV import rows — coerces strings to numbers and splits comma-separated fields */
export const importRowSchema = z.object({
  sku: z.string().min(1, "SKU requerido"),
  title: z.string().min(1, "Título requerido"),
  price: z.coerce.number().int("Precio debe ser entero").positive("Precio debe ser positivo"),
  compareAtPrice: z.coerce.number().int().positive().optional(),
  description: z.string().optional().default(""),
  category: z.string().optional().default(""),
  stock: z.coerce.number().int().min(0).optional().default(0),
  intangible: z.coerce.boolean().optional().default(false),
  tags: z
    .string()
    .optional()
    .default("")
    .transform((v) => (v ? v.split(",").map((t) => t.trim()).filter(Boolean) : [])),
  images: z
    .string()
    .optional()
    .default("")
    .transform((v) => (v ? v.split(",").map((u) => u.trim()).filter(Boolean) : [])),
  status: z
    .string()
    .optional()
    .default("draft")
    .transform((v) => {
      const normalized = v.toLowerCase().trim();
      if (["active", "draft", "archived"].includes(normalized)) return normalized;
      return "draft";
    }) as z.ZodType<"active" | "draft" | "archived">,
});

export type ImportRow = z.infer<typeof importRowSchema>;
