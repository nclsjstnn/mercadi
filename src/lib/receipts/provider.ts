export interface ReceiptItem {
  nombre: string;       // max 25 chars per SII spec
  cantidad: number;
  precioNeto: number;   // neto sin IVA, integer CLP
  unidad?: string;      // UN, KG, MT, etc. (max 4 chars)
  descuento?: number;   // 0-100
}

export interface ReceiptRequest {
  orderId: string;
  issueDate?: string;                                  // YYYY-MM-DD, defaults to today
  documentType?: 33 | 34;                             // 33=Factura afecta, 34=Factura exenta
  paymentMethod?: "CONTADO" | "CREDITO" | "SIN_COSTO"; // default CONTADO
  items: ReceiptItem[];
  buyer: {
    rut?: string;
    razonSocial?: string;
    email?: string;
  };
  totals: {
    neto: number;
    iva: number;
    total: number;
  };
  providerConfig: Record<string, unknown>;
}

export interface ReceiptResult {
  success: boolean;
  folio?: number;
  trackId?: string;
  documentType?: number;
  documentTypeName?: string;
  totals?: { neto: number; iva: number; total: number };
  pdfBase64?: string;
  providerResponse?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

export interface ReceiptProvider {
  readonly name: string;
  issue(request: ReceiptRequest): Promise<ReceiptResult>;
}
