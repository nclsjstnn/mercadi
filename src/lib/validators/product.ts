import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional().default(""),
  sku: z.string().min(1, "SKU requerido"),
  price: z.number().int().positive("Precio debe ser positivo"),
  images: z.array(z.string().url()).optional().default([]),
  category: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  stock: z.number().int().min(0).optional().default(0),
  status: z.enum(["active", "draft", "archived"]).optional().default("draft"),
});
