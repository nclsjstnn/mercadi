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

const MOCK_PRODUCTS = [
  { title: "Producto ejemplo", category: "Categoría", price: "$12.990" },
  { title: "Otro artículo", category: "Categoría", price: "$8.490", discount: "$11.990" },
  { title: "Tercer producto", category: "Categoría", price: "$24.900" },
];

function ThemePreview({ theme }: { theme: GeneratedTheme }) {
  const headingStyle = { fontFamily: `"${theme.headingFont}", sans-serif` };
  const bodyStyle = { fontFamily: `"${theme.bodyFont}", sans-serif` };
  const cardBorder = `1px solid ${theme.mutedColor}22`;

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

      {/* Mini storefront preview */}
      <div
        className="overflow-hidden rounded-lg"
        style={{ backgroundColor: theme.backgroundColor, border: cardBorder }}
      >
        {/* Header — mirrors StoreHeader */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            backgroundColor: theme.surfaceColor,
            borderBottom: cardBorder,
          }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: theme.primaryColor, ...headingStyle }}
          >
            Mi Tienda
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: theme.mutedColor, ...bodyStyle }}>
              Productos
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: theme.mutedColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-3 gap-2.5 p-3">
          {MOCK_PRODUCTS.map((p, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden"
              style={{
                backgroundColor: theme.surfaceColor,
                borderRadius: theme.borderRadius,
                border: cardBorder,
              }}
            >
              {/* Image area */}
              <div
                className="aspect-square"
                style={{ backgroundColor: `${theme.primaryColor}18` }}
              />
              {/* Card body */}
              <div className="flex flex-col gap-1 p-2">
                <p
                  className="text-[9px] font-medium uppercase tracking-widest"
                  style={{ color: theme.mutedColor, ...bodyStyle }}
                >
                  {p.category}
                </p>
                <p
                  className="text-[10px] font-semibold leading-tight"
                  style={{ color: theme.textColor, ...headingStyle }}
                >
                  {p.title}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-xs font-bold"
                    style={{ color: theme.primaryColor }}
                  >
                    {p.price}
                  </span>
                  {p.discount && (
                    <span
                      className="text-[9px] line-through"
                      style={{ color: theme.mutedColor }}
                    >
                      {p.discount}
                    </span>
                  )}
                </div>
                <div
                  className="mt-1 py-1 text-center text-[9px] font-semibold text-white"
                  style={{
                    backgroundColor: theme.primaryColor,
                    borderRadius: theme.borderRadius,
                  }}
                >
                  Agregar
                </div>
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
