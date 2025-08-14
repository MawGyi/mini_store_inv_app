/**
 * Unit tests for API Service - Inventory related endpoints
 * Tests the API service layer for proper error handling, data transformation, and network requests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService, ApiError } from '../services/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

describe('API Service - Inventory Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getItems', () => {
    it('should fetch items successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              _id: '1',
              name: 'Test Item',
              selling_price: 1000,
              stock_quantity: 50,
            },
          ],
          pagination: { totalItems: 1 },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.getItems();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3003/api/items',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle query parameters correctly', async () => {
      const mockResponse = { success: true, data: { items: [] } };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiService.getItems({
        search: 'test',
        category: 'food',
        page: 2,
        limit: 20,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3003/api/items?search=test&category=food&page=2&limit=20',
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        message: 'Items not found',
        details: { code: 404 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(apiService.getItems()).rejects.toThrow(ApiError);
      
      try {
        await apiService.getItems();
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(404);
        expect(error.message).toBe('Items not found');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getItems()).rejects.toThrow(ApiError);
      
      try {
        await apiService.getItems();
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(0);
        expect(error.message).toContain('ဆာဗာသို့ ချိတ်ဆက်မရပါ');
      }
    });
  });

  describe('createItem', () => {
    it('should create item successfully', async () => {
      const itemData = {
        name: 'New Item',
        price: 1500,
        cost: 1000,
        stock: 100,
        category: 'cat1',
      };

      const mockResponse = {
        success: true,
        data: { _id: '123', ...itemData },
        message: 'Item created successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.createItem(itemData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3003/api/items',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(itemData),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      const itemData = { name: '', price: -100 };
      
      const errorResponse = {
        message: 'Validation failed',
        details: {
          name: 'Name is required',
          price: 'Price must be positive',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(apiService.createItem(itemData)).rejects.toThrow(ApiError);
    });
  });

  describe('updateItem', () => {
    it('should update item successfully', async () => {
      const itemId = '123';
      const updateData = {
        name: 'Updated Item',
        price: 2000,
      };

      const mockResponse = {
        success: true,
        data: { _id: itemId, ...updateData },
        message: 'Item updated successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.updateItem(itemId, updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3003/api/items/${itemId}`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(updateData),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle item not found error', async () => {
      const itemId = 'nonexistent';
      const updateData = { name: 'Updated Item' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Item not found' }),
      });

      await expect(apiService.updateItem(itemId, updateData)).rejects.toThrow(ApiError);
    });
  });

  describe('deleteItem', () => {
    it('should delete item successfully', async () => {
      const itemId = '123';
      const mockResponse = {
        success: true,
        message: 'Item deleted successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.deleteItem(itemId);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3003/api/items/${itemId}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle delete errors', async () => {
      const itemId = '123';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      });

      await expect(apiService.deleteItem(itemId)).rejects.toThrow(ApiError);
    });
  });

  describe('getItem', () => {
    it('should fetch single item successfully', async () => {
      const itemId = '123';
      const mockResponse = {
        success: true,
        data: {
          _id: itemId,
          name: 'Test Item',
          selling_price: 1000,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.getItem(itemId);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3003/api/items/${itemId}`,
        expect.objectContaining({ method: 'GET' })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          { _id: 'cat1', category_name_my: 'အစားအစာ' },
          { _id: 'cat2', category_name_my: 'အဖျော်ယမကာ' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.getCategories();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3003/api/categories',
        expect.objectContaining({ method: 'GET' })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getInventoryReport', () => {
    it('should fetch inventory report successfully', async () => {
      const mockItemsResponse = {
        success: true,
        data: {
          items: [
            { _id: '1', stock_quantity: 50, low_stock_threshold: 10 },
            { _id: '2', stock_quantity: 5, low_stock_threshold: 10 },
            { _id: '3', stock_quantity: 0, low_stock_threshold: 5 },
          ],
        },
      };

      const mockOverviewResponse = {
        success: true,
        data: { topSellingItems: [] },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockItemsResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOverviewResponse),
        });

      const result = await apiService.getInventoryReport();

      expect(result.success).toBe(true);
      expect(result.data.totalItems).toBe(3);
      expect(result.data.lowStockItems).toBe(1);
      expect(result.data.outOfStockItems).toBe(1);
    });

    it('should fallback to mock data on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await apiService.getInventoryReport();

      expect(result.success).toBe(true);
      expect(result.data.totalItems).toBe(245);
      expect(result.data.lowStockItems).toBe(12);
      expect(result.data.outOfStockItems).toBe(3);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(apiService.getItems()).rejects.toThrow(ApiError);
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(apiService.getItems()).rejects.toThrow(ApiError);
    });

    it('should preserve error details', async () => {
      const errorDetails = {
        code: 'VALIDATION_ERROR',
        fields: ['name', 'price'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({
          message: 'Validation failed',
          details: errorDetails,
        }),
      });

      try {
        await apiService.createItem({});
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(422);
        expect(error.details).toEqual(errorDetails);
      }
    });
  });
});
