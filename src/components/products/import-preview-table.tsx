"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ImportRow } from "@/lib/validators/product";

interface PreviewRow {
  rowIndex: number;
  valid: boolean;
  data: ImportRow | null;
  errors: string[];
  raw: Record<string, string | undefined>;
}

export function ImportPreviewTable({ rows }: { rows: PreviewRow[] }) {
  return (
    <div className="border rounded-lg overflow-auto max-h-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Fila</TableHead>
            <TableHead className="w-20">Estado</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Errores</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.rowIndex} className={row.valid ? "" : "bg-red-50 dark:bg-red-950/20"}>
              <TableCell className="font-mono text-sm">{row.rowIndex}</TableCell>
              <TableCell>
                <Badge variant={row.valid ? "default" : "destructive"}>
                  {row.valid ? "OK" : "Error"}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {row.data?.sku ?? row.raw.sku ?? "—"}
              </TableCell>
              <TableCell>{row.data?.title ?? row.raw.title ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.data?.price != null ? `$${row.data.price.toLocaleString("es-CL")}` : "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.data?.stock ?? row.raw.stock ?? "0"}
              </TableCell>
              <TableCell>{row.data?.category ?? row.raw.category ?? "—"}</TableCell>
              <TableCell className="text-sm text-red-600">
                {row.errors.length > 0 ? row.errors.join("; ") : ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
