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
import { Checkbox } from "@/components/ui/checkbox";
import { ProductImageUploader } from "@/components/products/product-image-uploader";

interface ProductFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    title?: string;
    sku?: string;
    description?: string;
    price?: number;
    compareAtPrice?: number | null;
    stock?: number;
    category?: string;
    intangible?: boolean;
    brand?: string;
    acpEligibleSearch?: boolean;
    acpEligibleCheckout?: boolean;
    status?: string;
  };
  submitLabel?: string;
  productId?: string;
  initialImages?: string[];
}

export default function ProductForm({
  action,
  defaultValues = {},
  submitLabel = "Guardar",
  productId,
  initialImages = [],
}: ProductFormProps) {
  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Informacion basica
        </h3>
        <div className="space-y-2">
          <Label htmlFor="title">Titulo</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={defaultValues.title}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            name="sku"
            required
            defaultValue={defaultValues.sku}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripcion</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaultValues.description}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Precio y stock
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Precio de venta (CLP)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              required
              defaultValue={defaultValues.price}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Precio original (opcional)</Label>
            <Input
              id="compareAtPrice"
              name="compareAtPrice"
              type="number"
              placeholder="Ej: 10000"
              defaultValue={defaultValues.compareAtPrice ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              defaultValue={defaultValues.stock ?? 0}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Organizacion
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              name="category"
              defaultValue={defaultValues.category}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              name="brand"
              placeholder="Ej: Nike, Apple"
              defaultValue={defaultValues.brand}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="intangible"
            name="intangible"
            defaultChecked={defaultValues.intangible}
          />
          <Label htmlFor="intangible" className="font-normal">
            Producto intangible (digital, servicio, gift card)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="acpEligibleSearch"
            name="acpEligibleSearch"
            defaultChecked={defaultValues.acpEligibleSearch !== false}
          />
          <Label htmlFor="acpEligibleSearch" className="font-normal">
            Visible en busqueda ChatGPT (ACP)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="acpEligibleCheckout"
            name="acpEligibleCheckout"
            defaultChecked={defaultValues.acpEligibleCheckout !== false}
          />
          <Label htmlFor="acpEligibleCheckout" className="font-normal">
            Compra directa en ChatGPT (ACP)
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            name="status"
            defaultValue={defaultValues.status || "draft"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="archived">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Imágenes</h3>
        {productId ? (
          <ProductImageUploader productId={productId} initialImages={initialImages} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Guarda el producto primero para agregar imágenes.
          </p>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
