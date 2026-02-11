import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
  items,
  sales,
  notifications,
  loading,
  lowStockItems,
  totalInventoryValue,
  todaySales,
  todayRevenue,
  addNotification,
  removeNotification,
  clearNotifications
} from '$lib/stores';
import type { Item, Sale } from '$lib/types';

describe('Root Stores', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    items.set([]);
    sales.set([]);
    notifications.set([]);
    loading.set(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('items store', () => {
    it('should start empty', () => {
      expect(get(items)).toEqual([]);
    });

    it('should accept item array', () => {
      const testItems: Item[] = [
        { id: 1, name: 'Item A', itemCode: 'A001', price: 10, stockQuantity: 50, lowStockThreshold: 10, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() }
      ];
      items.set(testItems);
      expect(get(items)).toHaveLength(1);
      expect(get(items)[0].name).toBe('Item A');
    });
  });

  describe('sales store', () => {
    it('should start empty', () => {
      expect(get(sales)).toEqual([]);
    });

    it('should accept sale array', () => {
      const testSales: Sale[] = [
        { id: 1, saleDate: new Date(), totalAmount: 100, paymentMethod: 'cash', customerName: null, invoiceNumber: 'INV-001', createdAt: new Date(), updatedAt: new Date() }
      ];
      sales.set(testSales);
      expect(get(sales)).toHaveLength(1);
    });
  });

  describe('loading store', () => {
    it('should start false', () => {
      expect(get(loading)).toBe(false);
    });

    it('should toggle loading state', () => {
      loading.set(true);
      expect(get(loading)).toBe(true);
      loading.set(false);
      expect(get(loading)).toBe(false);
    });
  });

  describe('lowStockItems derived store', () => {
    it('should return empty when no items', () => {
      expect(get(lowStockItems)).toEqual([]);
    });

    it('should filter items at or below threshold', () => {
      items.set([
        { id: 1, name: 'Low', itemCode: 'L001', price: 10, stockQuantity: 5, lowStockThreshold: 10, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'OK', itemCode: 'O001', price: 20, stockQuantity: 50, lowStockThreshold: 10, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, name: 'AtThreshold', itemCode: 'T001', price: 15, stockQuantity: 10, lowStockThreshold: 10, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 4, name: 'OutOfStock', itemCode: 'X001', price: 5, stockQuantity: 0, lowStockThreshold: 5, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() }
      ]);
      const low = get(lowStockItems);
      expect(low).toHaveLength(3);
      expect(low.map(i => i.name)).toContain('Low');
      expect(low.map(i => i.name)).toContain('AtThreshold');
      expect(low.map(i => i.name)).toContain('OutOfStock');
    });

    it('should not include items above threshold', () => {
      items.set([
        { id: 1, name: 'OK', itemCode: 'O001', price: 20, stockQuantity: 50, lowStockThreshold: 10, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() }
      ]);
      expect(get(lowStockItems)).toHaveLength(0);
    });
  });

  describe('totalInventoryValue derived store', () => {
    it('should return 0 when no items', () => {
      expect(get(totalInventoryValue)).toBe(0);
    });

    it('should calculate total value correctly', () => {
      items.set([
        { id: 1, name: 'A', itemCode: 'A001', price: 10, stockQuantity: 5, lowStockThreshold: 2, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'B', itemCode: 'B001', price: 20, stockQuantity: 3, lowStockThreshold: 2, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() }
      ]);
      // 10*5 + 20*3 = 50 + 60 = 110
      expect(get(totalInventoryValue)).toBe(110);
    });

    it('should handle zero stock quantity', () => {
      items.set([
        { id: 1, name: 'A', itemCode: 'A001', price: 100, stockQuantity: 0, lowStockThreshold: 5, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() }
      ]);
      expect(get(totalInventoryValue)).toBe(0);
    });

    it('should handle zero price', () => {
      items.set([
        { id: 1, name: 'A', itemCode: 'A001', price: 0, stockQuantity: 50, lowStockThreshold: 5, category: null, expiryDate: null, createdAt: new Date(), updatedAt: new Date() }
      ]);
      expect(get(totalInventoryValue)).toBe(0);
    });
  });

  describe('todaySales derived store', () => {
    it('should return empty when no sales', () => {
      expect(get(todaySales)).toEqual([]);
    });

    it('should filter sales from today only', () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      sales.set([
        { id: 1, saleDate: now, totalAmount: 50, paymentMethod: 'cash', customerName: null, invoiceNumber: 'INV-001', createdAt: now, updatedAt: now },
        { id: 2, saleDate: yesterday, totalAmount: 30, paymentMethod: 'credit', customerName: null, invoiceNumber: 'INV-002', createdAt: yesterday, updatedAt: yesterday }
      ]);

      const today = get(todaySales);
      expect(today).toHaveLength(1);
      expect(today[0].id).toBe(1);
    });
  });

  describe('todayRevenue derived store', () => {
    it('should return 0 when no sales today', () => {
      expect(get(todayRevenue)).toBe(0);
    });

    it('should sum today sales amounts', () => {
      const now = new Date();
      sales.set([
        { id: 1, saleDate: now, totalAmount: 50, paymentMethod: 'cash', customerName: null, invoiceNumber: 'INV-001', createdAt: now, updatedAt: now },
        { id: 2, saleDate: now, totalAmount: 75.50, paymentMethod: 'credit', customerName: null, invoiceNumber: 'INV-002', createdAt: now, updatedAt: now }
      ]);
      expect(get(todayRevenue)).toBe(125.50);
    });
  });

  describe('addNotification', () => {
    it('should add notification with generated id', () => {
      addNotification({ message: 'Test', type: 'success' });
      const n = get(notifications);
      expect(n).toHaveLength(1);
      expect(n[0].message).toBe('Test');
      expect(n[0].type).toBe('success');
      expect(n[0].id).toBeDefined();
    });

    it('should auto-remove after default 5s duration', () => {
      addNotification({ message: 'Auto remove', type: 'info' });
      expect(get(notifications)).toHaveLength(1);
      vi.advanceTimersByTime(5000);
      expect(get(notifications)).toHaveLength(0);
    });

    it('should auto-remove after custom duration', () => {
      addNotification({ message: 'Custom', type: 'warning', duration: 2000 });
      expect(get(notifications)).toHaveLength(1);
      vi.advanceTimersByTime(2000);
      expect(get(notifications)).toHaveLength(0);
    });

    it('should NOT auto-remove when duration is 0', () => {
      addNotification({ message: 'Permanent', type: 'error', duration: 0 });
      expect(get(notifications)).toHaveLength(1);
      vi.advanceTimersByTime(60000);
      expect(get(notifications)).toHaveLength(1);
    });

    it('should add multiple notifications', () => {
      addNotification({ message: 'First', type: 'success' });
      addNotification({ message: 'Second', type: 'error' });
      addNotification({ message: 'Third', type: 'info' });
      expect(get(notifications)).toHaveLength(3);
    });
  });

  describe('removeNotification', () => {
    it('should remove by id', () => {
      addNotification({ message: 'Test', type: 'success', duration: 0 });
      const n = get(notifications);
      removeNotification(n[0].id);
      expect(get(notifications)).toHaveLength(0);
    });

    it('should handle non-existent id gracefully', () => {
      addNotification({ message: 'Test', type: 'success', duration: 0 });
      removeNotification('nonexistent');
      expect(get(notifications)).toHaveLength(1);
    });
  });

  describe('clearNotifications', () => {
    it('should clear all notifications', () => {
      addNotification({ message: 'A', type: 'success', duration: 0 });
      addNotification({ message: 'B', type: 'error', duration: 0 });
      clearNotifications();
      expect(get(notifications)).toHaveLength(0);
    });

    it('should work when already empty', () => {
      clearNotifications();
      expect(get(notifications)).toHaveLength(0);
    });
  });
});
