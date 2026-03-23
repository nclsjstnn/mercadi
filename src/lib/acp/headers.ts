import { NextRequest } from "next/server";

export interface AcpHeaders {
  apiKey?: string;
  idempotencyKey?: string;
  requestId?: string;
  signature?: string;
  timestamp?: string;
  apiVersion?: string;
  acceptLanguage?: string;
}

export function parseACPHeaders(request: NextRequest): AcpHeaders {
  return {
    apiKey:
      request.headers.get("authorization")?.replace("Bearer ", "") || undefined,
    idempotencyKey: request.headers.get("idempotency-key") || undefined,
    requestId: request.headers.get("request-id") || undefined,
    signature: request.headers.get("signature") || undefined,
    timestamp: request.headers.get("timestamp") || undefined,
    apiVersion: request.headers.get("api-version") || undefined,
    acceptLanguage: request.headers.get("accept-language") || undefined,
  };
}

export function acpResponseHeaders(headers: AcpHeaders): Record<string, string> {
  const result: Record<string, string> = {
    "content-type": "application/json",
  };
  if (headers.idempotencyKey) {
    result["idempotency-key"] = headers.idempotencyKey;
  }
  if (headers.requestId) {
    result["request-id"] = headers.requestId;
  }
  return result;
}
