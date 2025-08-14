# 🧪 Testing Guide - Myanmar Grocery Store Inventory System

This guide provides comprehensive testing procedures for the inventory management system.

## 🏃‍♂️ Quick Test Suite

### Prerequisites
```bash
# Ensure both servers are running
cd server && npm start &
cd client && npm run dev &
```

### API Endpoint Tests

**1. Health Check**
```bash
curl http://localhost:3003/api/health
# Expected: {"success":true,"message":"Server is running","timestamp":"..."}
```

**2. Dashboard Data**
```bash
curl http://localhost:3003/api/dashboard/overview
# Expected: Stats with Myanmar product data
```

**3. Items Endpoint**
```bash
curl http://localhost:3003/api/items
# Expected: List of Myanmar products with categories
```

**4. Categories**
```bash
curl http://localhost:3003/api/categories
# Expected: အစားအသောက်, သန့်ရှင်းရေးပစ္စည်း, etc.
```

## 🔧 Unit Testing

### Backend Tests

**Run All Tests:**
```bash
cd server
npm test
```

**Individual Test Categories:**
```bash
# Controller tests
npm test -- controllers/

# Model tests  
npm test -- models/

# Route tests
npm test -- routes/
```

### Frontend Tests

**Run Frontend Tests:**
```bash
cd client
npm test
```

**Component Tests:**
```bash
# Test specific components
npm test -- Dashboard
npm test -- EnhancedPOS
npm test -- InventoryView
```

## 🌐 Integration Testing

### Full Workflow Tests

**1. Dashboard Flow**
1. Open http://localhost:5177
2. Verify dashboard loads with Myanmar text
3. Check metrics display (sales, inventory, etc.)
4. Verify charts render correctly
5. Test responsive design on mobile

**2. Inventory Management**
```bash
# Test adding new item via API
curl -X POST http://localhost:3003/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "သစ်သီးရည်",
    "category": "အစားအသောက်",
    "price": 1500,
    "stock": 50,
    "description": "သစ်သီးရည် (၁ လီတာ)"
  }'
```

**3. POS System Testing**
1. Navigate to POS tab
2. Search for items (test Myanmar search)
3. Add items to cart
4. Test quantity adjustments
5. Process payment
6. Verify receipt generation

**4. Reports Generation**
1. Go to Reports section
2. Generate sales report
3. Test date range selection
4. Export functionality
5. Check Myanmar text in reports

## 📱 Mobile Testing

### Responsive Design Tests

**1. Screen Size Testing**
- Mobile: 375px width
- Tablet: 768px width  
- Desktop: 1200px+ width

**2. Touch Interface**
- Tap targets minimum 44px
- Swipe gestures work
- Form inputs accessible
- Navigation menu responsive

**3. Myanmar Font Support**
```css
/* Verify these fonts load correctly */
font-family: 'Myanmar Text', 'Pyidaungsu', 'Padauk', sans-serif;
```

## 🌍 Cross-Browser Testing

### Browser Compatibility

**Desktop Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers:**
- Chrome Mobile
- Safari iOS
- Samsung Internet
- Firefox Mobile

**Test Checklist per Browser:**
- [ ] Application loads
- [ ] Myanmar text displays correctly
- [ ] API calls successful
- [ ] Forms work properly
- [ ] Navigation functional
- [ ] Charts render correctly

## 🚀 Performance Testing

### Load Testing

**1. API Performance**
```bash
# Install Apache Bench
brew install httpie

# Test API endpoints
ab -n 1000 -c 10 http://localhost:3003/api/items
ab -n 500 -c 5 http://localhost:3003/api/dashboard/overview
```

**2. Frontend Performance**
- Use Chrome DevTools Lighthouse
- Target scores: Performance 90+, Accessibility 95+
- Check for memory leaks
- Optimize bundle size

**3. Network Testing**
- Test on slow 3G connection
- Verify offline behavior
- Check caching strategies

## 🔐 Security Testing

### Input Validation

**1. SQL Injection Prevention**
```bash
# Test malicious inputs
curl -X POST http://localhost:3003/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "'; DROP TABLE items; --"}'
```

**2. XSS Prevention**
```javascript
// Test script injection in forms
const maliciousInput = '<script>alert("xss")</script>';
// Should be escaped/sanitized
```

**3. CORS Testing**
```bash
# Test cross-origin requests
curl -H "Origin: http://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:3003/api/items
```

## 📊 Database Testing

### Data Integrity

**1. CRUD Operations**
```bash
# Create
curl -X POST http://localhost:3003/api/items -d '{"name":"test"}'

# Read
curl http://localhost:3003/api/items/1

# Update  
curl -X PUT http://localhost:3003/api/items/1 -d '{"name":"updated"}'

# Delete
curl -X DELETE http://localhost:3003/api/items/1
```

**2. Edge Cases**
- Empty database
- Large datasets (1000+ items)
- Concurrent operations
- Invalid data types
- Missing required fields

## 🌏 Internationalization Testing

### Myanmar Language Support

**1. Text Rendering**
- Unicode characters display correctly
- Font fallbacks work
- Text direction (left-to-right)
- Special characters (၀၁၂၃၄၅၆၇၈၉)

**2. Input Validation**
```javascript
// Test Myanmar input patterns
const myanmarText = /^[\u1000-\u109F\u1040-\u1049\s]+$/;
const testInputs = [
  'မြန်မာစာ',
  'ရန်ကုန်မြို့',
  '၁၂၃၄၅',
  'Mixed မြန်မာ English' // Should handle mixed content
];
```

**3. Date/Number Formatting**
- Myanmar numerals: ၁၂၃၄၅၆၇၈၉၀
- Currency formatting: ၁,၅００ ကျပ်
- Date formats: ၂၀၂၄ ခုနှစ်

## 🐛 Error Handling Testing

### API Error Responses

**1. 404 Errors**
```bash
curl http://localhost:3003/api/nonexistent
# Expected: {"error": "Not Found", "status": 404}
```

**2. Validation Errors**
```bash
curl -X POST http://localhost:3003/api/items \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# Expected: Validation error with details
```

**3. Server Errors**
```bash
# Test with malformed JSON
curl -X POST http://localhost:3003/api/items \
  -H "Content-Type: application/json" \
  -d '{"invalid json"'
```

### Frontend Error Handling

**1. Network Failures**
- Disconnect internet
- Verify error messages display
- Check retry mechanisms
- Test offline functionality

**2. Invalid User Input**
- Empty forms
- Invalid formats
- Out-of-range values
- Special characters

## 📝 User Acceptance Testing

### Business Workflow Tests

**1. Daily Operations**
```
Scenario: Shop opens for the day
1. Check yesterday's sales summary
2. Review low stock alerts
3. Add new inventory items
4. Process first customer sale
5. Generate morning report
```

**2. Inventory Management**
```
Scenario: Receiving new stock
1. Navigate to Inventory
2. Add new products
3. Update existing stock levels
4. Verify stock calculations
5. Check category assignments
```

**3. Sales Processing**
```
Scenario: Customer checkout
1. Go to POS system
2. Search and add items
3. Apply discounts (if any)
4. Process payment
5. Print/display receipt
6. Verify inventory deduction
```

## 📈 Automated Testing Setup

### Test Scripts

**1. API Test Suite**
```javascript
// tests/api.test.js
describe('API Endpoints', () => {
  test('Health check returns 200', async () => {
    const response = await fetch('http://localhost:3003/api/health');
    expect(response.status).toBe(200);
  });
  
  test('Items endpoint returns Myanmar products', async () => {
    const response = await fetch('http://localhost:3003/api/items');
    const data = await response.json();
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeGreaterThan(0);
  });
});
```

**2. E2E Test Suite**
```javascript
// Use Playwright or Cypress
describe('Full Application Flow', () => {
  test('Complete POS transaction', async () => {
    await page.goto('http://localhost:5177');
    await page.click('[data-testid="pos-tab"]');
    await page.fill('[data-testid="item-search"]', 'ကော်လာ');
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="checkout"]');
    // Verify transaction completed
  });
});
```

### Continuous Integration

**GitHub Actions Test Workflow:**
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm run install:all
      - run: npm run test:backend
      - run: npm run test:frontend
      - run: npm run test:e2e
```

## 📋 Test Checklist

### Pre-Release Testing

**Backend Testing:**
- [ ] All API endpoints respond correctly
- [ ] Myanmar text handled properly
- [ ] Error handling works
- [ ] Performance acceptable
- [ ] Security measures active

**Frontend Testing:**
- [ ] All components render
- [ ] Navigation works
- [ ] Forms validate input
- [ ] Myanmar fonts display
- [ ] Mobile responsive
- [ ] Cross-browser compatible

**Integration Testing:**
- [ ] Frontend communicates with backend
- [ ] Data flow accurate
- [ ] State management working
- [ ] Real-time updates function

**User Experience Testing:**
- [ ] Intuitive navigation
- [ ] Fast loading times
- [ ] Clear error messages
- [ ] Accessible design
- [ ] Myanmar language support

## 🔧 Testing Tools

### Recommended Tools

**API Testing:**
- Postman
- Insomnia
- curl
- Jest + Supertest

**Frontend Testing:**
- Vitest (already configured)
- Testing Library
- Playwright
- Cypress

**Performance Testing:**
- Lighthouse
- WebPageTest
- Apache Bench
- k6

**Myanmar Text Testing:**
- Unicode test strings
- Font rendering tools
- Character encoding validators

## 📞 Reporting Issues

When reporting bugs, include:

1. **Environment Details**
   - Browser/OS version
   - Screen resolution
   - Network conditions

2. **Steps to Reproduce**
   - Exact user actions
   - Expected vs actual behavior
   - Screenshots/videos

3. **Myanmar Text Issues**
   - Specific characters affected
   - Font rendering problems
   - Input/display discrepancies

4. **Error Information**
   - Console errors
   - Network failures
   - API response codes

---

**Testing Complete? ✅**

Your application is thoroughly tested and ready for production deployment!

---

*For questions about testing procedures, refer to the development team or create an issue on GitHub.*
