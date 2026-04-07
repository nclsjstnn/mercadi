import type { ReceiptProvider, ReceiptRequest, ReceiptResult } from "./provider";

let folioCounter = 1000;

export class MockReceiptProvider implements ReceiptProvider {
  readonly name = "mock";

  async issue(request: ReceiptRequest): Promise<ReceiptResult> {
    const folio = ++folioCounter;
    const documentType = request.documentType ?? 33;

    return {
      success: true,
      folio,
      trackId: `MOCK-T${documentType}F${folio}`,
      documentType,
      documentTypeName:
        documentType === 34
          ? "Factura No Afecta o Exenta (Mock)"
          : "Factura Electrónica (Mock)",
      totals: request.totals,
      providerResponse: {
        mock: true,
        orderId: request.orderId,
        buyer: request.buyer,
        items: request.items,
      },
    };
  }
}
