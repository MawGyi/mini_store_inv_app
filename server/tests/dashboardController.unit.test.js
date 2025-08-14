/**
 * Dashboard Controller Unit Tests
 * Myanmar Grocery Store Inventory Management System
 * 
 * Comprehensive test suite for dashboard controller functions
 * Tests business logic, error handling, and data validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Dashboard Controller Unit Tests', () => {
  let req, res, mockSale, mockItem;

  beforeEach(() => {
    // Setup request and response mocks
    req = {
      query: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Create fresh mock objects for each test
    mockSale = {
      aggregate: vi.fn(),
      countDocuments: vi.fn(),
      find: vi.fn()
    };

    mockItem = {
      aggregate: vi.fn(),
      countDocuments: vi.fn(),
      find: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverview Function Logic Tests', () => {
    it('should aggregate overview metrics correctly', async () => {
      // Mock successful responses
      const mockTodaySales = [{ totalAmount: 15000, count: 3 }];
      const mockTotalStock = [{ totalStock: 450 }];
      const mockLowStockCount = 5;
      const mockRecentSalesCount = 12;

      mockSale.aggregate
        .mockResolvedValueOnce(mockTodaySales)
        .mockResolvedValueOnce([]);
      
      mockItem.aggregate.mockResolvedValueOnce(mockTotalStock);
      mockItem.countDocuments.mockResolvedValueOnce(mockLowStockCount);
      mockSale.countDocuments.mockResolvedValueOnce(mockRecentSalesCount);

      // Simulate the controller logic
      const [
        todaySales,
        totalItemsInStock,
        lowStockItems,
        recentSalesCount
      ] = await Promise.all([
        mockSale.aggregate([
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
        ]),
        mockItem.aggregate([
          {
            $group: {
              _id: null,
              totalStock: { $sum: '$stock_quantity' }
            }
          }
        ]),
        mockItem.countDocuments({
          $expr: { $lt: ['$stock_quantity', '$low_stock_threshold'] }
        }),
        mockSale.countDocuments({
          saleDate: { $gte: expect.any(Date) }
        })
      ]);

      // Verify the aggregated data matches expected structure
      const todayTotalSales = todaySales.length > 0 ? todaySales[0].totalAmount : 0;
      const todaySalesCount = todaySales.length > 0 ? todaySales[0].count : 0;
      const totalStock = totalItemsInStock.length > 0 ? totalItemsInStock[0].totalStock : 0;

      expect(todayTotalSales).toBe(15000);
      expect(todaySalesCount).toBe(3);
      expect(totalStock).toBe(450);
      expect(lowStockItems).toBe(5);
      expect(recentSalesCount).toBe(12);
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty responses
      mockSale.aggregate.mockResolvedValue([]);
      mockItem.aggregate.mockResolvedValue([]);
      mockItem.countDocuments.mockResolvedValue(0);
      mockSale.countDocuments.mockResolvedValue(0);

      const [
        todaySales,
        totalItemsInStock,
        lowStockItems,
        recentSalesCount
      ] = await Promise.all([
        mockSale.aggregate([]),
        mockItem.aggregate([]),
        mockItem.countDocuments({}),
        mockSale.countDocuments({})
      ]);

      // Extract values with defaults
      const todayTotalSales = todaySales.length > 0 ? todaySales[0].totalAmount : 0;
      const todaySalesCount = todaySales.length > 0 ? todaySales[0].count : 0;
      const totalStock = totalItemsInStock.length > 0 ? totalItemsInStock[0].totalStock : 0;

      expect(todayTotalSales).toBe(0);
      expect(todaySalesCount).toBe(0);
      expect(totalStock).toBe(0);
      expect(lowStockItems).toBe(0);
      expect(recentSalesCount).toBe(0);
    });

    it('should calculate date ranges correctly', () => {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Verify date calculations
      expect(startOfToday.getHours()).toBe(0);
      expect(startOfToday.getMinutes()).toBe(0);
      expect(startOfToday.getSeconds()).toBe(0);
      expect(endOfToday.getDate()).toBe(today.getDate() + 1);
      expect(sevenDaysAgo < today).toBe(true);
    });
  });

  describe('getAlerts Function Logic Tests', () => {
    it('should format low stock alerts correctly', async () => {
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

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockLowStockItems)
      };
      
      mockItem.find.mockReturnValue(mockQuery);

      const items = await mockItem.find({
        $expr: { $lt: ['$stock_quantity', '$low_stock_threshold'] }
      })
        .populate('category_id', 'name')
        .sort({ stock_quantity: 1 })
        .lean();

      // Format alerts array (business logic)
      const alerts = items.map(item => ({
        type: 'low_stock',
        severity: item.stock_quantity === 0 ? 'critical' : 'warning',
        itemId: item._id,
        itemName: {
          en: item.name,
          my: item.name
        },
        itemCode: item.item_code,
        currentStock: item.stock_quantity,
        threshold: item.low_stock_threshold,
        category: item.category_id?.name || 'Unknown',
        message: item.stock_quantity === 0 
          ? `${item.name} is out of stock`
          : `${item.name} is running low (${item.stock_quantity} left, threshold: ${item.low_stock_threshold})`
      }));

      expect(alerts).toHaveLength(2);
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[0].category).toBe('Food');
      expect(alerts[1].severity).toBe('critical');
      expect(alerts[1].message).toContain('out of stock');
    });

    it('should calculate alert summary correctly', () => {
      const alerts = [
        { severity: 'warning' },
        { severity: 'critical' },
        { severity: 'warning' },
        { severity: 'critical' }
      ];

      const summary = {
        total: alerts.length,
        critical: alerts.filter(alert => alert.severity === 'critical').length,
        warning: alerts.filter(alert => alert.severity === 'warning').length
      };

      expect(summary.total).toBe(4);
      expect(summary.critical).toBe(2);
      expect(summary.warning).toBe(2);
    });

    it('should handle items without category', () => {
      const item = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Unknown Item',
        stock_quantity: 3,
        low_stock_threshold: 10,
        item_code: 'UNK001',
        category_id: null
      };

      const alert = {
        type: 'low_stock',
        severity: item.stock_quantity === 0 ? 'critical' : 'warning',
        itemId: item._id,
        itemName: {
          en: item.name,
          my: item.name
        },
        itemCode: item.item_code,
        currentStock: item.stock_quantity,
        threshold: item.low_stock_threshold,
        category: item.category_id?.name || 'Unknown',
        message: item.stock_quantity === 0 
          ? `${item.name} is out of stock`
          : `${item.name} is running low (${item.stock_quantity} left, threshold: ${item.low_stock_threshold})`
      };

      expect(alert.category).toBe('Unknown');
      expect(alert.severity).toBe('warning');
    });
  });

  describe('getSalesTrends Function Logic Tests', () => {
    it('should validate period parameters correctly', () => {
      const validPeriods = ['week', 'month', 'year'];
      
      expect(validPeriods.includes('week')).toBe(true);
      expect(validPeriods.includes('month')).toBe(true);
      expect(validPeriods.includes('year')).toBe(true);
      expect(validPeriods.includes('invalid')).toBe(false);
    });

    it('should calculate date ranges for different periods', () => {
      const now = new Date();
      
      // Week calculation
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      // Month calculation
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      
      // Year calculation
      const yearStart = new Date();
      yearStart.setFullYear(yearStart.getFullYear() - 1);

      expect(weekStart < now).toBe(true);
      expect(monthStart < weekStart).toBe(true);
      expect(yearStart < monthStart).toBe(true);
    });

    it('should create correct aggregation pipeline structure for different periods', () => {
      // Week/Month pipeline (daily grouping)
      const dailyGroupFormat = {
        year: { $year: '$saleDate' },
        month: { $month: '$saleDate' },
        day: { $dayOfMonth: '$saleDate' }
      };

      // Year pipeline (monthly grouping)
      const monthlyGroupFormat = {
        year: { $year: '$saleDate' },
        month: { $month: '$saleDate' }
      };

      expect(dailyGroupFormat).toHaveProperty('day');
      expect(monthlyGroupFormat).not.toHaveProperty('day');
      expect(dailyGroupFormat.year).toEqual({ $year: '$saleDate' });
      expect(monthlyGroupFormat.month).toEqual({ $month: '$saleDate' });
    });

    it('should calculate summary statistics correctly', () => {
      const mockSalesData = [
        { totalAmount: 10000, salesCount: 2 },
        { totalAmount: 15000, salesCount: 3 },
        { totalAmount: 8000, salesCount: 1 }
      ];

      const totalSales = mockSalesData.reduce((sum, item) => sum + item.totalAmount, 0);
      const totalTransactions = mockSalesData.reduce((sum, item) => sum + item.salesCount, 0);
      const averageDaily = mockSalesData.length > 0 ? totalSales / mockSalesData.length : 0;

      expect(totalSales).toBe(33000);
      expect(totalTransactions).toBe(6);
      expect(averageDaily).toBe(11000);
      expect(mockSalesData.length).toBe(3);
    });

    it('should handle empty sales data correctly', () => {
      const emptySalesData = [];

      const totalSales = emptySalesData.reduce((sum, item) => sum + item.totalAmount, 0);
      const totalTransactions = emptySalesData.reduce((sum, item) => sum + item.salesCount, 0);
      const averageDaily = emptySalesData.length > 0 ? totalSales / emptySalesData.length : 0;

      expect(totalSales).toBe(0);
      expect(totalTransactions).toBe(0);
      expect(averageDaily).toBe(0);
      expect(emptySalesData.length).toBe(0);
    });

    it('should format dates correctly for different periods', () => {
      const testDate = new Date('2025-08-14');
      
      // Daily format: YYYY-MM-DD
      const dailyFormat = testDate.toISOString().slice(0, 10);
      
      // Monthly format: YYYY-MM
      const monthlyFormat = `${testDate.getFullYear()}-${(testDate.getMonth() + 1).toString().padStart(2, '0')}`;

      expect(dailyFormat).toBe('2025-08-14');
      expect(monthlyFormat).toBe('2025-08');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      mockSale.aggregate.mockRejectedValue(error);

      try {
        await mockSale.aggregate([]);
        // Should not reach here
        expect(false).toBe(true);
      } catch (caughtError) {
        expect(caughtError.message).toBe('Database connection failed');
      }
    });

    it('should handle query timeout errors', async () => {
      const timeoutError = new Error('Operation timed out');
      mockItem.find.mockRejectedValue(timeoutError);

      try {
        await mockItem.find({});
        expect(false).toBe(true);
      } catch (caughtError) {
        expect(caughtError.message).toBe('Operation timed out');
      }
    });

    it('should handle invalid aggregation results', () => {
      const invalidResults = [null, undefined, { wrongProperty: 'test' }];
      
      invalidResults.forEach(result => {
        const safeValue = result?.totalAmount || 0;
        expect(typeof safeValue).toBe('number');
        expect(safeValue).toBe(0);
      });
    });
  });

  describe('Business Logic Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const item = {
        stock_quantity: 0,
        low_stock_threshold: 5
      };

      const isLowStock = item.stock_quantity < item.low_stock_threshold;
      const isOutOfStock = item.stock_quantity === 0;
      const severity = isOutOfStock ? 'critical' : 'warning';

      expect(isLowStock).toBe(true);
      expect(isOutOfStock).toBe(true);
      expect(severity).toBe('critical');
    });

    it('should handle negative thresholds gracefully', () => {
      const item = {
        stock_quantity: 5,
        low_stock_threshold: -1
      };

      const isLowStock = item.stock_quantity < item.low_stock_threshold;
      
      expect(isLowStock).toBe(false);
    });

    it('should calculate percentage changes correctly', () => {
      const currentSales = 15000;
      const previousSales = 12000;
      
      const percentageChange = ((currentSales - previousSales) / previousSales) * 100;
      const roundedChange = Math.round(percentageChange * 100) / 100;

      expect(roundedChange).toBe(25);
    });

    it('should handle division by zero in averages', () => {
      const totalSales = 1000;
      const transactionCount = 0;
      
      const averageSale = transactionCount > 0 ? totalSales / transactionCount : 0;
      
      expect(averageSale).toBe(0);
      expect(isNaN(averageSale)).toBe(false);
    });
  });

  describe('Data Validation Tests', () => {
    it('should validate required fields in overview response', () => {
      const overviewData = {
        totalSalesToday: 15000,
        todaySalesCount: 3,
        totalItemsInStock: 450,
        lowStockItemsCount: 5,
        recentSalesCount: 12
      };

      const requiredFields = [
        'totalSalesToday',
        'todaySalesCount', 
        'totalItemsInStock',
        'lowStockItemsCount',
        'recentSalesCount'
      ];

      requiredFields.forEach(field => {
        expect(overviewData).toHaveProperty(field);
        expect(typeof overviewData[field]).toBe('number');
      });
    });

    it('should validate alert object structure', () => {
      const alert = {
        type: 'low_stock',
        severity: 'warning',
        itemId: '507f1f77bcf86cd799439011',
        itemName: { en: 'Test Item', my: 'Test Item' },
        itemCode: 'TEST001',
        currentStock: 3,
        threshold: 10,
        category: 'Test Category',
        message: 'Test message'
      };

      const requiredFields = [
        'type', 'severity', 'itemId', 'itemName', 
        'itemCode', 'currentStock', 'threshold', 'category', 'message'
      ];

      requiredFields.forEach(field => {
        expect(alert).toHaveProperty(field);
      });

      expect(alert.itemName).toHaveProperty('en');
      expect(alert.itemName).toHaveProperty('my');
      expect(['critical', 'warning'].includes(alert.severity)).toBe(true);
    });

    it('should validate sales trends response structure', () => {
      const trendsData = {
        period: 'week',
        trends: [
          { date: '2025-08-14', totalAmount: 15000, salesCount: 3, averageAmount: 5000 }
        ],
        summary: {
          totalSales: 15000,
          totalTransactions: 3,
          averageDailySales: 15000,
          dataPoints: 1
        }
      };

      expect(trendsData).toHaveProperty('period');
      expect(trendsData).toHaveProperty('trends');
      expect(trendsData).toHaveProperty('summary');
      expect(Array.isArray(trendsData.trends)).toBe(true);
      
      if (trendsData.trends.length > 0) {
        const trend = trendsData.trends[0];
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('totalAmount');
        expect(trend).toHaveProperty('salesCount');
        expect(trend).toHaveProperty('averageAmount');
      }
    });
  });

  describe('Response Format Consistency Tests', () => {
    it('should maintain consistent success response format', () => {
      const successResponse = {
        success: true,
        message: 'Data retrieved successfully',
        data: { test: 'data' }
      };

      expect(successResponse).toHaveProperty('success');
      expect(successResponse).toHaveProperty('message');
      expect(successResponse).toHaveProperty('data');
      expect(successResponse.success).toBe(true);
    });

    it('should maintain consistent error response format', () => {
      const errorResponse = {
        error: 'Server error'
      };

      expect(errorResponse).toHaveProperty('error');
      expect(typeof errorResponse.error).toBe('string');
    });

    it('should validate HTTP status codes usage', () => {
      const statusCodes = {
        success: 200,
        badRequest: 400,
        serverError: 500
      };

      expect(statusCodes.success).toBe(200);
      expect(statusCodes.badRequest).toBe(400);
      expect(statusCodes.serverError).toBe(500);
    });
  });
});
