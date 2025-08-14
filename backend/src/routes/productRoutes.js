import express from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { createProductValidation, updateProductValidation } from '../validators/productValidator.js';

const router = express.Router();

router.route('/')
  .get(getAllProducts) // Public access
  .post(protect, restrictTo('admin', 'staff'), createProductValidation, createProduct);

router.route('/:id')
  .get(getProduct) // Public access
  .put(protect, restrictTo('admin', 'staff'), updateProductValidation, updateProduct)
  .delete(protect, restrictTo('admin'), deleteProduct);

export default router;
