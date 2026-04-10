"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/validators/upload";

interface LogoUploaderProps {
  logoUrl: string;
  onChange: (url: string) => void;
}

export function LogoUploader({ logoUrl, onChange }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side pre-validation
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMsg("Tipo no permitido. Usa JPEG, PNG, WebP, GIF o AVIF.");
      setStatus("error");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("El archivo supera 4 MB.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setErrorMsg("");

    const fd = new FormData();
    fd.set("file", file);
    fd.set("type", "logo");

    try {
      const res = await fetch("/api/tenant/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Error al subir imagen.");
        setStatus("error");
        return;
      }
      onChange(data.url);
      setStatus("idle");
    } catch {
      setErrorMsg("Error de red. Intenta nuevamente.");
      setStatus("error");
    } finally {
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>Logo de la tienda</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted hover:border-primary hover:bg-muted/80 transition-colors disabled:opacity-50"
      >
        {status === "uploading" ? (
          <span className="text-xs text-muted-foreground animate-pulse">Subiendo...</span>
        ) : logoUrl ? (
          <Image
            src={logoUrl}
            alt="Logo"
            width={160}
            height={96}
            className="h-full w-full object-contain"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-xs">Subir logo</span>
          </div>
        )}
      </button>
      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
      {logoUrl && (
        <p className="text-xs text-muted-foreground truncate max-w-xs">{logoUrl}</p>
      )}
    </div>
  );
}
