export interface TaxBreakdown {
  net: number;
  tax: number;
  total: number;
}

/**
 * Calculate tax breakdown from an amount.
 * @param amount - The amount (integer in smallest currency unit)
 * @param taxRate - Tax rate (e.g., 0.19 for 19% IVA)
 * @param taxInclusive - If true, amount already includes tax
 */
export function calculateTax(
  amount: number,
  taxRate: number,
  taxInclusive: boolean = true
): TaxBreakdown {
  if (taxInclusive) {
    const net = Math.round(amount / (1 + taxRate));
    const tax = amount - net;
    return { net, tax, total: amount };
  } else {
    const tax = Math.round(amount * taxRate);
    return { net: amount, tax, total: amount + tax };
  }
}
