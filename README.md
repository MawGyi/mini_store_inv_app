# 🏪 Mini Store Inventory Management System

<div align="center">

![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

A modern, full-stack inventory management application with real-time stock tracking, sales management, and multi-currency support.

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [API Reference](#-api-reference) • [Deployment](#-deployment)

</div>

---

## ✨ Features

### 📊 Dashboard
- Real-time sales overview with trends visualization
- Top-selling items tracking
- Low stock and expiry alerts
- Quick search across all inventory items

### 📦 Inventory Management
- Full CRUD operations with search & filtering
- Category-based organization
- Stock level tracking with threshold alerts
- Backup/restore functionality (CSV/JSON)
- URL-based item highlighting

### 💰 Sales Management
- Create and manage sales transactions
- Multiple payment method support
- Invoice printing and PDF export
- Customer information tracking
- Transaction history with filtering

### 📈 Reports
- Sales reports with date range filtering
- Inventory valuation reports
- Top products analysis
- Daily summary with trends
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
| Myanmar Kyat | K | MMK |
| Canadian Dollar | C$ | CAD |
| Australian Dollar | A$ | AUD |

### 🎨 Modern UI/UX
- Responsive design (desktop & mobile optimized)
- Collapsible sidebar with mobile hamburger menu
- Glassmorphism modal effects
- Smooth micro-animations and transitions
- Custom-styled form elements (inputs, selects, buttons)
- Gradient accent colors on stat cards
- Skeleton loading states

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **npm** or **pnpm**

### Installation

```bash
# Clone the repository
git clone https://github.com/MawGyi/mini_store_inv_app.git
cd mini_store_inv_app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Demo Credentials
```
Email:    admin@ministore.com
Password: admin123
```

> ⚠️ **Note:** Change credentials in production!

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit 2.0 + Svelte 4 |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4 |
| Database | SQLite (better-sqlite3) |
| Build Tool | Vite 5 |
| State | Svelte Stores |
| Auth | JWT + bcrypt |

---

## 📁 Project Structure

```
mini_store_inv_app/
├── src/
│   ├── lib/
│   │   ├── components/       # Reusable Svelte components
│   │   ├── stores/           # Svelte stores (auth, settings, notifications)
│   │   ├── types/            # TypeScript type definitions
│   │   ├── server/           # Server-side code & database
│   │   ├── utils/            # Utility functions
│   │   └── validators.ts     # Input validation
│   ├── routes/
│   │   ├── api/              # REST API endpoints
│   │   ├── dashboard/        # Dashboard page
│   │   ├── inventory/        # Inventory management
│   │   ├── sales/            # Sales management
│   │   ├── reports/          # Reports & analytics
│   │   ├── settings/         # App settings
│   │   ├── login/            # Authentication
│   │   └── +layout.svelte    # Main layout with sidebar
│   └── app.css               # Global styles & design system
├── static/                   # Static assets
├── svelte.config.js
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 📡 API Reference

### Items API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/items` | Get all items (supports `?search=`, `?category=`) |
| `GET` | `/api/items/:id` | Get item by ID |
| `POST` | `/api/items` | Create new item |
| `PUT` | `/api/items/:id` | Update item |
| `DELETE` | `/api/items/:id` | Delete item |

### Sales API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sales` | Get all sales (supports pagination) |
| `GET` | `/api/sales/:id` | Get sale with items |
| `POST` | `/api/sales` | Create new sale |
| `DELETE` | `/api/sales/:id` | Delete sale |
| `GET` | `/api/sales/top-selling` | Get top selling items |

### Dashboard API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Get overview stats |
| `GET` | `/api/dashboard/alerts` | Get stock alerts |
| `GET` | `/api/dashboard/sales-trends` | Get sales trends |

### Reports API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/sales` | Sales report with date filters |
| `GET` | `/api/reports/inventory` | Inventory valuation report |
| `GET` | `/api/reports/top-products` | Top products report |
| `GET` | `/api/reports/daily-summary` | Daily sales summary |

---

## 🗄️ Database Schema

```sql
-- Items
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemCode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stockQuantity INTEGER DEFAULT 0,
  lowStockThreshold INTEGER DEFAULT 10,
  category TEXT,
  unit TEXT DEFAULT 'Piece',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sales
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoiceNumber TEXT UNIQUE NOT NULL,
  customerName TEXT,
  customerPhone TEXT,
  totalAmount REAL NOT NULL,
  paymentMethod TEXT DEFAULT 'cash',
  notes TEXT,
  saleDate TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sale Items
CREATE TABLE saleItems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  saleId INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  itemId INTEGER REFERENCES items(id),
  itemName TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unitPrice REAL NOT NULL,
  totalPrice REAL NOT NULL
);
```

---

## 🧪 Development

### Available Scripts

```bash
npm run dev        # Start dev server at localhost:5173
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run unit tests
npm run lint       # Run ESLint
npm run check      # Run Svelte type checking
```

### Environment Variables

Create a `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_PATH=sqlite.db

# Auth
JWT_SECRET=your-super-secret-key-change-in-production
```

---

## 🌐 Deployment

### Vercel + Neon Postgres

#### 1. Create Neon Database
1. Sign up at [neon.tech](https://neon.tech)
2. Create project: `mini-store-inv`
3. Copy connection string (add `?sslmode=require`)

#### 2. Deploy to Vercel
```bash
# Push to GitHub
git push origin main

# Connect on Vercel
# Import repo → Deploy
```

#### 3. Configure Environment Variables
In Vercel Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `POSTGRES_URL` | `postgres://user:pass@host/db?sslmode=require` |
| `POSTGRES_HOST` | `ep-xxx.neon.tech` |
| `POSTGRES_USER` | Your username |
| `POSTGRES_PASSWORD` | Your password |
| `POSTGRES_DATABASE` | `mini_store_inv_app` |

#### 4. Redeploy
Changes auto-deploy on push to `main`.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention
```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting (no code change)
refactor: Code restructuring
test:     Adding tests
chore:    Build/config changes
```

---

## 📄 License

MIT License - free for personal and commercial use.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Empty dashboard | Check database initialization in logs |
| Connection refused | Verify `POSTGRES_URL` has `?sslmode=require` |
| Dropdowns overlap | Clear cache, CSS should include custom select styling |
| Mobile layout broken | Ensure viewport meta tag is present |
| Build fails | Run `npm run build` locally to debug |

---

<div align="center">

**Built with ❤️ using SvelteKit**

[⬆ Back to Top](#-mini-store-inventory-management-system)

</div>
