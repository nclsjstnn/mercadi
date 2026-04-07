import { connectDB } from "@/lib/db/connect";
import { Receipt } from "@/lib/db/models/receipt";
import { PlatformSettings } from "@/lib/db/models/platform-settings";
import type { IOrder } from "@/lib/db/models/order";
import type { ITenant } from "@/lib/db/models/tenant";
import { getReceiptProvider } from "./factory";
import type { ReceiptRequest } from "./provider";
import { calculateTax } from "@/lib/utils/tax";

/**
 * Issues an electronic receipt for a confirmed order.
 * Resolves provider via: tenant.receipt.provider → platform activeProvider → "mock"
 * Persists the result as a Receipt document regardless of success/failure.
 */
export async function issueReceipt(
  order: IOrder,
  tenant: ITenant
): Promise<void> {
  await connectDB();

  const platformSettings = await PlatformSettings.findOne({
    _id: "singleton",
  }).lean();

  const platformProvider = platformSettings?.receipt?.activeProvider ?? "mock";
  const platformEnabled = platformSettings?.receipt?.enabled ?? true;

  const tenantReceiptEnabled = tenant.receipt?.enabled ?? false;
  const activeProviderName =
    tenant.receipt?.provider || platformProvider;

  // Skip if receipt issuing is globally disabled
  if (!platformEnabled) return;

  const provider = getReceiptProvider(activeProviderName);

  // Build per-item neto prices.
  // unitPrice in the order is IVA-inclusive (taxInclusive=true by default).
  const taxRate = tenant.locale?.taxRate ?? 0.19;
  const taxInclusive = tenant.locale?.taxInclusive ?? true;

  const items: ReceiptRequest["items"] = order.lineItems.map((item) => {
    const breakdown = calculateTax(item.unitPrice, taxRate, taxInclusive);
    return {
      nombre: item.title.slice(0, 25),
      cantidad: item.quantity,
      precioNeto: breakdown.net,
    };
  });

  const providerConfig: Record<string, unknown> = {
    ...(platformSettings?.receipt?.providerConfig ?? {}),
    ...(tenant.receipt?.providerConfig ?? {}),
  };

  const request: ReceiptRequest = {
    orderId: order.orderId,
    documentType: 33,
    paymentMethod: "CONTADO",
    items,
    buyer: {
      rut: order.buyer.rut,
      razonSocial: order.buyer.name,
      email: order.buyer.email,
    },
    totals: {
      neto: order.totals.subtotal,
      iva: order.totals.tax,
      total: order.totals.total,
    },
    providerConfig,
  };

  const result = await provider.issue(request);

  await Receipt.create({
    orderId: order.orderId,
    tenantId: order.tenantId,
    provider: activeProviderName,
    status: result.success ? "issued" : "failed",
    folio: result.folio,
    trackId: result.trackId,
    documentType: result.documentType,
    totals: result.totals,
    pdfBase64: result.pdfBase64,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    providerResponse: result.providerResponse,
    issuedAt: result.success ? new Date() : undefined,
  });
}
