const csv = require('csv-parser');
const Item = require('../models/Item');
const ProductCategory = require('../models/ProductCategory');
const mongoose = require('mongoose');

/**
 * Import items from CSV file
 * POST /api/items/import
 */
const importItemsController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        error: 'Please upload a CSV file'
      });
    }

    const results = [];
    const errors = [];
    const validItems = [];
    
    // Read CSV file
    const csvData = req.file.buffer.toString('utf-8');
    const rows = csvData.split('\n').filter(row => row.trim() !== '');
    
    // Parse CSV manually for better error handling
    const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Validate headers
    const requiredHeaders = ['name', 'item_code', 'selling_price', 'cost_price', 'stock_quantity', 'low_stock_threshold', 'category_id'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CSV format',
        error: `Missing required columns: ${missingHeaders.join(', ')}`
      });
    }

    // Process each row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors = [];
      
      try {
        // Parse CSV row
        const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rowData = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            rowData[header] = values[index];
          }
        });

        // Validate required fields
        if (!rowData.name || rowData.name.trim().length === 0) {
          rowErrors.push('Name is required');
        }

        if (!rowData.item_code || rowData.item_code.trim().length === 0) {
          rowErrors.push('Item code is required');
        }

        // Validate numeric fields
        const numericFields = ['selling_price', 'cost_price', 'stock_quantity', 'low_stock_threshold'];
        const numericData = {};
        
        numericFields.forEach(field => {
          if (!rowData[field] || isNaN(Number(rowData[field]))) {
            rowErrors.push(`${field} must be a valid number`);
          } else {
            numericData[field] = Number(rowData[field]);
            if (numericData[field] < 0) {
              rowErrors.push(`${field} cannot be negative`);
            }
          }
        });

        // Validate category_id
        if (!rowData.category_id || !mongoose.Types.ObjectId.isValid(rowData.category_id)) {
          rowErrors.push('Category ID must be a valid MongoDB ObjectId');
        } else {
          // Check if category exists
          const categoryExists = await ProductCategory.findById(rowData.category_id);
          if (!categoryExists) {
            rowErrors.push(`Category with ID ${rowData.category_id} does not exist`);
          }
        }

        // Check for duplicate item_code in the same CSV
        const duplicateInCsv = validItems.find(item => item.item_code === rowData.item_code);
        if (duplicateInCsv) {
          rowErrors.push(`Duplicate item code "${rowData.item_code}" found in CSV`);
        }

        // Check for duplicate item_code in database
        const duplicateInDb = await Item.findOne({ item_code: rowData.item_code });
        if (duplicateInDb) {
          rowErrors.push(`Item code "${rowData.item_code}" already exists in database`);
        }

        if (rowErrors.length > 0) {
          errors.push({
            rowNumber: i + 1,
            data: rowData,
            errors: rowErrors
          });
        } else {
          // Valid item - prepare for bulk insert
          validItems.push({
            name: rowData.name.trim(),
            item_code: rowData.item_code.trim(),
            selling_price: numericData.selling_price,
            cost_price: numericData.cost_price,
            stock_quantity: numericData.stock_quantity,
            low_stock_threshold: numericData.low_stock_threshold,
            category_id: rowData.category_id
          });
        }

      } catch (error) {
        errors.push({
          rowNumber: i + 1,
          data: { raw: row },
          errors: ['Failed to parse row: ' + error.message]
        });
      }
    }

    // Bulk insert valid items
    let successfulImports = 0;
    if (validItems.length > 0) {
      const insertedItems = await Item.insertMany(validItems);
      successfulImports = insertedItems.length;
    }

    const totalProcessed = rows.length - 1; // Exclude header row
    const failedImports = errors.length;

    // Prepare response
    const response = {
      success: failedImports === 0,
      message: failedImports === 0 
        ? 'All items imported successfully' 
        : `Import completed with ${failedImports} error(s)`,
      data: {
        totalProcessed,
        successfulImports,
        failedImports,
        failedRows: errors
      }
    };

    // Return appropriate status code
    const statusCode = failedImports === 0 ? 201 : 207; // 207 Multi-Status for partial success
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('Error importing items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while importing items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  importItemsController
};
