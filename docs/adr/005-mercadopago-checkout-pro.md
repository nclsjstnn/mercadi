# ADR 005 — MercadoPago Checkout Pro Integration

**Date:** 2026-03-25
**Status:** Accepted
**Deciders:** Platform team

---

## Context

Mercadi needed a real payment provider to replace the mock provider used during development. Chilean small businesses (our primary tenants) require a payment solution that:

- Supports CLP (zero-decimal currency) natively
- Is widely trusted by Chilean consumers
- Handles PCI compliance on behalf of merchants
- Supports credit/debit cards, bank transfers, and cash (boletas)

MercadoPago has dominant market share in Chile and Latin America, and its **Checkout Pro** product (redirect-based hosted checkout) fits the existing payment provider abstraction already built into the platform.

---

## Decision

Implement **MercadoPago Checkout Pro** as the first real payment provider.

**Not chosen — MercadoPago Checkout Bricks (embedded):** Requires frontend integration with MP's JS SDK and PCI-compliant tokenisation on our frontend. Significantly more complex and would require changes to the storefront checkout UI. Checkout Pro delegates all of this to MP's hosted page.

**Not chosen — Transbank WebPay Plus:** Chile-only and not a priority. The provider stub remains; integration follows the same pattern as MP when needed.

---

## Implementation

### Flow

```
1. completeSession() → MercadoPagoProvider.authorize()
   → POST https://api.mercadopago.com/checkout/preferences
   → Returns preference.init_point as redirectUrl
   → CheckoutSession.status = "pending_payment"

2. Buyer redirects to MercadoPago hosted page and pays

3. MP redirects back to /checkout/result?status=success|failure|pending&session_id=cs_xxx

4. MP POSTs to /api/payments/webhook?provider=mercadopago&tenantId=xxx
   → Verify x-signature HMAC-SHA256
   → GET https://api.mercadopago.com/v1/payments/{id}
   → If approved: finalizeSessionToOrder(sessionId, orderId)
   → Creates Order, decrements stock, marks session completed
```

### Key design choices

**orderId in `external_reference`:** The preference's `external_reference` field stores the `orderId` pre-generated in `completeSession()`. When the webhook arrives, `payment.external_reference` gives us the orderId without a database roundtrip.

**checkoutSessionId in `metadata`:** The preference's `metadata.checkoutSessionId` gives the webhook handler the session to finalize. This survives the full round-trip through MP's API.

**`finalizeSessionToOrder(sessionId, orderId)` is idempotent:** If a webhook fires twice (MP guarantees at-least-once delivery), the second call detects `session.status === "completed"` and returns the existing order without duplicating it.

**No new Mongoose models:** All required data fits in existing `PaymentTransaction`, `CheckoutSession`, and `Order` models.

**Webhook signature uses x-signature, not x-hub-signature:** MP uses HMAC-SHA256 over the manifest string `id:{data.id};request-id:{x-request-id};ts:{ts};` — not over the raw body. This is distinct from GitHub/Stripe webhook verification.

### Tenant providerConfig shape

```json
{
  "accessToken": "APP_USR-...",
  "publicKey": "APP_USR-...",
  "webhookSecret": "...",
  "baseUrl": "https://mercadi.cl"
}
```

Stored in `tenant.payment.providerConfig` (MongoDB Mixed type, encrypted at rest by Atlas).

### Files changed

| File | Change |
|------|--------|
| `src/lib/payments/mercadopago-types.ts` | New — MP API type definitions |
| `src/lib/payments/mercadopago-provider.ts` | Replaced stub with full implementation |
| `src/lib/payments/factory.ts` | Wired MercadoPagoProvider |
| `src/lib/ucp/checkout-manager.ts` | Extracted `finalizeSessionToOrder()`, added `_createOrderFromSession()` helper |
| `src/app/api/payments/webhook/route.ts` | Rewrote for MP webhook format |
| `src/app/checkout/result/page.tsx` | New — return URL page after payment |
| `src/actions/store-checkout.ts` | Return `redirectUrl` when provider needs redirect |
| `src/app/store/[tenantSlug]/checkout/payment/page.tsx` | Handle `redirectUrl` (redirect to MP) |
| `src/app/(platform)/dashboard/settings/page.tsx` | Added "Pagos" tab |

---

## Consequences

**Positive:**
- Real payments immediately available for Chilean tenants
- PCI compliance fully delegated to MercadoPago
- Supports all MP payment methods (cards, Webpay, cash, transfers)
- Webhook-driven order creation is resilient — order created even if user closes browser after paying
- Pattern established for future Transbank integration (same `supportsDirectCapture: false` flow)

**Negative / trade-offs:**
- Async order creation: the buyer may see "pending" status for a few seconds between redirect and webhook firing
- Tenants must configure a webhook URL in their MP developer panel — not automatic
- `providerConfig` is an untyped `Record<string, unknown>` — a future task could add Zod validation per provider

---

## References

- [MercadoPago Checkout Pro docs](https://www.mercadopago.cl/developers/es/docs/checkout-pro/landing)
- [MercadoPago webhook notifications](https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks)
- Previous ADRs: 001-ucp-multi-tenant, 002-payment-provider-abstraction, 003-acp-openai-integration
