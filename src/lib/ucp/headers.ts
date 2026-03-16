import { NextRequest } from "next/server";

export function parseUCPHeaders(request: NextRequest) {
  return {
    ucpAgent: request.headers.get("ucp-agent") || undefined,
    idempotencyKey: request.headers.get("idempotency-key") || undefined,
    apiKey:
      request.headers.get("authorization")?.replace("Bearer ", "") || undefined,
  };
}
