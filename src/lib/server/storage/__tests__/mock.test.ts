import { describe, it, expect, beforeEach } from 'vitest';
import { MockAdapter } from '$lib/server/storage/mock';
import type { CreateItemData, CreateSaleData } from '$lib/server/storage/types';

describe('MockAdapter', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  describe('initialization', () => {
    it('should have demo data after construction', async () => {
      const result = await adapter.getItems();
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should initialize without errors', async () => {
      await expect(adapter.initialize()).resolves.not.toThrow();
    });

    it('should be idempotent on double init', async () => {
      await adapter.initialize();
      await adapter.initialize();
      const result = await adapter.getItems();
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const health = await adapter.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.message).toContain('Mock');
      expect(health.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('cleanup', () => {
    it('should clear all data', async () => {
      await adapter.cleanup();
      const items = await adapter.getItems();
      expect(items.data).toHaveLength(0);
      const sales = await adapter.getSales();
      expect(sales.data).toHaveLength(0);
      const categories = await adapter.getCategories();
      expect(categories).toHaveLength(0);
    });
  });

  describe('Items CRUD', () => {
    it('should get items with default pagination', async () => {
      const result = await adapter.getItems();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('should paginate items', async () => {
      const page1 = await adapter.getItems({ page: 1, limit: 3 });
      expect(page1.data).toHaveLength(3);
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.limit).toBe(3);
      expect(page1.pagination.totalPages).toBeGreaterThan(1);
    });

    it('should search items by name', async () => {
      const result = await adapter.getItems({ search: 'Water' });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].name.toLowerCase()).toContain('water');
    });

    it('should search items by item code', async () => {
      const result = await adapter.getItems({ search: 'BEV-001' });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].itemCode).toBe('BEV-001');
    });

    it('should filter items by category', async () => {
      const result = await adapter.getItems({ category: 'Beverages' });
      result.data.forEach(item => {
        expect(item.category).toBe('Beverages');
      });
    });

    it('should sort items by name ascending', async () => {
      const result = await adapter.getItems({ sortBy: 'name', sortOrder: 'asc' });
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].name.localeCompare(result.data[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort items by price descending', async () => {
      const result = await adapter.getItems({ sortBy: 'price', sortOrder: 'desc' });
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].price).toBeLessThanOrEqual(result.data[i - 1].price);
      }
    });

    it('should sort items by stockQuantity', async () => {
      const result = await adapter.getItems({ sortBy: 'stockQuantity', sortOrder: 'asc' });
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].stockQuantity).toBeGreaterThanOrEqual(result.data[i - 1].stockQuantity);
      }
    });

    it('should get item by ID', async () => {
      const item = await adapter.getItemById(1);
      expect(item).not.toBeNull();
      expect(item!.id).toBe(1);
    });

    it('should return null for non-existent item ID', async () => {
      const item = await adapter.getItemById(9999);
      expect(item).toBeNull();
    });

    it('should get item by code', async () => {
      const item = await adapter.getItemByCode('BEV-001');
      expect(item).not.toBeNull();
      expect(item!.itemCode).toBe('BEV-001');
    });

    it('should return null for non-existent item code', async () => {
      const item = await adapter.getItemByCode('NONEXISTENT');
      expect(item).toBeNull();
    });

    it('should create a new item', async () => {
      const newItem: CreateItemData = {
        name: 'Test Item',
        itemCode: 'TST-001',
        price: 9.99,
        stockQuantity: 25,
        lowStockThreshold: 5
      };
      const result = await adapter.createItem(newItem);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe('Test Item');
      expect(result.data!.id).toBeGreaterThan(0);
    });

    it('should reject duplicate item code on create', async () => {
      const result = await adapter.createItem({
        name: 'Duplicate',
        itemCode: 'BEV-001',
        price: 5,
        stockQuantity: 10,
        lowStockThreshold: 2
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should update an existing item', async () => {
      const result = await adapter.updateItem(1, { name: 'Updated Name', price: 99.99 });
      expect(result.success).toBe(true);
      expect(result.data!.name).toBe('Updated Name');
      expect(result.data!.price).toBe(99.99);
    });

    it('should fail to update non-existent item', async () => {
      const result = await adapter.updateItem(9999, { name: 'Nope' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject duplicate item code on update', async () => {
      const result = await adapter.updateItem(1, { itemCode: 'BEV-002' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should delete an item', async () => {
      const countBefore = (await adapter.getItems()).pagination.total;
      const result = await adapter.deleteItem(1);
      expect(result.success).toBe(true);
      const countAfter = (await adapter.getItems()).pagination.total;
      expect(countAfter).toBe(countBefore - 1);
    });

    it('should fail to delete non-existent item', async () => {
      const result = await adapter.deleteItem(9999);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should search items by name, code, and category', async () => {
      const results = await adapter.searchItems('Beverages');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should limit search results to 50', async () => {
      const results = await adapter.searchItems('');
      expect(results.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Sales CRUD', () => {
    it('should get sales with default pagination', async () => {
      const result = await adapter.getSales();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter sales by payment method', async () => {
      const result = await adapter.getSales({ paymentMethod: 'cash' });
      result.data.forEach(sale => {
        expect(sale.paymentMethod).toBe('cash');
      });
    });

    it('should filter sales by customer name', async () => {
      const result = await adapter.getSales({ customerName: 'John' });
      result.data.forEach(sale => {
        expect(sale.customerName?.toLowerCase()).toContain('john');
      });
    });

    it('should filter sales by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      const result = await adapter.getSales({ startDate, endDate });
      result.data.forEach(sale => {
        expect(sale.saleDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(sale.saleDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should get sale by ID', async () => {
      const sale = await adapter.getSaleById(1);
      expect(sale).not.toBeNull();
      expect(sale!.id).toBe(1);
    });

    it('should return null for non-existent sale', async () => {
      const sale = await adapter.getSaleById(9999);
      expect(sale).toBeNull();
    });

    it('should get sale with items', async () => {
      const sale = await adapter.getSaleWithItems(1);
      expect(sale).not.toBeNull();
      expect(sale!.items).toBeDefined();
      expect(Array.isArray(sale!.items)).toBe(true);
    });

    it('should return null for non-existent sale with items', async () => {
      const sale = await adapter.getSaleWithItems(9999);
      expect(sale).toBeNull();
    });

    it('should create a new sale', async () => {
      const saleData: CreateSaleData = {
        saleDate: new Date(),
        totalAmount: 50,
        paymentMethod: 'cash',
        customerName: 'Test Customer',
        items: [{ itemId: 1, quantity: 5, unitPrice: 10, totalPrice: 50 }]
      };
      const result = await adapter.createSale(saleData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.invoiceNumber).toBeDefined();
    });

    it('should create sale without items', async () => {
      const saleData: CreateSaleData = {
        saleDate: new Date(),
        totalAmount: 25,
        paymentMethod: 'credit'
      };
      const result = await adapter.createSale(saleData);
      expect(result.success).toBe(true);
    });

    it('should update a sale', async () => {
      const result = await adapter.updateSale(1, { customerName: 'Updated Customer' });
      expect(result.success).toBe(true);
      expect(result.data!.customerName).toBe('Updated Customer');
    });

    it('should fail to update non-existent sale', async () => {
      const result = await adapter.updateSale(9999, { customerName: 'Nope' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should delete a sale and its items', async () => {
      const result = await adapter.deleteSale(1);
      expect(result.success).toBe(true);
      const deleted = await adapter.getSaleById(1);
      expect(deleted).toBeNull();
    });

    it('should fail to delete non-existent sale', async () => {
      const result = await adapter.deleteSale(9999);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Categories CRUD', () => {
    it('should get all categories', async () => {
      const categories = await adapter.getCategories();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should get category by ID', async () => {
      const cat = await adapter.getCategoryById(1);
      expect(cat).not.toBeNull();
      expect(cat!.id).toBe(1);
    });

    it('should return null for non-existent category ID', async () => {
      const cat = await adapter.getCategoryById(9999);
      expect(cat).toBeNull();
    });

    it('should get category by name', async () => {
      const cat = await adapter.getCategoryByName('Beverages');
      expect(cat).not.toBeNull();
      expect(cat!.name).toBe('Beverages');
    });

    it('should return null for non-existent category name', async () => {
      const cat = await adapter.getCategoryByName('NonExistent');
      expect(cat).toBeNull();
    });

    it('should create a new category', async () => {
      const result = await adapter.createCategory('New Category');
      expect(result.success).toBe(true);
      expect(result.data!.name).toBe('New Category');
    });

    it('should reject duplicate category name', async () => {
      const result = await adapter.createCategory('Beverages');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should update a category', async () => {
      const result = await adapter.updateCategory(1, 'Updated Category');
      expect(result.success).toBe(true);
      expect(result.data!.name).toBe('Updated Category');
    });

    it('should fail to update non-existent category', async () => {
      const result = await adapter.updateCategory(9999, 'Nope');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject duplicate name on update', async () => {
      const result = await adapter.updateCategory(1, 'Snacks');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should delete a category', async () => {
      const result = await adapter.deleteCategory(1);
      expect(result.success).toBe(true);
    });

    it('should fail to delete non-existent category', async () => {
      const result = await adapter.deleteCategory(9999);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Dashboard & Analytics', () => {
    it('should return dashboard stats', async () => {
      const stats = await adapter.getDashboardStats();
      expect(stats.totalItems).toBeGreaterThan(0);
      expect(stats.totalSales).toBeGreaterThan(0);
      expect(stats.topSellingItems).toBeDefined();
      expect(stats.recentSales).toBeDefined();
      expect(stats.salesByCategory).toBeDefined();
      expect(typeof stats.lowStockItems).toBe('number');
      expect(typeof stats.outOfStockItems).toBe('number');
      expect(typeof stats.todaySales).toBe('number');
      expect(typeof stats.weeklySales).toBe('number');
      expect(typeof stats.monthlySales).toBe('number');
    });

    it('should return low stock items', async () => {
      const lowStock = await adapter.getLowStockItems();
      lowStock.forEach(item => {
        expect(item.stockQuantity).toBeGreaterThan(0);
        expect(item.stockQuantity).toBeLessThanOrEqual(item.lowStockThreshold);
      });
    });

    it('should return out of stock items', async () => {
      const outOfStock = await adapter.getOutOfStockItems();
      outOfStock.forEach(item => {
        expect(item.stockQuantity).toBe(0);
      });
    });

    it('should return top selling items', async () => {
      const top = await adapter.getTopSellingItems(5);
      expect(top.length).toBeLessThanOrEqual(5);
      top.forEach(item => {
        expect(item.itemId).toBeDefined();
        expect(item.itemName).toBeDefined();
        expect(item.totalSold).toBeDefined();
        expect(item.revenue).toBeDefined();
      });
    });

    it('should return top selling items with date filter', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      const top = await adapter.getTopSellingItems(10, startDate, endDate);
      expect(Array.isArray(top)).toBe(true);
    });

    it('should return sales report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-12-31');
      const report = await adapter.getSalesReport(startDate, endDate);
      expect(typeof report.totalSales).toBe('number');
      expect(typeof report.totalRevenue).toBe('number');
      expect(Array.isArray(report.salesByPaymentMethod)).toBe(true);
      expect(Array.isArray(report.salesByCategory)).toBe(true);
      expect(Array.isArray(report.dailySales)).toBe(true);
    });
  });

  describe('Inventory Management', () => {
    it('should set stock quantity', async () => {
      const result = await adapter.updateStock(1, 100, 'set');
      expect(result.success).toBe(true);
      expect(result.data!.stockQuantity).toBe(100);
    });

    it('should add to stock quantity', async () => {
      const before = await adapter.getItemById(1);
      const beforeQty = before!.stockQuantity;
      const result = await adapter.updateStock(1, 10, 'add');
      expect(result.success).toBe(true);
      expect(result.data!.stockQuantity).toBe(beforeQty + 10);
    });

    it('should subtract from stock quantity', async () => {
      const before = await adapter.getItemById(1);
      const beforeQty = before!.stockQuantity;
      const result = await adapter.updateStock(1, 5, 'subtract');
      expect(result.success).toBe(true);
      expect(result.data!.stockQuantity).toBe(beforeQty - 5);
    });

    it('should not go below 0 on subtract', async () => {
      const result = await adapter.updateStock(1, 99999, 'subtract');
      expect(result.success).toBe(true);
      expect(result.data!.stockQuantity).toBe(0);
    });

    it('should fail for non-existent item', async () => {
      const result = await adapter.updateStock(9999, 10, 'set');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should bulk update stock', async () => {
      const result = await adapter.bulkUpdateStock([
        { itemId: 1, quantity: 50, operation: 'set' },
        { itemId: 2, quantity: 10, operation: 'add' }
      ]);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should handle partial bulk update failure', async () => {
      const result = await adapter.bulkUpdateStock([
        { itemId: 1, quantity: 50, operation: 'set' },
        { itemId: 9999, quantity: 10, operation: 'set' }
      ]);
      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(1);
      expect(result.error).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate valid item data', async () => {
      const result = await adapter.validateItemData({
        name: 'Valid Item',
        itemCode: 'V001',
        price: 10,
        stockQuantity: 50,
        lowStockThreshold: 5
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject item with empty name', async () => {
      const result = await adapter.validateItemData({
        name: '',
        itemCode: 'V001',
        price: 10,
        stockQuantity: 50,
        lowStockThreshold: 5
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should reject item with empty item code', async () => {
      const result = await adapter.validateItemData({
        name: 'Valid',
        itemCode: '',
        price: 10,
        stockQuantity: 50,
        lowStockThreshold: 5
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Item code is required');
    });

    it('should reject item with negative price', async () => {
      const result = await adapter.validateItemData({
        name: 'Valid',
        itemCode: 'V001',
        price: -5,
        stockQuantity: 50,
        lowStockThreshold: 5
      });
      expect(result.isValid).toBe(false);
    });

    it('should validate valid sale data', async () => {
      const result = await adapter.validateSaleData({
        saleDate: new Date(),
        totalAmount: 50,
        paymentMethod: 'cash'
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject sale with zero amount', async () => {
      const result = await adapter.validateSaleData({
        saleDate: new Date(),
        totalAmount: 0,
        paymentMethod: 'cash'
      });
      expect(result.isValid).toBe(false);
    });

    it('should reject sale without payment method', async () => {
      const result = await adapter.validateSaleData({
        saleDate: new Date(),
        totalAmount: 50,
        paymentMethod: ''
      });
      expect(result.isValid).toBe(false);
    });
  });

  describe('Data Integrity', () => {
    it('should pass integrity check on fresh data', async () => {
      const result = await adapter.checkDataIntegrity();
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });
});
