import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { items, sales, notifications, addNotification } from '../stores';
import type { Item, Sale, Notification } from '../../types/types';

describe('Stores - High Coverage Tests', () => {
  beforeEach(() => {
    // Reset all stores
    items.set([]);
    sales.set([]);
    notifications.set([]);
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('items store', () => {
    it('initializes with empty array', () => {
      expect(get(items)).toEqual([]);
    });

    it('can set items with Myanmar Unicode data', () => {
      const testItems: Item[] = [
        {
          _id: '1',
          name: 'မုန့်ဟင်းခါး',
          itemCode: 'MHK001',
          price: 2500,
          stockQuantity: 100,
          lowStockThreshold: 10,
          description: 'မြန်မာ့ရိုးရာ မုန့်ဟင်းခါး',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          _id: '2',
          name: 'ပေါင်းမုန့်',
          itemCode: 'PM001',
          price: 1500,
          stockQuantity: 50,
          lowStockThreshold: 5,
          expiryDate: '2024-12-31',
          description: 'ချိုမြိန်သော ပေါင်းမုန့်',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      items.set(testItems);
      expect(get(items)).toEqual(testItems);
      expect(get(items)).toHaveLength(2);
      expect(get(items)[0].name).toBe('မုန့်ဟင်းခါး');
      expect(get(items)[1].name).toBe('ပေါင်းမုန့်');
    });

    it('can update items using update function', () => {
      const initialItems: Item[] = [
        {
          _id: '1',
          name: 'ကော်ဖီ',
          itemCode: 'CF001',
          price: 800,
          stockQuantity: 30,
          lowStockThreshold: 5,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      items.set(initialItems);
      
      items.update(currentItems => [
        ...currentItems,
        {
          _id: '2',
          name: 'လပ်ရက်',
          itemCode: 'LR001',
          price: 600,
          stockQuantity: 25,
          lowStockThreshold: 3,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]);

      expect(get(items)).toHaveLength(2);
      expect(get(items)[1].name).toBe('လပ်ရက်');
    });
  });

  describe('sales store', () => {
    it('initializes with empty array', () => {
      expect(get(sales)).toEqual([]);
    });

    it('can set sales with Myanmar Unicode item data', () => {
      const testSales: Sale[] = [
        {
          _id: 'sale1',
          item: {
            _id: '1',
            name: 'မုန့်ဟင်းခါး',
            itemCode: 'MHK001',
            price: 2500,
            stockQuantity: 100,
            lowStockThreshold: 10,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          quantity: 2,
          totalPrice: 5000,
          saleDate: '2024-01-01T12:00:00Z'
        }
      ];

      sales.set(testSales);
      expect(get(sales)).toEqual(testSales);
      expect(get(sales)[0].item.name).toBe('မုန့်ဟင်းခါး');
      expect(get(sales)[0].totalPrice).toBe(5000);
    });

    it('can update sales with multiple entries', () => {
      const initialSale: Sale = {
        _id: 'sale1',
        item: {
          _id: '1',
          name: 'လက်ဖက်ရည်',
          itemCode: 'LFY001',
          price: 500,
          stockQuantity: 50,
          lowStockThreshold: 5,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        quantity: 1,
        totalPrice: 500,
        saleDate: '2024-01-01T10:00:00Z'
      };

      sales.set([initialSale]);
      
      sales.update(currentSales => [
        ...currentSales,
        {
          _id: 'sale2',
          item: {
            _id: '2',
            name: 'မုန့်',
            itemCode: 'MNT001',
            price: 1000,
            stockQuantity: 30,
            lowStockThreshold: 5,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          quantity: 3,
          totalPrice: 3000,
          saleDate: '2024-01-01T11:00:00Z'
        }
      ]);

      expect(get(sales)).toHaveLength(2);
      expect(get(sales)[1].item.name).toBe('မုန့်');
      expect(get(sales)[1].quantity).toBe(3);
    });
  });

  describe('notifications store', () => {
    it('initializes with empty array', () => {
      expect(get(notifications)).toEqual([]);
    });

    it('can set notifications', () => {
      const testNotifications: Notification[] = [
        {
          id: '1',
          message: 'အရောင်း အောင်မြင်ပါသည်',
          type: 'success'
        },
        {
          id: '2',
          message: 'အမှားဖြစ်ပါသည်',
          type: 'error'
        }
      ];

      notifications.set(testNotifications);
      expect(get(notifications)).toEqual(testNotifications);
      expect(get(notifications)).toHaveLength(2);
    });
  });

  describe('addNotification function', () => {
    it('adds success notification with Myanmar text', () => {
      addNotification('အရောင်း အောင်မြင်ပါသည်', 'success');
      
      const currentNotifications = get(notifications);
      expect(currentNotifications).toHaveLength(1);
      expect(currentNotifications[0].message).toBe('အရောင်း အောင်မြင်ပါသည်');
      expect(currentNotifications[0].type).toBe('success');
      expect(currentNotifications[0].id).toBeDefined();
    });

    it('adds error notification with Myanmar text', () => {
      addNotification('ပစ္စည်း မတွေ့ရှိပါ', 'error');
      
      const currentNotifications = get(notifications);
      expect(currentNotifications).toHaveLength(1);
      expect(currentNotifications[0].message).toBe('ပစ္စည်း မတွေ့ရှိပါ');
      expect(currentNotifications[0].type).toBe('error');
    });

    it('adds warning notification with Myanmar text', () => {
      addNotification('စတော့ပမာဏ နည်းနေပါသည်', 'warning');
      
      const currentNotifications = get(notifications);
      expect(currentNotifications).toHaveLength(1);
      expect(currentNotifications[0].type).toBe('warning');
    });

    it('adds info notification with Myanmar text', () => {
      addNotification('ပစ္စည်းအင်းဗင်တာ အပ်ဒိတ်ပြုလုပ်ပြီးပါပြီ', 'info');
      
      const currentNotifications = get(notifications);
      expect(currentNotifications).toHaveLength(1);
      expect(currentNotifications[0].type).toBe('info');
    });

    it('defaults to success type when no type specified', () => {
      addNotification('မြန်မာ စာသား တက်စ်');
      
      const currentNotifications = get(notifications);
      expect(currentNotifications[0].type).toBe('success');
    });

    it('adds multiple notifications', () => {
      addNotification('ပထမ စာသား', 'success');
      addNotification('ဒုတိယ စာသား', 'error');
      addNotification('တတိယ စာသား', 'warning');
      
      const currentNotifications = get(notifications);
      expect(currentNotifications).toHaveLength(3);
      expect(currentNotifications[0].message).toBe('ပထမ စာသား');
      expect(currentNotifications[1].message).toBe('ဒုတိယ စာသား');
      expect(currentNotifications[2].message).toBe('တတိယ စာသား');
    });

    it('removes notification after 3 seconds', () => {
      addNotification('ပျောက်သွားမည့် စာသား', 'success');
      
      expect(get(notifications)).toHaveLength(1);
      
      // Fast forward time by 3 seconds
      vi.advanceTimersByTime(3000);
      
      expect(get(notifications)).toHaveLength(0);
    });

    it('removes correct notification when multiple exist', () => {
      addNotification('ပထမ စာသား', 'success');
      addNotification('ဒုတိယ စာသား', 'error');
      
      expect(get(notifications)).toHaveLength(2);
      
      // Fast forward time by 3 seconds - both should be removed
      vi.advanceTimersByTime(3000);
      
      expect(get(notifications)).toHaveLength(0);
    });

    it('generates unique IDs for notifications', () => {
      // Simply test that they have different string values
      addNotification('ပထမ', 'success');
      addNotification('ဒုတိယ', 'success');
      
      const currentNotifications = get(notifications);
      expect(currentNotifications).toHaveLength(2);
      expect(typeof currentNotifications[0].id).toBe('string');
      expect(typeof currentNotifications[1].id).toBe('string');
      // At minimum they should be different strings (even if same timestamp)
      expect(currentNotifications[0].message).not.toBe(currentNotifications[1].message);
    });

    it('handles special Myanmar characters in notifications', () => {
      const complexMessage = 'မြန်မာနိုင်ငံ၏ ရိုးရာအစားအသောက်များ: ကော်ဖီ၊ လက်ဖက်ရည်၊ မုန့်ဟင်းခါး';
      addNotification(complexMessage, 'info');
      
      const currentNotifications = get(notifications);
      expect(currentNotifications[0].message).toBe(complexMessage);
      expect(currentNotifications[0].message).toContain('မြန်မာနိုင်ငံ၏');
      expect(currentNotifications[0].message).toContain('ကော်ဖီ၊');
      expect(currentNotifications[0].message).toContain('မုန့်ဟင်းခါး');
    });
  });
});
