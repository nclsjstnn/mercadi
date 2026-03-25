# ADR 006 — Transbank WebPay Plus Integration

**Date:** 2026-03-25
**Status:** Accepted
**Deciders:** Platform team

---

## Context

After shipping MercadoPago Checkout Pro (ADR 005), Transbank WebPay Plus is the remaining priority payment method for Chilean tenants. WebPay is widely required for Redcompra (bank debit cards) and certain Visa/Mastercard issuers that mandate WebPay processing. The Transbank stub already existed; this ADR documents the implementation decision.

---

## Decision

Implement **Transbank WebPay Plus** using the official `transbank-sdk` npm package (v4.x), following the REST API flow.

**Not chosen — direct REST API (no SDK):** The SDK adds clean TypeScript types, handles authentication headers (`Tbk-Api-Key-Id`, `Tbk-Api-Key-Secret`), and environment switching. The SDK is actively maintained by Transbank developers.

---

## Critical architectural difference from MercadoPago

MercadoPago confirms payment via **async webhook**. Transbank confirms payment via **synchronous commit on the return URL**:

```
MercadoPago:
  authorize() → redirect → [user pays] → webhook fires → finalizeSessionToOrder()

Transbank:
  authorize() → form POST → [user pays] → POST to returnUrl → commit() → finalizeSessionToOrder()
```

Transbank has no server-side webhook. The `returnUrl` receives a **POST** from WebPay with `token_ws` in the form body. Our handler must call `commit(token)` synchronously before responding.

### Cancellation / timeout handling

When the user cancels or the session times out, WebPay sends a **GET** to `returnUrl` with `TBK_TOKEN` and `TBK_ORDEN_COMPRA` query params. No commit is needed; we redirect to the failure result page.

---

## Flow

```
1. checkout-manager.completeSession()
   → TransbankProvider.authorize(intent, config)
   → WebpayPlus.Transaction.buildForIntegration(commerceCode, apiKey)
       .create(orderId, sessionId, amount, returnUrl)
   → Returns { token, url }
   → redirectUrl = /checkout/transbank-redirect?token=xxx&url=https://webpay...

2. Browser navigates to /checkout/transbank-redirect
   → Server Component renders hidden form
   → JS auto-POSTs { token_ws: token } to WebPay URL

3. User pays on WebPay

4a. Payment processed (approved or rejected):
    WebPay POSTs token_ws to /api/payments/transbank/return?session_id=...&tenant_id=...
    → provider.capture(token)  →  transaction.commit(token)
    → responseCode === 0  →  finalizeSessionToOrder(sessionId, orderId)
    → redirect to /checkout/result?status=success|failure&session_id=...

4b. Timeout or user cancels:
    WebPay GETs /api/payments/transbank/return with TBK_TOKEN param
    → redirect to /checkout/result?status=failure&session_id=...
```

---

## Implementation

### SDK usage

```typescript
// Integration environment (test)
const tx = WebpayPlus.Transaction.buildForIntegration(commerceCode, apiKey);

// Production environment
const tx = WebpayPlus.Transaction.buildForProduction(commerceCode, apiKey);

await tx.create(buyOrder, sessionId, amount, returnUrl);  // → { token, url }
await tx.commit(token);   // responseCode === 0 = success
await tx.status(token);   // check status
await tx.refund(token, amount);  // full or partial refund
```

### WebPay redirect page

WebPay requires a **POST** form submission (GET doesn't work). The `/checkout/transbank-redirect` page renders a hidden form that auto-submits on page load, with a fallback `<noscript>` button.

### `providerTransactionId` = WebPay token

The WebPay `token` (a long hex string) serves as `providerTransactionId` in `PaymentTransaction`. It's used for `commit()`, `status()`, and `refund()` calls.

### Idempotent `finalizeSessionToOrder`

If WebPay delivers the POST twice (unlikely but possible), the second call finds `session.status === "completed"` and returns the existing order without creating duplicates.

### Tenant providerConfig

```json
{
  "commerceCode": "597055555532",
  "apiKey": "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C",
  "environment": "integration",
  "baseUrl": "https://mercadi.cl"
}
```

Integration credentials are Transbank's public test values documented at transbankdevelopers.cl.

### Files changed

| File | Change |
|------|--------|
| `src/lib/payments/transbank-types.ts` | New — TypeScript types for TBK API responses |
| `src/lib/payments/transbank-provider.ts` | Replaced stub with full SDK implementation |
| `src/lib/payments/factory.ts` | Wired TransbankProvider |
| `src/app/checkout/transbank-redirect/page.tsx` | New — auto-submit POST form to WebPay |
| `src/app/api/payments/transbank/return/route.ts` | New — commit + finalize on POST return, handle GET cancellation |
| `src/app/(platform)/dashboard/settings/page.tsx` | Extended Pagos tab for Transbank |

---

## Consequences

**Positive:**
- Transbank WebPay is fully functional for Chilean bank cards (Redcompra, Visa, Mastercard via WebPay)
- No async webhook complexity — synchronous commit is simpler to reason about
- No webhook URL to configure in Transbank's portal (unlike MercadoPago)
- Same `supportsDirectCapture = false` flow as MercadoPago — storefront requires no changes
- Pattern complete: all three providers (mock, mercadopago, transbank) operational

**Negative / trade-offs:**
- POST form redirect is less seamless than a direct GET redirect — requires intermediate page
- `transbank-sdk` ships CommonJS; bundler handles it but adds a small bundle cost
- `commit()` is blocking — if the return URL handler is slow, the user sees a longer redirect
- Refund requires the original WebPay token to be stored (done via `providerTransactionId`)

---

## Test credentials (Transbank integration)

| Field | Value |
|-------|-------|
| Commerce code | 597055555532 |
| API key | 579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C |
| Test card | Visa 4051 8856 0044 6623 |
| CVV | 123 |
| Expiry | 12/25 |
| RUT | 11.111.111-1 |
| Password | 123 |

---

## References

- [transbank-sdk on npm](https://www.npmjs.com/package/transbank-sdk)
- [transbank-sdk on GitHub](https://github.com/TransbankDevelopers/transbank-sdk-nodejs)
- [Transbank WebPay Plus REST docs](https://www.transbankdevelopers.cl/referencia/webpay)
- Related: ADR 005 — MercadoPago Checkout Pro
