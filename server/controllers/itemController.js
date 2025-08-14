import Item from '../models/Item.js';
import mongoose from 'mongoose';

/**
 * Create a new inventory item
 * POST /api/items
 */
const createItemController = async (req, res) => {
  try {
    const {
      name,
      item_code,
      selling_price,
      cost_price,
      stock_quantity,
      low_stock_threshold,
      category_id
    } = req.body;

    // Server-side validation
    const errors = [];

    // Required field validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }

    if (!item_code || typeof item_code !== 'string' || item_code.trim().length === 0) {
      errors.push('Item code is required and must be a non-empty string');
    }

    if (!category_id || !mongoose.Types.ObjectId.isValid(category_id)) {
      errors.push('Valid category ID is required');
    }

    // Numeric validation
    const numericFields = [
      { field: selling_price, name: 'Selling price', min: 0 },
      { field: cost_price, name: 'Cost price', min: 0 },
      { field: stock_quantity, name: 'Stock quantity', min: 0 },
      { field: low_stock_threshold, name: 'Low stock threshold', min: 0 }
    ];

    numericFields.forEach(({ field, name: fieldName, min }) => {
      if (field === undefined || field === null || isNaN(Number(field))) {
        errors.push(`${fieldName} is required and must be a number`);
      } else if (Number(field) < min) {
        errors.push(`${fieldName} must be at least ${min}`);
      }
    });

    // Check for validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check for duplicate item code
    const existingItem = await Item.findOne({ item_code: item_code.trim() });
    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Item code already exists',
        error: `An item with code "${item_code}" already exists`
      });
    }

    // Create new item
    const newItem = new Item({
      name: name.trim(),
      item_code: item_code.trim(),
      selling_price: Number(selling_price),
      cost_price: Number(cost_price),
      stock_quantity: Number(stock_quantity),
      low_stock_threshold: Number(low_stock_threshold),
      category_id: new mongoose.Types.ObjectId(category_id),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save to database
    const savedItem = await newItem.save();

    // Populate category information before sending response
    const populatedItem = await Item.findById(savedItem._id)
      .populate('category_id', 'category_name_my example_products')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: populatedItem
    });

  } catch (error) {
    console.error('Error creating item:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000 && error.keyPattern?.item_code) {
      return res.status(409).json({
        success: false,
        message: 'Item code already exists',
        error: `An item with code "${error.keyValue.item_code}" already exists`
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
      message: 'Server error while creating item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update an existing inventory item
 * PUT /api/items/:id
 */
const updateItemController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      item_code,
      selling_price,
      cost_price,
      stock_quantity,
      low_stock_threshold,
      category_id
    } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    // Server-side validation (same as create but optional for partial updates)
    const errors = [];

    // Validate provided fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Name must be a non-empty string');
      }
    }

    if (item_code !== undefined) {
      if (typeof item_code !== 'string' || item_code.trim().length === 0) {
        errors.push('Item code must be a non-empty string');
      }
    }

    if (category_id !== undefined && !mongoose.Types.ObjectId.isValid(category_id)) {
      errors.push('Valid category ID is required');
    }

    // Numeric validation
    const numericFields = [
      { field: selling_price, name: 'Selling price', min: 0 },
      { field: cost_price, name: 'Cost price', min: 0 },
      { field: stock_quantity, name: 'Stock quantity', min: 0 },
      { field: low_stock_threshold, name: 'Low stock threshold', min: 0 }
    ];

    numericFields.forEach(({ field, name: fieldName, min }) => {
      if (field !== undefined) {
        if (isNaN(Number(field))) {
          errors.push(`${fieldName} must be a number`);
        } else if (Number(field) < min) {
          errors.push(`${fieldName} must be at least ${min}`);
        }
      }
    });

    // Check for validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Check if item exists
    const existingItem = await Item.findById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check for duplicate item code (excluding current item)
    if (item_code !== undefined) {
      const duplicateItem = await Item.findOne({ 
        item_code: item_code.trim(),
        _id: { $ne: id }
      });
      
      if (duplicateItem) {
        return res.status(409).json({
          success: false,
          message: 'Item code already exists',
          error: `An item with code "${item_code}" already exists`
        });
      }
    }

    // Prepare update data
    const updateData = {
      ...(name && { name: name.trim() }),
      ...(item_code && { item_code: item_code.trim() }),
      ...(selling_price !== undefined && { selling_price: Number(selling_price) }),
      ...(cost_price !== undefined && { cost_price: Number(cost_price) }),
      ...(stock_quantity !== undefined && { stock_quantity: Number(stock_quantity) }),
      ...(low_stock_threshold !== undefined && { low_stock_threshold: Number(low_stock_threshold) }),
      ...(category_id && { category_id: new mongoose.Types.ObjectId(category_id) }),
      updatedAt: new Date()
    };

    // Update the item
    const updatedItem = await Item.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category_id', 'category_name_my example_products');

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('Error updating item:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000 && error.keyPattern?.item_code) {
      return res.status(409).json({
        success: false,
        message: 'Item code already exists',
        error: `An item with code "${error.keyValue.item_code}" already exists`
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
      message: 'Server error while updating item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all items with pagination, search, and filtering
 * GET /api/items
 */
const getAllItemsController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category
    } = req.query;

    // Validate query parameters
    const errors = [];
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be a positive integer between 1 and 100');
    }

    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      errors.push('Invalid category ID format');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors
      });
    }

    // Build query filter
    const filter = {};

    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { itemCode: searchRegex }
      ];
    }

    // Category filtering
    if (category) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [items, totalCount] = await Promise.all([
      Item.find(filter)
        .populate('category', 'category_name_my example_products')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Item.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      message: 'Items retrieved successfully',
      data: {
        items,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get single item by ID
 * GET /api/items/:id
 */
const getItemByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    // Find item by ID and populate category information
    const item = await Item.findById(id)
      .populate('category_id', 'category_name_my example_products')
      .lean();

    // Check if item exists
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item retrieved successfully',
      data: item
    });

  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete an item by ID
 * DELETE /api/items/:id
 */
const deleteItemController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    // Find item by ID and delete it
    const deletedItem = await Item.findByIdAndDelete(id);

    // Check if item exists
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
      data: {
        id: deletedItem._id,
        name: deletedItem.name,
        item_code: deletedItem.item_code
      }
    });

  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Adjust stock quantity for a specific item
 * PATCH /api/items/:id/adjust-stock
 */
const adjustStockController = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    // Validate stock_quantity
    const errors = [];
    
    if (stock_quantity === undefined || stock_quantity === null) {
      errors.push('stock_quantity is required');
    } else if (isNaN(Number(stock_quantity))) {
      errors.push('stock_quantity must be a number');
    } else if (Number(stock_quantity) < 0) {
      errors.push('stock_quantity cannot be negative');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Find item by ID and update only stock_quantity
    const updatedItem = await Item.findByIdAndUpdate(
      id,
      {
        stock_quantity: Number(stock_quantity),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('category_id', 'category_name_my example_products');

    // Check if item exists
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock quantity updated successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('Error adjusting stock:', error);

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
      message: 'Server error while adjusting stock',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get low stock items report
 * GET /api/reports/low-stock
 */
const getLowStockItemsController = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Query for low stock items
    const query = {
      $expr: { $lte: ['$stock_quantity', '$low_stock_threshold'] }
    };

    // Get total count for pagination
    const totalItems = await Item.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Get low stock items with pagination
    const items = await Item.find(query)
      .populate('category_id', 'category_name_my example_products')
      .sort({ stock_quantity: 1 }) // Sort by stock_quantity ascending (lowest first)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Check if any low stock items found
    if (!items || items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No low stock items found',
        data: {
          items: [],
          pagination: {
            currentPage: pageNum,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Low stock items retrieved successfully',
      data: {
        items,
        pagination: {
          currentPage: pageNum,
          totalItems,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving low stock items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export {
  createItemController,
  updateItemController,
  getAllItemsController,
  getItemByIdController,
  deleteItemController,
  adjustStockController,
  getLowStockItemsController
};
