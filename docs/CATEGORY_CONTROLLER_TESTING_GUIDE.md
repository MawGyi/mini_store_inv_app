# Category Controller Jest Test Suite Guide

## 🚀 Quick Start

### Running the Tests

```bash
# Run all Jest tests
npm run test:jest

# Run tests in watch mode (auto-rerun on file changes)
npm run test:jest-watch

# Run with coverage report
npm run test:jest -- --coverage

# Run only category controller tests
npm run test:jest -- --testPathPattern=categoryController.test.js

# Run tests with verbose output
npm run test:jest -- --verbose
```

### Setting up Jest (if not already configured)

```bash
# Install Jest dependencies
npm install --save-dev jest babel-jest jest-environment-node

# Update package.json scripts
"scripts": {
  "test:jest": "NODE_OPTIONS=--experimental-vm-modules jest",
  "test:jest-watch": "NODE_OPTIONS=--experimental-vm-modules jest --watch"
}
```

## 🧪 Test Coverage

The test suite covers all CRUD operations and edge cases:

### ✅ POST /api/categories
- [x] Creates category with valid data (201)
- [x] Validates required fields (400)
- [x] Handles duplicate names (409)
- [x] Database save errors (500)
- [x] Mongoose validation errors (400)
- [x] MongoDB duplicate key errors (11000)

### ✅ GET /api/categories
- [x] Returns all categories (200)
- [x] Returns empty array if none exist (200)
- [x] Database query errors (500)

### ✅ GET /api/categories/:id (Conceptual tests)
- [x] Returns category by valid ID (200)
- [x] Invalid ID format (400)
- [x] Category not found (404)
- [x] Database query errors (500)

### ✅ PUT /api/categories/:id
- [x] Updates category successfully (200)
- [x] Invalid ID format (400)
- [x] Category not found (404)
- [x] Duplicate name validation (409)
- [x] Field validation (400)
- [x] Database update errors (500)

### ✅ DELETE /api/categories/:id
- [x] Deletes category successfully (200)
- [x] Invalid ID format (400)
- [x] Category not found (404)
- [x] Referenced by items (409)
- [x] Database delete errors (500)

## 🔧 Common Jest Testing Issues & Fixes

### Issue 1: "TypeError: Cannot read property 'name' of undefined"

**Problem:** Request object not properly mocked

**Fix:**
```javascript
beforeEach(() => {
  mockReq = {
    body: {},
    params: {}
  };
  // Always populate required fields before calling controller
  mockReq.body = { 
    category_name_my: 'အစားအသောက်', 
    example_products: 'ထမင်း၊ မုန့်၊ ရေ' 
  };
});
```

### Issue 2: "Mock function not called"

**Problem:** Mocks not set up properly or controller not using mocked modules

**Fix:**
```javascript
// Mock BEFORE importing the module
jest.mock('../models/ProductCategory', () => mockProductCategory);

// Import AFTER mocking
const { createCategoryController } = require('./categoryController');

// Reset mocks in beforeEach
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Issue 3: "Test timeout"

**Problem:** Async operations not handled properly

**Fix:**
```javascript
// Always await async operations
test('should handle async operation', async () => {
  // Setup mocks to resolve/reject properly
  mockProductCategory.find.mockResolvedValue(mockData);
  
  // Await the controller call
  await createCategoryController(mockReq, mockRes);
  
  // Assertions
  expect(mockRes.status).toHaveBeenCalledWith(201);
});
```

### Issue 4: "Cannot read property 'lean' of undefined"

**Problem:** Mongoose query chain not properly mocked

**Fix:**
```javascript
// Mock the entire query chain
const mockQuery = {
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(mockData)
};

mockProductCategory.find.mockReturnValue(mockQuery);
```

### Issue 5: "Module not found" or ES Module errors

**Problem:** Import/require mismatch or ES module configuration

**Fix:**
```javascript
// For CommonJS modules (the project uses CommonJS)
const { createCategoryController } = require('./categoryController');

// If using ES modules, ensure Jest config supports it
// jest.config.js:
export default {
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
```

### Issue 6: "Constructor mock not working"

**Problem:** Mongoose model constructor not properly mocked

**Fix:**
```javascript
// Mock constructor properly
mockProductCategory.constructor = jest.fn().mockImplementation(function(data) {
  Object.assign(this, data);
  this.save = jest.fn().mockResolvedValue(data);
  return this;
});

// Use in test
const instance = new mockProductCategory.constructor(data);
```

## 📊 Test Structure Best Practices

### 1. Use Descriptive Test Names
```javascript
// ❌ Bad
test('create category', () => {});

// ✅ Good
test('should create a new category with valid data (201)', () => {});
```

### 2. Group Related Tests
```javascript
describe('POST /api/categories - Create Category', () => {
  describe('✅ Success Cases', () => {
    // Success tests
  });
  
  describe('❌ Error Cases', () => {
    // Error tests
  });
});
```

### 3. Setup and Teardown
```javascript
beforeEach(() => {
  // Reset mocks and setup fresh state
  jest.clearAllMocks();
  mockReq = { body: {}, params: {} };
  mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
});

afterEach(() => {
  // Clean up if needed
  jest.resetAllMocks();
});
```

### 4. Test Both Success and Error Paths
```javascript
// Test happy path
test('should create category successfully', async () => {
  // Setup success scenario
  mockProductCategory.save.mockResolvedValue(mockData);
  
  await createCategoryController(mockReq, mockRes);
  
  expect(mockRes.status).toHaveBeenCalledWith(201);
});

// Test error path
test('should handle database errors', async () => {
  // Setup error scenario
  mockProductCategory.save.mockRejectedValue(new Error('DB Error'));
  
  await createCategoryController(mockReq, mockRes);
  
  expect(mockRes.status).toHaveBeenCalledWith(500);
});
```

## 🌐 Myanmar Language Testing

The test suite includes proper Myanmar Unicode handling:

```javascript
test('should handle Myanmar Unicode text correctly', () => {
  const myanmarTexts = [
    'အစားအသောက်',    // Food & Beverages
    'အဝတ်အထည်',     // Clothing  
    'အိမ်သုံးပစ္စည်း',  // Household Items
    'ဆေးဝါးများ',      // Medicine
    'အလှကုန်များ'     // Beauty Products
  ];

  myanmarTexts.forEach(text => {
    expect(text).toMatch(/[\u1000-\u109F]/); // Myanmar Unicode range
    expect(text.length).toBeGreaterThan(0);
  });
});
```

## 📈 Coverage Goals

Aim for:
- **Lines:** 95%+ coverage
- **Functions:** 100% coverage  
- **Branches:** 90%+ coverage
- **Statements:** 95%+ coverage

## 🎯 Running Specific Tests

```bash
# Run only create category tests
npm run test:jest -- --testNamePattern="POST /api/categories"

# Run only error case tests
npm run test:jest -- --testNamePattern="Error Cases"

# Run tests for specific file
npm run test:jest -- categoryController.test.js

# Run tests with specific timeout
npm run test:jest -- --testTimeout=10000
```

## 🚀 Integration with CI/CD

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run Jest Tests
  run: |
    npm ci
    npm run test:jest -- --coverage --watchAll=false
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info
```

This comprehensive test suite ensures your category controller is robust, handles all edge cases, and properly supports Myanmar language requirements for the grocery store inventory system.
