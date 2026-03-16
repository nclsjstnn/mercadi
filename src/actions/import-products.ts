"use server";

import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/product";
import { requireTenant } from "@/lib/auth/guards";
import { parseGoogleSheetsUrl } from "@/lib/sheets/parse-url";
import { parseCSV } from "@/lib/sheets/parse-rows";
import { validateRows, type ValidatedRow } from "@/lib/sheets/validate-rows";
import { revalidatePath } from "next/cache";
import type { ImportRow } from "@/lib/validators/product";

const MAX_ROWS = 500;

export interface PreviewResult {
  success: boolean;
  error?: string;
  rows?: Array<{
    rowIndex: number;
    valid: boolean;
    data: ImportRow | null;
    errors: string[];
    raw: Record<string, string | undefined>;
  }>;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
}

export async function fetchAndParseSheet(url: string): Promise<PreviewResult> {
  await requireTenant();

  let csvUrl: string;
  try {
    const parsed = parseGoogleSheetsUrl(url);
    csvUrl = parsed.csvUrl;
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }

  let csvText: string;
  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) {
      return {
        success: false,
        error: "No se pudo acceder a la hoja. Verifica que esté compartida con \"Cualquier persona con el enlace\".",
      };
    }
    csvText = await res.text();
  } catch {
    return {
      success: false,
      error: "Error de red al descargar la hoja. Inténtalo de nuevo.",
    };
  }

  let rawRows;
  try {
    rawRows = parseCSV(csvText);
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }

  if (rawRows.length === 0) {
    return { success: false, error: "La hoja no contiene filas de datos." };
  }

  if (rawRows.length > MAX_ROWS) {
    return {
      success: false,
      error: `La hoja tiene ${rawRows.length} filas. El máximo permitido es ${MAX_ROWS}.`,
    };
  }

  const validated = validateRows(rawRows);
  const validCount = validated.filter((r) => r.valid).length;

  return {
    success: true,
    rows: validated.map((r) => ({
      ...r,
      raw: r.raw as unknown as Record<string, string | undefined>,
    })),
    totalRows: validated.length,
    validRows: validCount,
    invalidRows: validated.length - validCount,
  };
}

export interface ImportResult {
  success: boolean;
  error?: string;
  created: number;
  updated: number;
  errors: number;
}

export async function executeImport(
  rows: ImportRow[]
): Promise<ImportResult> {
  const session = await requireTenant();
  const tenantId = session.user.tenantId;

  if (rows.length === 0) {
    return { success: false, error: "No hay filas para importar.", created: 0, updated: 0, errors: 0 };
  }

  if (rows.length > MAX_ROWS) {
    return {
      success: false,
      error: `Demasiadas filas (${rows.length}). Máximo: ${MAX_ROWS}.`,
      created: 0,
      updated: 0,
      errors: 0,
    };
  }

  await connectDB();

  // Find existing SKUs for this tenant to distinguish creates vs updates
  const skus = rows.map((r) => r.sku);
  const existing = await Product.find(
    { tenantId, sku: { $in: skus } },
    { sku: 1 }
  ).lean();
  const existingSkus = new Set(existing.map((p) => p.sku));

  const ops = rows.map((row) => ({
    updateOne: {
      filter: { tenantId, sku: row.sku },
      update: {
        $set: {
          title: row.title,
          price: row.price,
          description: row.description,
          category: row.category,
          tags: row.tags,
          images: row.images,
          stock: row.stock,
          status: row.status,
        },
        $setOnInsert: {
          ucpItemId: `item_${nanoid(12)}`,
          tenantId: new mongoose.Types.ObjectId(tenantId),
        },
      },
      upsert: true,
    },
  }));

  try {
    await Product.bulkWrite(ops);
  } catch {
    return {
      success: false,
      error: "Error al guardar en la base de datos. Inténtalo de nuevo.",
      created: 0,
      updated: 0,
      errors: rows.length,
    };
  }

  const created = rows.filter((r) => !existingSkus.has(r.sku)).length;
  const updated = rows.filter((r) => existingSkus.has(r.sku)).length;

  revalidatePath("/dashboard/products");

  return { success: true, created, updated, errors: 0 };
}
