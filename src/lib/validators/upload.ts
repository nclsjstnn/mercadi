import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_PRODUCT_IMAGES = 5;

export const uploadQuerySchema = z.object({
  type: z.enum(["logo", "product-image"]),
  productId: z.string().optional(),
});

export function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  return map[mime] ?? "bin";
}

export function isVercelBlobUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
