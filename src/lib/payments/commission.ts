export interface CommissionBreakdown {
  orderTotal: number;
  currency: string;
  netAmount: number;
  taxAmount: number;
  taxRate: number;
  commissionRate: number;
  commissionOnNet: number;
  commissionTax: number;
  totalCommission: number;
  merchantPayout: number;
}

/**
 * Calculate commission breakdown for an order.
 * All amounts are integers in smallest currency unit.
 *
 * Example (Chile, CLP, IVA 19%, tax-inclusive):
 *   Product $11,900 CLP → net=$10,000, iva=$1,900
 *   Commission 5% on net = $500
 *   Commission tax (19% of $500) = $95
 *   Total commission = $595, merchant gets $11,305
 */
export function calculateCommission(
  orderTotal: number,
  commissionRate: number,
  taxRate: number,
  taxInclusive: boolean,
  currency: string = "CLP"
): CommissionBreakdown {
  let netAmount: number;
  let taxAmount: number;

  if (taxInclusive) {
    netAmount = Math.round(orderTotal / (1 + taxRate));
    taxAmount = orderTotal - netAmount;
  } else {
    netAmount = orderTotal;
    taxAmount = Math.round(orderTotal * taxRate);
  }

  const commissionOnNet = Math.round(netAmount * commissionRate);
  const commissionTax = Math.round(commissionOnNet * taxRate);
  const totalCommission = commissionOnNet + commissionTax;
  const merchantPayout = orderTotal - totalCommission;

  return {
    orderTotal,
    currency,
    netAmount,
    taxAmount,
    taxRate,
    commissionRate,
    commissionOnNet,
    commissionTax,
    totalCommission,
    merchantPayout,
  };
}
