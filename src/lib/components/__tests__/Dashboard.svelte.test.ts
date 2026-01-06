import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import Dashboard from '$lib/components/Dashboard.svelte';

const mockOverview = {
  totalSales: 1500.00,
  totalTransactions: 25,
  totalItems: 10,
  lowStockItems: 2,
  todaySales: 150.00,
  weekSales: 800.00,
  monthSales: 1500.00
};

const mockSalesTrends = [
  { date: '2024-01-01', totalSales: 100.00, transactionCount: 5 },
  { date: '2024-01-02', totalSales: 150.00, transactionCount: 8 },
  { date: '2024-01-03', totalSales: 200.00, transactionCount: 10 },
  { date: '2024-01-04', totalSales: 75.00, transactionCount: 3 },
  { date: '2024-01-05', totalSales: 250.00, transactionCount: 12 },
  { date: '2024-01-06', totalSales: 180.00, transactionCount: 9 },
  { date: '2024-01-07', totalSales: 220.00, transactionCount: 11 }
];

const mockTopSelling = [
  { itemId: 1, itemName: 'Test Product A', totalQuantity: 50, totalRevenue: 549.50 },
  { itemId: 2, itemName: 'Test Product B', totalQuantity: 35, totalRevenue: 892.50 },
  { itemId: 3, itemName: 'Test Product C', totalQuantity: 25, totalRevenue: 274.75 }
];

const mockAlerts = [
  { type: 'low_stock', message: 'Test Product B is running low (5 remaining)', severity: 'medium', itemId: 2, itemCode: 'TPB002', name: 'Test Product B', stockQuantity: 5 },
  { type: 'out_of_stock', message: 'Test Product C is out of stock', severity: 'critical', itemId: 3, itemCode: 'TPC003', name: 'Test Product C', stockQuantity: 0 }
];

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render loading skeleton when loading', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: {} })
      })
    );
    const { container } = render(Dashboard);
    await waitFor(() => {
      const skeleton = container.querySelector('.loading-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  it('should render welcome header', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });
  });

  it('should display dashboard title', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText("Here's what's happening with your inventory today")).toBeInTheDocument();
    });
  });

  it('should render period tabs', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    const { container } = render(Dashboard);
    await waitFor(() => {
      const periodTabs = container.querySelector('.period-tabs');
      expect(periodTabs).toBeTruthy();
      expect(container.querySelector('.period-tab')).toBeTruthy();
    });
  });

  it('should render all stat cards', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total Sales')).toBeInTheDocument();
      expect(screen.getByText('Stock Level')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });
  });

  it('should display total revenue', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    });
  });

  it('should display total transactions', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('should display stock level percentage', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  it('should display stock level as Excellent', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Excellent Stock')).toBeInTheDocument();
    });
  });

  it('should render sales trends section', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Sales Trends')).toBeInTheDocument();
      expect(screen.getByText('Daily sales for the past week')).toBeInTheDocument();
    });
  });

  it('should render top selling items section', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Top Selling Items')).toBeInTheDocument();
      expect(screen.getByText('Best performing products this period')).toBeInTheDocument();
    });
  });

  it('should display top selling items with ranks', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });
  });

  it('should render alerts section when alerts exist', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Stock Alerts')).toBeInTheDocument();
    });
  });

  it('should display alert count', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('2 items need attention')).toBeInTheDocument();
    });
  });

  it('should render critical alerts', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Critical (1)')).toBeInTheDocument();
    });
  });

  it('should render low stock alerts', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Low Stock (1)')).toBeInTheDocument();
    });
  });

  it('should render quick actions button', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    const { container } = render(Dashboard);
    await waitFor(() => {
      const quickActionsButton = container.querySelector('.btn-primary');
      expect(quickActionsButton?.textContent).toContain('Quick Actions');
    });
  });

  it('should toggle quick actions panel', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    const { container } = render(Dashboard);
    await waitFor(() => {
      const quickActionsButton = container.querySelector('.btn-primary');
      fireEvent.click(quickActionsButton as HTMLElement);
    });
    await waitFor(() => {
      const quickActionsPanel = container.querySelector('.quick-actions-panel');
      expect(quickActionsPanel).toBeTruthy();
    });
  });

  it('should render quick actions in panel', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    const { container } = render(Dashboard);
    await waitFor(() => {
      const quickActionsButton = container.querySelector('.btn-primary');
      fireEvent.click(quickActionsButton as HTMLElement);
    });
    await waitFor(() => {
      expect(container.textContent).toContain('Add Item');
      expect(container.textContent).toContain('Record Sale');
      expect(container.textContent).toContain('Check Stock');
      expect(container.textContent).toContain('Generate Report');
    });
  });

  it('should change period on tab click', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    const { container } = render(Dashboard);
    await waitFor(() => {
      const weekTab = container.querySelectorAll('.period-tab')[1];
      fireEvent.click(weekTab as HTMLElement);
    });
    await waitFor(() => {
      expect(container.querySelector('.period-tab.active')?.textContent).toContain('This Week');
    });
  });

  it('should show error state on fetch failure', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Failed to fetch'));
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Unable to Load Dashboard')).toBeInTheDocument();
    });
  });

  it('should render retry button on error', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Failed to fetch'));
    const { container } = render(Dashboard);
    await waitFor(() => {
      const retryButton = container.querySelector('.btn-primary');
      expect(retryButton?.textContent).toContain('Retry');
    });
  });

  it('should show empty state when no overview data', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: null, salesTrends: [], topSelling: [], alerts: [] } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Add your first item to the inventory to see dashboard analytics')).toBeInTheDocument();
    });
  });

  it('should show empty top selling state when no data', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: [], alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('No top selling items found')).toBeInTheDocument();
      expect(screen.getByText('Start recording sales to see analytics')).toBeInTheDocument();
    });
  });

  it('should show empty sales trends when no data', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: [], topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      const salesTrendsSection = screen.queryByText('Sales Trends');
      expect(salesTrendsSection).not.toBeInTheDocument();
    });
  });

  it('should not show alerts section when no alerts', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: [] } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      const alertsSection = screen.queryByText('Stock Alerts');
      expect(alertsSection).not.toBeInTheDocument();
    });
  });

  it('should display stat trends with percentage', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      const trendElements = screen.queryAllByText(/↗|↘/);
      expect(trendElements.length).toBeGreaterThan(0);
    });
  });

  it('should display stat period labels', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    render(Dashboard);
    await waitFor(() => {
      expect(screen.getByText('This Month')).toBeInTheDocument();
      expect(screen.getByText('Transactions')).toBeInTheDocument();
      expect(screen.getByText('Efficiency')).toBeInTheDocument();
    });
  });

  it('should render stock progress bar', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    const { container } = render(Dashboard);
    await waitFor(() => {
      const progressBar = container.querySelector('.progress-bar');
      expect(progressBar).toBeTruthy();
    });
  });

  it('should render progress fill with correct width', async () => {
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { overview: mockOverview, salesTrends: mockSalesTrends, topSelling: mockTopSelling, alerts: mockAlerts } })
      })
    );
    const { container } = render(Dashboard);
    await waitFor(() => {
      const progressFill = container.querySelector('.progress-fill');
      expect(progressFill).toBeTruthy();
      expect(progressFill?.getAttribute('style')).toContain('width: 80%');
    });
  });
});
