import { getCurrencyConfig } from "@/lib/config/currencies";

/**
 * Format a price amount for display.
 * @param amount - Integer amount (CLP whole units, USD cents, etc.)
 * @param currencyCode - ISO 4217 currency code
 * @param locale - Override locale (defaults to currency's locale)
 */
export function formatPrice(
  amount: number,
  currencyCode: string = "CLP",
  locale?: string
): string {
  const config = getCurrencyConfig(currencyCode);
  const displayLocale = locale ?? config.locale;
  const displayAmount =
    config.decimals === 0 ? amount : amount / Math.pow(10, config.decimals);

  return new Intl.NumberFormat(displayLocale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(displayAmount);
}
