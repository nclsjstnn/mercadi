"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface CouponFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    code?: string;
    description?: string;
    discountType?: "fixed" | "percentage";
    discountValue?: number;
    minimumOrderAmount?: number | null;
    maxUsageCount?: number | null;
    expiresAt?: string | null;
    status?: string;
  };
  submitLabel?: string;
}

export default function CouponForm({
  action,
  defaultValues = {},
  submitLabel = "Guardar",
}: CouponFormProps) {
  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Información del cupón
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              name="code"
              required
              placeholder="Ej: VERANO10"
              className="uppercase"
              defaultValue={defaultValues.code}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              name="status"
              defaultValue={defaultValues.status || "active"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Descripción interna del cupón"
            defaultValue={defaultValues.description}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Configuración del descuento
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discountType">Tipo de descuento</Label>
            <Select
              name="discountType"
              defaultValue={defaultValues.discountType || "percentage"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                <SelectItem value="fixed">Monto fijo (CLP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountValue">Valor del descuento</Label>
            <Input
              id="discountValue"
              name="discountValue"
              type="number"
              required
              placeholder="Ej: 10"
              defaultValue={defaultValues.discountValue}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Restricciones
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minimumOrderAmount">Monto mínimo (CLP)</Label>
            <Input
              id="minimumOrderAmount"
              name="minimumOrderAmount"
              type="number"
              placeholder="Sin mínimo"
              defaultValue={defaultValues.minimumOrderAmount ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUsageCount">Usos máximos</Label>
            <Input
              id="maxUsageCount"
              name="maxUsageCount"
              type="number"
              placeholder="Ilimitado"
              defaultValue={defaultValues.maxUsageCount ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Fecha de expiración</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="date"
              defaultValue={defaultValues.expiresAt ?? ""}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
