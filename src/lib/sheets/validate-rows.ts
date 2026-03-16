import { importRowSchema, type ImportRow } from "@/lib/validators/product";
import type { RawProductRow } from "./parse-rows";

export interface ValidatedRow {
  rowIndex: number;
  valid: boolean;
  data: ImportRow | null;
  errors: string[];
  raw: RawProductRow;
}

export function validateRows(rows: RawProductRow[]): ValidatedRow[] {
  return rows.map((raw, index) => {
    const result = importRowSchema.safeParse(raw);
    if (result.success) {
      return {
        rowIndex: index + 2, // +2: 1-indexed + header row
        valid: true,
        data: result.data,
        errors: [],
        raw,
      };
    }
    return {
      rowIndex: index + 2,
      valid: false,
      data: null,
      errors: result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`
      ),
      raw,
    };
  });
}
