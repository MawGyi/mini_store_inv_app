const mongoose = require('mongoose');
const ProductCategory = require('../models/ProductCategory');

/**
 * Get all product categories
 * GET /api/categories
 */
const getAllCategoriesController = async (req, res) => {
  try {
    const categories = await ProductCategory.find({})
      .select('category_name_my example_products')
      .sort({ category_name_my: 1 })
      .lean();

    if (!categories || categories.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No categories found',
        data: []
      });
    }

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create new category
 * POST /api/categories
 */
const createCategoryController = async (req, res) => {
  try {
    const { category_name_my, example_products } = req.body;

    // Validation
    const errors = [];

    if (!category_name_my || typeof category_name_my !== 'string' || category_name_my.trim().length === 0) {
      errors.push('Category name (Myanmar) is required and must be a non-empty string');
    }

    if (!example_products || typeof example_products !== 'string' || example_products.trim().length === 0) {
      errors.push('Example products are required and must be a non-empty string');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check for duplicate category name
    const existingCategory = await ProductCategory.findOne({ 
      category_name_my: category_name_my.trim() 
    });
    
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists',
        error: `A category with name "${category_name_my}" already exists`
      });
    }

    // Create new category
    const newCategory = new ProductCategory({
      category_name_my: category_name_my.trim(),
      example_products: example_products.trim()
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: savedCategory
    });

  } catch (error) {
    console.error('Error creating category:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000 && error.keyPattern?.category_name_my) {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists',
        error: `A category with name "${error.keyValue.category_name_my}" already exists`
      });
    }

    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update existing category
 * PUT /api/categories/:id
 */
const updateCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name_my, example_products } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Validation
    const errors = [];

    if (!category_name_my || typeof category_name_my !== 'string' || category_name_my.trim().length === 0) {
      errors.push('Category name (Myanmar) is required and must be a non-empty string');
    }

    if (!example_products || typeof example_products !== 'string' || example_products.trim().length === 0) {
      errors.push('Example products are required and must be a non-empty string');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check if category exists
    const existingCategory = await ProductCategory.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate category name (excluding current category)
    const duplicateCategory = await ProductCategory.findOne({
      category_name_my: category_name_my.trim(),
      _id: { $ne: id }
    });

    if (duplicateCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists',
        error: `A category with name "${category_name_my}" already exists`
      });
    }

    // Update category
    const updatedCategory = await ProductCategory.findByIdAndUpdate(
      id,
      {
        category_name_my: category_name_my.trim(),
        example_products: example_products.trim()
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    console.error('Error updating category:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000 && error.keyPattern?.category_name_my) {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists',
        error: `A category with name "${error.keyValue.category_name_my}" already exists`
      });
    }

    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete category by ID (with reference check)
 * DELETE /api/categories/:id
 */
const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Check if category is referenced by any items
    const Item = require('../models/Item');
    const referencedItems = await Item.countDocuments({ category_id: id });

    if (referencedItems > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete category',
        error: `This category is currently used by ${referencedItems} item(s). Please update or delete those items first.`
      });
    }

    // Find and delete category
    const deletedCategory = await ProductCategory.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        id: deletedCategory._id,
        category_name_my: deletedCategory.category_name_my
      }
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController
};
