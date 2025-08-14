# 📁 Project Structure

This document outlines the clean, organized structure of the Mini Store Inventory Management System.

## 🏗️ Root Directory Structure

```
mini-store-inventory-app/
├── 📄 README.md                 # Main project documentation
├── 📄 package.json              # Root package.json with workspace scripts
├── 📄 .gitignore               # Git ignore rules
├── 📁 docs/                    # Project documentation
├── 📁 scripts/                 # Development and deployment scripts
├── 📁 client/                  # Frontend Svelte application
└── 📁 server/                  # Backend Express.js API server
```

## 🎨 Frontend (Client) Structure

```
client/
├── 📄 package.json             # Client dependencies and scripts
├── 📄 vite.config.ts           # Vite build configuration
├── 📄 svelte.config.js         # Svelte configuration
├── 📄 tsconfig.json            # TypeScript configuration
├── 📄 vitest.config.ts         # Testing configuration
├── 📄 index.html               # Main HTML template
├── 📁 public/                  # Static assets
├── 📁 src/                     # Source code
│   ├── 📄 App.svelte           # Main application component
│   ├── 📄 main.ts              # Application entry point
│   ├── 📄 app.css              # Global styles
│   └── 📁 lib/                 # Reusable library code
│       ├── 📁 components/      # Svelte components
│       │   ├── 📄 Dashboard.svelte
│       │   ├── 📄 EnhancedPOS.svelte
│       │   ├── 📄 InventoryView.svelte
│       │   ├── 📄 EnhancedReports.svelte
│       │   ├── 📄 NotificationContainer.svelte
│       │   └── 📁 __tests__/   # Component tests
│       ├── 📁 services/        # API and external services
│       │   └── 📄 api.ts       # API service layer
│       ├── 📁 stores/          # Svelte stores for state management
│       │   └── 📄 stores.ts    # Global application stores
│       ├── 📁 types/           # TypeScript type definitions
│       │   └── 📄 types.ts     # Application interfaces
│       └── 📁 __tests__/       # Library tests
└── 📁 .vscode/                # VS Code configuration
```

## 🚀 Backend (Server) Structure

```
server/
├── 📄 package.json             # Server dependencies and scripts
├── 📄 tsconfig.json            # TypeScript configuration
├── 📄 server.js                # Main server entry point
├── 📄 .env.example             # Environment variables template
├── 📁 controllers/             # Request handlers
│   ├── 📄 categoryController.js
│   ├── 📄 dashboardController.js
│   ├── 📄 itemController.js
│   ├── 📄 salesController.js
│   ├── 📄 reportsController.js
│   └── 📄 importController.js
├── 📁 models/                  # Database models
│   ├── 📄 Category.js
│   ├── 📄 Item.js
│   └── 📄 Sale.js
├── 📁 routes/                  # API route definitions
│   ├── 📄 categoryRoutes.js
│   ├── 📄 dashboardRoutes.js
│   ├── 📄 itemRoutes.js
│   ├── 📄 salesRoutes.js
│   └── 📄 reportsRoutes.js
├── 📁 middleware/              # Custom middleware
│   └── 📄 upload.js            # File upload middleware
├── 📁 src/                     # TypeScript source (if using TS)
│   ├── 📁 models/
│   ├── 📁 routes/
│   └── 📄 server.ts
├── 📁 tests/                   # Server tests
│   └── 📄 *.test.js
├── 📁 uploads/                 # File upload directory (created at runtime)
└── 📁 logs/                    # Application logs (created at runtime)
```

## 📚 Documentation Structure

```
docs/
├── 📄 CATEGORY_CONTROLLER_TESTING_GUIDE.md
├── 📄 SALES_CONTROLLER_TESTING_GUIDE.md
├── 📄 NEXT_STEPS_GUIDE.md
├── 📄 PHASE_2_ENHANCEMENT_SUMMARY.md
└── 📄 PHASE_3_SUMMARY.md
```

## 🛠️ Development Scripts

```
scripts/
└── 📄 setup.sh                # Development environment setup script
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace configuration |
| `client/package.json` | Frontend dependencies and scripts |
| `server/package.json` | Backend dependencies and scripts |
| `client/vite.config.ts` | Vite build tool configuration |
| `client/svelte.config.js` | Svelte compiler options |
| `client/tsconfig.json` | TypeScript configuration for client |
| `server/tsconfig.json` | TypeScript configuration for server |
| `client/vitest.config.ts` | Testing framework configuration |
| `.gitignore` | Git version control ignore rules |

## 📦 Key Dependencies

### Frontend
- **Svelte 4** - Reactive UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Vitest** - Testing framework
- **Testing Library** - Component testing utilities

### Backend
- **Express.js** - Web application framework
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **Multer** - File upload handling

## 🎯 Best Practices Implemented

1. **Separation of Concerns**: Clear separation between frontend and backend
2. **TypeScript**: Type safety across the entire application
3. **Component Organization**: Logical grouping of UI components
4. **API Layer**: Centralized API service for consistent data handling
5. **Testing**: Comprehensive test coverage for both client and server
6. **Documentation**: Clear documentation for all major features
7. **Environment Configuration**: Proper environment variable management
8. **Error Handling**: Robust error handling throughout the application
9. **Security**: Security best practices with Helmet and CORS
10. **Performance**: Optimized builds with Vite and proper caching strategies

## 🔄 Development Workflow

1. **Setup**: Run `./scripts/setup.sh` for initial environment setup
2. **Development**: Use `npm run dev` to start both client and server
3. **Testing**: Run `npm test` to execute all tests
4. **Building**: Use `npm run build` for production builds
5. **Deployment**: Follow deployment guides in the docs folder

This clean structure ensures maintainability, scalability, and follows modern web development best practices.
