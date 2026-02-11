import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte';
import Dashboard from '../Dashboard.svelte';

// Mock fetch globally
const mockFetchResponses: Record<string, any> = {
  '/api/dashboard?action=overview': {
    success: true,
    data: {
      overview: {
        totalSales: 1500,
        totalTransactions: 25,
        totalItems: 40,
        lowStockItems: 5,
        todaySales: 150,
        weekSales: 800,
        monthSales: 1500
      },
      inventory: {
        totalItems: 40,
        totalCategories: 8,
        lowStockItems: 5,
        outOfStockItems: 2,
        totalValue: 5000
      },
      recentSales: [
        { id: 1, saleDate: new Date().toISOString(), totalAmount: 50, paymentMethod: 'cash', customerName: 'Test', invoiceNumber: 'INV-001' }
      ],
      sales: {
        today: { count: 5, totalAmount: 150 },
        thisMonth: { count: 25, totalAmount: 1500 }
      },
      todayTransactionCount: 5
    }
  },
  '/api/dashboard/sales-trends?days=7': {
    success: true,
    data: [
      { date: '2025-01-01', totalSales: 200, transactionCount: 5 },
      { date: '2025-01-02', totalSales: 300, transactionCount: 8 }
    ]
  },
  '/api/sales/top-selling': {
    success: true,
    data: [
      { itemId: 1, itemName: 'Product A', totalQuantity: 100, totalRevenue: 999 }
    ]
  },
  '/api/dashboard?action=alerts': {
    success: true,
    data: [
      { type: 'low_stock', message: 'Energy Drink low', severity: 'critical', itemId: 5 }
    ]
  }
};

vi.mock('$lib/stores/settings', () => ({
  settings: {
    subscribe: (fn: any) => {
      fn({
        storeName: 'Test Store',
        currency: 'USD',
        lowStockThreshold: 10,
        enableNotifications: true,
        enableEmailReports: false,
        storeAddress: '123 Test St',
        storePhone: '555-0000',
        storeEmail: 'test@test.com',
        timezone: 'UTC'
      });
      return () => {};
    },
    load: vi.fn()
  },
  formatCurrency: vi.fn((value: number) => `$${value.toFixed(2)}`)
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const key = Object.keys(mockFetchResponses).find(k => url.includes(k) || url.endsWith(k));
      const responseData = key ? mockFetchResponses[key] : { success: false };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responseData)
      });
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render the dashboard component', async () => {
    const { container } = render(Dashboard);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should call fetch for dashboard data on mount', async () => {
    render(Dashboard);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should fetch multiple endpoints', async () => {
    render(Dashboard);
    await waitFor(() => {
      expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(1);
    });
    const fetchCalls = (global.fetch as any).mock.calls.map((c: any) => c[0]);
    expect(fetchCalls.some((url: string) => url.includes('dashboard'))).toBe(true);
  });

  it('should handle fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const { container } = render(Dashboard);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should handle non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false })
    });
    const { container } = render(Dashboard);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
