const express = require('express');
const { getAllCategoriesController, createCategoryController, updateCategoryController, deleteCategoryController } = require('../controllers/categoryController');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all product categories for dropdown
 * @access  Public
 */
router.get('/', getAllCategoriesController);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Public (add authentication middleware as needed)
 * @body    { category_name_my, example_products }
 */
router.post('/', createCategoryController);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update existing category
 * @access  Public (add authentication middleware as needed)
 * @body    { category_name_my, example_products }
 * @params  { id } - Category ID to update
 */
router.put('/:id', updateCategoryController);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category by ID (with reference check)
 * @access  Public (add authentication middleware as needed)
 * @params  { id } - Category ID to delete
 */
router.delete('/:id', deleteCategoryController);

module.exports = router;
