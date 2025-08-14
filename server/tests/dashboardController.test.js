/**
 * Comprehensive Dashboard Controller Test Suite
 * Myanmar Grocery Store Inventory Management System
 * 
 * Tests dashboard controller functions with mocked models and proper error handling
 * Uses Vitest framework with vi.mock for model mocking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock objects
const mockSale = {
  aggregate: vi.fn(),
  countDocuments: vi.fn(),
  find: vi.fn()
};

const mockItem = {
  aggregate: vi.fn(),
  countDocuments: vi.fn(),
  find: vi.fn()
};

// Mock require calls at module level
vi.mock('../models/Sale', () => mockSale);
vi.mock('../models/Item', () => mockItem);

// Now import controller after mocking
const dashboardController = await import('../controllers/dashboardController.js');
const { getOverview, getAlerts, getSalesTrends } = dashboardController;

describe('Dashboard Controller Tests', () => {
  let req, res;

  beforeEach(() => {
    // Setup request and response mocks
    req = {
      query: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Clear all mocks
    vi.clearAllMocks();
    mockSale.aggregate.mockClear();
    mockSale.countDocuments.mockClear();
    mockSale.find.mockClear();
    mockItem.aggregate.mockClear();
    mockItem.countDocuments.mockClear();
    mockItem.find.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverview - GET /api/dashboard/overview', () => {
    it('should return successful overview with all metrics', async () => {
      // Mock data for today's sales
      const mockTodaySales = [{ totalAmount: 15000, count: 3 }];
      const mockTotalStock = [{ totalStock: 450 }];
      const mockLowStockCount = 5;
      const mockRecentSalesCount = 12;

      // Setup mocks
      mockSale.aggregate
        .mockResolvedValueOnce(mockTodaySales)  // Today's sales
        .mockResolvedValueOnce([]);             // Recent sales count (will use countDocuments)
      
      mockItem.aggregate.mockResolvedValueOnce(mockTotalStock);
      mockItem.countDocuments
        .mockResolvedValueOnce(mockLowStockCount)  // Low stock count
      
      mockSale.countDocuments.mockResolvedValueOnce(mockRecentSalesCount);

      await getOverview(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Dashboard overview retrieved successfully',
        data: {
          totalSalesToday: 15000,
          todaySalesCount: 3,
          totalItemsInStock: 450,
          lowStockItemsCount: 5,
          recentSalesCount: 12
        }
      });
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty responses
      mockSale.aggregate.mockResolvedValue([]);
      mockItem.aggregate.mockResolvedValue([]);
      mockItem.countDocuments.mockResolvedValue(0);
      mockSale.countDocuments.mockResolvedValue(0);

      await getOverview(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Dashboard overview retrieved successfully',
        data: {
          totalSalesToday: 0,
          todaySalesCount: 0,
          totalItemsInStock: 0,
          lowStockItemsCount: 0,
          recentSalesCount: 0
        }
      });
    });

    it('should handle database errors properly', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock database error
      mockSale.aggregate.mockRejectedValue(new Error('Database connection failed'));

      await getOverview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Server error'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting dashboard overview:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should calculate date ranges correctly', async () => {
      // Mock successful responses
      mockSale.aggregate.mockResolvedValue([]);
      mockItem.aggregate.mockResolvedValue([]);
      mockItem.countDocuments.mockResolvedValue(0);
      mockSale.countDocuments.mockResolvedValue(0);

      await getOverview(req, res);

      // Verify Sale.aggregate was called with proper date filters
      expect(mockSale.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            saleDate: {
              $gte: expect.any(Date),
              $lt: expect.any(Date)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Verify recent sales query (7 days ago)
      expect(mockSale.countDocuments).toHaveBeenCalledWith({
        saleDate: { $gte: expect.any(Date) }
      });
    });
  });

  describe('getAlerts - GET /api/dashboard/alerts', () => {
    it('should return low stock alerts with proper formatting', async () => {
      const mockLowStockItems = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Rice Bags',
          stock_quantity: 2,
          low_stock_threshold: 10,
          item_code: 'RICE001',
          category_id: { name: 'Food' }
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Cooking Oil',
          stock_quantity: 0,
          low_stock_threshold: 5,
          item_code: 'OIL001',
          category_id: { name: 'Cooking' }
        }
      ];

      // Mock Item.find to return a query-like object
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockLowStockItems)
      };
      
      mockItem.find.mockReturnValue(mockQuery);

      await getAlerts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Dashboard alerts retrieved successfully',
        data: {
          alerts: [
            {
              type: 'low_stock',
              severity: 'warning',
              itemId: '507f1f77bcf86cd799439011',
              itemName: { en: 'Rice Bags', my: 'Rice Bags' },
              itemCode: 'RICE001',
              currentStock: 2,
              threshold: 10,
              category: 'Food',
              message: 'Rice Bags is running low (2 left, threshold: 10)'
            },
            {
              type: 'low_stock',
              severity: 'critical',
              itemId: '507f1f77bcf86cd799439012',
              itemName: { en: 'Cooking Oil', my: 'Cooking Oil' },
              itemCode: 'OIL001',
              currentStock: 0,
              threshold: 5,
              category: 'Cooking',
              message: 'Cooking Oil is out of stock'
            }
          ],
          summary: {
            total: 2,
            critical: 1,
            warning: 1
          }
        }
      });
    });

    it('should handle empty alerts list', async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      };
      
      mockItem.find.mockReturnValue(mockQuery);

      await getAlerts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Dashboard alerts retrieved successfully',
        data: {
          alerts: [],
          summary: {
            total: 0,
            critical: 0,
            warning: 0
          }
        }
      });
    });

    it('should handle items without category', async () => {
      const mockLowStockItems = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Unknown Item',
          stock_quantity: 3,
          low_stock_threshold: 10,
          item_code: 'UNK001',
          category_id: null
        }
      ];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockLowStockItems)
      };
      
      mockItem.find.mockReturnValue(mockQuery);

      await getAlerts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            alerts: expect.arrayContaining([
              expect.objectContaining({
                category: 'Unknown'
              })
            ])
          })
        })
      );
    });

    it('should handle database errors in alerts', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockItem.find.mockImplementation(() => {
        throw new Error('Database query failed');
      });

      await getAlerts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Server error'
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSalesTrends - GET /api/dashboard/sales-trends', () => {
    it('should return weekly trends successfully', async () => {
      req.query.period = 'week';

      const mockSalesData = [
        {
          _id: { year: 2025, month: 8, day: 14 },
          totalAmount: 15000,
          salesCount: 3,
          averageAmount: 5000
        },
        {
          _id: { year: 2025, month: 8, day: 13 },
          totalAmount: 12000,
          salesCount: 2,
          averageAmount: 6000
        }
      ];

      mockSale.aggregate.mockResolvedValue(mockSalesData);

      await getSalesTrends(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sales trends retrieved successfully',
        data: {
          period: 'week',
          trends: mockSalesData,
          summary: {
            totalSales: 27000,
            totalTransactions: 5,
            averageDailySales: 13500,
            dataPoints: 2
          }
        }
      });
    });

    it('should return monthly trends successfully', async () => {
      req.query.period = 'month';

      const mockSalesData = [
        {
          _id: { year: 2025, month: 8, day: 14 },
          totalAmount: 45000,
          salesCount: 8,
          averageAmount: 5625
        }
      ];

      mockSale.aggregate.mockResolvedValue(mockSalesData);

      await getSalesTrends(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            period: 'month',
            trends: mockSalesData
          })
        })
      );
    });

    it('should return yearly trends successfully', async () => {
      req.query.period = 'year';

      const mockSalesData = [
        {
          _id: { year: 2025, month: 8 },
          totalAmount: 150000,
          salesCount: 45,
          averageAmount: 3333.33
        }
      ];

      mockSale.aggregate.mockResolvedValue(mockSalesData);

      await getSalesTrends(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            period: 'year',
            trends: mockSalesData
          })
        })
      );
    });

    it('should handle invalid period parameter', async () => {
      req.query.period = 'invalid';

      await getSalesTrends(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid period parameter',
        error: 'Period must be one of: week, month, year'
      });
    });

    it('should use default period when not specified', async () => {
      // req.query.period is undefined, should default to 'week'
      
      const mockSalesData = [];
      mockSale.aggregate.mockResolvedValue(mockSalesData);

      await getSalesTrends(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            period: 'week'
          })
        })
      );
    });

    it('should handle empty sales data', async () => {
      req.query.period = 'week';
      
      mockSale.aggregate.mockResolvedValue([]);

      await getSalesTrends(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sales trends retrieved successfully',
        data: {
          period: 'week',
          trends: [],
          summary: {
            totalSales: 0,
            totalTransactions: 0,
            averageDailySales: 0,
            dataPoints: 0
          }
        }
      });
    });

    it('should handle aggregation pipeline correctly for different periods', async () => {
      req.query.period = 'week';
      
      mockSale.aggregate.mockResolvedValue([]);

      await getSalesTrends(req, res);

      // Verify the aggregation pipeline structure
      expect(mockSale.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            saleDate: { $gte: expect.any(Date) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$saleDate' },
              month: { $month: '$saleDate' },
              day: { $dayOfMonth: '$saleDate' }
            },
            totalAmount: { $sum: '$totalAmount' },
            salesCount: { $sum: 1 },
            averageAmount: { $avg: '$totalAmount' }
          }
        },
        {
          $addFields: {
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date'
              }
            },
            totalAmount: { $round: ['$totalAmount', 2] },
            salesCount: 1,
            averageAmount: { $round: ['$averageAmount', 2] }
          }
        },
        {
          $sort: { date: 1 }
        }
      ]);
    });

    it('should handle database errors in sales trends', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      req.query.period = 'week';
      mockSale.aggregate.mockRejectedValue(new Error('Aggregation failed'));

      await getSalesTrends(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Server error'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting sales trends:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should calculate summary statistics correctly', async () => {
      req.query.period = 'week';

      const mockSalesData = [
        { totalAmount: 10000, salesCount: 2 },
        { totalAmount: 15000, salesCount: 3 },
        { totalAmount: 8000, salesCount: 1 }
      ];

      mockSale.aggregate.mockResolvedValue(mockSalesData);

      await getSalesTrends(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            summary: {
              totalSales: 33000,          // 10000 + 15000 + 8000
              totalTransactions: 6,        // 2 + 3 + 1
              averageDailySales: 11000,    // 33000 / 3
              dataPoints: 3
            }
          })
        })
      );
    });

    it('should handle year period aggregation differently', async () => {
      req.query.period = 'year';
      
      mockSale.aggregate.mockResolvedValue([]);

      await getSalesTrends(req, res);

      // Verify year period uses different grouping (no day field)
      expect(mockSale.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $group: expect.objectContaining({
              _id: {
                year: { $year: '$saleDate' },
                month: { $month: '$saleDate' }
              }
            })
          }),
          expect.objectContaining({
            $addFields: {
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1
                }
              }
            }
          }),
          expect.objectContaining({
            $project: expect.objectContaining({
              date: {
                $dateToString: {
                  format: '%Y-%m',
                  date: '$date'
                }
              }
            })
          })
        ])
      );
    });
  });

  describe('Integration Tests', () => {
    it('should handle concurrent requests properly', async () => {
      // Mock successful responses for all models
      mockSale.aggregate.mockResolvedValue([{ totalAmount: 5000, count: 1 }]);
      mockItem.aggregate.mockResolvedValue([{ totalStock: 100 }]);
      mockItem.countDocuments.mockResolvedValue(2);
      mockSale.countDocuments.mockResolvedValue(10);

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      };
      mockItem.find.mockReturnValue(mockQuery);

      // Test multiple concurrent calls
      const promises = [
        getOverview(req, res),
        getAlerts(req, res),
        getSalesTrends({ ...req, query: { period: 'week' } }, res)
      ];

      await Promise.all(promises);

      // All should succeed
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should maintain proper response format consistency', async () => {
      // Test that all endpoints return consistent success response format
      const responses = [];
      
      // Mock getOverview
      mockSale.aggregate.mockResolvedValue([]);
      mockItem.aggregate.mockResolvedValue([]);
      mockItem.countDocuments.mockResolvedValue(0);
      mockSale.countDocuments.mockResolvedValue(0);

      res.json = vi.fn((data) => { responses.push(data); });

      await getOverview(req, res);

      // All responses should have success and data properties
      responses.forEach(response => {
        expect(response).toHaveProperty('success');
        expect(response).toHaveProperty('data');
        if (response.success) {
          expect(response).toHaveProperty('message');
        } else {
          expect(response).toHaveProperty('error');
        }
      });
    });
  });
});
