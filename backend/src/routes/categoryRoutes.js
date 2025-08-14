import express from 'express';
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { createCategoryValidation, updateCategoryValidation } from '../validators/categoryValidator.js';

const router = express.Router();

router.route('/')
  .get(getAllCategories) // Public access
  .post(protect, restrictTo('admin', 'staff'), createCategoryValidation, createCategory);

router.route('/:id')
  .get(getCategory) // Public access
  .put(protect, restrictTo('admin', 'staff'), updateCategoryValidation, updateCategory)
  .delete(protect, restrictTo('admin'), deleteCategory);

export default router;
