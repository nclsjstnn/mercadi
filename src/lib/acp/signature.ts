import { createHmac, timingSafeEqual } from "crypto";
import { ACP_SIGNATURE_MAX_AGE_SECONDS } from "./constants";

/**
 * Verify HMAC-SHA256 signature on incoming ACP requests.
 * Signing string: `${timestamp}.${body}`
 */
export function verifyACPSignature(
  body: string,
  signature: string | undefined,
  timestamp: string | undefined,
  signingSecret: string
): { valid: boolean; error?: string } {
  if (!signature || !timestamp) {
    return { valid: false, error: "Missing signature or timestamp header" };
  }

  // Replay protection: reject if timestamp is too old
  const requestTime = new Date(timestamp).getTime();
  if (isNaN(requestTime)) {
    return { valid: false, error: "Invalid timestamp format" };
  }

  const age = (Date.now() - requestTime) / 1000;
  if (age > ACP_SIGNATURE_MAX_AGE_SECONDS) {
    return { valid: false, error: "Request timestamp too old" };
  }
  if (age < -60) {
    // Allow 60s clock skew into the future
    return { valid: false, error: "Request timestamp in the future" };
  }

  const signingString = `${timestamp}.${body}`;
  const expected = createHmac("sha256", signingSecret)
    .update(signingString)
    .digest("base64");

  const signatureBuffer = Buffer.from(signature, "base64");
  const expectedBuffer = Buffer.from(expected, "base64");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: "Invalid signature" };
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true };
}

/**
 * Generate HMAC-SHA256 signature for outbound ACP webhooks.
 */
export function signACPPayload(
  body: string,
  timestamp: string,
  signingSecret: string
): string {
  const signingString = `${timestamp}.${body}`;
  return createHmac("sha256", signingSecret)
    .update(signingString)
    .digest("base64");
}
