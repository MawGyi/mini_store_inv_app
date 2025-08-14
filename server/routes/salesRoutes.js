const express = require('express');
const {
  createSaleController,
  getAllSalesController,
  getSaleByIdController,
  getDailySalesSummaryController,
  getMonthlySalesSummaryController,
  getTopSellingItemsController
} = require('../controllers/salesController');

const router = express.Router();

// POST /api/sales - Create new sale
router.post('/', createSaleController);

// GET /api/sales - Get all sales with pagination and filtering
router.get('/', getAllSalesController);

// GET /api/sales/summary/daily - Get daily sales summary
router.get('/summary/daily', getDailySalesSummaryController);

// GET /api/sales/summary/monthly - Get monthly sales summary
router.get('/summary/monthly', getMonthlySalesSummaryController);

// GET /api/sales/top-selling - Get top selling items
router.get('/top-selling', getTopSellingItemsController);

// GET /api/sales/:id - Get single sale by ID (must be last)
router.get('/:id', getSaleByIdController);

module.exports = router;
