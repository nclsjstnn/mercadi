"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { addProductImage, deleteProductImage } from "@/actions/products";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES, MAX_PRODUCT_IMAGES } from "@/lib/validators/upload";

interface ProductImageUploaderProps {
  productId: string;
  initialImages: string[];
}

export function ProductImageUploader({ productId, initialImages }: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const canUpload = images.length < MAX_PRODUCT_IMAGES;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMsg("Tipo no permitido. Usa JPEG, PNG, WebP, GIF o AVIF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("El archivo supera 4 MB.");
      return;
    }
    if (images.length >= MAX_PRODUCT_IMAGES) {
      setErrorMsg(`Máximo ${MAX_PRODUCT_IMAGES} imágenes por producto.`);
      return;
    }

    setErrorMsg("");
    setUploading(true);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("type", "product-image");
    fd.set("productId", productId);

    try {
      const res = await fetch("/api/tenant/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Error al subir imagen.");
        return;
      }
      await addProductImage(productId, data.url);
      setImages((prev) => [...prev, data.url]);
    } catch {
      setErrorMsg("Error de red. Intenta nuevamente.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(url: string) {
    setDeletingUrl(url);
    try {
      await deleteProductImage(productId, url);
      setImages((prev) => prev.filter((u) => u !== url));
    } catch {
      setErrorMsg("Error al eliminar imagen.");
    } finally {
      setDeletingUrl(null);
    }
  }

  return (
    <div className="space-y-3">
      <Label>Imágenes del producto</Label>
      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <div key={url} className="relative h-24 w-24 rounded-lg overflow-hidden border bg-muted">
            <Image
              src={url}
              alt="Imagen del producto"
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => handleDelete(url)}
              disabled={deletingUrl === url}
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50 transition-colors"
              aria-label="Eliminar imagen"
            >
              {deletingUrl === url ? (
                <span className="text-[10px]">...</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        ))}

        {canUpload && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted hover:border-primary hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-[10px] text-muted-foreground animate-pulse">Subiendo...</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-xs text-muted-foreground">
        {images.length}/{MAX_PRODUCT_IMAGES} imágenes · JPEG, PNG, WebP, GIF, AVIF · máx. 4 MB
      </p>
      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
    </div>
  );
}
