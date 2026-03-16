export interface CurrencyConfig {
  decimals: number;
  locale: string;
  symbol: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  CLP: { decimals: 0, locale: "es-CL", symbol: "$" },
  USD: { decimals: 2, locale: "en-US", symbol: "$" },
  EUR: { decimals: 2, locale: "de-DE", symbol: "€" },
  MXN: { decimals: 2, locale: "es-MX", symbol: "$" },
  ARS: { decimals: 2, locale: "es-AR", symbol: "$" },
  PEN: { decimals: 2, locale: "es-PE", symbol: "S/" },
  COP: { decimals: 0, locale: "es-CO", symbol: "$" },
  BRL: { decimals: 2, locale: "pt-BR", symbol: "R$" },
  JPY: { decimals: 0, locale: "ja-JP", symbol: "¥" },
};

export function getCurrencyConfig(code: string): CurrencyConfig {
  return CURRENCIES[code] ?? { decimals: 2, locale: "en-US", symbol: code };
}
