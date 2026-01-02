const express = require('express');
const router = express.Router();
const {
  getOverviewController,
  getInventorySummaryController,
  getSalesTrendsController,
  getCategoryPerformanceController,
  getAlertsController
} = require('../controllers/dashboardController');

// GET /api/dashboard/overview - Overall business overview
router.get('/overview', getOverviewController);

// GET /api/dashboard/inventory-summary - Inventory status summary
router.get('/inventory-summary', getInventorySummaryController);

// GET /api/dashboard/sales-trends - Sales trends (daily/weekly)
router.get('/sales-trends', getSalesTrendsController);

// GET /api/dashboard/category-performance - Category-wise performance
router.get('/category-performance', getCategoryPerformanceController);

// GET /api/dashboard/alerts - System alerts and notifications
router.get('/alerts', getAlertsController);

module.exports = router;
