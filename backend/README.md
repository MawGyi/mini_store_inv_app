````markdown
# Store Inventory Backend

A Node.js + Express + MongoDB backend API for store inventory management system with JWT authentication and role-based access control.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (admin/staff)
- **Product Management**: Full CRUD operations for products with category relationships
- **Category Management**: Organize products into categories
- **Sales Management**: Record and track sales transactions with automatic inventory updates
- **Request Validation**: Input validation using express-validator
- **Health Monitoring**: Built-in health check endpoint
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Data Validation**: Mongoose schema validation with custom error messages
- **Search & Filtering**: Advanced query capabilities for products and sales
- **Pagination**: Built-in pagination for large datasets
- **Security**: bcrypt password hashing, JWT tokens, Helmet.js security headers

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint (Airbnb style guide)
- **Security**: Helmet.js, CORS
- **Environment**: dotenv for configuration

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone and navigate to the project**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/store_inventory
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=1h
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
npm run test:watch  # Watch mode
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Authentication

### Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "staff"  // optional, defaults to "staff"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "staff"
    }
  }
}
```

### Using the Token
Include the JWT token in the Authorization header for protected routes:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires authentication)

### Health Check
- `GET /api/health` - System health status

### Products
- `GET /api/products` - Get all products (public access)
- `GET /api/products/:id` - Get single product (public access)
- `POST /api/products` - Create new product (requires authentication, admin/staff only)
- `PUT /api/products/:id` - Update product (requires authentication, admin/staff only)
- `DELETE /api/products/:id` - Delete product (requires authentication, admin only)

### Categories
- `GET /api/categories` - Get all categories (public access)
- `GET /api/categories/:id` - Get single category (public access)
- `POST /api/categories` - Create new category (requires authentication, admin/staff only)
- `PUT /api/categories/:id` - Update category (requires authentication, admin/staff only)
- `DELETE /api/categories/:id` - Delete category (requires authentication, admin only)

### Sales
- `GET /api/sales` - Get all sales (requires authentication)
- `GET /api/sales/:id` - Get single sale (requires authentication)
- `POST /api/sales` - Create new sale (requires authentication, admin/staff only)
- `PUT /api/sales/:id` - Update sale (requires authentication, admin/staff only)
- `DELETE /api/sales/:id` - Delete sale (requires authentication, admin only)

## Access Control

### Public Routes
- Health check
- Product listing and details
- Category listing and details

### Authenticated Routes
- All sales operations
- User profile access

### Admin/Staff Routes
- Create/update products and categories
- Create/update sales

### Admin Only Routes
- Delete products, categories, and sales

## Validation Rules

### User Registration
- Username: 3-30 characters, alphanumeric only
- Email: valid email format
- Password: minimum 6 characters, must contain uppercase, lowercase, and number
- Role: "admin" or "staff"

### Products
- Name: required, max 100 characters
- Price: required, non-negative number
- Quantity: required, non-negative integer
- Category: required, valid MongoDB ObjectId
- SKU: required, 1-50 characters
- Status: "active", "inactive", or "discontinued"

### Categories
- Name: required, 2-50 characters
- Description: optional, max 200 characters

### Sales
- Items: required array with at least one item
- Each item must have valid product ID, positive quantity, and non-negative unit price
- Payment method: "cash", "card", or "digital"

## Query Parameters

### Products
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `category` - Filter by category ID
- `status` - Filter by status (active, inactive, discontinued)
- `search` - Search in name, description, or SKU

### Sales
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (completed, pending, cancelled, refunded)
- `paymentMethod` - Filter by payment method (cash, card, digital)
- `startDate` - Filter sales from this date
- `endDate` - Filter sales to this date

## Data Models

### User
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (admin|staff),
  isActive: Boolean
}
```

### Product
```javascript
{
  name: String (required),
  description: String,
  price: Number (required),
  quantity: Number (required),
  category: ObjectId (required),
  sku: String (required, unique),
  barcode: String,
  status: String (active|inactive|discontinued),
  lowStockThreshold: Number
}
```

### Category
```javascript
{
  name: String (required, unique),
  description: String
}
```

### Sale
```javascript
{
  items: [{
    product: ObjectId (required),
    quantity: Number (required),
    unitPrice: Number (required),
    subtotal: Number (required)
  }],
  totalAmount: Number (required),
  paymentMethod: String (cash|card|digital),
  status: String (completed|pending|cancelled|refunded),
  customerName: String,
  customerPhone: String,
  notes: String,
  saleDate: Date
}
```

## Error Handling

The API uses consistent error response format:
```javascript
{
  "success": false,
  "message": "Error description",
  "details": [] // For validation errors
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Example Requests

### Create Product
```bash
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop Computer",
  "description": "High-performance laptop",
  "price": 999.99,
  "quantity": 50,
  "category": "507f1f77bcf86cd799439011",
  "sku": "LAP001",
  "status": "active",
  "lowStockThreshold": 5
}
```

### Create Sale
```bash
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product": "507f1f77bcf86cd799439012",
      "quantity": 2,
      "unitPrice": 999.99
    }
  ],
  "paymentMethod": "card",
  "customerName": "John Doe",
  "customerPhone": "+1234567890"
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── salesController.js
│   │   └── healthController.js
│   ├── middleware/
│   │   ├── AppError.js        # Custom error class
│   │   ├── errorHandler.js    # Global error handler
│   │   └── authMiddleware.js  # JWT authentication
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Product.js
│   │   ├── Category.js
│   │   └── Sale.js
│   ├── routes/
│   │   ├── authRoutes.js     # Authentication routes
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── salesRoutes.js
│   │   └── healthRoutes.js
│   ├── validators/
│   │   ├── authValidator.js   # Auth validation rules
│   │   ├── productValidator.js
│   │   ├── categoryValidator.js
│   │   └── salesValidator.js
│   ├── tests/
│   │   ├── health.test.js
│   │   ├── auth.test.js      # Authentication tests
│   │   ├── protected-routes.test.js
│   │   └── validation.test.js
│   ├── app.js                # Express app setup
│   └── server.js             # Server startup
├── .env.example              # Environment variables template
├── .eslintrc.json            # ESLint configuration
├── package.json
└── README.md
```

## Security Considerations

- JWT tokens expire after 1 hour by default
- Passwords are hashed using bcrypt with salt rounds of 12
- Sensitive user data (passwords) are excluded from API responses
- Input validation prevents injection attacks
- Helmet.js provides additional security headers
- CORS is enabled for cross-origin requests

## Contributing

1. Follow the existing code style (Airbnb ESLint config)
2. Write tests for new features
3. Update documentation as needed
4. Use meaningful commit messages
5. Ensure all tests pass before submitting

## License

MIT

````
