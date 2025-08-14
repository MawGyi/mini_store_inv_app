import express from 'express';
import {
  getAllSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
} from '../controllers/salesController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { createSaleValidation, updateSaleValidation } from '../validators/salesValidator.js';

const router = express.Router();

// All sales routes require authentication
router.use(protect);

router.route('/')
  .get(getAllSales)
  .post(restrictTo('admin', 'staff'), createSaleValidation, createSale);

router.route('/:id')
  .get(getSale)
  .put(restrictTo('admin', 'staff'), updateSaleValidation, updateSale)
  .delete(restrictTo('admin'), deleteSale);

export default router;
