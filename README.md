# 🏪 Mini Store Inventory Management System

<div align="center">

![SvelteKit](https://img.shields.io/badge/SvelteKit_2-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Postgres](https://img.shields.io/badge/Neon_Postgres-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)


![Dashboard](static/screenshots/dashboard.png)

A modern, full-stack inventory management application built with **SvelteKit** — featuring real-time stock tracking, sales management, PDF receipt generation, multi-currency support, and a charming hand-drawn login UI.

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Deployment](#-deployment)

</div>

---

## ✨ Features

### 📊 Dashboard

- Real-time overview: today/week/month sales, total transactions, inventory count
- Top-selling items with revenue breakdown
- Low-stock & out-of-stock alerts with severity levels
- Sales trend visualization
- Global quick-search across inventory

### 📦 Inventory Management
![Inventory](static/screenshots/inventory.png)

- Full CRUD with inline search & category filtering
- Auto-generated item codes and stock level tracking
- Low-stock threshold alerts per item
- Expiry date tracking with "expired" / "expiring soon" alerts
- Backup & restore (export/import data)
- URL-based item highlighting for quick navigation

### 💰 Sales & Invoicing
![Sales](static/screenshots/sales.png)

- Create sales transactions with multiple line items
- Automatic stock deduction on sale
- Payment methods: Cash, Credit, Mobile Payment
- Auto-generated invoice numbers
- **PDF receipt generation** via jsPDF with store branding
- Customer name tracking & transaction history

### 📈 Reports & Analytics
![Reports](static/screenshots/reports.png)

- Sales reports with custom date range filtering
- Inventory valuation reports
- Top products analysis (by quantity sold & revenue)
- Daily sales summary with trend data
- Sales breakdown by payment method & category
- Export to CSV and PDF

### 🌍 Multi-Currency Support
| Currency | Symbol | Code |
|----------|--------|------|
| US Dollar | $ | USD |
| Euro | € | EUR |
| British Pound | £ | GBP |
| Thai Baht | ฿ | THB |
| Japanese Yen | ¥ | JPY |
| Chinese Yuan | ¥ | CNY |
| Myanmar Kyat | MMK | MMK |
| Canadian Dollar | C$ | CAD |
| Australian Dollar | A$ | AUD |

### 🔐 Authentication & Security
- Cookie-based session authentication (base64-encoded, 30-day expiry)
- Role-Based Access Control: **Administrator** (full access) and **Manager** (read-only on protected routes)
- Rate limiting on login: 5 attempts per 15-minute window
- Input sanitization (XSS prevention)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- Password hashing with constant-time comparison

### 🎨 Premium UI/UX
![Login](static/screenshots/login.png)

- **Hand-drawn login page** — shopkeeper mascot with eye-tracking, SVG sketch filters, paper texture, wax-seal button, ticket-style demo cards
- **Dark glassmorphism** theme across dashboard, inventory, and layout
- Fully responsive: desktop sidebar ↔ mobile hamburger menu
- Skeleton loading states for async content
- Toast notification system (success / error / warning / info)
- Smooth micro-animations and transitions
- Custom-styled form elements with gradient accent colors
- Collapsible sidebar with navigation highlights

### ⚙️ Settings & Profile
![Settings](static/screenshots/settings.png)

- Configure store name, address, phone, email
- Currency & timezone selection
- Low-stock threshold preference
- Notification & email report toggles
- Settings persisted in `localStorage`

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **npm** (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/MawGyi/mini_store_inv_app.git
cd mini_store_inv_app

# Install dependencies
npm install

# Seed the database with sample data (optional)
npm run seed

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@ministore.com` | `admin123` |
| Manager | `manager@ministore.com` | `manager123` |

> ⚠️ **Change credentials before deploying to production!**

---

## 🏗 Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | SvelteKit 2 + Svelte 4 | Full-stack SSR framework |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS 3.4 + PostCSS | Utility-first CSS with `@tailwindcss/forms` & `@tailwindcss/typography` |
| **Database (Dev)** | SQLite via `better-sqlite3` / `@libsql/client` | Zero-config local database |
| **Database (Prod)** | Neon Postgres via `@vercel/postgres` / `pg` | Serverless PostgreSQL |
| **ORM** | Drizzle ORM | Type-safe SQL query builder |
| **Validation** | Zod | Runtime schema validation |
| **PDF** | jsPDF + jspdf-autotable | Receipt & report generation |
| **Build** | Vite 5 | Dev server & production bundling |
| **Testing** | Vitest + Testing Library | Unit & component testing |
| **Deployment** | Vercel (`@sveltejs/adapter-vercel`) | Serverless edge deployment |
| **State** | Svelte Stores | Reactive client-side state |

### Storage Adapter Pattern

The app uses a **pluggable storage layer** with a common `StorageAdapter` interface:

```
StorageAdapter (interface)
├── SqliteAdapter      → Local development (file:sqlite.db)
├── PostgresAdapter    → Production (Neon Postgres)
└── MockAdapter        → Testing
```

The correct adapter is auto-detected based on environment variables (`DATABASE_TYPE`, `POSTGRES_URL`, `TURSO_DATABASE_URL`).

### Project Structure

```
mini_store_inv_app/
├── src/
│   ├── app.css                  # Global design system & styles
│   ├── app.html                 # HTML entry point
│   ├── hooks.server.ts          # Auth middleware, security headers, DB init
│   ├── lib/
│   │   ├── components/          # Svelte UI components
│   │   │   ├── Dashboard.svelte       # Main dashboard view
│   │   │   ├── InventoryList.svelte   # Inventory management grid
│   │   │   ├── AdvancedSearch.svelte   # Search & filter panel
│   │   │   ├── NotificationToast.svelte
│   │   │   ├── NotificationContainer.svelte
│   │   │   └── SkeletonLoader.svelte
│   │   ├── stores/              # Svelte reactive stores
│   │   │   ├── auth.ts          # Authentication state & login/logout
│   │   │   ├── settings.ts      # Store settings & currency formatting
│   │   │   └── stores.ts        # Notification store
│   │   ├── server/              # Server-side only
│   │   │   ├── config/          # Database config detection
│   │   │   ├── db/              # Drizzle schema & DB initialization
│   │   │   ├── storage/         # Storage adapters (SQLite, Postgres, Mock)
│   │   │   │   ├── interfaces.ts    # StorageAdapter interface
│   │   │   │   ├── types.ts         # Storage types
│   │   │   │   ├── sqlite.ts        # SQLite adapter
│   │   │   │   ├── postgres.ts      # Postgres adapter
│   │   │   │   ├── mock.ts          # Mock adapter (testing)
│   │   │   │   └── index.ts         # Adapter factory
│   │   │   └── security.ts      # Rate limiting, hashing, input sanitization
│   │   ├── types/index.ts       # Shared TypeScript interfaces
│   │   ├── utils/pdfGenerator.ts# PDF receipt generation
│   │   └── validators.ts        # Zod validation schemas
│   └── routes/
│       ├── +layout.svelte       # Main layout (sidebar, navigation)
│       ├── +page.svelte         # Root redirect
│       ├── login/               # Auth page (hand-drawn UI)
│       ├── dashboard/           # Dashboard overview
│       ├── inventory/           # Inventory CRUD
│       ├── sales/               # Sales management
│       ├── reports/             # Reports & analytics
│       ├── settings/            # App configuration
│       ├── profile/             # User profile
│       └── api/                 # REST API endpoints
│           ├── auth/            # Login, logout, session
│           ├── items/           # Items CRUD
│           ├── sales/           # Sales CRUD + top-selling
│           ├── dashboard/       # Stats, alerts, trends
│           ├── reports/         # Sales, inventory, top-products, daily-summary
│           └── export/          # Data export
├── scripts/                     # Database seed scripts
├── server/                      # Legacy Express server (deprecated)
├── static/                      # Static assets (logo, favicon)
├── svelte.config.js             # SvelteKit config (Vercel adapter, aliases)
├── tailwind.config.js           # Tailwind + plugins config
├── vite.config.ts               # Vite dev server config
├── vitest.config.ts             # Vitest testing config
├── vercel.json                  # Vercel deployment config
└── package.json
```

---

## 🗄️ Database Schema

```sql
-- Items: Inventory products
CREATE TABLE items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  item_code       TEXT UNIQUE NOT NULL,
  price           REAL NOT NULL,
  stock_quantity  INTEGER NOT NULL,
  low_stock_threshold INTEGER NOT NULL,
  category        TEXT,
  expiry_date     INTEGER,          -- Unix timestamp
  created_at      INTEGER NOT NULL,  -- Unix timestamp
  updated_at      INTEGER NOT NULL   -- Unix timestamp
);

-- Sales: Transaction headers
CREATE TABLE sales (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_date       INTEGER NOT NULL,
  total_amount    REAL NOT NULL,
  payment_method  TEXT NOT NULL,     -- 'cash' | 'credit' | 'mobile_payment'
  customer_name   TEXT,
  invoice_number  TEXT UNIQUE NOT NULL,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Sale Items: Line items per sale
CREATE TABLE sale_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id     INTEGER REFERENCES sales(id),
  item_id     INTEGER REFERENCES items(id),
  quantity    INTEGER NOT NULL,
  unit_price  REAL NOT NULL,
  total_price REAL NOT NULL
);

-- Categories: Item categorization
CREATE TABLE categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT UNIQUE NOT NULL,
  created_at  INTEGER NOT NULL
);
```

---

## 📡 API Reference

All API endpoints are SvelteKit server routes under `/api/`. Protected routes require a valid session cookie.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email & password |
| `POST` | `/api/auth/logout` | Destroy session |
| `GET` | `/api/auth/session` | Check current session |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/items` | List items (`?search=`, `?category=`) |
| `GET` | `/api/items/[id]` | Get item by ID |
| `POST` | `/api/items` | Create item *(Admin only)* |
| `PUT` | `/api/items/[id]` | Update item *(Admin only)* |
| `DELETE` | `/api/items/[id]` | Delete item *(Admin only)* |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sales` | List sales (paginated) |
| `GET` | `/api/sales/[id]` | Get sale with line items |
| `POST` | `/api/sales` | Create sale *(Admin only)* |
| `DELETE` | `/api/sales/[id]` | Delete sale *(Admin only)* |
| `GET` | `/api/sales/top-selling` | Top-selling items by quantity |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Overview stats (sales, items, transactions) |
| `GET` | `/api/dashboard/alerts` | Low-stock & expiry alerts |
| `GET` | `/api/dashboard/sales-trends` | Sales trend data |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/sales` | Sales report with date filters |
| `GET` | `/api/reports/inventory` | Inventory valuation report |
| `GET` | `/api/reports/top-products` | Top products by revenue |
| `GET` | `/api/reports/daily-summary` | Daily sales summary |

---

## 🧪 Testing

The project uses **Vitest** with **Testing Library** for unit and component tests, with **v8** coverage.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Test Coverage Areas
- **Stores:** `auth.ts`, `settings.ts`, `stores.ts`
- **Validators:** `validators.ts` (Zod schema tests)
- **Security:** `security.ts` (rate limiting, hashing, sanitization)
- **Components:** Dashboard, InventoryList, AdvancedSearch, Notifications, SkeletonLoader
- **Storage:** Mock adapter, config detection, seed scripts
- **Types:** Type interface validation

---

## 🧑‍💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (SQLite) at `localhost:5173` |
| `npm run dev:prod` | Start dev server with production DB at `localhost:3000` |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run check` | SvelteKit type checking |
| `npm run check:watch` | Type checking in watch mode |
| `npm run test` | Run Vitest tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run seed` | Seed local SQLite with sample data |
| `npm run seed:prod` | Seed production database |

### Environment Variables

Copy `.env.example` to `.env` for local development:

```env
# Local development — uses SQLite, no external DB needed
DATABASE_TYPE=sqlite
```

For production (Neon Postgres on Vercel):

```env
# Remove or comment out DATABASE_TYPE for Postgres
# DATABASE_TYPE=sqlite

# Neon Serverless Postgres connection
POSTGRES_URL=postgres://user:pass@ep-xxx.region.neon.tech/mini_store_inv_app?sslmode=require

# Or individual parameters
POSTGRES_HOST=ep-xxx.region.neon.tech
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=mini_store_inv_app
```

Legacy Turso support is also available via `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

---

## 🌐 Deployment

### Vercel + Neon Postgres

#### 1. Create Neon Database
1. Sign up at [neon.tech](https://neon.tech) (free tier available)
2. Create a new project → copy the connection string
3. The app auto-creates tables on first request

#### 2. Deploy to Vercel
```bash
# Push to GitHub
git push origin main

# On Vercel: Import repo → Deploy
# Framework Preset: SvelteKit (auto-detected)
```

#### 3. Set Environment Variables
In Vercel → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `POSTGRES_URL` | `postgres://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` |

#### 4. Seed Production Database
```bash
npm run seed:prod
```

Subsequent pushes to `main` trigger automatic redeployment.

> **Region:** Currently configured for `iad1` (US East) in `svelte.config.js`. Adjust as needed.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Empty dashboard after fresh setup | Run `npm run seed` to populate sample data |
| Database connection fails in production | Verify `POSTGRES_URL` is set correctly in Vercel env vars |
| Login fails with "Unauthorized" | Clear cookies and retry; check if session has expired (30-day limit) |
| Rate limited on login | Wait 15 minutes or restart the dev server to clear in-memory rate limits |
| Mobile layout broken | Ensure the viewport meta tag is present in `app.html` |
| Build fails | Run `npm run check` to identify TypeScript errors, then `npm run build` |

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention
| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Formatting (no code change) |
| `refactor:` | Code restructuring |
| `test:` | Adding or updating tests |
| `chore:` | Build/config changes |

---

## 📄 License

MIT License — free for personal and commercial use.

---

<div align="center">

**Built with ❤️ using SvelteKit**

[⬆ Back to Top](#-mini-store-inventory-management-system)

</div>
