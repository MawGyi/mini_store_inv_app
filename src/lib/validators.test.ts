import { describe, it, expect } from 'vitest';
import { ItemSchema, ItemUpdateSchema, SaleItemInputSchema, SaleSchema, formatZodError, type ItemInput, type ItemUpdateInput, type SaleInput } from '$lib/validators';
import { z } from 'zod';

describe('Validators', () => {
  describe('ItemSchema', () => {
    it('should validate a valid item', () => {
      const validItem: ItemInput = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50,
        lowStockThreshold: 10,
        category: 'Electronics',
        expiryDate: null
      };
      const result = ItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Product');
        expect(result.data.itemCode).toBe('TP001');
        expect(result.data.price).toBe(10.99);
        expect(result.data.stockQuantity).toBe(50);
      }
    });

    it('should reject empty name', () => {
      const invalidItem = {
        name: '',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'name')).toBe(true);
        expect(errors.find(e => e.field === 'name')?.message).toContain('Name is required');
      }
    });

    it('should reject name exceeding 255 characters', () => {
      const invalidItem = {
        name: 'a'.repeat(256),
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'name')).toBe(true);
        expect(errors.find(e => e.field === 'name')?.message).toContain('less than 255 characters');
      }
    });

    it('should reject empty item code', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: '',
        price: 10.99,
        stockQuantity: 50,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'itemCode')).toBe(true);
      }
    });

    it('should reject item code exceeding 50 characters', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'T'.repeat(51),
        price: 10.99,
        stockQuantity: 50,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'itemCode')).toBe(true);
      }
    });

    it('should reject zero price', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 0,
        stockQuantity: 50,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'price')).toBe(true);
        expect(errors.find(e => e.field === 'price')?.message).toContain('positive');
      }
    });

    it('should reject negative price', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: -10.99,
        stockQuantity: 50,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'price')).toBe(true);
        expect(errors.find(e => e.field === 'price')?.message).toContain('positive');
      }
    });

    it('should reject non-numeric price', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 'ten' as any,
        stockQuantity: 50,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject negative stock quantity', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: -5,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'stockQuantity')).toBe(true);
        expect(errors.find(e => e.field === 'stockQuantity')?.message).toContain('cannot be negative');
      }
    });

    it('should accept zero stock quantity', () => {
      const validItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 0,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject non-integer stock quantity', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 5.5,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'stockQuantity')).toBe(true);
        expect(errors.find(e => e.field === 'stockQuantity')?.message).toContain('integer');
      }
    });

    it('should reject negative low stock threshold', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50,
        lowStockThreshold: -5
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'lowStockThreshold')).toBe(true);
      }
    });

    it('should use default low stock threshold of 10', () => {
      const validItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50
      };
      const result = ItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lowStockThreshold).toBe(10);
      }
    });

    it('should accept null category', () => {
      const validItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50,
        category: null
      };
      const result = ItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should accept optional expiry date', () => {
      const validItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50,
        expiryDate: new Date('2025-12-31')
      };
      const result = ItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiryDate).toBeInstanceOf(Date);
      }
    });

    it('should reject invalid expiry date', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50,
        expiryDate: 'invalid-date' as any
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should collect multiple validation errors', () => {
      const invalidItem = {
        name: '',
        itemCode: '',
        price: -5,
        stockQuantity: -10,
        lowStockThreshold: -5
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.length).toBeGreaterThanOrEqual(4);
      }
    });
  });

  describe('ItemUpdateSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate: ItemUpdateInput = {
        name: 'Updated Name'
      };
      const result = ItemUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.itemCode).toBeUndefined();
      }
    });

    it('should allow empty object for updates', () => {
      const emptyUpdate = {};
      const result = ItemUpdateSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate price when provided', () => {
      const invalidUpdate = {
        price: -10
      };
      const result = ItemUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('SaleItemInputSchema', () => {
    it('should validate a valid sale item', () => {
      const validSaleItem = {
        itemId: 1,
        quantity: 5,
        unitPrice: 10.99,
        totalPrice: 54.95
      };
      const result = SaleItemInputSchema.safeParse(validSaleItem);
      expect(result.success).toBe(true);
    });

    it('should reject non-positive item ID', () => {
      const invalidSaleItem = {
        itemId: 0,
        quantity: 5,
        unitPrice: 10.99,
        totalPrice: 54.95
      };
      const result = SaleItemInputSchema.safeParse(invalidSaleItem);
      expect(result.success).toBe(false);
    });

    it('should reject negative item ID', () => {
      const invalidSaleItem = {
        itemId: -1,
        quantity: 5,
        unitPrice: 10.99,
        totalPrice: 54.95
      };
      const result = SaleItemInputSchema.safeParse(invalidSaleItem);
      expect(result.success).toBe(false);
    });

    it('should reject zero quantity', () => {
      const invalidSaleItem = {
        itemId: 1,
        quantity: 0,
        unitPrice: 10.99,
        totalPrice: 0
      };
      const result = SaleItemInputSchema.safeParse(invalidSaleItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'quantity')).toBe(true);
      }
    });

    it('should reject negative quantity', () => {
      const invalidSaleItem = {
        itemId: 1,
        quantity: -5,
        unitPrice: 10.99,
        totalPrice: -54.95
      };
      const result = SaleItemInputSchema.safeParse(invalidSaleItem);
      expect(result.success).toBe(false);
    });

    it('should accept zero unit price', () => {
      const validSaleItem = {
        itemId: 1,
        quantity: 5,
        unitPrice: 0,
        totalPrice: 0
      };
      const result = SaleItemInputSchema.safeParse(validSaleItem);
      expect(result.success).toBe(true);
    });

    it('should reject negative unit price', () => {
      const invalidSaleItem = {
        itemId: 1,
        quantity: 5,
        unitPrice: -10.99,
        totalPrice: -54.95
      };
      const result = SaleItemInputSchema.safeParse(invalidSaleItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'unitPrice')).toBe(true);
      }
    });

    it('should accept zero total price', () => {
      const validSaleItem = {
        itemId: 1,
        quantity: 5,
        unitPrice: 0,
        totalPrice: 0
      };
      const result = SaleItemInputSchema.safeParse(validSaleItem);
      expect(result.success).toBe(true);
    });

    it('should reject negative total price', () => {
      const invalidSaleItem = {
        itemId: 1,
        quantity: 5,
        unitPrice: 10.99,
        totalPrice: -54.95
      };
      const result = SaleItemInputSchema.safeParse(invalidSaleItem);
      expect(result.success).toBe(false);
    });
  });

  describe('SaleSchema', () => {
    it('should validate a valid sale', () => {
      const validSale: SaleInput = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 },
          { itemId: 2, quantity: 1, unitPrice: 25.50, totalPrice: 25.50 }
        ],
        paymentMethod: 'cash',
        customerName: 'John Doe',
        saleDate: '2024-01-15T10:30:00Z'
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should reject sale without items', () => {
      const invalidSale = {
        items: [],
        paymentMethod: 'cash'
      };
      const result = SaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'items')).toBe(true);
        expect(errors.find(e => e.field === 'items')?.message).toContain('At least one item');
      }
    });

    it('should reject invalid payment method', () => {
      const invalidSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'bank_transfer'
      };
      const result = SaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'paymentMethod')).toBe(true);
      }
    });

    it('should accept cash payment method', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'cash'
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should accept credit payment method', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'credit'
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should accept mobile_payment payment method', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'mobile_payment'
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should accept optional customer name', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'cash'
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should accept null customer name', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'cash',
        customerName: null
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should reject customer name exceeding 255 characters', () => {
      const invalidSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'cash',
        customerName: 'a'.repeat(256)
      };
      const result = SaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
    });

    it('should accept optional sale date', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'cash'
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should validate sale date format', () => {
      const invalidSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'cash',
        saleDate: 'not-a-date'
      };
      const result = SaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
    });

    it('should accept ISO datetime format', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'cash',
        saleDate: '2024-01-15T10:30:00.000Z'
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });
  });

  describe('formatZodError', () => {
    it('should format single error correctly', () => {
      const result = ItemSchema.safeParse({ name: '', itemCode: '', price: -1, stockQuantity: -1 });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted.length).toBeGreaterThanOrEqual(4);
        expect(formatted[0]).toHaveProperty('field');
        expect(formatted[0]).toHaveProperty('message');
      }
    });

    it('should include all error paths', () => {
      const result = ItemSchema.safeParse({ name: '', itemCode: '', price: -1, stockQuantity: -1 });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        const fields = formatted.map(e => e.field);
        expect(fields).toContain('name');
        expect(fields).toContain('itemCode');
        expect(fields).toContain('price');
        expect(fields).toContain('stockQuantity');
      }
    });

    it('should handle nested path errors', () => {
      const result = SaleSchema.safeParse({ items: [{ itemId: 0, quantity: 0 }], paymentMethod: 'invalid' });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should preserve original error messages', () => {
      const result = ItemSchema.safeParse({ name: '', itemCode: 'T001', price: -1, stockQuantity: 5 });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        const nameError = formatted.find(e => e.field === 'name');
        expect(nameError?.message).toBe('Name is required');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum values', () => {
      const maxItem = {
        name: 'a'.repeat(255),
        itemCode: 'a'.repeat(50),
        price: Number.MAX_SAFE_INTEGER,
        stockQuantity: Number.MAX_SAFE_INTEGER,
        lowStockThreshold: Number.MAX_SAFE_INTEGER
      };
      const result = ItemSchema.safeParse(maxItem);
      expect(result.success).toBe(true);
    });

    it('should handle decimal prices', () => {
      const decimalItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 0.01,
        stockQuantity: 1
      };
      const result = ItemSchema.safeParse(decimalItem);
      expect(result.success).toBe(true);
    });

    it('should handle very small positive price', () => {
      const smallPriceItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 0.0001,
        stockQuantity: 1
      };
      const result = ItemSchema.safeParse(smallPriceItem);
      expect(result.success).toBe(true);
    });

    it('should handle large quantity values', () => {
      const largeQuantityItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 1000000,
        lowStockThreshold: 1000
      };
      const result = ItemSchema.safeParse(largeQuantityItem);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in name', () => {
      const specialCharItem = {
        name: 'Test Product with special chars: @#$%^&*()',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50
      };
      const result = ItemSchema.safeParse(specialCharItem);
      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in name', () => {
      const unicodeItem = {
        name: 'テスト商品',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50
      };
      const result = ItemSchema.safeParse(unicodeItem);
      expect(result.success).toBe(true);
    });

    it('should handle item code with special characters', () => {
      const specialCodeItem = {
        name: 'Test Product',
        itemCode: 'TP-001_ABC',
        price: 10.99,
        stockQuantity: 50
      };
      const result = ItemSchema.safeParse(specialCodeItem);
      expect(result.success).toBe(true);
    });

    it('should accept null expiryDate', () => {
      const itemWithNullExpiry = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50,
        lowStockThreshold: 10,
        expiryDate: null
      };
      const result = ItemSchema.safeParse(itemWithNullExpiry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiryDate).toBeNull();
      }
    });

    it('should reject negative price', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: -10,
        stockQuantity: 50,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'price')).toBe(true);
      }
    });

    it('should reject negative stockQuantity', () => {
      const invalidItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: -5,
        lowStockThreshold: 10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'stockQuantity')).toBe(true);
      }
    });

    it('should accept 0 as lowStockThreshold', () => {
      const itemWithZeroThreshold = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50,
        lowStockThreshold: 0
      };
      const result = ItemSchema.safeParse(itemWithZeroThreshold);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lowStockThreshold).toBe(0);
      }
    });

    it('should handle very long name (255 characters)', () => {
      const longNameItem = {
        name: 'a'.repeat(255),
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50
      };
      const result = ItemSchema.safeParse(longNameItem);
      expect(result.success).toBe(true);
    });

    it('should reject name exceeding 255 characters', () => {
      const invalidItem = {
        name: 'a'.repeat(256),
        itemCode: 'TP001',
        price: 10.99,
        stockQuantity: 50
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.some(e => e.field === 'name')).toBe(true);
      }
    });

    it('should accept decimal prices', () => {
      const decimalPriceItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 0.01,
        stockQuantity: 50
      };
      const result = ItemSchema.safeParse(decimalPriceItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(0.01);
      }
    });

    it('should accept very large prices', () => {
      const largePriceItem = {
        name: 'Test Product',
        itemCode: 'TP001',
        price: 9999999.99,
        stockQuantity: 50
      };
      const result = ItemSchema.safeParse(largePriceItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(9999999.99);
      }
    });
  });

  describe('SaleSchema', () => {
    it('should validate a valid sale with single item', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 5, unitPrice: 10.99, totalPrice: 54.95 }
        ],
        paymentMethod: 'cash',
        customerName: 'John Doe',
        saleDate: new Date().toISOString()
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should validate a valid sale with multiple items', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 5, unitPrice: 10.99, totalPrice: 54.95 },
          { itemId: 2, quantity: 3, unitPrice: 25.50, totalPrice: 76.50 }
        ],
        paymentMethod: 'credit',
        customerName: 'Jane Doe',
        saleDate: new Date().toISOString()
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should reject empty items array', () => {
      const invalidSale = {
        items: [],
        paymentMethod: 'cash',
        customerName: 'John Doe'
      };
      const result = SaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
    });

    it('should reject items with quantity 0', () => {
      const invalidSale = {
        items: [
          { itemId: 1, quantity: 0, unitPrice: 10.99, totalPrice: 0 }
        ],
        paymentMethod: 'cash'
      };
      const result = SaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
    });

    it('should accept all payment methods', () => {
      const paymentMethods = ['cash', 'credit', 'mobile_payment'];
      
      paymentMethods.forEach(paymentMethod => {
        const sale = {
          items: [{ itemId: 1, quantity: 5, unitPrice: 10, totalPrice: 50 }],
          paymentMethod
        };
        const result = SaleSchema.safeParse(sale);
        expect(result.success).toBe(true);
      });
    });

    it('should handle missing customerName', () => {
      const saleWithoutCustomer = {
        items: [{ itemId: 1, quantity: 5, unitPrice: 10, totalPrice: 50 }],
        paymentMethod: 'cash'
      };
      const result = SaleSchema.safeParse(saleWithoutCustomer);
      expect(result.success).toBe(true);
    });

    it('should reject negative quantity', () => {
      const invalidSale = {
        items: [
          { itemId: 1, quantity: -5, unitPrice: 10.99, totalPrice: -54.95 }
        ],
        paymentMethod: 'cash'
      };
      const result = SaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
    });

    it('should validate totalPrice matches quantity * unitPrice', () => {
      const validSale = {
        items: [
          { itemId: 1, quantity: 3, unitPrice: 10, totalPrice: 30 }
        ],
        paymentMethod: 'cash'
      };
      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it('should handle ISO date format', () => {
      const saleWithDate = {
        items: [{ itemId: 1, quantity: 5, unitPrice: 10, totalPrice: 50 }],
        paymentMethod: 'cash',
        saleDate: '2024-01-15T10:30:00.000Z'
      };
      const result = SaleSchema.safeParse(saleWithDate);
      expect(result.success).toBe(true);
    });
  });

  describe('SaleItemInputSchema', () => {
    it('should validate a valid sale item', () => {
      const validItem = {
        itemId: 1,
        quantity: 10,
        unitPrice: 25.50,
        totalPrice: 255.00
      };
      const result = SaleItemInputSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject negative quantity', () => {
      const invalidItem = {
        itemId: 1,
        quantity: -1,
        unitPrice: 25.50,
        totalPrice: -25.50
      };
      const result = SaleItemInputSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should accept zero unit price', () => {
      const validItem = {
        itemId: 1,
        quantity: 10,
        unitPrice: 0,
        totalPrice: 0
      };
      const result = SaleItemInputSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject missing itemId', () => {
      const invalidItem = {
        quantity: 10,
        unitPrice: 25.50,
        totalPrice: 255.00
      };
      const result = SaleItemInputSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('ItemUpdateSchema', () => {
    it('should validate partial item update', () => {
      const partialUpdate = {
        name: 'Updated Name'
      };
      const result = ItemUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
      }
    });

    it('should allow updating only price', () => {
      const partialUpdate = {
        price: 19.99
      };
      const result = ItemUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(19.99);
      }
    });

    it('should allow updating only stockQuantity', () => {
      const partialUpdate = {
        stockQuantity: 100
      };
      const result = ItemUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stockQuantity).toBe(100);
      }
    });

    it('should reject negative price in update', () => {
      const invalidUpdate = {
        price: -5
      };
      const result = ItemUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should reject negative stockQuantity in update', () => {
      const invalidUpdate = {
        stockQuantity: -10
      };
      const result = ItemUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should allow empty update object', () => {
      const emptyUpdate = {};
      const result = ItemUpdateSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('formatZodError', () => {
    it('should format multiple errors correctly', () => {
      const invalidItem = {
        name: '',
        itemCode: '',
        price: -5,
        stockQuantity: -10
      };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.length).toBeGreaterThan(1);
        expect(errors.some(e => e.field === 'name')).toBe(true);
        expect(errors.some(e => e.field === 'itemCode')).toBe(true);
        expect(errors.some(e => e.field === 'price')).toBe(true);
        expect(errors.some(e => e.field === 'stockQuantity')).toBe(true);
      }
    });

    it('should handle nested object errors', () => {
      const invalidSale = {
        items: [
          { itemId: 1, quantity: 0, unitPrice: 10, totalPrice: 0 }
        ],
        paymentMethod: 'invalid'
      };
      const result = SaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });
});
