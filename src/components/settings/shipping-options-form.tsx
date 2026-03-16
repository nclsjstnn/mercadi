"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { updateShippingOptions } from "@/actions/shipping-settings";

interface ShippingOption {
  id?: string;
  name: string;
  price: number;
  type: "shipping" | "pickup";
  enabled: boolean;
}

interface ShippingOptionsFormProps {
  initialOptions: ShippingOption[];
}

export default function ShippingOptionsForm({
  initialOptions,
}: ShippingOptionsFormProps) {
  const [options, setOptions] = useState<ShippingOption[]>(initialOptions);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function addOption() {
    setOptions((prev) => [
      ...prev,
      { name: "", price: 0, type: "shipping", enabled: true },
    ]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOption(index: number, field: keyof ShippingOption, value: unknown) {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt))
    );
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateShippingOptions(options);
      if (result.success) {
        setMessage({ type: "success", text: "Opciones de envio guardadas" });
      } else {
        setMessage({ type: "error", text: result.error || "Error al guardar" });
      }
    });
  }

  return (
    <div className="space-y-4">
      {options.map((option, index) => (
        <Card key={option.id || index}>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={option.enabled}
                  onCheckedChange={(checked) =>
                    updateOption(index, "enabled", checked)
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {option.enabled ? "Habilitada" : "Deshabilitada"}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={option.name}
                  onChange={(e) => updateOption(index, "name", e.target.value)}
                  placeholder="Envio estandar"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio (CLP)</Label>
                <Input
                  type="number"
                  value={option.price}
                  onChange={(e) =>
                    updateOption(index, "price", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={option.type}
                  onValueChange={(v) => updateOption(index, "type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipping">Envio</SelectItem>
                    <SelectItem value="pickup">Retiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={addOption}
          disabled={options.length >= 5}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar opcion
        </Button>
        {options.length >= 5 && (
          <span className="text-sm text-muted-foreground">
            Maximo 5 opciones
          </span>
        )}
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
