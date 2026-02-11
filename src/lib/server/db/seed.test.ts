import { describe, it, expect, vi } from 'vitest';

// Mock the db/index module to avoid @libsql/client import chain
vi.mock('$lib/server/db/index', () => ({
  db: {},
  items: {},
  categories: {},
  sales: {},
  saleItems: {},
}));

// Mock drizzle-orm sql template tag
vi.mock('drizzle-orm', () => ({
  sql: () => '',
}));

import { categoryData, itemData, sampleSalesData } from '$lib/server/db/seed';

describe('Seed Data', () => {
  describe('categoryData', () => {
    it('should have categories defined', () => {
      expect(categoryData).toBeDefined();
      expect(categoryData.length).toBeGreaterThan(0);
    });

    it('should have unique category names', () => {
      const names = categoryData.map(c => c.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });

    it('should have non-empty names', () => {
      categoryData.forEach(cat => {
        expect(cat.name.length).toBeGreaterThan(0);
      });
    });

    it('should contain expected categories', () => {
      const names = categoryData.map(c => c.name);
      expect(names).toContain('Beverages');
      expect(names).toContain('Snacks');
      expect(names).toContain('Groceries');
      expect(names).toContain('Dairy');
    });
  });

  describe('itemData', () => {
    it('should have items defined', () => {
      expect(itemData).toBeDefined();
      expect(itemData.length).toBeGreaterThan(0);
    });

    it('should have unique item codes', () => {
      const codes = itemData.map(i => i.itemCode);
      const unique = new Set(codes);
      expect(unique.size).toBe(codes.length);
    });

    it('should have positive prices', () => {
      itemData.forEach(item => {
        expect(item.price).toBeGreaterThan(0);
      });
    });

    it('should have non-negative stock quantities', () => {
      itemData.forEach(item => {
        expect(item.stockQuantity).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have non-negative low stock thresholds', () => {
      itemData.forEach(item => {
        expect(item.lowStockThreshold).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid categories matching categoryData', () => {
      const categoryNames = categoryData.map(c => c.name);
      itemData.forEach(item => {
        expect(categoryNames).toContain(item.category);
      });
    });

    it('should have non-empty names', () => {
      itemData.forEach(item => {
        expect(item.name.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty item codes', () => {
      itemData.forEach(item => {
        expect(item.itemCode.length).toBeGreaterThan(0);
      });
    });

    it('should have items with specific prefixes by category', () => {
      const beverages = itemData.filter(i => i.category === 'Beverages');
      beverages.forEach(item => {
        expect(item.itemCode).toMatch(/^BEV-/);
      });
    });
  });

  describe('sampleSalesData', () => {
    it('should have sales defined', () => {
      expect(sampleSalesData).toBeDefined();
      expect(sampleSalesData.length).toBeGreaterThan(0);
    });

    it('should have positive total amounts', () => {
      sampleSalesData.forEach(sale => {
        expect(sale.totalAmount).toBeGreaterThan(0);
      });
    });

    it('should have valid payment methods', () => {
      const validMethods = ['cash', 'credit', 'mobile_payment'];
      sampleSalesData.forEach(sale => {
        expect(validMethods).toContain(sale.paymentMethod);
      });
    });

    it('should have sale dates as Date objects', () => {
      sampleSalesData.forEach(sale => {
        expect(sale.saleDate).toBeInstanceOf(Date);
      });
    });

    it('should have items with item codes', () => {
      sampleSalesData.forEach(sale => {
        expect(sale.items.length).toBeGreaterThan(0);
        sale.items.forEach(item => {
          expect(item.itemCode).toBeDefined();
          expect(item.itemCode.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have items with positive quantities', () => {
      sampleSalesData.forEach(sale => {
        sale.items.forEach(item => {
          expect(item.quantity).toBeGreaterThan(0);
        });
      });
    });

    it('should reference valid item codes from itemData', () => {
      const validCodes = itemData.map(i => i.itemCode);
      sampleSalesData.forEach(sale => {
        sale.items.forEach(item => {
          expect(validCodes).toContain(item.itemCode);
        });
      });
    });

    it('should have mix of customer names and nulls', () => {
      const withName = sampleSalesData.filter(s => s.customerName !== null);
      const withNull = sampleSalesData.filter(s => s.customerName === null);
      expect(withName.length).toBeGreaterThan(0);
      expect(withNull.length).toBeGreaterThan(0);
    });
  });
});
