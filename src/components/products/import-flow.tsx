"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImportPreviewTable } from "./import-preview-table";
import {
  fetchAndParseSheet,
  executeImport,
  type PreviewResult,
  type ImportResult,
} from "@/actions/import-products";
import type { ImportRow } from "@/lib/validators/product";
import { Upload, Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Step = "input" | "preview" | "result";

export function ImportFlow() {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetchAndParseSheet(url.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error ?? "Error desconocido");
      return;
    }

    setPreview(res);
    setStep("preview");
  }

  async function handleImport() {
    if (!preview?.rows) return;
    const validRows = preview.rows
      .filter((r) => r.valid && r.data)
      .map((r) => r.data as ImportRow);

    if (validRows.length === 0) {
      setError("No hay filas válidas para importar.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await executeImport(validRows);
    setLoading(false);
    setResult(res);
    setStep("result");
  }

  function handleReset() {
    setStep("input");
    setUrl("");
    setError(null);
    setPreview(null);
    setResult(null);
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Input */}
      {step === "input" && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Paso 1: Pegar enlace de Google Sheets</h3>
              <p className="text-sm text-muted-foreground mt-1">
                La hoja debe estar compartida con &quot;Cualquier persona con el enlace&quot;.
                Columnas requeridas: <strong>sku</strong>, <strong>titulo</strong> (o title), <strong>precio</strong> (o price).
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              />
              <Button onClick={handleFetch} disabled={loading || !url.trim()}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Cargar datos
              </Button>
            </div>
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && preview?.rows && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Paso 2: Revisar datos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Verifica que los datos se leyeron correctamente antes de importar.
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="default">{preview.validRows} válidas</Badge>
                {(preview.invalidRows ?? 0) > 0 && (
                  <Badge variant="destructive">{preview.invalidRows} con errores</Badge>
                )}
                <Badge variant="secondary">{preview.totalRows} total</Badge>
              </div>
            </div>

            <ImportPreviewTable rows={preview.rows} />

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || preview.validRows === 0}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Importar {preview.validRows} productos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && result && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <h3 className="text-lg font-medium">
                {result.success ? "Importación completada" : "Error en la importación"}
              </h3>
            </div>

            {result.success ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{result.created}</div>
                  <div className="text-sm text-muted-foreground">Creados</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                  <div className="text-sm text-muted-foreground">Actualizados</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                  <div className="text-sm text-muted-foreground">Errores</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600">{result.error}</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Importar otra hoja
              </Button>
              <Link href="/dashboard/products">
                <Button>Ver productos</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
