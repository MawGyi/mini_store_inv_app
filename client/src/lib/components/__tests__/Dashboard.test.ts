import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import Dashboard from '../Dashboard.svelte';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    getDashboardStats: vi.fn(),
    getItems: vi.fn(),
    getCategories: vi.fn(),
  },
}));

// Mock translation helpers
const mockTStore = {
  subscribe: vi.fn((callback) => {
    callback((key: string) => key); // Return key as translation
    return () => {}; // Unsubscribe function
  })
};

vi.mock('../../stores/translationHelpers', () => ({
  t: mockTStore,
  formatCurrency: (amount: number) => `${amount} MMK`,
  formatDate: (date: Date) => date.toLocaleDateString()
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders dashboard with loading state', () => {
    render(Dashboard);
    
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  test('displays dashboard data after loading', async () => {
    const mockApiService = await import('../../services/api');
    mockApiService.apiService.get = vi.fn().mockResolvedValue({
      success: true,
      data: {
        todaySales: 150000,
        totalItems: 245,
        lowStockItems: 5,
      },
    });

    render(Dashboard);

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    const mockApiService = await import('../../services/api');
    mockApiService.apiService.get = vi.fn().mockRejectedValue(new Error('API Error'));

    render(Dashboard);

    await waitFor(() => {
      expect(screen.getByText(/error.*loading/i)).toBeInTheDocument();
    });
  });

  test('refreshes data when refresh button is clicked', async () => {
    const mockApiService = await import('../../services/api');
    const getSpy = vi.fn().mockResolvedValue({
      success: true,
      data: { todaySales: 150000 },
    });
    mockApiService.apiService.get = getSpy;

    render(Dashboard);

    const refreshButton = screen.getByTestId('refresh-button');
    await fireEvent.click(refreshButton);

    expect(getSpy).toHaveBeenCalledTimes(4); // Initial load + refresh
  });
});
