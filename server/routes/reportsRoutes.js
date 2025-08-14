const express = require('express');
const {
  generateSalesReportController,
  generateInventoryReportController,
  generateProfitReportController,
  generateFinancialReportController,
  generateCustomerReportController,
  generateProductReportController,
  exportReportController
} = require('../controllers/reportsController');

const router = express.Router();

// GET /api/reports/sales - Generate comprehensive sales report
router.get('/sales', generateSalesReportController);

// GET /api/reports/inventory - Generate inventory report
router.get('/inventory', generateInventoryReportController);

// GET /api/reports/profit - Generate profit/loss report
router.get('/profit', generateProfitReportController);

// GET /api/reports/financial - Generate financial report
router.get('/financial', generateFinancialReportController);

// GET /api/reports/customers - Generate customer report  
router.get('/customers', generateCustomerReportController);

// GET /api/reports/products - Generate product report
router.get('/products', generateProductReportController);

// GET /api/reports/:type/export - Export report in various formats
router.get('/:type/export', exportReportController);

module.exports = router;
