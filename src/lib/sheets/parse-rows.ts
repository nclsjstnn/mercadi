import Papa from "papaparse";

/** Column aliases: Spanish → English canonical name */
const COLUMN_ALIASES: Record<string, string> = {
  titulo: "title",
  title: "title",
  descripcion: "description",
  description: "description",
  precio: "price",
  price: "price",
  categoria: "category",
  category: "category",
  imagenes: "images",
  images: "images",
  estado: "status",
  status: "status",
  sku: "sku",
  stock: "stock",
  tags: "tags",
};

/** Strip accents and normalize to lowercase trimmed string */
function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export interface RawProductRow {
  sku?: string;
  title?: string;
  price?: string;
  description?: string;
  category?: string;
  stock?: string;
  tags?: string;
  images?: string;
  status?: string;
}

export function parseCSV(csvText: string): RawProductRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(
      `Error al parsear CSV: ${result.errors[0].message}`
    );
  }

  // Map original headers to canonical names
  const originalHeaders = result.meta.fields ?? [];
  const headerMap: Record<string, string> = {};
  for (const h of originalHeaders) {
    const normalized = normalizeHeader(h);
    if (COLUMN_ALIASES[normalized]) {
      headerMap[h] = COLUMN_ALIASES[normalized];
    }
  }

  // Check required columns exist
  const mappedColumns = new Set(Object.values(headerMap));
  for (const required of ["sku", "title", "price"]) {
    if (!mappedColumns.has(required)) {
      throw new Error(
        `Columna requerida "${required}" no encontrada. Columnas detectadas: ${originalHeaders.join(", ")}`
      );
    }
  }

  return result.data.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [original, canonical] of Object.entries(headerMap)) {
      mapped[canonical] = row[original] ?? "";
    }
    return mapped as unknown as RawProductRow;
  });
}
