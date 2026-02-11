import { describe, it, expect } from 'vitest';
import type {
  Item,
  Sale,
  SaleItem,
  Category,
  SaleWithItems,
  DashboardOverview,
  SalesSummary,
  TopSellingItem,
  Notification,
  DashboardAlert,
  ExpiryAlertSummary
} from '$lib/types';

describe('Type Definitions', () => {
  describe('Item type', () => {
    it('should accept a valid item', () => {
      const item: Item = {
        id: 1,
        name: 'Test Item',
        itemCode: 'TI001',
        price: 10.99,
        stockQuantity: 50,
        lowStockThreshold: 10,
        category: 'Electronics',
        expiryDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(item.id).toBe(1);
      expect(item.name).toBe('Test Item');
      expect(item.category).toBe('Electronics');
      expect(item.expiryDate).toBeNull();
    });

    it('should accept null category', () => {
      const item: Item = {
        id: 1, name: 'Test', itemCode: 'T001', price: 5, stockQuantity: 0,
        lowStockThreshold: 5, category: null, expiryDate: null,
        createdAt: new Date(), updatedAt: new Date()
      };
      expect(item.category).toBeNull();
    });

    it('should accept Date expiryDate', () => {
      const expiry = new Date('2026-12-31');
      const item: Item = {
        id: 1, name: 'Test', itemCode: 'T001', price: 5, stockQuantity: 10,
        lowStockThreshold: 5, category: null, expiryDate: expiry,
        createdAt: new Date(), updatedAt: new Date()
      };
      expect(item.expiryDate).toBeInstanceOf(Date);
    });
  });

  describe('Sale type', () => {
    it('should accept valid sale', () => {
      const sale: Sale = {
        id: 1,
        saleDate: new Date(),
        totalAmount: 100,
        paymentMethod: 'cash',
        customerName: 'John',
        invoiceNumber: 'INV-001',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(sale.paymentMethod).toBe('cash');
    });

    it('should accept all payment methods', () => {
      const methods: Sale['paymentMethod'][] = ['cash', 'credit', 'mobile_payment'];
      methods.forEach(method => {
        const sale: Sale = {
          id: 1, saleDate: new Date(), totalAmount: 50, paymentMethod: method,
          customerName: null, invoiceNumber: 'INV-001', createdAt: new Date(), updatedAt: new Date()
        };
        expect(sale.paymentMethod).toBe(method);
      });
    });
  });

  describe('SaleItem type', () => {
    it('should accept valid sale item', () => {
      const saleItem: SaleItem = {
        id: 1, saleId: 1, itemId: 1, quantity: 5, unitPrice: 10, totalPrice: 50
      };
      expect(saleItem.quantity).toBe(5);
      expect(saleItem.totalPrice).toBe(50);
    });

    it('should accept optional itemName', () => {
      const saleItem: SaleItem = {
        id: 1, saleId: 1, itemId: 1, quantity: 5, unitPrice: 10, totalPrice: 50, itemName: 'Test'
      };
      expect(saleItem.itemName).toBe('Test');
    });
  });

  describe('SaleWithItems type', () => {
    it('should extend Sale with items array', () => {
      const sale: SaleWithItems = {
        id: 1, saleDate: new Date(), totalAmount: 100, paymentMethod: 'cash',
        customerName: null, invoiceNumber: 'INV-001', createdAt: new Date(), updatedAt: new Date(),
        items: [{ id: 1, saleId: 1, itemId: 1, quantity: 2, unitPrice: 50, totalPrice: 100 }]
      };
      expect(sale.items).toHaveLength(1);
      expect(sale.items[0].quantity).toBe(2);
    });
  });

  describe('Notification type', () => {
    it('should accept all notification types', () => {
      const types: Notification['type'][] = ['success', 'error', 'warning', 'info'];
      types.forEach(type => {
        const notification: Notification = { id: '1', type, message: 'Test' };
        expect(notification.type).toBe(type);
      });
    });

    it('should accept optional duration', () => {
      const notification: Notification = { id: '1', type: 'info', message: 'Test', duration: 5000 };
      expect(notification.duration).toBe(5000);
    });
  });

  describe('DashboardOverview type', () => {
    it('should have all expected fields', () => {
      const overview: DashboardOverview = {
        totalSales: 1500, totalTransactions: 25, totalItems: 40,
        lowStockItems: 5, todaySales: 150, weekSales: 800, monthSales: 1500
      };
      expect(overview.totalItems).toBe(40);
      expect(overview.lowStockItems).toBe(5);
    });
  });

  describe('DashboardAlert type', () => {
    it('should accept all severity levels', () => {
      const severities: DashboardAlert['severity'][] = ['critical', 'high', 'medium', 'low'];
      severities.forEach(severity => {
        const alert: DashboardAlert = { type: 'low_stock', message: 'Low stock', severity };
        expect(alert.severity).toBe(severity);
      });
    });

    it('should accept optional fields', () => {
      const alert: DashboardAlert = {
        type: 'low_stock', message: 'Test', severity: 'medium',
        itemId: 1, itemCode: 'T001', name: 'Test Item', stockQuantity: 5
      };
      expect(alert.itemId).toBe(1);
      expect(alert.stockQuantity).toBe(5);
    });
  });

  describe('ExpiryAlertSummary type', () => {
    it('should have expired and expiring soon arrays', () => {
      const summary: ExpiryAlertSummary = {
        expired: [{ type: 'expired', message: 'Expired', severity: 'critical' }],
        expiringSoon: [{ type: 'expiring', message: 'Expiring', severity: 'high' }],
        totalExpired: 1,
        totalExpiringSoon: 1
      };
      expect(summary.expired).toHaveLength(1);
      expect(summary.expiringSoon).toHaveLength(1);
    });
  });

  describe('SalesSummary type', () => {
    it('should have date, sales, and count', () => {
      const summary: SalesSummary = { date: '2025-01-01', totalSales: 500, transactionCount: 10 };
      expect(summary.date).toBe('2025-01-01');
      expect(summary.transactionCount).toBe(10);
    });
  });

  describe('TopSellingItem type', () => {
    it('should have all fields', () => {
      const item: TopSellingItem = { itemId: 1, itemName: 'Product A', totalQuantity: 100, totalRevenue: 999.99 };
      expect(item.itemName).toBe('Product A');
      expect(item.totalRevenue).toBe(999.99);
    });
  });

  describe('Category type', () => {
    it('should have id, name, and createdAt', () => {
      const cat: Category = { id: 1, name: 'Electronics', createdAt: new Date() };
      expect(cat.name).toBe('Electronics');
    });
  });
});
