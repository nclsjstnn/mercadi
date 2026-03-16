# Mercadi.cl - UCP Commerce Platform

## Project Overview
Multi-tenant SaaS enabling Chilean small businesses to expose product catalogs to AI shopping agents via Google's Universal Commerce Protocol (UCP). Built on Next.js 15, deployed on Vercel.

## Tech Stack
- **Framework:** Next.js 15 (App Router, Server Actions, Route Handlers)
- **UI:** Tailwind CSS v4 + shadcn/ui
- **Database:** MongoDB via Mongoose
- **Auth:** NextAuth.js v5 (credentials, JWT strategy)
- **Payments:** Pluggable providers (Mock → Transbank/MercadoPago)
- **AI Testing:** Google Gemini API
- **Deploy:** Vercel

## Architecture
- **Multi-tenant:** Path-based (`/api/ucp/[tenantSlug]/`)
- **UCP endpoints:** REST transport, checkout capability
- **Payments:** Abstract provider interface + factory pattern
- **Currency:** Configurable per tenant (default CLP). Integer storage for zero-decimal currencies, 2-decimal for others
- **Tax:** Configurable per tenant (default IVA 19% for Chile)

## Key Directories
- `src/lib/ucp/` - UCP protocol implementation (profile, checkout state machine)
- `src/lib/payments/` - Payment provider abstraction + implementations
- `src/lib/db/models/` - Mongoose models (Tenant, Product, CheckoutSession, Order, User, PaymentTransaction)
- `src/lib/auth/` - NextAuth config + role guards
- `src/lib/validators/` - Zod schemas
- `src/lib/utils/` - Chilean utilities (RUT, CLP formatting)
- `src/app/api/ucp/` - UCP REST endpoints (external, API key auth)
- `src/app/api/admin/` - Admin API (session auth)
- `src/app/api/tenant/` - Tenant API (session auth)
- `src/app/(platform)/admin/` - Admin dashboard pages
- `src/app/(platform)/dashboard/` - Tenant dashboard pages

## Commands
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - ESLint

## Conventions
- Prices stored as integers for zero-decimal currencies (CLP, JPY) or cents for 2-decimal currencies (USD→amount in cents). Currency configurable per tenant, default CLP
- RUT validated with modulo-11 before storage
- UCP sessions expire after 30 minutes (TTL index)
- Commission calculated as integer: `Math.round(total * rate)`
- Server Actions for UI mutations, Route Handlers for external APIs
- All UCP responses follow spec at https://ucp.dev/specification/checkout-rest/

## Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_SECRET` - NextAuth encryption key
- `NEXTAUTH_URL` - App URL
- `GEMINI_API_KEY` - Google Gemini API key

## Roles
- `admin` - Platform administrator (manage tenants, commissions, settings)
- `tenant_owner` - Business owner (manage catalog, view orders)
