# Mini Store Inventory Management System

A modern, full-stack inventory management application built with SvelteKit, featuring real-time stock tracking, sales management, and multi-currency support.

![Mini Store Inventory](screenshot.svg)

## Features

### Core Functionality
- **Dashboard** - Overview of sales, inventory stats, top-selling items, and stock alerts
- **Inventory Management** - Full CRUD operations for items with search, filtering, and highlighting
- **Sales Management** - Create sales, view transaction history, and print receipts
- **Multi-Currency Support** - USD, EUR, GBP, THB, JPY, CNY, CAD, AUD, MMK

### User Experience
- Responsive design for desktop and mobile
- Dark mode capable (Tailwind CSS)
- Real-time notifications
- Keyboard-accessible interface
- Smooth transitions and animations

### Technical Features
- TypeScript for type safety
- SQLite database with better-sqlite3
- Svelte stores for state management
- RESTful API endpoints
- Local storage for user settings

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit + Svelte 4 |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Database | SQLite (better-sqlite3) |
| Build Tool | Vite |
| State Management | Svelte Stores |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mini_store_inv_app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DB_PATH=sqlite.db

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-key
```

## Project Structure

```
mini_store_inv_app/
├── src/
│   ├── lib/
│   │   ├── components/          # Reusable Svelte components
│   │   │   ├── AdvancedSearch.svelte
│   │   │   ├── Dashboard.svelte
│   │   │   ├── InventoryList.svelte
│   │   │   ├── NotificationContainer.svelte
│   │   │   └── NotificationToast.svelte
│   │   ├── stores/              # Svelte stores
│   │   │   ├── auth.ts          # Authentication state
│   │   │   ├── settings.ts      # App settings (currency, timezone)
│   │   │   └── stores.ts        # Notification store
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts
│   │   └── server/              # Server-side code
│   │       ├── db/              # Database configuration
│   │       ├── init.ts          # Database initialization
│   │       └── security.ts      # Security utilities
│   ├── routes/
│   │   ├── api/                 # API endpoints
│   │   │   ├── auth/            # Authentication APIs
│   │   │   ├── dashboard/       # Dashboard data APIs
│   │   │   ├── items/           # Inventory item APIs
│   │   │   └── sales/           # Sales transaction APIs
│   │   ├── dashboard/           # Dashboard page
│   │   ├── inventory/           # Inventory management page
│   │   ├── sales/               # Sales management page
│   │   ├── settings/            # Settings page
│   │   ├── login/               # Login page
│   │   ├── profile/             # User profile page
│   │   └── +layout.svelte       # Main layout
│   └── app.css                  # Global styles
├── server/
│   ├── controllers/             # Route controllers
│   ├── models/                  # Data models
│   ├── routes/                  # Express routes
│   ├── utils/                   # Utility functions
│   ├── tests/                   # Test files
│   ├── index.js                 # Server entry point
│   └── seed_data.js             # Sample data
├── static/                      # Static assets
├── .env                         # Environment variables
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## API Reference

### Items API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all items with pagination |
| GET | `/api/items/:id` | Get single item by ID |
| POST | `/api/items` | Create new item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |

### Sales API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | Get all sales with pagination |
| GET | `/api/sales/:id` | Get single sale by ID |
| POST | `/api/sales` | Create new sale |
| DELETE | `/api/sales/:id` | Delete sale |

### Dashboard API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Get dashboard statistics |
| GET | `/api/dashboard/alerts` | Get stock alerts |
| GET | `/api/dashboard/sales-summary` | Get sales summary |
| GET | `/api/dashboard/top-items` | Get top selling items |

## Currency Settings

Supported currencies:

| Currency | Symbol | Code |
|----------|--------|------|
| US Dollar | $ | USD |
| Euro | € | EUR |
| British Pound | £ | GBP |
| Canadian Dollar | C$ | CAD |
| Australian Dollar | A$ | AUD |
| Thai Baht | ฿ | THB |
| Japanese Yen | ¥ | JPY |
| Chinese Yuan | ¥ | CNY |
| Myanmar Kyat | MMK | MMK |

Currency settings are stored in localStorage and persist across sessions.

## Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Run linting
```

### Database Schema

**Items Table:**
```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemCode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stockQuantity INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  unit TEXT DEFAULT 'Piece',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

**Sales Table:**
```sql
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customerName TEXT,
  customerPhone TEXT,
  totalAmount REAL NOT NULL,
  paymentMethod TEXT,
  notes TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

**SaleItems Table:**
```sql
CREATE TABLE saleItems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  saleId INTEGER REFERENCES sales(id),
  itemId INTEGER REFERENCES items(id),
  itemName TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unitPrice REAL NOT NULL,
  totalPrice REAL NOT NULL
)
```

## Default Credentials

```
Email: admin@ministore.com
Password: admin123
```

**Note:** Change the default password in production!

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and feature requests, please open a GitHub issue.
