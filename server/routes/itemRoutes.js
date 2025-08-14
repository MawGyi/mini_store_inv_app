import express from 'express';
import { createItemController, updateItemController, getAllItemsController, getItemByIdController, deleteItemController, adjustStockController, getLowStockItemsController } from '../controllers/itemController.js';
import { importItemsController } from '../controllers/importController.js';
import upload from '../middleware/upload.js';
import Item from '../models/Item.js';

const router = express.Router();

/**
 * @route   POST /api/items
 * @desc    Create a new inventory item
 * @access  Public (add authentication middleware as needed)
 * @body    { name, item_code, selling_price, cost_price, stock_quantity, low_stock_threshold, category_id }
 */
router.post('/', createItemController);

/**
 * @route   PUT /api/items/:id
 * @desc    Update an existing inventory item
 * @access  Public (add authentication middleware as needed)
 * @body    { name, item_code, selling_price, cost_price, stock_quantity, low_stock_threshold, category_id }
 * @params  { id } - Item ID to update
 */
router.put('/:id', updateItemController);

/**
 * @route   GET /api/items
 * @desc    Get all items with pagination, search, and filtering
 * @access  Public
 * @query   { page, limit, search, category_id }
 */
router.get('/', getAllItemsController);

/**
 * @route   GET /api/items/search/:query
 * @desc    Search items by name, code, or barcode for POS
 * @access  Public
 * @params  { query } - Search term
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const searchResults = await Item.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { item_code: { $regex: query, $options: 'i' } },
        { barcode: { $regex: query, $options: 'i' } }
      ],
      stock_quantity: { $gt: 0 } // Only return items in stock
    })
    .populate('category_id', 'name')
    .limit(10)
    .select('name item_code barcode selling_price stock_quantity category_id');

    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'ရှာဖွေမှုမှာ အမှားရှိနေပါသည်',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/items/:id
 * @desc    Get single item by ID
 * @access  Public
 * @params  { id } - Item ID to retrieve
 */
router.get('/:id', getItemByIdController);

/**
 * @route   DELETE /api/items/:id
 * @desc    Delete an item by ID
 * @access  Public (add authentication middleware as needed)
 * @params  { id } - Item ID to delete
 */
router.delete('/:id', deleteItemController);

/**
 * @route   PATCH /api/items/:id/adjust-stock
 * @desc    Adjust stock quantity for a specific item
 * @access  Public (add authentication middleware as needed)
 * @body    { stock_quantity }
 * @params  { id } - Item ID to adjust stock for
 */
router.patch('/:id/adjust-stock', adjustStockController);

/**
 * @route   GET /api/reports/low-stock
 * @desc    Get low stock items report (stock_quantity <= low_stock_threshold)
 * @access  Public
 * @query   { page, limit }
 */
router.get('/reports/low-stock', getLowStockItemsController);

/**
 * @route   POST /api/items/import
 * @desc    Bulk import items from CSV file
 * @access  Public (add authentication middleware as needed)
 * @body    CSV file (multipart/form-data)
 */
router.post('/import', upload.single('file'), importItemsController);

/**
 * @route   POST /api/items/bulk-import
 * @desc    Bulk import items from CSV file (alias for /import)
 * @access  Public (add authentication middleware as needed)  
 * @body    CSV file (multipart/form-data)
 */
router.post('/bulk-import', upload.single('file'), importItemsController);

/**
 * @route   POST /api/items/bulk-import/validate
 * @desc    Validate bulk import CSV file without importing
 * @access  Public (add authentication middleware as needed)
 * @body    CSV file (multipart/form-data)
 */
router.post('/bulk-import/validate', upload.single('file'), (req, res) => {
  // Add validate flag to request
  req.validateOnly = true;
  importItemsController(req, res);
});

export default router;
