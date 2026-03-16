import Link from "next/link";
import { formatPrice } from "@/lib/utils/currency";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  image?: string;
  category?: string;
}

export function ProductCard({
  id,
  title,
  price,
  compareAtPrice,
  currency,
  image,
  category,
}: ProductCardProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  return (
    <Link
      href={`/product/${id}`}
      className="group overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {hasDiscount && (
          <span className="absolute top-2 left-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            -{discountPct}%
          </span>
        )}
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        {category && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            {category}
          </p>
        )}
        <h3 className="font-medium text-gray-900 group-hover:text-gray-700">
          {title}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(compareAtPrice, currency)}
            </span>
          )}
          <span
            className="text-lg font-bold"
            style={{ color: "var(--store-primary)" }}
          >
            {formatPrice(price, currency)}
          </span>
        </div>
      </div>
    </Link>
  );
}
