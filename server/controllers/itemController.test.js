/**
 * Comprehensive Test Suite for Item Controller
 * Myanmar Grocery Store Inventory Management System
 * 
 * Tests all CRUD operations, validation, error handling, and edge cases
 * Production-ready with proper mocking and async/await handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules at the top level
const mockItem = vi.fn();
const mockMongoose = {
  Types: {
    ObjectId: vi.fn().mockImplementation((id) => ({ toString: () => id || 'mock-id' }))
  }
};

// Set up static methods for mongoose
mockMongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);

// Mock the modules
vi.mock('../models/Item', () => ({ default: mockItem }));
vi.mock('mongoose', () => ({ default: mockMongoose }));

// Import the controllers after mocking
const {
  createItemController,
  updateItemController,
  getAllItemsController,
  getItemByIdController,
  deleteItemController,
  adjustStockController,
  getLowStockItemsController
} = await import('./itemController.js');

describe('Item Controller Test Suite', () => {
  // Common test data
  const validItemData = {
    name: 'Test Item',
    item_code: 'TEST001',
    selling_price: 100,
    cost_price: 80,
    stock_quantity: 50,
    low_stock_threshold: 10,
    category_id: '507f1f77bcf86cd799439011'
  };

  const mockItemId = '507f1f77bcf86cd799439012';
  const mockCategoryId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Set NODE_ENV to development for tests to show detailed error messages
    process.env.NODE_ENV = 'development';
    
    // Reset mongoose ObjectId validation to true by default
    mockMongoose.Types.ObjectId.isValid.mockReturnValue(true);

    // Setup default Item model methods
    mockItem.findOne = vi.fn();
    mockItem.findById = vi.fn();
    mockItem.findByIdAndUpdate = vi.fn();
    mockItem.findByIdAndDelete = vi.fn();
    mockItem.find = vi.fn();
    mockItem.countDocuments = vi.fn();

    // Setup method chaining for queries
    const mockQueryChain = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };

    mockItem.find.mockReturnValue(mockQueryChain);
    mockItem.findById.mockReturnValue(mockQueryChain);
    mockItem.findByIdAndUpdate.mockReturnValue(mockQueryChain);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createItemController', () => {
    let req, res, mockSave;

    beforeEach(() => {
      req = {
        body: { ...validItemData }
      };

      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      mockSave = vi.fn();
      
      // Mock Item constructor
      mockItem.mockImplementation((data) => ({
        ...data,
        _id: mockItemId,
        save: mockSave
      }));
    });

    describe('✅ Successful item creation', () => {
      it('should create a new item successfully with valid data', async () => {
        // Arrange
        mockItem.findOne.mockResolvedValue(null); // No duplicate found
        mockSave.mockResolvedValue({
          _id: mockItemId,
          ...validItemData
        });

        // Mock the population chain
        const mockPopulatedItem = {
          _id: mockItemId,
          ...validItemData,
          category_id: { _id: mockCategoryId, category_name_my: 'Test Category' }
        };
        
        mockItem.findById.mockReturnValue({
          populate: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockPopulatedItem)
          })
        });

        // Act
        await createItemController(req, res);

        // Assert
        expect(mockItem.findOne).toHaveBeenCalledWith({ item_code: 'TEST001' });
        expect(mockSave).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Item created successfully',
          data: mockPopulatedItem
        });
      });
    });

    describe('❌ Validation errors - missing required fields', () => {
      it('should return 400 error when name is missing', async () => {
        // Arrange
        delete req.body.name;

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Name is required and must be a non-empty string'
          ])
        });
        expect(mockItem.findOne).not.toHaveBeenCalled();
      });

      it('should return 400 error when item_code is missing', async () => {
        // Arrange
        delete req.body.item_code;

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Item code is required and must be a non-empty string'
          ])
        });
      });

      it('should return 400 error when category_id is missing', async () => {
        // Arrange
        delete req.body.category_id;

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Valid category ID is required'
          ])
        });
      });

      it('should return 400 error when category_id is invalid', async () => {
        // Arrange
        req.body.category_id = 'invalid-id';
        mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Valid category ID is required'
          ])
        });
      });

      it('should return 400 error for invalid numeric fields', async () => {
        // Arrange
        req.body.selling_price = -10;
        req.body.cost_price = 'invalid';
        req.body.stock_quantity = null;

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Selling price must be at least 0',
            'Cost price is required and must be a number',
            'Stock quantity is required and must be a number'
          ])
        });
      });

      it('should return 400 error for empty string fields', async () => {
        // Arrange
        req.body.name = '   '; // Empty after trim
        req.body.item_code = '';

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Name is required and must be a non-empty string',
            'Item code is required and must be a non-empty string'
          ])
        });
      });
    });

    describe('🔄 Duplicate item code scenarios', () => {
      it('should return 409 error when item_code already exists', async () => {
        // Arrange
        const existingItem = {
          _id: '507f1f77bcf86cd799439013',
          name: 'Existing Item',
          item_code: 'TEST001'
        };
        mockItem.findOne.mockResolvedValue(existingItem);

        // Act
        await createItemController(req, res);

        // Assert
        expect(mockItem.findOne).toHaveBeenCalledWith({ item_code: 'TEST001' });
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Item code already exists',
          error: 'An item with code "TEST001" already exists'
        });
        expect(mockSave).not.toHaveBeenCalled();
      });
    });

    describe('💥 Server error scenarios', () => {
      it('should return 500 error when database save operation fails', async () => {
        // Arrange
        mockItem.findOne.mockResolvedValue(null);
        const serverError = new Error('Database connection failed');
        mockSave.mockRejectedValue(serverError);

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Server error while creating item',
          error: 'Database connection failed'
        });
      });

      it('should return 500 error when Item.findOne fails', async () => {
        // Arrange
        const serverError = new Error('Database query failed');
        mockItem.findOne.mockRejectedValue(serverError);

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Server error while creating item',
          error: 'Database query failed'
        });
      });

      it('should handle Mongoose ValidationError', async () => {
        // Arrange
        mockItem.findOne.mockResolvedValue(null);
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        validationError.errors = {
          name: { message: 'Name is required' },
          item_code: { message: 'Item code must be unique' }
        };
        mockSave.mockRejectedValue(validationError);

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: ['Name is required', 'Item code must be unique']
        });
      });

      it('should handle MongoDB duplicate key error during save', async () => {
        // Arrange
        mockItem.findOne.mockResolvedValue(null);
        const duplicateError = new Error('Duplicate key error');
        duplicateError.code = 11000;
        duplicateError.keyPattern = { item_code: 1 };
        duplicateError.keyValue = { item_code: 'TEST001' };
        mockSave.mockRejectedValue(duplicateError);

        // Act
        await createItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Item code already exists',
          error: 'An item with code "TEST001" already exists'
        });
      });

      it('should hide error details in production environment', async () => {
        // Arrange
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        mockItem.findOne.mockResolvedValue(null);
        const serverError = new Error('Sensitive database error');
        mockSave.mockRejectedValue(serverError);

        try {
          // Act
          await createItemController(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Server error while creating item',
            error: 'Internal server error'
          });
        } finally {
          // Cleanup
          process.env.NODE_ENV = originalEnv;
        }
      });
    });
  });

  describe('updateItemController', () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: { id: mockItemId },
        body: {
          name: 'Updated Item',
          selling_price: 120
        }
      };

      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
    });

    describe('✅ Successful updates', () => {
      it('should update item successfully with valid data', async () => {
        // Arrange
        const existingItem = { _id: mockItemId, name: 'Old Item' };
        const updatedItem = {
          _id: mockItemId,
          name: 'Updated Item',
          selling_price: 120,
          category_id: { category_name_my: 'Test Category' }
        };

        mockItem.findById.mockResolvedValue(existingItem);
        mockItem.findByIdAndUpdate.mockReturnValue({
          populate: vi.fn().mockResolvedValue(updatedItem)
        });

        // Act
        await updateItemController(req, res);

        // Assert
        expect(mockItem.findById).toHaveBeenCalledWith(mockItemId);
        expect(mockItem.findByIdAndUpdate).toHaveBeenCalledWith(
          mockItemId,
          expect.objectContaining({
            name: 'Updated Item',
            selling_price: 120,
            updatedAt: expect.any(Date)
          }),
          { new: true, runValidators: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Item updated successfully',
          data: updatedItem
        });
      });

      it('should update only provided fields (partial update)', async () => {
        // Arrange
        req.body = { stock_quantity: 75 }; // Only update stock
        const existingItem = { _id: mockItemId, name: 'Existing Item' };
        const updatedItem = { _id: mockItemId, name: 'Existing Item', stock_quantity: 75 };

        mockItem.findById.mockResolvedValue(existingItem);
        mockItem.findByIdAndUpdate.mockReturnValue({
          populate: vi.fn().mockResolvedValue(updatedItem)
        });

        // Act
        await updateItemController(req, res);

        // Assert
        expect(mockItem.findByIdAndUpdate).toHaveBeenCalledWith(
          mockItemId,
          expect.objectContaining({
            stock_quantity: 75,
            updatedAt: expect.any(Date)
          }),
          { new: true, runValidators: true }
        );
      });
    });

    describe('❌ Validation errors', () => {
      it('should return error for invalid ID format', async () => {
        // Arrange
        req.params.id = 'invalid-id';
        mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

        // Act
        await updateItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid item ID format'
        });
      });

      it('should return error when item not found', async () => {
        // Arrange
        mockItem.findById.mockResolvedValue(null);

        // Act
        await updateItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Item not found'
        });
      });

      it('should validate numeric fields during update', async () => {
        // Arrange
        req.body.selling_price = 'invalid';
        req.body.stock_quantity = -5;
        mockItem.findById.mockResolvedValue({ _id: mockItemId });

        // Act
        await updateItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Selling price must be a number',
            'Stock quantity must be at least 0'
          ])
        });
      });

      it('should check for duplicate item_code during update', async () => {
        // Arrange
        req.body.item_code = 'DUPLICATE001';
        const existingItem = { _id: mockItemId };
        const duplicateItem = { _id: 'different-id', item_code: 'DUPLICATE001' };

        mockItem.findById.mockResolvedValue(existingItem);
        mockItem.findOne.mockResolvedValue(duplicateItem);

        // Act
        await updateItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Item code already exists',
          error: 'An item with code "DUPLICATE001" already exists'
        });
      });
    });

    describe('💥 Server errors', () => {
      it('should handle database errors during update', async () => {
        // Arrange
        mockItem.findById.mockResolvedValue({ _id: mockItemId });
        
        // Mock findByIdAndUpdate to return something that will cause populate to fail
        mockItem.findByIdAndUpdate.mockReturnValue({
          populate: vi.fn().mockRejectedValue(new Error('Database update failed'))
        });

        // Act
        await updateItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Server error while updating item',
          error: 'Database update failed'
        });
      });
    });
  });

  describe('getAllItemsController', () => {
    let req, res;

    beforeEach(() => {
      req = {
        query: { page: '1', limit: '10' }
      };

      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
    });

    describe('✅ Successful retrieval', () => {
      it('should return paginated items successfully', async () => {
        // Arrange
        const mockItems = [
          { _id: '1', name: 'Item 1', item_code: 'ITEM001' },
          { _id: '2', name: 'Item 2', item_code: 'ITEM002' }
        ];

        const mockQueryChain = {
          populate: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockItems)
        };

        mockItem.find.mockReturnValue(mockQueryChain);
        mockItem.countDocuments.mockResolvedValue(2);

        // Act
        await getAllItemsController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Items retrieved successfully',
          data: {
            items: mockItems,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 2,
              itemsPerPage: 10,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      });

      it('should handle search functionality', async () => {
        // Arrange
        req.query.search = 'test item';
        const mockQueryChain = {
          populate: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue([])
        };

        mockItem.find.mockReturnValue(mockQueryChain);
        mockItem.countDocuments.mockResolvedValue(0);

        // Act
        await getAllItemsController(req, res);

        // Assert
        expect(mockItem.find).toHaveBeenCalledWith({
          $or: [
            { name: expect.any(RegExp) },
            { itemCode: expect.any(RegExp) }
          ]
        });
      });

      it('should handle category filtering', async () => {
        // Arrange
        req.query.category = mockCategoryId;
        const mockQueryChain = {
          populate: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue([])
        };

        mockItem.find.mockReturnValue(mockQueryChain);
        mockItem.countDocuments.mockResolvedValue(0);

        // Act
        await getAllItemsController(req, res);

        // Assert
        expect(mockItem.find).toHaveBeenCalledWith({
          category: expect.any(Object)
        });
      });
    });

    describe('❌ Validation errors', () => {
      it('should return validation errors for invalid query parameters', async () => {
        // Arrange
        req.query = { page: '-1', limit: '150' };

        // Act
        await getAllItemsController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid query parameters',
          errors: expect.arrayContaining([
            'Page must be a positive integer',
            'Limit must be a positive integer between 1 and 100'
          ])
        });
      });

      it('should validate category ID format', async () => {
        // Arrange
        req.query.category = 'invalid-category-id';
        mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

        // Act
        await getAllItemsController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid query parameters',
          errors: expect.arrayContaining([
            'Invalid category ID format'
          ])
        });
      });
    });

    describe('💥 Server errors', () => {
      it('should handle database query errors', async () => {
        // Arrange
        const dbError = new Error('Database query failed');
        mockItem.find.mockImplementation(() => {
          throw dbError;
        });

        // Act
        await getAllItemsController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Server error while fetching items',
          error: 'Database query failed'
        });
      });
    });
  });

  describe('getItemByIdController', () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: { id: mockItemId }
      };

      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
    });

    describe('✅ Successful retrieval', () => {
      it('should return item successfully', async () => {
        // Arrange
        const mockFoundItem = {
          _id: mockItemId,
          name: 'Test Item',
          category_id: { category_name_my: 'Test Category' }
        };

        const mockQueryChain = {
          populate: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockFoundItem)
        };

        mockItem.findById.mockReturnValue(mockQueryChain);

        // Act
        await getItemByIdController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Item retrieved successfully',
          data: mockFoundItem
        });
      });
    });

    describe('❌ Validation and not found errors', () => {
      it('should return error for invalid ID format', async () => {
        // Arrange
        req.params.id = 'invalid-id';
        mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

        // Act
        await getItemByIdController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid item ID format'
        });
      });

      it('should return error when item not found', async () => {
        // Arrange
        const mockQueryChain = {
          populate: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(null)
        };

        mockItem.findById.mockReturnValue(mockQueryChain);

        // Act
        await getItemByIdController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Item not found'
        });
      });
    });
  });

  describe('deleteItemController', () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: { id: mockItemId }
      };

      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
    });

    describe('✅ Successful deletion', () => {
      it('should delete item successfully', async () => {
        // Arrange
        const mockDeletedItem = {
          _id: mockItemId,
          name: 'Test Item',
          item_code: 'TEST001'
        };

        mockItem.findByIdAndDelete.mockResolvedValue(mockDeletedItem);

        // Act
        await deleteItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Item deleted successfully',
          data: {
            id: mockDeletedItem._id,
            name: mockDeletedItem.name,
            item_code: mockDeletedItem.item_code
          }
        });
      });
    });

    describe('❌ Validation and not found errors', () => {
      it('should return error for invalid ID format', async () => {
        // Arrange
        req.params.id = 'invalid-id';
        mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

        // Act
        await deleteItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid item ID format'
        });
      });

      it('should return error when item not found', async () => {
        // Arrange
        mockItem.findByIdAndDelete.mockResolvedValue(null);

        // Act
        await deleteItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Item not found'
        });
      });
    });

    describe('💥 Server errors', () => {
      it('should handle database deletion errors', async () => {
        // Arrange
        const dbError = new Error('Database deletion failed');
        mockItem.findByIdAndDelete.mockRejectedValue(dbError);

        // Act
        await deleteItemController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Server error while deleting item',
          error: 'Database deletion failed'
        });
      });
    });
  });

  describe('adjustStockController', () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: { id: mockItemId },
        body: { stock_quantity: 25 }
      };

      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
    });

    describe('✅ Successful stock adjustment', () => {
      it('should adjust stock successfully', async () => {
        // Arrange
        const mockUpdatedItem = {
          _id: mockItemId,
          stock_quantity: 25,
          category_id: { category_name_my: 'Test Category' }
        };

        mockItem.findByIdAndUpdate.mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockUpdatedItem)
        });

        // Act
        await adjustStockController(req, res);

        // Assert
        expect(mockItem.findByIdAndUpdate).toHaveBeenCalledWith(
          mockItemId,
          expect.objectContaining({
            stock_quantity: 25,
            updatedAt: expect.any(Date)
          }),
          { new: true, runValidators: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Stock quantity updated successfully',
          data: mockUpdatedItem
        });
      });
    });

    describe('❌ Validation errors', () => {
      it('should return validation error for invalid stock quantity', async () => {
        // Arrange
        req.body.stock_quantity = -5;

        // Act
        await adjustStockController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: ['stock_quantity cannot be negative']
        });
      });

      it('should return error when stock_quantity is missing', async () => {
        // Arrange
        delete req.body.stock_quantity;

        // Act
        await adjustStockController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: ['stock_quantity is required']
        });
      });

      it('should return error for non-numeric stock_quantity', async () => {
        // Arrange
        req.body.stock_quantity = 'invalid';

        // Act
        await adjustStockController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: ['stock_quantity must be a number']
        });
      });

      it('should return error when item not found', async () => {
        // Arrange
        mockItem.findByIdAndUpdate.mockReturnValue({
          populate: vi.fn().mockResolvedValue(null)
        });

        // Act
        await adjustStockController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Item not found'
        });
      });
    });
  });

  describe('getLowStockItemsController', () => {
    let req, res;

    beforeEach(() => {
      req = {
        query: { page: '1', limit: '10' }
      };

      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
    });

    describe('✅ Successful retrieval', () => {
      it('should return low stock items successfully', async () => {
        // Arrange
        const mockLowStockItems = [
          { _id: '1', name: 'Low Stock Item', stock_quantity: 2, low_stock_threshold: 10 }
        ];

        const mockQueryChain = {
          populate: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockLowStockItems)
        };

        mockItem.countDocuments.mockResolvedValue(1);
        mockItem.find.mockReturnValue(mockQueryChain);

        // Act
        await getLowStockItemsController(req, res);

        // Assert
        expect(mockItem.find).toHaveBeenCalledWith({
          $expr: { $lte: ['$stock_quantity', '$low_stock_threshold'] }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Low stock items retrieved successfully',
          data: {
            items: mockLowStockItems,
            pagination: {
              currentPage: 1,
              totalItems: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      });

      it('should return empty result when no low stock items found', async () => {
        // Arrange
        const mockQueryChain = {
          populate: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue([])
        };

        mockItem.countDocuments.mockResolvedValue(0);
        mockItem.find.mockReturnValue(mockQueryChain);

        // Act
        await getLowStockItemsController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'No low stock items found',
          data: {
            items: [],
            pagination: {
              currentPage: 1,
              totalItems: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      });

      it('should handle pagination correctly for multiple pages', async () => {
        // Arrange
        req.query = { page: '2', limit: '5' };
        
        const mockQueryChain = {
          populate: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue([])
        };

        mockItem.countDocuments.mockResolvedValue(12); // Total 12 items, page 2 of 3
        mockItem.find.mockReturnValue(mockQueryChain);

        // Act
        await getLowStockItemsController(req, res);

        // Assert
        expect(mockQueryChain.skip).toHaveBeenCalledWith(5); // (page - 1) * limit
        expect(mockQueryChain.limit).toHaveBeenCalledWith(5);
      });
    });

    describe('💥 Server errors', () => {
      it('should handle database query errors', async () => {
        // Arrange
        const dbError = new Error('Database query failed');
        mockItem.countDocuments.mockRejectedValue(dbError);

        // Act
        await getLowStockItemsController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Server error while retrieving low stock items',
          error: 'Database query failed'
        });
      });
    });
  });
});
