<div align="center">

# ZYRA — Premium Fashion & Lifestyle Store

A full-stack e-commerce platform for premium fashion, with end-to-end **customer shopping**, an **admin dashboard**, **role-based auth (Clerk + local fallback)**, and a built-in **AI Virtual Stylist** that assembles real outfits from the live product catalog.

[Live demo](#-getting-started) · [Report bug](#-contributing) · [Features](#-features) · [Stack](#-tech-stack)

</div>

---

## Table of contents

- [Overview](#-overview)
- [Features](#-features)
  - [Customer storefront](#-customer-storefront)
  - [Admin dashboard](#-admin-dashboard)
  - [AI Virtual Stylist](#-ai-virtual-stylist)
  - [Authentication & security](#-authentication--security)
- [Tech stack](#-tech-stack)
- [Repository layout](#-repository-layout)
- [Data model](#-data-model)
- [Getting started](#-getting-started)
- [Environment variables](#-environment-variables)
- [Running the app](#-running-the-app)
- [API reference](#-api-reference)
- [Customer flow](#-customer-flow)
- [Admin flow](#-admin-flow)
- [AI Stylist flow](#-ai-stylist-flow)
- [Project structure (frontend)](#-project-structure-frontend)
- [Project structure (backend)](#-project-structure-backend)
- [Build & deploy](#-build--deploy)
- [Testing](#-testing)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## Overview

ZYRA is a production-style fashion storefront and admin console built as a single monorepo with two apps:

- **`Frontend/`** — Vite + React 19 SPA with Redux Toolkit, Tailwind CSS v4, and Clerk for production auth
- **`Backend/`** — Node.js + Express 5 API with MongoDB (Mongoose) and a **local JSON fallback** that lets the entire stack run with zero external services

The platform supports both **guests and signed-in users**, has a fully-featured **admin panel** (users, products, orders, image uploads to Cloudinary, statistics), and ships with a unique **AI Virtual Stylist** that returns product IDs verified server-side against the database.

---

## Features

### 🛍️ Customer storefront

| Capability | Description |
|---|---|
| Homepage | Hero, best-sellers carousel, new arrivals, gender/category sections |
| Collections | `Men`, `Women`, `Top Wear`, `Bottom Wear` with filters (size, color, brand, material, price), sort, search |
| Product details | Image gallery, sizes, colors, stock, reviews, similar-products recommendations |
| Search | Full-text across name / description / brand / SKU |
| Guest cart | LocalStorage-backed cart, automatic `guestId`, syncs to server on action |
| Logged-in cart | Server-authoritative cart keyed by user id |
| Cart merge | Guest cart is merged into the user cart on sign-in |
| Add to cart | Single-item and **batch** (entire outfit) endpoints |
| Checkout | Multi-step form, address book, payment-method selection, server-side validation |
| Order history | My orders, order details, reorder flow |
| Order confirmation | Estimated delivery, order summary, items |
| Profile | Personal info, saved addresses, password change |
| Auth | Email/password, Google (Clerk SignIn), local-mode fallback |
| Responsive | Mobile-first, mobile drawer, slide-in cart drawer, lazy-loaded routes |

### 🛠️ Admin dashboard

- **Dashboard** with KPIs: total revenue, orders, products, users, customer/admin split, order status breakdown
- **Product management**: list, search, filter, create, edit, delete
- **Image upload** to Cloudinary with multi-file support (up to 10 per product)
- **User management**: list, filter, role assignment, approval, delete
- **Order management**: list, search, status update (processing, shipped, delivered, cancelled, etc.), delete
- **Admin-only routes** gated server-side (`requireLocalAdmin`) and client-side (`RequireAdmin`)
- **Statistics endpoint** for charts

### 🤖 AI Virtual Stylist

- Free-form natural language prompt: *"Create a casual college outfit for men under $100"*
- Server returns a **complete outfit** (1 top + 1 bottom minimum, 3-6 items typical)
- The model is **forced to return product IDs**, and the server **re-validates every ID** against the database before shipping to the client — the AI cannot inject a fake product
- Detects intent locally (gender, occasion, style, budget) to drive the prompt and the deterministic fallback
- **Smart offline fallback** — works with zero configuration, no API key required
- **Per-item** Add to Cart and **Add entire outfit** (single batch call) actions
- Shows a clear indicator when the AI provider is not configured (still functional)
- Provider-agnostic via OpenAI-compatible `/chat/completions` — OpenAI, OpenRouter, Groq, Together, etc.

### 🔐 Authentication & security

- **Clerk** in production (email/password + Google social, multi-factor)
- **Local JWT** fallback for development and offline runs
- **Auto-promote** to admin: emails in `CLERK_ADMIN_EMAILS` are upgraded to `admin` on first Clerk sign-in
- HttpOnly JWT cookie + Bearer token support
- Separate admin sign-in page (`/local-login`) restricted to admin/superadmin role
- Role checks server-side (`requireLocalUser` / `requireLocalAdmin`) and client-side (`RequireAuth` / `RequireAdmin`)
- `helmet` HTTP headers, CORS allow-list, `express-rate-limit` (per-IP and per-route auth limit), `express-mongo-sanitize` against NoSQL injection
- Service worker pre-cache with stale-origin cleanup so old `localhost:5176` SWs do not shadow the current origin
- All secrets server-side; no API keys prefixed `VITE_` so they cannot leak to the client bundle

---

## Tech stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev) + [Vite 8](https://vitejs.dev) |
| Routing | [react-router-dom 7](https://reactrouter.com) (lazy routes) |
| State | [Redux Toolkit 2](https://redux-toolkit.js.org) + [react-redux 9](https://react-redux.js.org) |
| Auth | [@clerk/react 6](https://clerk.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) (CSS-first config) + custom design tokens |
| HTTP | [Axios 1](https://axios-http.com) with auth interceptor (Clerk + legacy JWT) |
| Icons | [react-icons 5](https://react-icons.github.io/react-icons) |
| Toasts | [sonner 2](https://sonner.emilkowal.ski) |
| PWA / offline | Hand-written service worker, `manifest.json` |
| Testing | [Playwright 1.62](https://playwright.dev) (e2e) |
| Lint | ESLint 10 + `eslint-plugin-react-hooks` |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 (ESM, `"type": "module"`) |
| Framework | [Express 5](https://expressjs.com) |
| Database | [MongoDB](https://www.mongodb.com) via [Mongoose 9](https://mongoosejs.com) **or** a local JSON store (`Backend/data/local-store.json`) with zero external dependencies |
| Auth | [@clerk/backend 3](https://clerk.com/docs/backend-authentication/overview) + [@clerk/express 2](https://www.npmjs.com/package/@clerk/express) for production, [jsonwebtoken 9](https://www.npmjs.com/package/jsonwebtoken) + [bcryptjs 3](https://www.npmjs.com/package/bcryptjs) for local mode |
| Storage | [Cloudinary 2](https://cloudinary.com) for product images (multer 2 + streamifier) |
| AI | [openai 7](https://www.npmjs.com/package/openai) (OpenAI-compatible client, default `gpt-oss-20b:free` via OpenRouter) |
| Security | [helmet 8](https://helmetjs.github.io), [cors 2](https://www.npmjs.com/package/cors) with allow-list, [express-rate-limit 7](https://www.npmjs.com/package/express-rate-limit), [express-mongo-sanitize 2](https://www.npmjs.com/package/express-mongo-sanitize) |
| Validation | [express-validator 7](https://express-validator.github.io) |
| Logging | [morgan 1](https://www.npmjs.com/package/morgan) (dev / combined) |
| Dev | [nodemon 3](https://nodemon.io) |

### Design tokens

- Brand: `--color-zyra: #ea2e0e` (primary), `--color-zyra-secondary: #c41f07`, `--color-zyra-dark: #991506`
- Type: Inter via Google Fonts
- Layout: Tailwind v4 with custom `@theme`

---

## Repository layout

```
ZYRA/
├── Backend/                    # Node + Express API
│   ├── Server.js               # Entry: middleware, route mounting, error handling
│   ├── config/                 # Mongo connection, initial seeder
│   ├── middleware/             # auth (Clerk + JWT), error
│   ├── models/                 # Mongoose schemas (User, Product, Cart, Order, Checkout, Subscriber)
│   ├── routes/                 # 16 route files (admin, public, stylist, batch)
│   ├── services/               # localStore, stylistService, stylistResponse
│   ├── data/                   # products seed + local-store.json (live)
│   ├── scripts/                # createSuperAdmin, promoteToSuperAdmin
│   ├── seeder.js
│   ├── .env                    # local secrets (gitignored)
│   └── .env.example            # committed template
│
├── Frontend/                   # Vite + React SPA
│   ├── index.html              # SEO meta, Inter font, structured data
│   ├── public/                 # sw.js, manifest.json, favicon.svg, robots.txt
│   ├── src/
│   │   ├── main.jsx            # Entry: ClerkProvider, SW registration
│   │   ├── App.jsx             # Lazy routes
│   │   ├── api/client.js       # Axios + auth interceptor
│   │   ├── Pages/              # Home, Login, Register, LocalLogin, Profile, CollectionPage, Cart, Checkout, Order*, Stylist, NotFound, Admin*
│   │   ├── components/
│   │   │   ├── auth/           # ClerkAuthBridge, RequireAuth, RequireAdmin
│   │   │   ├── cart/           # CartContext, CartContents, Checkout
│   │   │   ├── products/       # ProductGrid, ProductsDetails, NewArrivals, BestSeller, ...
│   │   │   ├── common/         # Header, Footer, Navbar
│   │   │   ├── layout/         # UserLayout, CartDrawer, Topbar, Hero
│   │   │   └── Admin/          # AdminLayout, AdminSidebar, UserManagment, ProductManagement, OrderManagement, EditProductPage
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   └── slices/         # auth, products, cart, checkout, order, admin, adminProduct, adminOrder, stylist
│   │   ├── utils/              # performance, requestWithRetry, clerkToken, guestId
│   │   └── index.css           # Tailwind v4 @theme tokens
│   ├── tailwind.config.js (via @theme in CSS)
│   ├── vite.config.js
│   ├── .env
│   └── .env.example
│
├── DEPLOYMENT.md
├── CRITICAL_ISSUES_LOG.md
├── FIX_SUMMARY_REPORT.md
├── vercel.json                  # Frontend Vercel config
├── package.json                 # Root (workspaces config)
└── README.md                    # You are here
```

---

## Data model

The full Mongoose schema is authoritative; the local JSON store mirrors it.

### `User`

| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `email` | String | unique (case-insensitive) |
| `password` | String | bcrypt hash, 10 rounds (local mode only) |
| `role` | String | `customer` (default) / `admin` / `superadmin` |
| `clerkUserId` | String | set on first Clerk sign-in |
| `isAdminApproved` | Boolean | gates admin login when `true` |
| `addresses` | Array | `{firstName, lastName, phone, address, city, postalCode, country, isDefault}` |
| `createdAt` / `updatedAt` | Date | |

### `Product`

| Field | Type | Notes |
|---|---|---|
| `sku` | String | unique, indexed |
| `name`, `description` | String | indexed for full-text search |
| `price` | Number | list price |
| `discountPrice` | Number | optional |
| `countInStock` | Number | defaults to 0 |
| `category` | String | `Top Wear` / `Bottom Wear` (indexed) |
| `brand` | String | |
| `sizes` | [String] | `S`, `M`, `L`, `XL`, `XXL` |
| `colors` | [String] | |
| `collections` | String | free-text, e.g. `Business Casual`, `Streetwear` (indexed) |
| `material` | String | |
| `gender` | String | `Men` / `Women` (indexed) |
| `images` | [{`url`, `publicId`, `altText`}] | Cloudinary |
| `tags` | [String] | |
| `isFeatured`, `isPublished` | Boolean | indexed |
| `rating`, `numReviews` | Number | |

### `Cart`, `Order`, `Checkout`, `Subscriber` — see `Backend/models/`

### Local JSON store

`Backend/data/local-store.json` is the single source of truth when `USE_LOCAL_DATA=true`. It contains `{ products, users, carts, checkouts, orders, subscribers }`. The store is auto-seeded from `Backend/data/products.js` on first read.

---

## Getting started

### Prerequisites

- Node.js 20+ (tested on 24)
- npm 10+
- (Production only) MongoDB instance, Clerk account, Cloudinary account, AI provider key

### 1. Clone & install

```bash
git clone <repo-url> zyra
cd zyra
cd Backend && npm install
cd ../Frontend && npm install
```

### 2. Configure environment

Copy the example envs and edit:

```bash
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
```

The defaults work **without any external service** — `USE_LOCAL_DATA=true` and the AI stylist falls back to deterministic local recommendations.

See [Environment variables](#-environment-variables) for the full list.

### 3. Seed an admin (optional, local mode only)

```bash
cd Backend
node scripts/createSuperAdmin.js
node scripts/promoteToSuperAdmin.js your@email.com   # promote an existing user
```

Default credentials: `superadmin@zyra.com` / `SuperAdmin@123!` (after running `createSuperAdmin.js`).

### 4. Start the stack

```bash
# Terminal 1 — backend on http://localhost:5000
cd Backend
npm run dev

# Terminal 2 — frontend on http://localhost:5173 (or whatever vite.config.js says)
cd Frontend
npm run dev
```

Open <http://localhost:5173> and you're in.

---

## Environment variables

### `Backend/.env`

| Key | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | no | `5000` | Express port |
| `NODE_ENV` | no | `development` | `development` / `production` / `test` |
| `USE_LOCAL_DATA` | **yes for dev** | `false` | When `true`, skips MongoDB and uses `Backend/data/local-store.json` |
| `MONGO_URI` | required if not local | — | `mongodb://127.0.0.1:27017/zyra` |
| `JWT_SECRET` | **yes** | — | Local-mode JWT signing secret (use a long random value in production) |
| `JWT_EXPIRES_IN` | no | `7d` | |
| `JWT_COOKIE_NAME` | no | `zyra_token` | httpOnly cookie name |
| `CLIENT_URL` | **yes** | `http://localhost:5173` | Comma-separated allowed CORS origins |
| `CLOUDINARY_CLOUD_NAME` | required for image upload | — | |
| `CLOUDINARY_API_KEY` | required for image upload | — | |
| `CLOUDINARY_API_SECRET` | required for image upload | — | |
| `CLOUDINARY_PRODUCT_FOLDER` | no | `ZYRA` | Cloudinary folder |
| `CLERK_SECRET_KEY` | required for Clerk mode | — | `sk_test_...` or `sk_live_...` |
| `CLERK_PUBLISHABLE_KEY` | required for Clerk mode | — | |
| `CLERK_FRONTEND_API` | required for Clerk mode | — | e.g. `https://<instance>.clerk.accounts.dev` |
| `CLERK_API_URL` | no | `https://api.clerk.com` | |
| `CLERK_JWKS_URL` | required for Clerk mode | — | `<frontend_api>/.well-known/jwks.json` |
| `CLERK_ADMIN_EMAILS` | no | — | Comma-separated; auto-promote on Clerk sign-in |
| `STYLIST_API_KEY` | no | (empty) | AI provider key. **Server-side only.** |
| `STYLIST_BASE_URL` | no | `https://openrouter.ai/api/v1` | Any OpenAI-compatible endpoint |
| `STYLIST_MODEL` | no | `openai/gpt-oss-20b:free` | Model name |

### `Frontend/.env`

| Key | Required | Default | Purpose |
|---|---|---|---|
| `VITE_BACKEND_URL` | no | `http://localhost:5000` | Base URL of the API |
| `VITE_USE_LOCAL_DATA` | no | `true` | Toggles local-mode behavior in the client |
| `VITE_CLERK_PUBLISHABLE_KEY` | no | (empty) | `pk_test_...` or `pk_live_...` |

> **Never** put a Clerk secret or stylist key in `Frontend/.env`. Only `VITE_*` vars are exposed to the client bundle.

---

## Running the app

| Action | Command |
|---|---|
| Backend dev (with hot reload) | `cd Backend && npm run dev` |
| Backend production | `cd Backend && npm start` |
| Frontend dev | `cd Frontend && npm run dev` |
| Frontend production build | `cd Frontend && npm run build` |
| Frontend preview | `cd Frontend && npm run preview` |
| Lint frontend | `cd Frontend && npm run lint` |
| E2E tests (Playwright) | `cd Frontend && npx playwright test` |
| Seed super admin | `cd Backend && node scripts/createSuperAdmin.js` |
| Promote user to super admin | `cd Backend && node scripts/promoteToSuperAdmin.js <email>` |

---

## API reference

All routes are JSON. Authenticated routes accept either:
- `Authorization: Bearer <jwt>` header
- httpOnly cookie `JWT_COOKIE_NAME`

### Public

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/products` | — | Paginated `{ products, page, pages, total }`; supports `gender`, `category`, `size`, `color`, `brand`, `material`, `minPrice`, `maxPrice`, `collection`, `search`, `sortBy` |
| GET | `/api/products/:id` | — | Single product |
| GET | `/api/products/new-arrivals` | — | Array of latest products |
| GET | `/api/products/best-seller` | — | Top-rated product |
| GET | `/api/products/best-sellers` | — | Array of best sellers |
| GET | `/api/products/similar/:id` | — | Up to 4 ranked similar products |
| GET | `/api/cart` | `?userId=&guestId=` | `{ products, totalPrice }` |
| POST | `/api/cart` | `{ productId, quantity, size, color, guestId, userId }` | Updated cart (201) |
| PUT | `/api/cart` | `{ productId, quantity, size, color, guestId, userId }` | Updated cart |
| DELETE | `/api/cart` | `{ productId, size, color, guestId, userId }` | Updated cart |
| POST | `/api/cart/merge` | `{ guestId }` (auth required) | Merged cart |
| POST | `/api/cart/batch` | `{ guestId \| userId, items: [{ productId, size?, color?, quantity }] }` | `{ message, addedCount, skipped, cart }` |
| POST | `/api/checkout` | checkout payload (auth required) | Created checkout |
| POST | `/api/checkout/:id/pay` | (auth required) | Updated checkout |
| POST | `/api/checkout/:id/finalize` | (auth required) | Created order |
| GET | `/api/orders/my-orders` | (auth required) | Array of orders |
| GET | `/api/orders/:id` | (auth required) | Order details |
| POST | `/api/users/register` | `{ name, email, password }` | `{ user, token }` |
| POST | `/api/users/login` | `{ email, password }` | `{ user, token }` |
| GET | `/api/users/profile` | (auth required) | Profile |
| PUT | `/api/users/profile` | (auth required) | Updated profile |
| POST | `/api/subscribers` | `{ email }` | `{ message }` |
| POST | `/api/stylist/recommend` | `{ prompt }` | `{ outfitName, summary, source, aiConfigured, aiError, products[] }` |
| POST | `/api/upload` | `multipart image` | `{ imageUrl, publicId }` |

### Admin (require `admin` or `superadmin` role)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard KPIs |
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/products` | List products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| POST | `/api/admin/products/upload` | `multipart images` (≤ 10) → Cloudinary |
| GET | `/api/admin/orders` | List orders |
| GET | `/api/admin/orders/:id` | Order details |
| PUT | `/api/admin/orders/:id` | Update status |
| DELETE | `/api/admin/orders/:id` | Delete order |

### Response shapes

Most endpoints return either:

```json
{ "products": [...], "page": 1, "pages": 1, "total": 40 }
```

or a single object. Errors are always `{ "message": "..." }` with a 4xx/5xx status.

---

## Customer flow

1. Land on `/` → see hero, best-sellers, new arrivals
2. Browse `/collections/all?gender=Men` or `?category=Top+Wear` etc.
3. Open a product page → image gallery, sizes, colors, stock, similar products
4. Add to cart (guest or signed-in) → POST `/api/cart` (single) or `/api/cart/batch` (outfit)
5. Open cart drawer → review items, change quantity, remove
6. **Sign in** → guest cart auto-merges via `/api/cart/merge`
7. **Checkout** → address, payment method → `/api/checkout` → `/api/checkout/:id/pay` → `/api/checkout/:id/finalize`
8. Order confirmation page with estimated delivery
9. My Orders → reorder / view details

## Admin flow

1. Sign in at `/local-login` with `superadmin@zyra.com` / `SuperAdmin@123!` (or any admin email)
2. Land on `/admin` → stats dashboard
3. Manage **products**: list, search, create (with image upload to Cloudinary), edit, delete
4. Manage **users**: list, change role, approve, delete
5. Manage **orders**: list, filter, change status, view details, delete
6. Sign out → cleared from Redux + storage

## AI Stylist flow

1. Visit `/stylist` (or click **✨ AI Stylist** in the navbar)
2. Type a request: *"casual college outfit for men under $100"*, or click a suggestion chip
3. Frontend → `POST /api/stylist/recommend { prompt }`
4. Backend detects intent (gender, occasion, style, budget) and either:
   - Calls the AI provider with a compact catalog and strict rules
   - Falls back to deterministic local ranking (no key configured)
5. AI returns `{ outfitName, summary, productIds[] }` (or fallback produces the same shape)
6. **Server re-validates every productId against the database** — fake IDs are dropped
7. Frontend renders product cards with image, name, price, color/size chips, **View** and **Add to cart** buttons
8. **Add entire outfit** → `POST /api/cart/batch` with all items in one call, optimistic UI update, toast confirmation
9. The page shows whether AI is active or whether the fallback was used (with the actual AI error if any)

---

## Project structure (frontend)

```
src/
├── main.jsx               # ReactDOM, ClerkProvider, service worker
├── App.jsx                # Lazy routes
├── index.css              # Tailwind v4 @theme tokens
├── api/client.js          # Axios with auth interceptor (Clerk + legacy JWT)
├── Pages/                 # Top-level routes
├── components/
│   ├── auth/              # ClerkAuthBridge, RequireAuth, RequireAdmin
│   ├── cart/              # CartContext, CartContents, Checkout
│   ├── products/          # ProductGrid, ProductsDetails, NewArrivals, BestSeller, FeaturedCollection, FeaturesSection, GenderProductSection
│   ├── common/            # Header, Footer, Navbar
│   ├── layout/            # UserLayout, CartDrawer, Topbar, Hero
│   └── Admin/             # AdminLayout, AdminSidebar, ProductManagement, OrderManagement, UserManagment, EditProductPage
├── redux/
│   ├── store.js
│   └── slices/            # auth, products, cart, checkout, order, admin, adminProduct, adminOrder, stylist
└── utils/                 # performance, requestWithRetry, clerkToken, guestId
```

## Project structure (backend)

```
Backend/
├── Server.js                          # Entry, middleware chain, route mounting
├── config/
│   ├── db.js                          # Mongoose connect
│   └── seedInitialData.js
├── middleware/
│   ├── authMiddleware.js              # protect (Clerk first, JWT fallback)
│   └── errorMiddleware.js
├── models/                            # User, Product, Cart, Order, Checkout, Subscriber
├── routes/                            # user, product, cart, checkout, order, upload, subscribe, admin*, stylist, cartBatch, localFallback
├── services/
│   ├── localStore.js                  # JSON store helpers (withStore, ensureCart, filterProducts, etc.)
│   ├── stylistService.js              # AI integration with offline fallback
│   └── stylistResponse.js             # product shaping + fetchProductByIds
├── data/                              # products seed + local-store.json (live)
└── scripts/                           # createSuperAdmin, promoteToSuperAdmin
```

---

## Build & deploy

### Frontend (Vercel-friendly)

`vercel.json` at the root configures the build for Vercel. To build locally:

```bash
cd Frontend
npm run build
npm run preview    # serves dist/ on the configured port
```

### Backend (any Node host)

```bash
cd Backend
NODE_ENV=production \
USE_LOCAL_DATA=false \
MONGO_URI=... \
JWT_SECRET=$(openssl rand -hex 64) \
npm start
```

For containerized deploys, the standard `node:24-alpine` image works — copy `Backend/`, `npm ci --omit=dev`, then `CMD ["node", "Server.js"]`.

See `DEPLOYMENT.md` for the full deploy guide.

---

## Testing

End-to-end tests live in `Frontend/tests` (Playwright). The dev team uses them to verify customer, admin, and AI stylist flows against a running stack.

```bash
cd Frontend
npx playwright test                # headless
npx playwright test --ui           # interactive UI mode
```

Manual smoke test (with both servers running):

```bash
# Health
curl http://localhost:5000/                                    # "Welcome to the ZYRA API!"
curl http://localhost:5173/                                    # 200, HTML shell

# Stylist (no key configured — fallback)
curl -X POST http://localhost:5000/api/stylist/recommend \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a casual college outfit for women"}'
# → { outfitName, summary, source: "fallback", aiConfigured: false, products: [...] }
```

---

## Roadmap

- [ ] Reviews & ratings (frontend UI, backend persistence)
- [ ] Wishlist
- [ ] Email notifications (order confirmation, shipping)
- [ ] Payment gateway integration (Stripe)
- [ ] Multi-currency + i18n
- [ ] Product recommendations via collaborative filtering on top of stylist
- [ ] AI stylist: streaming responses, conversation history, image-aware prompts
- [ ] Server-Sent Events for live order status updates in admin

---

## Contributing

1. Fork & branch (`git checkout -b feat/your-feature`)
2. Make your changes
3. Run `npm run lint` and Playwright tests
4. Open a PR with a clear description

Please do not commit secrets, `.env` files, or `local-store.json` with real user data.

---

## License

[MIT](./LICENSE) — Rukhsar Mansuri / ZYRA contributors.

---

## Acknowledgements

- [Clerk](https://clerk.com) for authentication
- [Cloudinary](https://cloudinary.com) for image storage and delivery
- [OpenRouter](https://openrouter.ai) for the free AI Stylist model
- [Tailwind CSS](https://tailwindcss.com) for the design system
- [Redux Toolkit](https://redux-toolkit.js.org) for predictable state
- The React, Express, and Vite communities

---

<div align="center">

Built with care by the ZYRA team.

</div>
