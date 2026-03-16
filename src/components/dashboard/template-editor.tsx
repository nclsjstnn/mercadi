"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateStoreTemplate } from "@/actions/store-settings";

interface TemplateEditorProps {
  template: string;
}

const VARIABLE_DOCS = `Variables disponibles en tu plantilla Liquid:

{{ business_name }}       - Nombre del negocio
{{ theme.primaryColor }}  - Color primario hex
{{ theme.secondaryColor }}- Color secundario hex
{{ theme.accentColor }}   - Color de acento hex
{{ theme.logoUrl }}       - URL del logo
{{ theme.faviconUrl }}    - URL del favicon
{{ branding }}            - true si muestra branding Mercadi
{{ content }}             - Contenido de la pagina (requerido)

Filtros personalizados:
{{ precio | format_price: "CLP" }} - Formatea precio`;

export function TemplateEditor({ template: initialTemplate }: TemplateEditorProps) {
  const [template, setTemplate] = useState(initialTemplate);
  const [saving, setSaving] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateStoreTemplate(template);
    setSaving(false);
  }

  async function handleReset() {
    setTemplate("");
    setSaving(true);
    await updateStoreTemplate("");
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Plantilla Liquid</Label>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDocs(!showDocs)}
          >
            {showDocs ? "Ocultar referencia" : "Ver referencia"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Restaurar por defecto
          </Button>
        </div>
      </div>

      {showDocs && (
        <pre className="rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed">
          {VARIABLE_DOCS}
        </pre>
      )}

      <textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        placeholder="Deja vacio para usar la plantilla por defecto..."
        className="h-80 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <p className="text-xs text-muted-foreground">
        {template.length.toLocaleString()} / 50.000 caracteres
      </p>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Guardando..." : "Guardar plantilla"}
      </Button>
    </div>
  );
}
