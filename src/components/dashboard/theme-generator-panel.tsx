"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateStoreTheme, resetStoreTheme, type GeneratedTheme } from "@/actions/store-theme";

interface ThemeGeneratorPanelProps {
  tenantSlug: string;
  initialPrompt: string;
  initialTheme: GeneratedTheme | null;
}

const EXAMPLE_PROMPTS = [
  "Panadería artesanal con panes de masa madre, ambiente cálido y rústico",
  "Tienda de ropa femenina moderna, minimalista y elegante",
  "Librería indie con enfoque en literatura latinoamericana, ambiente intelectual",
  "Cafetería especialidad, estilo escandinavo, colores neutros y limpios",
  "Ferretería familiar, confiable, colores sólidos y directos",
];

function GoogleFontLoader({ fonts }: { fonts: string[] }) {
  useEffect(() => {
    const unique = [...new Set(fonts.filter(Boolean))];
    if (unique.length === 0) return;
    const params = unique
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
    const existing = document.querySelector(`link[data-gf-preview]`);
    if (existing) existing.remove();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-gf-preview", "1");
    document.head.appendChild(link);
  }, [fonts]);
  return null;
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-10 w-10 rounded-lg border shadow-sm"
        style={{ backgroundColor: color }}
        title={color}
      />
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{color}</span>
    </div>
  );
}

function ThemePreview({ theme }: { theme: GeneratedTheme }) {
  return (
    <div className="space-y-4 rounded-xl border p-4" style={{ backgroundColor: theme.backgroundColor }}>
      <GoogleFontLoader fonts={[theme.headingFont, theme.bodyFont]} />

      {/* Color palette */}
      <div className="flex flex-wrap gap-3">
        <ColorSwatch color={theme.primaryColor} label="Principal" />
        <ColorSwatch color={theme.secondaryColor} label="Secundario" />
        <ColorSwatch color={theme.accentColor} label="Acento" />
        <ColorSwatch color={theme.backgroundColor} label="Fondo" />
        <ColorSwatch color={theme.surfaceColor} label="Surface" />
        <ColorSwatch color={theme.textColor} label="Texto" />
        <ColorSwatch color={theme.mutedColor} label="Atenuado" />
      </div>

      {/* Mini store preview */}
      <div
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: theme.surfaceColor }}
      >
        <h3
          className="text-lg font-bold"
          style={{
            color: theme.textColor,
            fontFamily: `"${theme.headingFont}", sans-serif`,
          }}
        >
          Vista previa de tu tienda
        </h3>
        <p
          className="text-sm"
          style={{
            color: theme.mutedColor,
            fontFamily: `"${theme.bodyFont}", sans-serif`,
          }}
        >
          Así lucirán los textos y elementos en tu storefront.
        </p>
        <div className="flex gap-2">
          <div
            className="px-4 py-2 text-sm font-semibold text-white"
            style={{
              backgroundColor: theme.primaryColor,
              borderRadius: theme.borderRadius,
            }}
          >
            Agregar al carro
          </div>
          <div
            className="px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: theme.accentColor,
              borderRadius: theme.borderRadius,
              color: theme.textColor,
            }}
          >
            Ver detalle
          </div>
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-1 space-y-1 rounded p-2"
              style={{
                backgroundColor: theme.backgroundColor,
                borderRadius: theme.borderRadius,
                border: `1px solid ${theme.mutedColor}22`,
              }}
            >
              <div className="h-12 rounded" style={{ backgroundColor: `${theme.primaryColor}22` }} />
              <div
                className="text-xs font-semibold truncate"
                style={{ color: theme.textColor, fontFamily: `"${theme.headingFont}", sans-serif` }}
              >
                Producto {i}
              </div>
              <div className="text-xs font-bold" style={{ color: theme.primaryColor }}>
                $12.990
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography info */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Títulos: <strong>{theme.headingFont}</strong></span>
        <span>Cuerpo: <strong>{theme.bodyFont}</strong></span>
        <span>Radio: <strong>{theme.borderRadius}</strong></span>
      </div>
    </div>
  );
}

export function ThemeGeneratorPanel({
  tenantSlug,
  initialPrompt,
  initialTheme,
}: ThemeGeneratorPanelProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [theme, setTheme] = useState<GeneratedTheme | null>(initialTheme);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isResetting, startReset] = useTransition();

  function handleGenerate() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await generateStoreTheme(prompt);
      if (result.ok) {
        setTheme(result.theme);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleReset() {
    startReset(async () => {
      await resetStoreTheme();
      setTheme(null);
      setPrompt("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Prompt input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Describe tu tienda</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Ej: panadería artesanal con panes de masa madre, ambiente cálido y rústico, inspirada en el campo chileno..."
          className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {/* Example prompts */}
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {ex.split(",")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={isPending || !prompt.trim()}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {isPending ? "Generando diseño…" : "Generar con IA"}
        </Button>

        {theme && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isResetting}
              className="gap-1.5 text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar defaults
            </Button>
            <a
              href={`/store/${tenantSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver tienda
            </a>
          </>
        )}

        {saved && (
          <span className="text-sm text-emerald-600">
            ¡Diseño aplicado a tu tienda!
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Preview */}
      {theme && <ThemePreview theme={theme} />}
    </div>
  );
}
