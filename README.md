# Mercadi.cl — UCP Commerce Platform

Multi-tenant SaaS that enables Chilean small businesses to expose product catalogs to AI shopping agents via Google's **Universal Commerce Protocol (UCP)**. Businesses get a public storefront and a machine-readable checkout API that any UCP-compatible AI agent can use autonomously.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Testing the Payment Flow](#testing-the-payment-flow)
  - [1. Storefront (browser)](#1-storefront-browser)
  - [2. Transbank WebPay Plus](#2-transbank-webpay-plus)
  - [3. Mock Provider (instant approval)](#3-mock-provider-instant-approval)
  - [4. UCP API (AI agent flow)](#4-ucp-api-ai-agent-flow)
- [Payment Providers](#payment-providers)
- [Multi-Tenancy](#multi-tenancy)
- [UCP Endpoints Reference](#ucp-endpoints-reference)
- [Roles & Access](#roles--access)
- [Key Directories](#key-directories)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mercadi Platform                         │
│                                                                 │
│  ┌──────────────┐   ┌─────────────────┐   ┌─────────────────┐  │
│  │  Storefront  │   │   Admin Panel   │   │ Tenant Dashboard│  │
│  │/store/:slug  │   │  /admin/*       │   │  /dashboard/*   │  │
│  └──────┬───────┘   └────────┬────────┘   └────────┬────────┘  │
│         │                   │                      │           │
│         └───────────────────┴──────────────────────┘           │
│                             │                                   │
│                  ┌──────────┴──────────┐                       │
│                  │  CheckoutManager    │                       │
│                  │  (state machine)    │                       │
│                  └──────────┬──────────┘                       │
│                             │                                   │
│                  ┌──────────┴──────────┐                       │
│                  │  PaymentProvider    │                       │
│                  │  (plugin pattern)   │                       │
│                  └──┬────────┬─────────┘                       │
│                     │        │                                  │
│            ┌────────┴┐  ┌───┴──────┐  ┌────────┐              │
│            │Transbank│  │MercadoPago│  │  Mock  │              │
│            └─────────┘  └──────────┘  └────────┘              │
└─────────────────────────────────────────────────────────────────┘
         │
         │  /api/ucp/:tenantSlug/v1/
         ▼
┌─────────────────┐
│   AI Agents     │  ← UCP-compatible shopping agents
│  (Google, etc.) │
└─────────────────┘
```

### Checkout Session State Machine

```
open → buyer_set → fulfillment_set → pending_payment → completed
                                            ↓
                                        cancelled / expired (30 min TTL)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Actions) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Database | MongoDB via Mongoose |
| Auth | NextAuth.js v5 (credentials + JWT) |
| Payments | Transbank WebPay Plus, MercadoPago Checkout Pro, Mock |
| AI Testing | Google Gemini API |
| Deployment | Vercel |

---

## Local Setup

### 1. Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- A Google Gemini API key (for AI test flows)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/mercadi
NEXTAUTH_SECRET=any-random-string-32-chars-or-more
NEXTAUTH_URL=http://localhost:3000
STOREFRONT_BASE_DOMAIN=localhost

# Required for Gemini AI test flow
GEMINI_API_KEY=your-key-from-aistudio.google.com
```

### 4. Start development server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Create an admin account

Seed the first admin user by POSTing to the registration endpoint or by inserting directly into MongoDB:

```js
// MongoDB shell / Compass
db.users.insertOne({
  email: "admin@mercadi.cl",
  password: "<bcrypt hash of your password>",
  role: "admin",
  name: "Admin",
  createdAt: new Date()
})
```

Then log in at `http://localhost:3000/login`.

---

## Testing the Payment Flow

### 1. Storefront (browser)

Each tenant gets a public storefront at `/store/:tenantSlug`.

**Step-by-step:**

1. Log in as `admin` → go to `/admin/tenants` → create a tenant with slug `demo`
2. Go to the tenant dashboard (`/dashboard`) → add products to the catalog
3. Configure the payment provider (see section below)
4. Open the storefront: `http://localhost:3000/store/demo`
5. Add items to cart → proceed to checkout → fill in buyer info → pay

**Storefront pages:**

| URL | Description |
|-----|-------------|
| `/store/:slug` | Product listing page |
| `/store/:slug/product/:id` | Product detail page |
| `/store/:slug/cart` | Shopping cart |
| `/store/:slug/checkout` | Buyer info form |
| `/store/:slug/checkout/payment` | Payment method selection |
| `/store/:slug/checkout/confirmation/:orderId` | Order confirmation |

---

### 2. Transbank WebPay Plus

Transbank is the standard payment processor for Chilean bank cards (Redcompra, Visa, Mastercard via WebPay network).

#### Configure Transbank on a tenant

In the Tenant Dashboard → **Configuración → Pagos**, set:

| Field | Integration value |
|-------|-------------------|
| Provider | `transbank` |
| Commerce Code | `597055555532` |
| API Key | `579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C` |
| Environment | `integration` |

These are Transbank's official public test credentials (safe to commit, integration-only).

#### Payment flow diagram

```
Storefront checkout
       │
       ▼
POST /api/ucp/:slug/v1/checkout-sessions/:id/complete
       │
       ▼
TransbankProvider.authorize()
  → WebpayPlus.Transaction.buildForIntegration(commerceCode, apiKey)
  → .create(orderId, sessionId, amount, returnUrl)
  → returns { token, url }
       │
       ▼
/checkout/transbank-redirect?token=XXX&url=https://webpay...
  → Server component renders hidden <form>
  → JavaScript auto-POSTs { token_ws } to WebPay
       │
       ▼
  ┌─────────────────────┐
  │  WebPay payment UI  │  ← User enters card details here
  └─────────────────────┘
       │
       ├── Approved / Rejected ──→ POST /api/payments/transbank/return?session_id=...
       │                              → commit(token_ws)
       │                              → responseCode === 0 → finalizeSessionToOrder()
       │                              → redirect /checkout/result?status=success|failure
       │
       └── Cancelled / Timeout ──→ GET /api/payments/transbank/return?TBK_TOKEN=...
                                      → no commit needed
                                      → redirect /checkout/result?status=failure
```

#### Test card credentials

Use these on the WebPay payment page during integration testing:

| Field | Value |
|-------|-------|
| Card number (Visa) | `4051 8856 0044 6623` |
| CVV | `123` |
| Expiry | `12/25` |
| RUT | `11.111.111-1` |
| Password | `123` |

> To test a **rejection**, use card `5186 0595 5959 0568` with the same credentials.

> To test **cancellation**, click "Anular" on the WebPay page — the flow handles the GET callback and redirects to the failure result page.

#### What gets recorded

On successful payment, Mercadi creates:

- An **Order** document (`orderId`) with line items, totals, and commission
- A **PaymentTransaction** document with `status: "captured"` and the WebPay token as `providerTransactionId`
- Stock is decremented atomically per product
- Session status transitions to `"completed"`

---

### 3. Mock Provider (instant approval)

For local development without a payment processor. Every checkout is immediately approved.

In Tenant Dashboard → Pagos, set provider to `mock` (no additional config needed).

The mock provider has `supportsDirectCapture: true`, so `completeSession()` creates the order synchronously — no redirect needed.

---

### 4. UCP API (AI agent flow)

The UCP endpoints let any compatible AI agent create and complete a checkout programmatically.

**Get the tenant's API key** from the Admin panel or from `tenant.ucpApiKey` in the database.

#### Full checkout sequence

```bash
SLUG="demo"
API_KEY="ucp_xxxxxxxxxxxxxxxxxxxx"
BASE="http://localhost:3000/api/ucp/$SLUG/v1"

# 1. Create session
SESSION=$(curl -s -X POST "$BASE/checkout-sessions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "line_items": [
      { "ucp_item_id": "PRODUCT_UCP_ID", "quantity": 1 }
    ]
  }')

SESSION_ID=$(echo $SESSION | jq -r '.checkout_session_id')

# 2. Set buyer info
curl -s -X PATCH "$BASE/checkout-sessions/$SESSION_ID" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "buyer": {
      "email": "test@example.com",
      "name": "Test User",
      "rut": "11.111.111-1"
    }
  }'

# 3. Set fulfillment (get option IDs from the session response)
curl -s -X PATCH "$BASE/checkout-sessions/$SESSION_ID" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fulfillment": {
      "type": "shipping",
      "shipping_option_id": "OPTION_ID_FROM_SESSION",
      "address": {
        "street": "Av. Providencia 123",
        "comuna": "Providencia",
        "region": "Metropolitana",
        "postal_code": "7500000"
      }
    }
  }'

# 4. Complete (for mock provider → order created instantly)
curl -s -X POST "$BASE/checkout-sessions/$SESSION_ID/complete" \
  -H "Authorization: Bearer $API_KEY"
```

For Transbank/MercadoPago tenants, step 4 returns a `redirect_url` for the human-facing payment page instead of an order.

---

## Payment Providers

| Provider | Type | Confirmation | Test? |
|----------|------|-------------|-------|
| **Mock** | Direct capture | Synchronous (instant) | Always |
| **Transbank WebPay Plus** | Redirect | Synchronous POST return | Integration env |
| **MercadoPago Checkout Pro** | Redirect | Async webhook | Sandbox env |

### Provider interface

All providers implement:

```typescript
interface PaymentProvider {
  authorize(intent, providerConfig)  // → redirectUrl or immediate capture
  capture(transactionId, config)     // → commit (Transbank) or poll (MP)
  refund(transactionId, amount?, config)
  getStatus(transactionId, config)
  verifyWebhook(headers, body, config) → boolean
}
```

### Commission model

Mercadi charges a platform commission on each order (default 5%):

```
Order: CLP 11,900 (tax-inclusive, 19% IVA)
  Net (pre-tax): CLP 10,000
  IVA (19%):     CLP  1,900

Commission (5% of net): CLP   500
Commission IVA (19%):   CLP    95
Total commission:       CLP   595

Merchant receives:      CLP 11,305
```

---

## Multi-Tenancy

Tenants are isolated by slug. Each has:

- A **storefront** at `/store/:slug` (or custom domain)
- A **UCP API** at `/api/ucp/:slug/v1/`
- Their own **payment provider config** (stored encrypted in the Tenant document)
- Their own **product catalog**, **orders**, and **shipping options**

### Subdomain routing (production)

`booty.mercadi.cl` → `/store/booty` via `vercel.json` rewrite rules.

### Tenant model highlights

```typescript
{
  slug: string,           // URL identifier (unique, lowercase)
  rut: string,            // Chilean tax ID (modulo-11 validated)
  ucpEnabled: boolean,    // UCP API access toggle
  ucpApiKey: string,      // Bearer token for /api/ucp/:slug/
  payment: {
    provider: "mock" | "transbank" | "mercadopago",
    providerConfig: { ... }
  },
  locale: {
    currency: "CLP",      // Zero-decimal integer storage
    taxRate: 0.19,        // 19% IVA default
    taxInclusive: true    // Prices shown include tax
  },
  commissionRate: 0.05    // Platform fee (configurable per tenant)
}
```

---

## UCP Endpoints Reference

All endpoints require `Authorization: Bearer <ucpApiKey>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/.well-known/ucp` | Service discovery (public) |
| `GET` | `/api/ucp/:slug/v1/profile` | Tenant UCP profile |
| `GET` | `/api/ucp/:slug/v1/items` | Product catalog |
| `POST` | `/api/ucp/:slug/v1/checkout-sessions` | Create session |
| `GET` | `/api/ucp/:slug/v1/checkout-sessions/:id` | Get session state |
| `PATCH` | `/api/ucp/:slug/v1/checkout-sessions/:id` | Update buyer/fulfillment |
| `POST` | `/api/ucp/:slug/v1/checkout-sessions/:id/complete` | Initiate payment |
| `POST` | `/api/ucp/:slug/v1/checkout-sessions/:id/coupons` | Apply coupon |

Sessions expire after **30 minutes** (MongoDB TTL index).

---

## Roles & Access

| Role | Access |
|------|--------|
| `admin` | `/admin/*` — manage all tenants, view commissions, platform settings |
| `tenant_owner` | `/dashboard/*` — manage own catalog, orders, payment config |

Guards are enforced via `requireAdmin()` / `requireTenant()` in `src/lib/auth/guards.ts`.

---

## Key Directories

```
src/
├── app/
│   ├── api/
│   │   ├── ucp/[tenantSlug]/     UCP REST endpoints (API key auth)
│   │   ├── payments/transbank/   Transbank return URL handler
│   │   ├── admin/                Admin API (session auth)
│   │   └── tenant/               Tenant API (session auth)
│   ├── store/[tenantSlug]/       Public storefront
│   ├── checkout/                 Payment redirect + result pages
│   └── (platform)/               Protected dashboards
├── lib/
│   ├── payments/                 Provider abstraction + implementations
│   ├── ucp/                      UCP protocol + checkout state machine
│   ├── db/models/                Mongoose models
│   ├── auth/                     NextAuth config + role guards
│   └── utils/                    Chilean RUT, CLP formatting, tax calc
docs/
└── adr/
    ├── 005-mercadopago-checkout-pro.md
    └── 006-transbank-webpay-plus.md
```

---

## References

- [UCP Specification](https://ucp.dev/specification/checkout-rest/)
- [Transbank Developer Docs](https://www.transbankdevelopers.cl/referencia/webpay)
- [transbank-sdk on npm](https://www.npmjs.com/package/transbank-sdk)
- [MercadoPago Checkout Pro](https://www.mercadopago.cl/developers/es/docs/checkout-pro/landing)
