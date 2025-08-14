# Manual UI Testing Guide - Mini Store Inventory App

## Overview
This guide provides comprehensive manual testing workflows for the Mini Store Inventory Application.

## Testing Environment Setup

### Prerequisites
1. **Backend Server Running**: `http://localhost:3003`
2. **Frontend Server Running**: `http://localhost:5177`
3. **Test Data**: Sample items, categories, and sales data loaded

### Browser Testing Requirements
- **Primary**: Chrome (latest)
- **Secondary**: Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile

## Core UI Testing Workflows

### 1. Application Startup & Navigation

#### Test Case 1.1: Initial Load
- [ ] Open `http://localhost:5177`
- [ ] Verify application loads without errors
- [ ] Check for loading states/skeleton screens
- [ ] Verify navigation tabs are visible
- [ ] Test dark/light theme toggle

#### Test Case 1.2: Tab Navigation
- [ ] Click each tab: POS, Inventory, Dashboard, Reports
- [ ] Verify smooth transitions
- [ ] Check URL updates correctly
- [ ] Verify back/forward browser navigation

### 2. Language System Testing

#### Test Case 2.1: Language Switching
- [ ] Test Myanmar ↔ English switching
- [ ] Verify all text elements update
- [ ] Check currency formatting (MMK vs ကျပ်)
- [ ] Test date formatting changes
- [ ] Verify language persistence on refresh

#### Test Case 2.2: Mixed Content
- [ ] Test forms with mixed language input
- [ ] Verify search functionality in both languages
- [ ] Check error messages in correct language

### 3. POS System Testing

#### Test Case 3.1: Item Search & Selection
- [ ] Test search functionality with Myanmar/English
- [ ] Verify search filters work correctly
- [ ] Test category filtering
- [ ] Check stock status indicators
- [ ] Test item selection and cart addition

#### Test Case 3.2: Cart Management
- [ ] Add multiple items to cart
- [ ] Test quantity adjustments (+/- buttons)
- [ ] Test direct quantity input
- [ ] Remove items from cart
- [ ] Clear entire cart
- [ ] Verify total calculations

#### Test Case 3.3: Customer Information
- [ ] Enter customer name (Myanmar/English)
- [ ] Test phone number validation
- [ ] Test email validation (optional)
- [ ] Verify customer info persistence during session

#### Test Case 3.4: Payment Processing
- [ ] Test cash payment calculations
- [ ] Verify change calculation
- [ ] Test insufficient payment validation
- [ ] Complete successful transactions
- [ ] Test transaction receipt generation

### 4. Inventory Management Testing

#### Test Case 4.1: Item Listing
- [ ] Verify all items display correctly
- [ ] Test search functionality
- [ ] Check sorting options
- [ ] Test pagination (if applicable)
- [ ] Verify stock status indicators

#### Test Case 4.2: Item Management
- [ ] Add new items
- [ ] Edit existing items
- [ ] Test form validation
- [ ] Upload/change item images
- [ ] Delete items (with confirmation)

#### Test Case 4.3: Category Management
- [ ] View category list
- [ ] Add new categories
- [ ] Edit category names (Myanmar/English)
- [ ] Delete categories
- [ ] Test category assignment to items

#### Test Case 4.4: Stock Management
- [ ] Update stock quantities
- [ ] Set low stock thresholds
- [ ] Test stock alerts
- [ ] Verify stock history tracking

### 5. Dashboard Testing

#### Test Case 5.1: Overview Metrics
- [ ] Verify sales metrics display
- [ ] Check inventory summary
- [ ] Test real-time updates
- [ ] Verify metric calculations

#### Test Case 5.2: Charts & Visualizations
- [ ] Test sales trend charts
- [ ] Verify category performance charts
- [ ] Check responsive chart behavior
- [ ] Test chart interactions

#### Test Case 5.3: Recent Activity
- [ ] Verify recent sales display
- [ ] Check activity timestamps
- [ ] Test activity filtering

### 6. Reports System Testing

#### Test Case 6.1: Sales Reports
- [ ] Generate daily sales reports
- [ ] Test date range selection
- [ ] Verify report accuracy
- [ ] Test export functionality (PDF/CSV)

#### Test Case 6.2: Inventory Reports
- [ ] Generate stock level reports
- [ ] Test low stock alerts report
- [ ] Verify inventory valuation
- [ ] Check product performance reports

#### Test Case 6.3: Financial Reports
- [ ] Test profit/loss calculations
- [ ] Verify revenue reporting
- [ ] Check expense tracking
- [ ] Test financial summaries

### 7. Responsive Design Testing

#### Test Case 7.1: Mobile Devices
- [ ] Test on smartphones (320px - 480px)
- [ ] Verify touch interactions
- [ ] Check mobile navigation
- [ ] Test mobile-specific features

#### Test Case 7.2: Tablet Devices
- [ ] Test on tablets (768px - 1024px)
- [ ] Verify landscape/portrait modes
- [ ] Check touch and gesture support

#### Test Case 7.3: Desktop Variations
- [ ] Test on different screen sizes
- [ ] Verify layout adaptations
- [ ] Check high-DPI displays

### 8. Performance Testing

#### Test Case 8.1: Load Performance
- [ ] Measure initial load time
- [ ] Test with large data sets
- [ ] Verify smooth scrolling
- [ ] Check memory usage

#### Test Case 8.2: Network Conditions
- [ ] Test on slow networks
- [ ] Verify offline behavior
- [ ] Check error handling for network failures

### 9. Error Handling Testing

#### Test Case 9.1: Form Validation
- [ ] Test required field validation
- [ ] Check data type validation
- [ ] Verify custom validation rules
- [ ] Test error message display

#### Test Case 9.2: API Error Handling
- [ ] Test server connection errors
- [ ] Verify timeout handling
- [ ] Check error notification system
- [ ] Test retry mechanisms

### 10. Accessibility Testing

#### Test Case 10.1: Keyboard Navigation
- [ ] Test tab navigation
- [ ] Verify keyboard shortcuts
- [ ] Check focus indicators
- [ ] Test screen reader compatibility

#### Test Case 10.2: Visual Accessibility
- [ ] Check color contrast ratios
- [ ] Test with zoom levels up to 200%
- [ ] Verify font size options
- [ ] Check colorblind-friendly design

## Common Issues to Watch For

### Critical Issues
- [ ] **Data Loss**: Any action causing data loss
- [ ] **Calculation Errors**: Incorrect price/stock calculations
- [ ] **Payment Errors**: Issues with transaction processing
- [ ] **Data Corruption**: Invalid data being saved

### High Priority Issues
- [ ] **Performance**: Slow loading or unresponsive UI
- [ ] **Navigation**: Broken links or routing issues
- [ ] **Search**: Non-functional search features
- [ ] **Language**: Missing translations or formatting errors

### Medium Priority Issues
- [ ] **Visual**: Layout issues or styling problems
- [ ] **Validation**: Missing or incorrect form validation
- [ ] **Notifications**: Missing or incorrect user feedback
- [ ] **Export**: Issues with report generation

## Testing Checklist for Each Release

### Pre-Release Testing
- [ ] All critical workflows function correctly
- [ ] No console errors in browser developer tools
- [ ] All forms submit successfully
- [ ] Search functionality works in both languages
- [ ] Payment calculations are accurate
- [ ] Data persistence works correctly
- [ ] No visual layout issues

### Post-Deployment Testing
- [ ] Application loads correctly in production
- [ ] All API endpoints respond correctly
- [ ] Database operations work as expected
- [ ] Error handling functions properly
- [ ] Performance meets requirements

## Bug Reporting Template

```
**Bug Title**: [Clear, descriptive title]

**Environment**: 
- Browser: [Chrome/Firefox/Safari]
- Version: [Browser version]
- OS: [macOS/Windows/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: [What should happen]

**Actual Result**: [What actually happened]

**Severity**: [Critical/High/Medium/Low]

**Screenshots**: [If applicable]

**Console Errors**: [Any browser console errors]
```

## Testing Schedule Recommendations

### Daily Testing (Development)
- Smoke test: Core POS functionality
- New feature testing as developed
- Quick cross-browser check

### Weekly Testing (Development)
- Full UI testing workflow
- Performance testing
- Accessibility audit
- Mobile testing

### Pre-Release Testing
- Complete manual testing checklist
- Extended browser testing
- Load testing with sample data
- User acceptance testing

### Post-Release Testing
- Production smoke test
- Monitor for user-reported issues
- Performance monitoring
- Analytics review

## Notes for Testers

1. **Test Data**: Use realistic Myanmar product names and prices
2. **Language Testing**: Always test both language modes
3. **Edge Cases**: Test with empty states, maximum values, special characters
4. **Error States**: Intentionally trigger errors to test handling
5. **Documentation**: Record any unclear UI elements or confusing workflows

## Success Criteria

A testing session is successful when:
- [ ] All planned test cases executed
- [ ] Critical workflows function without errors
- [ ] No data loss or corruption occurs
- [ ] Performance remains acceptable
- [ ] User experience is intuitive
- [ ] All bugs are documented and prioritized
