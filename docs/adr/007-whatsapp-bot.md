# ADR 007 — WhatsApp Bot Integration

**Date:** 2026-03-25
**Status:** Accepted
**Deciders:** Platform team

---

## Context

Chilean small businesses rely heavily on WhatsApp for customer communication. Adding a WhatsApp bot allows customers to browse a tenant's product catalog in the channel where they already spend time, lowering the barrier to discovery without requiring the customer to visit the web store.

---

## Decision

Implement a **per-tenant WhatsApp Business Cloud API bot** using Meta's official REST API directly (no third-party SDK). Each tenant configures their own Meta App credentials. The bot handles catalog browsing; checkout is delegated to the web store via a link.

**Not chosen — shared platform number:** would require routing logic to map customers to tenants; adds UX friction (user must identify which tenant they want before seeing products).

**Not chosen — Twilio / 360dialog:** adds cost and a third-party dependency. Meta Cloud API has a free tier (1 000 conversations/month) sufficient for MVP.

**Not chosen — full checkout in WhatsApp:** requires capturing shipping address and redirecting to Transbank/MercadoPago within a messaging thread. The UX is poor on mobile; the web store already handles this well.

---

## Flow

```
Customer → WhatsApp Business Number
  POST /api/whatsapp/[tenantSlug]/webhook
    → lookup WhatsAppConversation (upsert, TTL 24h)
    → dispatch by conv.state + incoming message

States:
  idle          → greeting → main_menu
  main_menu     → [Ver catálogo] [Buscar] [Ir a la tienda]
  browsing      → interactive list of categories
  product_list  → interactive list of products (PAGE_SIZE=10, pagination via "Ver más" row)
  product_detail → product image + details + [Comprar ahora] → storeUrl link
  search        → wait for free-text → regex search on title/tags/description
```

---

## Webhook verification

Meta sends a `GET` request before activating the webhook:

```
GET /api/whatsapp/[slug]/webhook
  ?hub.mode=subscribe
  &hub.verify_token=<tenant.whatsapp.verifyToken>
  &hub.challenge=<token>

→ respond 200 with plain-text hub.challenge
```

---

## Message types used

| Situation | WhatsApp message type |
|-----------|----------------------|
| Greeting, errors, store link | Text message |
| Category list, product list | Interactive list (max 10 rows/section) |
| Main menu, product detail actions | Interactive buttons (max 3) |
| Product image | Image message (link) |

Interactive messages require `messaging_product: "whatsapp"` and proper `interactive.type` (`list` or `button`).

---

## Implementation

### Tenant config

New field in `Tenant` model:

```typescript
whatsapp: {
  enabled: boolean           // must be true to activate webhook
  phoneNumberId: string      // Meta phone number ID
  accessToken: string        // permanent or system user token
  verifyToken: string        // arbitrary secret set by tenant
}
```

### Conversation state (MongoDB, TTL 24h)

```typescript
WhatsAppConversation {
  phoneNumber: string          // customer WA number (key)
  tenantId: ObjectId           // (key)
  state: WhatsAppState
  context: {
    selectedCategory?: string
    selectedProductId?: string
    productListOffset?: number
  }
  expiresAt: Date              // TTL index — auto-deleted after 24h
}
```

### Webhook response timing

The webhook handler responds `200 { status: "ok" }` immediately and processes the message asynchronously via a fire-and-forget async function. This is required because Meta retries delivery if it does not receive a `2xx` within ~5 seconds.

### Files changed

| File | Change |
|------|--------|
| `src/lib/db/models/whatsapp-conversation.ts` | New — conversation state model |
| `src/lib/whatsapp/client.ts` | New — Meta Cloud API client |
| `src/lib/whatsapp/messages.ts` | New — message builders |
| `src/lib/whatsapp/handler.ts` | New — state machine dispatcher |
| `src/app/api/whatsapp/[tenantSlug]/webhook/route.ts` | New — GET verify + POST handler |
| `src/lib/db/models/tenant.ts` | Added `whatsapp` field |
| `src/app/(platform)/dashboard/settings/page.tsx` | Added WhatsApp tab |

---

## Tenant setup (one-time)

1. Create a Meta App at [developers.facebook.com](https://developers.facebook.com)
2. Enable **WhatsApp Business** product
3. Add and verify a phone number
4. In the Meta dashboard under **WhatsApp → Configuration**, set:
   - **Webhook URL:** `https://mercadi.cl/api/whatsapp/[tenantSlug]/webhook`
   - **Verify Token:** same value stored in `tenant.whatsapp.verifyToken`
   - Subscribe to the **`messages`** webhook field
5. Load credentials into the tenant's MongoDB document:
   ```json
   {
     "whatsapp": {
       "enabled": true,
       "phoneNumberId": "1234567890",
       "accessToken": "EAAxx...",
       "verifyToken": "my-secret-token"
     }
   }
   ```

---

## WhatsApp interactive message limits

| Constraint | Limit |
|-----------|-------|
| List sections per message | 10 |
| Rows per section | 10 |
| Row title | 24 chars |
| Row description | 72 chars |
| Reply buttons per message | 3 |
| Button title | 20 chars |

Products with titles longer than 24 characters are truncated client-side in `messages.ts`.

---

## Consequences

**Positive:**
- Customers can discover and browse products in WhatsApp without installing anything
- Per-tenant architecture: each business owns their number and Meta App
- No webhook to register at the platform level — each tenant registers their own
- Conversation state is ephemeral (TTL 24h) — no long-lived storage burden
- Fire-and-forget async processing means Meta never retries due to slow handler

**Negative / trade-offs:**
- Checkout requires leaving WhatsApp (link to web store) — no in-chat payment
- Each tenant must create and manage their own Meta App (friction for non-technical owners)
- Interactive lists/buttons limited to 10 rows / 3 buttons — requires pagination for large catalogs
- WhatsApp Cloud API free tier: 1 000 service conversations/month; high-volume tenants need a paid plan

---

## References

- [Meta WhatsApp Cloud API docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Interactive list messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-list-messages)
- [Webhook setup](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/getting-started)
- Related: ADR 005 — MercadoPago, ADR 006 — Transbank
