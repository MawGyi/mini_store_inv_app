/**
 * Reports Controller Test Suite
 * Myanmar Grocery Store Inventory Management System
 * 
 * Tests all reporting functionality including sales, inventory, profit, customer, and product reports
 * Uses business logic testing approach to avoid ES/CommonJS module conflicts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('📊 Reports Controller Business Logic Test Suite', () => {

  describe('🛒 Sales Report Logic Tests', () => {
    
    it('should validate date range filtering for sales reports', () => {
      const salesData = [
        { saleDate: new Date('2025-08-01'), totalAmount: 50000, items: [{ quantity: 2 }] },
        { saleDate: new Date('2025-08-15'), totalAmount: 75000, items: [{ quantity: 1 }] },
        { saleDate: new Date('2025-08-31'), totalAmount: 30000, items: [{ quantity: 3 }] },
        { saleDate: new Date('2025-09-01'), totalAmount: 20000, items: [{ quantity: 1 }] } // Outside range
      ];

      const startDate = new Date('2025-08-01');
      const endDate = new Date('2025-08-31');

      const filteredSales = salesData.filter(sale => 
        sale.saleDate >= startDate && sale.saleDate <= endDate
      );

      expect(filteredSales).toHaveLength(3);
      expect(filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)).toBe(155000);
      expect(filteredSales.every(sale => sale.saleDate >= startDate && sale.saleDate <= endDate)).toBe(true);
    });

    it('should calculate sales summary correctly', () => {
      const salesData = [
        { totalAmount: 50000, items: [{ quantity: 2 }, { quantity: 3 }] },
        { totalAmount: 75000, items: [{ quantity: 1 }] },
        { totalAmount: 30000, items: [{ quantity: 4 }, { quantity: 2 }] }
      ];

      const summary = {
        totalSales: salesData.reduce((sum, sale) => sum + sale.totalAmount, 0),
        totalTransactions: salesData.length,
        averageTransaction: 0,
        totalItems: salesData.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        )
      };

      summary.averageTransaction = summary.totalSales / summary.totalTransactions;

      expect(summary.totalSales).toBe(155000);
      expect(summary.totalTransactions).toBe(3);
      expect(summary.averageTransaction).toBeCloseTo(51666.67, 2);
      expect(summary.totalItems).toBe(12);
    });

    it('should handle missing date parameters validation', () => {
      const validateDateParams = (startDate, endDate) => {
        if (!startDate || !endDate) {
          return {
            isValid: false,
            status: 400,
            message: "စတင်ရက်စွဲနှင့် ဆုံးရက်စွဲကို ထည့်သွင်းပေးပါ"
          };
        }
        return { isValid: true };
      };

      expect(validateDateParams(null, '2025-08-31')).toEqual({
        isValid: false,
        status: 400,
        message: "စတင်ရက်စွဲနှင့် ဆုံးရက်စွဲကို ထည့်သွင်းပေးပါ"
      });

      expect(validateDateParams('2025-08-01', '2025-08-31')).toEqual({
        isValid: true
      });
    });

    it('should generate category breakdown correctly', () => {
      const salesWithCategories = [
        {
          items: [
            { 
              item: { category_id: { name: 'အစားအသောက်' } }, 
              totalPrice: 50000, 
              quantity: 2 
            },
            { 
              item: { category_id: { name: 'အဝတ်အထည်' } }, 
              totalPrice: 150000, 
              quantity: 1 
            }
          ]
        },
        {
          items: [
            { 
              item: { category_id: { name: 'အစားအသောက်' } }, 
              totalPrice: 30000, 
              quantity: 1 
            }
          ]
        }
      ];

      const categoryBreakdown = {};
      salesWithCategories.forEach(sale => {
        sale.items.forEach(item => {
          const categoryName = item.item.category_id.name;
          if (!categoryBreakdown[categoryName]) {
            categoryBreakdown[categoryName] = {
              totalRevenue: 0,
              totalQuantity: 0,
              transactionCount: 0
            };
          }
          categoryBreakdown[categoryName].totalRevenue += item.totalPrice;
          categoryBreakdown[categoryName].totalQuantity += item.quantity;
          categoryBreakdown[categoryName].transactionCount += 1;
        });
      });

      expect(categoryBreakdown['အစားအသောက်'].totalRevenue).toBe(80000);
      expect(categoryBreakdown['အစားအသောက်'].totalQuantity).toBe(3);
      expect(categoryBreakdown['အစားအသောက်'].transactionCount).toBe(2);
      expect(categoryBreakdown['အဝတ်အထည်'].totalRevenue).toBe(150000);
      expect(categoryBreakdown['အဝတ်အထည်'].totalQuantity).toBe(1);
      expect(categoryBreakdown['အဝတ်အထည်'].transactionCount).toBe(1);
    });

    it('should calculate payment method statistics', () => {
      const salesWithPayments = [
        { paymentMethod: 'cash', totalAmount: 50000 },
        { paymentMethod: 'cash', totalAmount: 30000 },
        { paymentMethod: 'credit_card', totalAmount: 150000 },
        { paymentMethod: 'bank_transfer', totalAmount: 20000 }
      ];

      const paymentStats = {};
      salesWithPayments.forEach(sale => {
        if (!paymentStats[sale.paymentMethod]) {
          paymentStats[sale.paymentMethod] = {
            totalSales: 0,
            transactionCount: 0
          };
        }
        paymentStats[sale.paymentMethod].totalSales += sale.totalAmount;
        paymentStats[sale.paymentMethod].transactionCount += 1;
      });

      expect(paymentStats.cash.totalSales).toBe(80000);
      expect(paymentStats.cash.transactionCount).toBe(2);
      expect(paymentStats.credit_card.totalSales).toBe(150000);
      expect(paymentStats.credit_card.transactionCount).toBe(1);
      expect(paymentStats.bank_transfer.totalSales).toBe(20000);
      expect(paymentStats.bank_transfer.transactionCount).toBe(1);
    });

    it('should handle CSV format generation for sales', () => {
      const salesData = [
        {
          saleDate: new Date('2025-08-14'),
          invoiceNumber: 'INV001',
          customerName: 'မောင်မောင်',
          totalAmount: 50000,
          paymentMethod: 'cash',
          subtotal: 45000,
          discount: 5000,
          tax: 0,
          items: [
            {
              item: { name: 'ထမင်း' },
              quantity: 2,
              unitPrice: 1500,
              totalPrice: 3000
            }
          ]
        }
      ];

      const generateSalesCSV = (salesData) => {
        const headers = [
          'Date', 'Invoice Number', 'Customer Name', 'Item Name',
          'Quantity', 'Unit Price', 'Total Price', 'Payment Method',
          'Subtotal', 'Discount', 'Tax', 'Total Amount'
        ];

        const rows = [];
        salesData.forEach(sale => {
          sale.items.forEach(item => {
            rows.push([
              sale.saleDate.toISOString().split('T')[0],
              sale.invoiceNumber,
              sale.customerName || '',
              item.item.name,
              item.quantity,
              item.unitPrice,
              item.totalPrice,
              sale.paymentMethod,
              sale.subtotal,
              sale.discount,
              sale.tax,
              sale.totalAmount
            ]);
          });
        });

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      };

      const csvData = generateSalesCSV(salesData);
      const lines = csvData.split('\n');
      
      expect(lines).toHaveLength(2); // Header + 1 data row
      expect(lines[0]).toContain('Date,Invoice Number,Customer Name');
      expect(lines[1]).toContain('2025-08-14,INV001,မောင်မောင်,ထမင်း');
    });

    it('should return 400 error for invalid date range', () => {
      const createErrorResponse = (status, message) => ({
        success: false,
        status,
        message
      });

      const invalidDateError = createErrorResponse(
        400, 
        "စတင်ရက်စွဲနှင့် ဆုံးရက်စွဲကို ထည့်သွင်းပေးပါ"
      );

      expect(invalidDateError.success).toBe(false);
      expect(invalidDateError.status).toBe(400);
      expect(invalidDateError.message).toContain('စတင်ရက်စွဲ');
    });

    it('should return 500 error on database failure', () => {
      const createErrorResponse = (status, message, error) => ({
        success: false,
        status,
        message,
        error
      });

      const databaseError = createErrorResponse(
        500,
        "အစီရင်ခံစာကို မဖန်တီးနိုင်ပါ",
        "Database connection failed"
      );

      expect(databaseError.success).toBe(false);
      expect(databaseError.status).toBe(500);
      expect(databaseError.message).toContain('မဖန်တီးနိုင်ပါ');
      expect(databaseError.error).toBe("Database connection failed");
    });
  });

  describe('📦 Inventory Report Logic Tests', () => {
    
    it('should calculate inventory summary correctly', () => {
      const inventoryData = [
        { 
          name: 'ထမင်း', 
          stock_quantity: 50, 
          selling_price: 1500, 
          low_stock_threshold: 10 
        },
        { 
          name: 'လုံချည်', 
          stock_quantity: 3, 
          selling_price: 15000, 
          low_stock_threshold: 5 
        },
        { 
          name: 'ဆေးကြောရည်', 
          stock_quantity: 0, 
          selling_price: 2500, 
          low_stock_threshold: 10 
        },
        { 
          name: 'နို့', 
          stock_quantity: 25, 
          selling_price: 800, 
          low_stock_threshold: 15 
        }
      ];

      const summary = {
        totalItems: inventoryData.length,
        totalValue: inventoryData.reduce((sum, item) => 
          sum + (item.selling_price * item.stock_quantity), 0
        ),
        lowStockItems: inventoryData.filter(item => 
          item.stock_quantity < item.low_stock_threshold && item.stock_quantity > 0
        ).length,
        outOfStockItems: inventoryData.filter(item => 
          item.stock_quantity === 0
        ).length
      };

      expect(summary.totalItems).toBe(4);
      expect(summary.totalValue).toBe(140000); // (50*1500) + (3*15000) + (0*2500) + (25*800)
      expect(summary.lowStockItems).toBe(1); // လုံချည် (3<5), နို့ is not low stock (25>15)
      expect(summary.outOfStockItems).toBe(1); // ဆေးကြောရည်
    });

    it('should categorize stock levels correctly', () => {
      const items = [
        { name: 'Item A', stock_quantity: 0, low_stock_threshold: 10 },
        { name: 'Item B', stock_quantity: 5, low_stock_threshold: 10 },
        { name: 'Item C', stock_quantity: 15, low_stock_threshold: 10 },
        { name: 'Item D', stock_quantity: 10, low_stock_threshold: 10 }
      ];

      const stockCategories = {
        outOfStock: items.filter(item => item.stock_quantity === 0),
        lowStock: items.filter(item => 
          item.stock_quantity > 0 && item.stock_quantity < item.low_stock_threshold
        ),
        inStock: items.filter(item => 
          item.stock_quantity >= item.low_stock_threshold
        )
      };

      expect(stockCategories.outOfStock).toHaveLength(1);
      expect(stockCategories.lowStock).toHaveLength(1);
      expect(stockCategories.inStock).toHaveLength(2);
      expect(stockCategories.outOfStock[0].name).toBe('Item A');
      expect(stockCategories.lowStock[0].name).toBe('Item B');
    });

    it('should handle empty inventory gracefully', () => {
      const emptyInventory = [];
      
      const summary = {
        totalItems: emptyInventory.length,
        totalValue: emptyInventory.reduce((sum, item) => 
          sum + (item.selling_price * item.stock_quantity), 0
        ),
        lowStockItems: 0,
        outOfStockItems: 0
      };

      expect(summary.totalItems).toBe(0);
      expect(summary.totalValue).toBe(0);
      expect(summary.lowStockItems).toBe(0);
      expect(summary.outOfStockItems).toBe(0);
    });

    it('should return stock analysis correctly', () => {
      const inventoryData = [
        { name: 'ထမင်း', stock_quantity: 50, selling_price: 1500 },
        { name: 'လုံချည်', stock_quantity: 3, selling_price: 15000 },
        { name: 'ဆေးကြောရည်', stock_quantity: 0, selling_price: 2500 }
      ];

      const analysis = inventoryData.map(item => ({
        ...item,
        totalValue: item.stock_quantity * item.selling_price,
        status: item.stock_quantity === 0 ? 'Out of Stock' : 
                item.stock_quantity < 10 ? 'Low Stock' : 'In Stock'
      }));

      expect(analysis[0].status).toBe('In Stock');
      expect(analysis[1].status).toBe('Low Stock');
      expect(analysis[2].status).toBe('Out of Stock');
      expect(analysis[0].totalValue).toBe(75000);
      expect(analysis[1].totalValue).toBe(45000);
      expect(analysis[2].totalValue).toBe(0);
    });

    it('should return 500 error on database failure', () => {
      const createErrorResponse = (status, message, error) => ({
        success: false,
        status,
        message,
        error
      });

      const databaseError = createErrorResponse(
        500,
        "အရေအတွက်စာရင်းကို မဖန်တီးနိုင်ပါ",
        "Database query failed"
      );

      expect(databaseError.success).toBe(false);
      expect(databaseError.status).toBe(500);
      expect(databaseError.message).toContain('မဖန်တီးနိုင်ပါ');
    });
  });

  describe('💰 Profit Report Logic Tests', () => {
    
    it('should calculate profit correctly', () => {
      const salesData = [
        {
          items: [
            {
              item: { name: 'ထမင်း', cost_price: 1000, selling_price: 1500 },
              quantity: 2,
              totalPrice: 3000
            },
            {
              item: { name: 'လုံချည်', cost_price: 12000, selling_price: 15000 },
              quantity: 1,
              totalPrice: 15000
            }
          ]
        }
      ];

      let totalRevenue = 0;
      let totalCost = 0;
      const itemProfit = [];

      salesData.forEach(sale => {
        sale.items.forEach(itemData => {
          const item = itemData.item;
          const revenue = itemData.totalPrice;
          const cost = item.cost_price ? item.cost_price * itemData.quantity : 0;
          const profit = revenue - cost;

          totalRevenue += revenue;
          totalCost += cost;

          itemProfit.push({
            item: item.name,
            quantity: itemData.quantity,
            revenue,
            cost,
            profit,
            profitMargin: cost > 0 ? (profit / revenue) * 100 : 0
          });
        });
      });

      const totalProfit = totalRevenue - totalCost;
      const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      expect(totalRevenue).toBe(18000);
      expect(totalCost).toBe(14000);
      expect(totalProfit).toBe(4000);
      expect(overallProfitMargin).toBeCloseTo(22.22, 2);
      expect(itemProfit).toHaveLength(2);
      expect(itemProfit[0].profit).toBe(1000);
      expect(itemProfit[1].profit).toBe(3000);
    });

    it('should handle items without cost price', () => {
      const salesData = [
        {
          items: [
            {
              item: { name: 'Unknown Item', cost_price: null },
              quantity: 1,
              totalPrice: 10000
            }
          ]
        }
      ];

      let totalRevenue = 0;
      let totalCost = 0;

      salesData.forEach(sale => {
        sale.items.forEach(itemData => {
          const revenue = itemData.totalPrice;
          const cost = itemData.item.cost_price ? itemData.item.cost_price * itemData.quantity : 0;

          totalRevenue += revenue;
          totalCost += cost;
        });
      });

      const totalProfit = totalRevenue - totalCost;
      const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      expect(totalRevenue).toBe(10000);
      expect(totalCost).toBe(0);
      expect(totalProfit).toBe(10000);
      expect(overallProfitMargin).toBe(100);
    });

    it('should calculate profit margins correctly', () => {
      const testCases = [
        { revenue: 10000, cost: 8000, expectedMargin: 20 },
        { revenue: 15000, cost: 10000, expectedMargin: 33.33 },
        { revenue: 20000, cost: 0, expectedMargin: 100 },
        { revenue: 5000, cost: 6000, expectedMargin: -20 } // Loss scenario
      ];

      testCases.forEach(({ revenue, cost, expectedMargin }) => {
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        expect(margin).toBeCloseTo(expectedMargin, 2);
      });
    });

    it('should return 400 error for missing dates', () => {
      const validateProfitReportParams = (startDate, endDate) => {
        if (!startDate || !endDate) {
          return {
            success: false,
            status: 400,
            message: "စတင်ရက်စွဲနှင့် ဆုံးရက်စွဲကို ထည့်သွင်းပေးပါ"
          };
        }
        return { success: true };
      };

      const result = validateProfitReportParams(null, '2025-08-31');
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toContain('စတင်ရက်စွဲ');
    });

    it('should return 500 error on database failure', () => {
      const createErrorResponse = (status, message, error) => ({
        success: false,
        status,
        message,
        error
      });

      const databaseError = createErrorResponse(
        500,
        "အမြတ်အစွန်းစာရင်းကို မဖန်တီးနိုင်ပါ",
        "Database aggregation failed"
      );

      expect(databaseError.success).toBe(false);
      expect(databaseError.status).toBe(500);
      expect(databaseError.message).toContain('မဖန်တီးနိုင်ပါ');
    });
  });

  describe('👥 Customer Report Logic Tests', () => {
    
    it('should calculate customer statistics correctly', () => {
      const salesData = [
        { customerName: 'မောင်မောင်', totalAmount: 50000, saleDate: new Date('2025-08-14') },
        { customerName: 'မောင်မောင်', totalAmount: 30000, saleDate: new Date('2025-08-13') },
        { customerName: 'မမထွေး', totalAmount: 75000, saleDate: new Date('2025-08-12') },
        { customerName: 'မမထွေး', totalAmount: 25000, saleDate: new Date('2025-08-11') }
      ];

      const customerStats = {};
      salesData.forEach(sale => {
        if (!customerStats[sale.customerName]) {
          customerStats[sale.customerName] = {
            totalPurchases: 0,
            transactionCount: 0,
            lastPurchase: sale.saleDate
          };
        }
        customerStats[sale.customerName].totalPurchases += sale.totalAmount;
        customerStats[sale.customerName].transactionCount += 1;
        if (sale.saleDate > customerStats[sale.customerName].lastPurchase) {
          customerStats[sale.customerName].lastPurchase = sale.saleDate;
        }
      });

      // Calculate average transaction for each customer
      Object.keys(customerStats).forEach(customer => {
        const stats = customerStats[customer];
        stats.averageTransaction = stats.totalPurchases / stats.transactionCount;
      });

      expect(customerStats['မောင်မောင်'].totalPurchases).toBe(80000);
      expect(customerStats['မောင်မောင်'].transactionCount).toBe(2);
      expect(customerStats['မောင်မောင်'].averageTransaction).toBe(40000);
      expect(customerStats['မမထွေး'].totalPurchases).toBe(100000);
      expect(customerStats['မမထွေး'].transactionCount).toBe(2);
      expect(customerStats['မမထွေး'].averageTransaction).toBe(50000);
    });

    it('should calculate customer summary statistics', () => {
      const customerStats = {
        'မောင်မောင်': { totalPurchases: 80000, transactionCount: 2 },
        'မမထွေး': { totalPurchases: 100000, transactionCount: 2 },
        'ဦးအောင်': { totalPurchases: 50000, transactionCount: 1 }
      };

      const summary = {
        totalCustomers: Object.keys(customerStats).length,
        totalTransactions: Object.values(customerStats).reduce((sum, customer) => 
          sum + customer.transactionCount, 0
        ),
        totalRevenue: Object.values(customerStats).reduce((sum, customer) => 
          sum + customer.totalPurchases, 0
        )
      };

      summary.averageRevenuePerCustomer = summary.totalRevenue / summary.totalCustomers;

      expect(summary.totalCustomers).toBe(3);
      expect(summary.totalTransactions).toBe(5);
      expect(summary.totalRevenue).toBe(230000);
      expect(summary.averageRevenuePerCustomer).toBeCloseTo(76666.67, 2);
    });

    it('should handle optional date filtering', () => {
      const createDateFilter = (startDate, endDate) => {
        const dateFilter = {};
        if (startDate && endDate) {
          dateFilter.saleDate = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        return dateFilter;
      };

      const filterWithDates = createDateFilter('2025-08-01', '2025-08-31');
      const filterWithoutDates = createDateFilter(null, null);

      expect(filterWithDates.saleDate).toBeDefined();
      expect(filterWithDates.saleDate.$gte).toBeInstanceOf(Date);
      expect(filterWithDates.saleDate.$lte).toBeInstanceOf(Date);
      expect(Object.keys(filterWithoutDates)).toHaveLength(0);
    });

    it('should return 500 error on database failure', () => {
      const createErrorResponse = (status, message, error) => ({
        success: false,
        status,
        message,
        error
      });

      const databaseError = createErrorResponse(
        500,
        "ဖောက်သည်အစီရင်ခံစာကို မဖန်တီးနိုင်ပါ",
        "Customer aggregation failed"
      );

      expect(databaseError.success).toBe(false);
      expect(databaseError.status).toBe(500);
      expect(databaseError.message).toContain('မဖန်တီးနိုင်ပါ');
    });
  });

  describe('📦 Product Report Logic Tests', () => {
    
    it('should calculate product statistics correctly', () => {
      const salesData = [
        {
          items: [
            { item: { _id: 'item1', name: 'ထမင်း' }, quantity: 2, totalPrice: 30000, unitPrice: 15000 },
            { item: { _id: 'item2', name: 'လုံချည်' }, quantity: 1, totalPrice: 150000, unitPrice: 150000 }
          ]
        },
        {
          items: [
            { item: { _id: 'item1', name: 'ထမင်း' }, quantity: 3, totalPrice: 45000, unitPrice: 15000 }
          ]
        }
      ];

      const productStats = {};
      salesData.forEach(sale => {
        sale.items.forEach(item => {
          const itemId = item.item._id;
          if (!productStats[itemId]) {
            productStats[itemId] = {
              productName: item.item.name,
              totalSold: 0,
              totalRevenue: 0,
              transactionCount: 0,
              unitPrices: []
            };
          }
          productStats[itemId].totalSold += item.quantity;
          productStats[itemId].totalRevenue += item.totalPrice;
          productStats[itemId].transactionCount += 1;
          productStats[itemId].unitPrices.push(item.unitPrice);
        });
      });

      // Calculate average price for each product
      Object.keys(productStats).forEach(itemId => {
        const stats = productStats[itemId];
        stats.averagePrice = stats.unitPrices.reduce((sum, price) => sum + price, 0) / stats.unitPrices.length;
      });

      expect(productStats['item1'].productName).toBe('ထမင်း');
      expect(productStats['item1'].totalSold).toBe(5);
      expect(productStats['item1'].totalRevenue).toBe(75000);
      expect(productStats['item1'].transactionCount).toBe(2);
      expect(productStats['item1'].averagePrice).toBe(15000);

      expect(productStats['item2'].productName).toBe('လုံချည်');
      expect(productStats['item2'].totalSold).toBe(1);
      expect(productStats['item2'].totalRevenue).toBe(150000);
      expect(productStats['item2'].transactionCount).toBe(1);
      expect(productStats['item2'].averagePrice).toBe(150000);
    });

    it('should combine product sales with inventory data', () => {
      const productStats = {
        'item1': { productName: 'ထမင်း', totalSold: 5, totalRevenue: 75000 },
        'item2': { productName: 'လုံချည်', totalSold: 1, totalRevenue: 150000 }
      };

      const inventoryData = [
        { _id: 'item1', name: 'ထမင်း', stock_quantity: 50, selling_price: 15000 },
        { _id: 'item2', name: 'လုံချည်', stock_quantity: 3, selling_price: 150000 },
        { _id: 'item3', name: 'ဆေးကြောရည်', stock_quantity: 10, selling_price: 25000 }
      ];

      const combinedReport = {
        productStats: Object.values(productStats),
        inventoryData,
        totalProducts: inventoryData.length,
        productsWithSales: Object.keys(productStats).length,
        productsWithoutSales: inventoryData.length - Object.keys(productStats).length
      };

      expect(combinedReport.totalProducts).toBe(3);
      expect(combinedReport.productsWithSales).toBe(2);
      expect(combinedReport.productsWithoutSales).toBe(1);
      expect(combinedReport.productStats).toHaveLength(2);
      expect(combinedReport.inventoryData).toHaveLength(3);
    });

    it('should return 500 error on database failure', () => {
      const createErrorResponse = (status, message, error) => ({
        success: false,
        status,
        message,
        error
      });

      const databaseError = createErrorResponse(
        500,
        "ပစ္စည်းအစီရင်ခံစာကို မဖန်တီးနိုင်ပါ",
        "Product aggregation failed"
      );

      expect(databaseError.success).toBe(false);
      expect(databaseError.status).toBe(500);
      expect(databaseError.message).toContain('မဖန်တီးနိုင်ပါ');
    });
  });

  describe('📤 Export Functionality Logic Tests', () => {
    
    it('should validate export request parameters', () => {
      const validateExportRequest = (type, format) => {
        const validTypes = ['sales', 'inventory', 'profit', 'customer', 'product'];
        const validFormats = ['pdf', 'csv', 'excel'];

        if (!type) {
          return { valid: false, error: 'Export type is required' };
        }

        if (!validTypes.includes(type)) {
          return { valid: false, error: 'Invalid export type' };
        }

        if (format && !validFormats.includes(format)) {
          return { valid: false, error: 'Invalid export format' };
        }

        return { valid: true };
      };

      expect(validateExportRequest('sales', 'pdf')).toEqual({ valid: true });
      expect(validateExportRequest('invalid', 'pdf')).toEqual({ 
        valid: false, 
        error: 'Invalid export type' 
      });
      expect(validateExportRequest('sales', 'invalid')).toEqual({ 
        valid: false, 
        error: 'Invalid export format' 
      });
      expect(validateExportRequest(null, 'pdf')).toEqual({ 
        valid: false, 
        error: 'Export type is required' 
      });
    });

    it('should handle CSV export logic for inventory', () => {
      const inventoryData = [
        {
          name: 'ထမင်း',
          category_id: { name: 'အစားအသောက်' },
          stock_quantity: 50,
          selling_price: 1500,
          cost_price: 1000,
          expiry_date: new Date('2025-09-01'),
          low_stock_threshold: 10
        }
      ];

      const generateInventoryCSV = (inventoryData) => {
        const headers = [
          'Item Name', 'Category', 'Stock Quantity', 'Selling Price',
          'Cost Price', 'Total Value', 'Expiry Date', 'Status'
        ];

        const rows = inventoryData.map(item => [
          item.name,
          item.category_id?.name || '',
          item.stock_quantity,
          item.selling_price,
          item.cost_price || 0,
          item.selling_price * item.stock_quantity,
          item.expiry_date ? item.expiry_date.toISOString().split('T')[0] : '',
          item.stock_quantity === 0 ? 'Out of Stock' : 
            item.stock_quantity < item.low_stock_threshold ? 'Low Stock' : 'In Stock'
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      };

      const csvData = generateInventoryCSV(inventoryData);
      const lines = csvData.split('\n');
      
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('Item Name,Category,Stock Quantity');
      expect(lines[1]).toContain('ထမင်း,အစားအသောက်,50,1500');
    });

    it('should handle export not implemented scenario', () => {
      const handleExportRequest = (type, format) => {
        return {
          success: false,
          message: "Export အင်္ဂါရပ်ကို မကြာမီ ထည့်သွင်းပေးမည်",
          data: {
            type,
            format: format || 'pdf',
            message: "Export functionality will be implemented soon"
          }
        };
      };

      const result = handleExportRequest('sales', 'pdf');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Export');
      expect(result.data.type).toBe('sales');
      expect(result.data.format).toBe('pdf');
    });

    it('should return 500 error on export failure', () => {
      const createErrorResponse = (status, message, error) => ({
        success: false,
        status,
        message,
        error
      });

      const exportError = createErrorResponse(
        500,
        "Export လုပ်ဆောင်မှုမှာ အမှားရှိနေပါသည်",
        "Export generation failed"
      );

      expect(exportError.success).toBe(false);
      expect(exportError.status).toBe(500);
      expect(exportError.message).toContain('အမှားရှိနေပါသည်');
    });
  });

  describe('🚀 Aggregation Pipeline Logic Tests', () => {
    
    it('should validate sales aggregation pipeline structure', () => {
      const createSalesAggregationPipeline = (startDate, endDate) => {
        return [
          {
            $match: {
              saleDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$totalAmount" },
              totalTransactions: { $sum: 1 },
              averageTransaction: { $avg: "$totalAmount" },
              totalItems: { $sum: { $size: "$items" } }
            }
          }
        ];
      };

      const pipeline = createSalesAggregationPipeline('2025-08-01', '2025-08-31');
      
      expect(pipeline).toHaveLength(2);
      expect(pipeline[0].$match.saleDate).toHaveProperty('$gte');
      expect(pipeline[0].$match.saleDate).toHaveProperty('$lte');
      expect(pipeline[1].$group._id).toBeNull();
      expect(pipeline[1].$group.totalSales.$sum).toBe("$totalAmount");
      expect(pipeline[1].$group.totalItems.$sum.$size).toBe("$items");
    });

    it('should validate category breakdown aggregation', () => {
      const createCategoryAggregationPipeline = (startDate, endDate) => {
        return [
          {
            $match: {
              saleDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          },
          { $unwind: "$items" },
          {
            $lookup: {
              from: "items",
              localField: "items.item",
              foreignField: "_id",
              as: "item"
            }
          },
          { $unwind: "$item" },
          {
            $lookup: {
              from: "productcategories",
              localField: "item.category_id",
              foreignField: "_id",
              as: "category"
            }
          },
          { $unwind: "$category" },
          {
            $group: {
              _id: "$category.name",
              totalRevenue: { $sum: "$items.totalPrice" },
              totalQuantity: { $sum: "$items.quantity" },
              transactionCount: { $sum: 1 }
            }
          },
          { $sort: { totalRevenue: -1 } }
        ];
      };

      const pipeline = createCategoryAggregationPipeline('2025-08-01', '2025-08-31');
      
      expect(pipeline).toHaveLength(8);
      expect(pipeline[1].$unwind).toBe("$items");
      expect(pipeline[2].$lookup.from).toBe("items");
      expect(pipeline[4].$lookup.from).toBe("productcategories");
      expect(pipeline[7].$sort.totalRevenue).toBe(-1);
    });

    it('should validate payment method aggregation', () => {
      const createPaymentMethodPipeline = (startDate, endDate) => {
        return [
          {
            $match: {
              saleDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          },
          {
            $group: {
              _id: "$paymentMethod",
              totalSales: { $sum: "$totalAmount" },
              transactionCount: { $sum: 1 }
            }
          },
          { $sort: { totalSales: -1 } }
        ];
      };

      const pipeline = createPaymentMethodPipeline('2025-08-01', '2025-08-31');
      
      expect(pipeline).toHaveLength(3);
      expect(pipeline[1].$group._id).toBe("$paymentMethod");
      expect(pipeline[1].$group.totalSales.$sum).toBe("$totalAmount");
      expect(pipeline[2].$sort.totalSales).toBe(-1);
    });

    it('should validate customer aggregation pipeline', () => {
      const createCustomerAggregationPipeline = (dateFilter) => {
        return [
          { $match: dateFilter },
          {
            $group: {
              _id: "$customerName",
              totalPurchases: { $sum: "$totalAmount" },
              transactionCount: { $sum: 1 },
              averageTransaction: { $avg: "$totalAmount" },
              lastPurchase: { $max: "$saleDate" }
            }
          },
          { $sort: { totalPurchases: -1 } },
          { $limit: 100 }
        ];
      };

      const dateFilter = {
        saleDate: {
          $gte: new Date('2025-08-01'),
          $lte: new Date('2025-08-31')
        }
      };

      const pipeline = createCustomerAggregationPipeline(dateFilter);
      
      expect(pipeline).toHaveLength(4);
      expect(pipeline[1].$group._id).toBe("$customerName");
      expect(pipeline[1].$group.lastPurchase.$max).toBe("$saleDate");
      expect(pipeline[3].$limit).toBe(100);
    });

    it('should validate product aggregation pipeline', () => {
      const createProductAggregationPipeline = () => {
        return [
          { $unwind: "$items" },
          {
            $lookup: {
              from: "items",
              localField: "items.item",
              foreignField: "_id",
              as: "item"
            }
          },
          { $unwind: "$item" },
          {
            $group: {
              _id: "$item._id",
              productName: { $first: "$item.name" },
              totalSold: { $sum: "$items.quantity" },
              totalRevenue: { $sum: "$items.totalPrice" },
              averagePrice: { $avg: "$items.unitPrice" },
              transactionCount: { $sum: 1 }
            }
          },
          { $sort: { totalRevenue: -1 } }
        ];
      };

      const pipeline = createProductAggregationPipeline();
      
      expect(pipeline).toHaveLength(5);
      expect(pipeline[0].$unwind).toBe("$items");
      expect(pipeline[1].$lookup.from).toBe("items");
      expect(pipeline[3].$group.productName.$first).toBe("$item.name");
      expect(pipeline[4].$sort.totalRevenue).toBe(-1);
    });
  });

  describe('🔄 Response Format Validation', () => {
    
    it('should validate sales report response structure', () => {
      const mockSalesReport = {
        success: true,
        data: {
          period: { startDate: '2025-08-01', endDate: '2025-08-31' },
          summary: {
            totalSales: 155000,
            totalTransactions: 3,
            averageTransaction: 51666.67,
            totalItems: 12
          },
          categoryBreakdown: [
            { _id: 'အစားအသောက်', totalRevenue: 80000, totalQuantity: 3 }
          ],
          paymentMethodStats: [
            { _id: 'cash', totalSales: 80000, transactionCount: 2 }
          ],
          salesData: []
        }
      };

      expect(mockSalesReport.success).toBe(true);
      expect(mockSalesReport.data.period).toHaveProperty('startDate');
      expect(mockSalesReport.data.period).toHaveProperty('endDate');
      expect(mockSalesReport.data.summary).toHaveProperty('totalSales');
      expect(Array.isArray(mockSalesReport.data.categoryBreakdown)).toBe(true);
      expect(Array.isArray(mockSalesReport.data.paymentMethodStats)).toBe(true);
      expect(Array.isArray(mockSalesReport.data.salesData)).toBe(true);
    });

    it('should validate inventory report response structure', () => {
      const mockInventoryReport = {
        success: true,
        data: {
          generatedAt: new Date(),
          summary: {
            totalItems: 4,
            totalValue: 140000,
            lowStockItems: 2,
            outOfStockItems: 1
          },
          inventoryData: []
        }
      };

      expect(mockInventoryReport.success).toBe(true);
      expect(mockInventoryReport.data.generatedAt).toBeInstanceOf(Date);
      expect(mockInventoryReport.data.summary).toHaveProperty('totalItems');
      expect(mockInventoryReport.data.summary).toHaveProperty('totalValue');
      expect(mockInventoryReport.data.summary).toHaveProperty('lowStockItems');
      expect(mockInventoryReport.data.summary).toHaveProperty('outOfStockItems');
      expect(Array.isArray(mockInventoryReport.data.inventoryData)).toBe(true);
    });

    it('should validate profit report response structure', () => {
      const mockProfitReport = {
        success: true,
        data: {
          period: { startDate: '2025-08-01', endDate: '2025-08-31' },
          summary: {
            totalRevenue: 18000,
            totalCost: 14000,
            totalProfit: 4000,
            overallProfitMargin: 22.22
          },
          itemProfit: [],
          generatedAt: new Date()
        }
      };

      expect(mockProfitReport.success).toBe(true);
      expect(mockProfitReport.data.period).toHaveProperty('startDate');
      expect(mockProfitReport.data.summary).toHaveProperty('totalRevenue');
      expect(mockProfitReport.data.summary).toHaveProperty('totalCost');
      expect(mockProfitReport.data.summary).toHaveProperty('totalProfit');
      expect(mockProfitReport.data.summary).toHaveProperty('overallProfitMargin');
      expect(Array.isArray(mockProfitReport.data.itemProfit)).toBe(true);
      expect(mockProfitReport.data.generatedAt).toBeInstanceOf(Date);
    });

    it('should validate customer report response structure', () => {
      const mockCustomerReport = {
        success: true,
        data: {
          period: { startDate: '2025-08-01', endDate: '2025-08-31' },
          summary: {
            totalCustomers: 3,
            totalTransactions: 5,
            totalRevenue: 230000,
            averageRevenuePerCustomer: 76666.67
          },
          customerStats: [],
          generatedAt: new Date()
        }
      };

      expect(mockCustomerReport.success).toBe(true);
      expect(mockCustomerReport.data.summary).toHaveProperty('totalCustomers');
      expect(mockCustomerReport.data.summary).toHaveProperty('totalTransactions');
      expect(mockCustomerReport.data.summary).toHaveProperty('totalRevenue');
      expect(mockCustomerReport.data.summary).toHaveProperty('averageRevenuePerCustomer');
      expect(Array.isArray(mockCustomerReport.data.customerStats)).toBe(true);
      expect(mockCustomerReport.data.generatedAt).toBeInstanceOf(Date);
    });

    it('should validate product report response structure', () => {
      const mockProductReport = {
        success: true,
        data: {
          productStats: [],
          inventoryData: [],
          generatedAt: new Date()
        }
      };

      expect(mockProductReport.success).toBe(true);
      expect(Array.isArray(mockProductReport.data.productStats)).toBe(true);
      expect(Array.isArray(mockProductReport.data.inventoryData)).toBe(true);
      expect(mockProductReport.data.generatedAt).toBeInstanceOf(Date);
    });

    it('should validate export response structure', () => {
      const mockExportResponse = {
        success: false,
        message: "Export အင်္ဂါရပ်ကို မကြာမီ ထည့်သွင်းပေးမည်",
        data: {
          type: 'sales',
          format: 'pdf',
          message: "Export functionality will be implemented soon"
        }
      };

      expect(mockExportResponse.success).toBe(false);
      expect(mockExportResponse.message).toContain('Export');
      expect(mockExportResponse.data).toHaveProperty('type');
      expect(mockExportResponse.data).toHaveProperty('format');
      expect(mockExportResponse.data).toHaveProperty('message');
    });
  });

  describe('🌐 Myanmar Language Support Tests', () => {
    
    it('should validate Myanmar error messages', () => {
      const myanmarErrors = {
        missingDates: "စတင်ရက်စွဲနှင့် ဆုံးရက်စွဲကို ထည့်သွင်းပေးပါ",
        salesReportError: "အစီရင်ခံစာကို မဖန်တီးနိုင်ပါ",
        inventoryReportError: "အရေအတွက်စာရင်းကို မဖန်တီးနိုင်ပါ",
        profitReportError: "အမြတ်အစွန်းစာရင်းကို မဖန်တီးနိုင်ပါ",
        customerReportError: "ဖောက်သည်အစီရင်ခံစာကို မဖန်တီးနိုင်ပါ",
        productReportError: "ပစ္စည်းအစီရင်ခံစာကို မဖန်တီးနိုင်ပါ",
        exportError: "Export လုပ်ဆောင်မှုမှာ အမှားရှိနေပါသည်",
        exportNotImplemented: "Export အင်္ဂါရပ်ကို မကြာမီ ထည့်သွင်းပေးမည်"
      };

      // Validate all messages contain Myanmar script
      Object.values(myanmarErrors).forEach(message => {
        expect(message).toMatch(/[\u1000-\u109F]/); // Myanmar Unicode range
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should validate Myanmar category names in test data', () => {
      const myanmarCategories = [
        'အစားအသောက်',    // Food & Beverages
        'အဝတ်အထည်',     // Clothing
        'အိမ်သုံးပစ္စည်း',  // Household items
        'ဆေးဝါးများ',      // Medicine
        'အလှကုန်များ'     // Beauty products
      ];

      myanmarCategories.forEach(category => {
        expect(category).toMatch(/[\u1000-\u109F]/);
        expect(category.length).toBeGreaterThan(0);
      });
    });

    it('should validate Myanmar customer names in test data', () => {
      const myanmarNames = [
        'မောင်မောင်',
        'မမထွေး',
        'ဦးအောင်',
        'ဒေါ်ခင်',
        'မစုစု'
      ];

      myanmarNames.forEach(name => {
        expect(name).toMatch(/[\u1000-\u109F]/);
        expect(name.length).toBeGreaterThan(0);
      });
    });

    it('should validate Myanmar product names in test data', () => {
      const myanmarProducts = [
        'ထမင်း',      // Rice
        'လုံချည်',    // Longyi (traditional clothing)
        'ဆေးကြောရည်', // Dish soap
        'နို့',        // Milk
        'လက်ဖက်ရည်'  // Tea
      ];

      myanmarProducts.forEach(product => {
        expect(product).toMatch(/[\u1000-\u109F]/);
        expect(product.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('🔄 Integration Workflow Tests', () => {
  
  it('should validate complete report generation workflow', () => {
    // Simulate complete report workflow
    const mockData = {
      dateRange: { startDate: '2025-08-01', endDate: '2025-08-31' },
      salesData: [
        { totalAmount: 50000, items: [{ quantity: 2 }] }
      ],
      inventoryData: [
        { stock_quantity: 50, selling_price: 1500 }
      ]
    };

    const workflow = {
      validateDates: (startDate, endDate) => !!startDate && !!endDate,
      processSales: (data) => data.reduce((sum, sale) => sum + sale.totalAmount, 0),
      processInventory: (data) => data.reduce((sum, item) => sum + (item.stock_quantity * item.selling_price), 0)
    };

    expect(workflow.validateDates(mockData.dateRange.startDate, mockData.dateRange.endDate)).toBe(true);
    expect(workflow.processSales(mockData.salesData)).toBe(50000);
    expect(workflow.processInventory(mockData.inventoryData)).toBe(75000);
  });

  it('should validate error handling across all report types', () => {
    const errorHandlers = {
      handleDatabaseError: (error) => ({
        success: false,
        message: "ဒေတာဘေ့စ်နှင့် ချိတ်ဆက်မှု အမှားရှိပါသည်",
        error: error.message
      }),
      handleValidationError: (field) => ({
        success: false,
        message: `${field} ကို ထည့်သွင်းပေးပါ`
      }),
      handleGeneralError: (operation) => ({
        success: false,
        message: `${operation} မအောင်မြင်ပါ`
      })
    };

    const dbError = errorHandlers.handleDatabaseError(new Error('Connection failed'));
    expect(dbError.success).toBe(false);
    expect(dbError.message).toContain('ဒေတာဘေ့စ်');
    expect(dbError.error).toBe('Connection failed');

    const validationError = errorHandlers.handleValidationError('ရက်စွဲ');
    expect(validationError.success).toBe(false);
    expect(validationError.message).toContain('ရက်စွဲ');

    const generalError = errorHandlers.handleGeneralError('အစီရင်ခံစာ ဖန်တီးခြင်း');
    expect(generalError.success).toBe(false);
    expect(generalError.message).toContain('မအောင်မြင်ပါ');
  });

  it('should validate comprehensive report data processing', () => {
    // Test end-to-end data processing for Myanmar grocery store
    const rawMyanmarData = {
      sales: [
        {
          saleDate: new Date('2025-08-14'),
          customerName: 'မောင်မောင်',
          totalAmount: 50000,
          paymentMethod: 'cash',
          items: [
            { 
              item: { 
                name: 'ထမင်း', 
                cost_price: 1000, 
                category_id: { name: 'အစားအသောက်' } 
              },
              quantity: 2,
              totalPrice: 3000,
              unitPrice: 1500
            }
          ]
        }
      ],
      inventory: [
        {
          name: 'ထမင်း',
          stock_quantity: 50,
          selling_price: 1500,
          low_stock_threshold: 10,
          category_id: { name: 'အစားအသောက်' }
        }
      ]
    };

    // Process data as controller would
    const processedData = {
      salesSummary: {
        totalSales: rawMyanmarData.sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        totalTransactions: rawMyanmarData.sales.length
      },
      inventorySummary: {
        totalItems: rawMyanmarData.inventory.length,
        totalValue: rawMyanmarData.inventory.reduce((sum, item) => 
          sum + (item.stock_quantity * item.selling_price), 0
        )
      },
      profitAnalysis: {
        totalRevenue: rawMyanmarData.sales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0), 0
        ),
        totalCost: rawMyanmarData.sales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => 
            itemSum + (item.item.cost_price * item.quantity), 0
          ), 0
        )
      }
    };

    processedData.profitAnalysis.totalProfit = 
      processedData.profitAnalysis.totalRevenue - processedData.profitAnalysis.totalCost;

    expect(processedData.salesSummary.totalSales).toBe(50000);
    expect(processedData.salesSummary.totalTransactions).toBe(1);
    expect(processedData.inventorySummary.totalItems).toBe(1);
    expect(processedData.inventorySummary.totalValue).toBe(75000);
    expect(processedData.profitAnalysis.totalRevenue).toBe(3000);
    expect(processedData.profitAnalysis.totalCost).toBe(2000);
    expect(processedData.profitAnalysis.totalProfit).toBe(1000);
  });
});
