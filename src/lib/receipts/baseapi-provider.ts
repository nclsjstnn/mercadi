import type { ReceiptProvider, ReceiptRequest, ReceiptResult } from "./provider";

const BASEAPI_URL = "https://api.baseapi.cl/api/v1/sii/dte/emitir/factura";
const BASEAPI_URL_EXENTA =
  "https://api.baseapi.cl/api/v1/sii/dte/emitir/factura-exenta";

interface BaseApiSuccessResponse {
  success: true;
  data: {
    folio: number;
    tipo_dte: number;
    tipo_dte_nombre: string;
    fecha_emision: string;
    receptor: { rut: string; razon_social: string };
    totales: { neto: number; iva: number; total: number };
    track_id: string;
    pdf?: { filename: string; content_type: string; base64: string; size: number } | string;
  };
}

interface BaseApiErrorResponse {
  success: false;
  error?: string;
  message?: string;
}

type BaseApiResponse = BaseApiSuccessResponse | BaseApiErrorResponse;

export class BaseApiReceiptProvider implements ReceiptProvider {
  readonly name = "baseapi";

  async issue(request: ReceiptRequest): Promise<ReceiptResult> {
    const config = request.providerConfig as {
      rut?: string;
      password?: string;
      clave_certificado?: string;
      rut_empresa?: string;
      apiKey?: string;
    };

    const { rut, password, clave_certificado, rut_empresa, apiKey } = config;

    if (!rut || !password || !clave_certificado || !rut_empresa || !apiKey) {
      return {
        success: false,
        errorCode: "missing_credentials",
        errorMessage:
          "Faltan credenciales SII. Se requieren: rut, password, clave_certificado, rut_empresa, apiKey",
      };
    }

    const documentType = request.documentType ?? 33;
    const url = documentType === 34 ? BASEAPI_URL_EXENTA : BASEAPI_URL;

    const body: Record<string, unknown> = {
      rut,
      password,
      clave_certificado,
      rut_empresa,
      receptor: {
        rut: request.buyer.rut,
        ...(request.buyer.razonSocial && {
          razon_social: request.buyer.razonSocial,
        }),
        ...(request.buyer.email && { contacto: request.buyer.email }),
      },
      items: request.items.map((item) => ({
        nombre: item.nombre.slice(0, 25),
        cantidad: item.cantidad,
        precio: item.precioNeto,
        ...(item.unidad && { unidad: item.unidad.slice(0, 4) }),
        ...(item.descuento != null && { descuento: item.descuento }),
      })),
      forma_pago: request.paymentMethod ?? "CONTADO",
      ...(request.issueDate && { fecha_emision: request.issueDate }),
      descargar_pdf: false,
    };

    let raw: BaseApiResponse;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      raw = (await res.json()) as BaseApiResponse;
    } catch (err) {
      return {
        success: false,
        errorCode: "network_error",
        errorMessage: err instanceof Error ? err.message : "Error de red",
      };
    }

    if (!raw.success) {
      const errRes = raw as BaseApiErrorResponse;
      return {
        success: false,
        errorCode: "baseapi_error",
        errorMessage: errRes.error ?? errRes.message ?? "Error desconocido de BaseAPI",
        providerResponse: raw as unknown as Record<string, unknown>,
      };
    }

    const { data } = raw as BaseApiSuccessResponse;
    return {
      success: true,
      folio: data.folio,
      trackId: data.track_id,
      documentType: data.tipo_dte,
      documentTypeName: data.tipo_dte_nombre,
      totals: {
        neto: data.totales.neto,
        iva: data.totales.iva,
        total: data.totales.total,
      },
      providerResponse: data as unknown as Record<string, unknown>,
    };
  }
}
