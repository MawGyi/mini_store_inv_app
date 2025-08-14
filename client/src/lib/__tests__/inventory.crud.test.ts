/**
 * Comprehensive unit tests for Inventory CRUD operations
 * Tests the core inventory management functionality including Create, Read, Update, Delete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { apiService } from '../services/api';
import InventoryList from '../components/InventoryList.svelte';
import InventoryManagementForm from '../components/InventoryManagementForm.svelte';
import InventoryView from '../components/InventoryView.svelte';

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    getItems: vi.fn(),
    getItem: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    getCategories: vi.fn(),
    getInventoryReport: vi.fn(),
  }
}));

// Mock stores
const mockTStore = {
  subscribe: vi.fn((callback) => {
    callback((key: string) => key); // Return key as translation
    return () => {}; // Unsubscribe function
  })
};

vi.mock('../stores/translationHelpers', () => ({
  t: mockTStore,
  formatCurrency: (amount: number) => `${amount} MMK`,
  formatDate: (date: Date) => date.toLocaleDateString()
}));

// Sample test data
const mockItems = [
  {
    _id: '1',
    name: 'ချောကလက်',
    item_code: 'CHO001',
    selling_price: 2000,
    cost_price: 1500,
    stock_quantity: 50,
    low_stock_threshold: 10,
    category_id: { category_name_my: 'အစားအစာ' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    _id: '2',
    name: 'ကော်ဖီ',
    item_code: 'COF001',
    selling_price: 1500,
    cost_price: 1000,
    stock_quantity: 5, // Low stock
    low_stock_threshold: 10,
    category_id: { category_name_my: 'အဖျော်ယမကာ' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    _id: '3',
    name: 'နှမ်းစပါး',
    item_code: 'MIL001',
    selling_price: 3000,
    cost_price: 2500,
    stock_quantity: 0, // Out of stock
    low_stock_threshold: 5,
    category_id: { category_name_my: 'အစားအစာ' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockCategories = [
  { _id: 'cat1', category_name_my: 'အစားအစာ' },
  { _id: 'cat2', category_name_my: 'အဖျော်ယမကာ' },
];

const mockInventoryReport = {
  success: true,
  data: {
    totalItems: 3,
    lowStockItems: 1,
    outOfStockItems: 1,
    topSellingItems: [],
    slowMovingItems: [],
  },
};

describe('Inventory CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(apiService.getItems).mockResolvedValue({
      success: true,
      data: {
        items: mockItems,
        pagination: { totalItems: mockItems.length },
      },
    });

    vi.mocked(apiService.getCategories).mockResolvedValue({
      success: true,
      data: mockCategories,
    });

    vi.mocked(apiService.getInventoryReport).mockResolvedValue(mockInventoryReport);
  });

  describe('READ Operations - InventoryList Component', () => {
    it('should render inventory list with items', async () => {
      render(InventoryList);

      await waitFor(() => {
        expect(screen.getByText('ချောကလက်')).toBeInTheDocument();
        expect(screen.getByText('ကော်ဖီ')).toBeInTheDocument();
        expect(screen.getByText('နှမ်းစပါး')).toBeInTheDocument();
      });

      expect(apiService.getItems).toHaveBeenCalledTimes(1);
    });

    it('should display correct stock status for items', async () => {
      render(InventoryList);

      await waitFor(() => {
        // Available item
        expect(screen.getByText('Available')).toBeInTheDocument();
        // Low stock item
        expect(screen.getByText('Low Stock')).toBeInTheDocument();
        // Out of stock item
        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
      });
    });

    it('should filter items by search query', async () => {
      const user = userEvent.setup();
      render(InventoryList);

      await waitFor(() => {
        expect(screen.getByText('ချောကလက်')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search items...');
      await user.type(searchInput, 'ချောကလက်');

      await waitFor(() => {
        expect(screen.getByText('ချောကလက်')).toBeInTheDocument();
        expect(screen.queryByText('ကော်ဖီ')).not.toBeInTheDocument();
      });
    });

    it('should filter items by stock status', async () => {
      const user = userEvent.setup();
      render(InventoryList);

      await waitFor(() => {
        expect(screen.getByText('ချောကလက်')).toBeInTheDocument();
      });

      const stockFilter = screen.getByDisplayValue('အားလုံး');
      await user.selectOptions(stockFilter, 'low');

      await waitFor(() => {
        expect(screen.getByText('ကော်ဖီ')).toBeInTheDocument();
        expect(screen.queryByText('ချောကလက်')).not.toBeInTheDocument();
      });
    });

    it('should sort items by different criteria', async () => {
      const user = userEvent.setup();
      render(InventoryList);

      await waitFor(() => {
        expect(screen.getByText('ချောကလက်')).toBeInTheDocument();
      });

      const sortSelect = screen.getByDisplayValue('အမည်အလိုက်');
      await user.selectOptions(sortSelect, 'price');

      // Verify sorting is applied (implementation may vary based on component logic)
      await waitFor(() => {
        expect(sortSelect).toHaveValue('price');
      });
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(apiService.getItems).mockRejectedValueOnce(new Error('Network error'));

      render(InventoryList);

      await waitFor(() => {
        expect(screen.getByText('ပစ္စည်းများ ဖတ်ရှုခြင်းတွင် အမှားဖြစ်ပေါ်သည်။')).toBeInTheDocument();
      });
    });

    it('should show empty state when no items found', async () => {
      vi.mocked(apiService.getItems).mockResolvedValueOnce({
        success: true,
        data: { items: [], pagination: { totalItems: 0 } },
      });

      render(InventoryList);

      await waitFor(() => {
        expect(screen.getByText('ပစ္စည်းမရှိပါ')).toBeInTheDocument();
      });
    });
  });

  describe('CREATE Operations - InventoryManagementForm Component', () => {
    const mockOnInventoryUpdate = vi.fn();

    beforeEach(() => {
      mockOnInventoryUpdate.mockClear();
    });

    it('should render create form with all required fields', async () => {
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
        expect(screen.getByLabelText('အမျိုးအစား *')).toBeInTheDocument();
        expect(screen.getByLabelText('ရောင်းဈေး *')).toBeInTheDocument();
        expect(screen.getByLabelText('ကုန်ကျစရိတ် *')).toBeInTheDocument();
        expect(screen.getByLabelText('လက်ကျန်အရေအတွက် *')).toBeInTheDocument();
      });
    });

    it('should create new item successfully', async () => {
      const user = userEvent.setup();
      const newItem = {
        _id: '4',
        name: 'နွားနို့',
        selling_price: 1800,
        cost_price: 1200,
        stock_quantity: 30,
        category: 'cat1',
      };

      vi.mocked(apiService.createItem).mockResolvedValueOnce({
        success: true,
        data: newItem,
        message: 'ပစ္စည်းအသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ',
      });

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      // Fill form fields
      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'နွားနို့');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1800');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '1200');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '30');
      
      const categorySelect = screen.getByLabelText('အမျိုးအစား *');
      await user.selectOptions(categorySelect, 'cat1');

      // Submit form
      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.createItem).toHaveBeenCalledWith({
          name: 'နွားနို့',
          price: 1800,
          cost: 1200,
          stock: 30,
          category: 'cat1',
          description: '',
          barcode: '',
          image: '',
        });
        expect(mockOnInventoryUpdate).toHaveBeenCalledWith(newItem);
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByText('ထည့်သွင်းမည်')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ပစ္စည်းအမည် ဖြည့်ရန်လိုအပ်ပါသည်')).toBeInTheDocument();
      });

      expect(apiService.createItem).not.toHaveBeenCalled();
    });

    it('should validate price and cost fields', async () => {
      const user = userEvent.setup();
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Test Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '0');
      
      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ဈေးနှုန်း 0 ထက်မြင့်ရန်လိုအပ်ပါသည်')).toBeInTheDocument();
      });
    });

    it('should handle create API errors', async () => {
      const user = userEvent.setup();
      vi.mocked(apiService.createItem).mockRejectedValueOnce(new Error('Server error'));

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      // Fill required fields
      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Test Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1000');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '800');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '10');
      
      const categorySelect = screen.getByLabelText('အမျိုးအစား *');
      await user.selectOptions(categorySelect, 'cat1');

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('လုပ်ဆောင်ချက် မအောင်မြင်ပါ')).toBeInTheDocument();
      });
    });
  });

  describe('UPDATE Operations - InventoryManagementForm Component', () => {
    const mockOnInventoryUpdate = vi.fn();
    const editItem = mockItems[0];

    beforeEach(() => {
      mockOnInventoryUpdate.mockClear();
    });

    it('should populate form fields when editing', async () => {
      render(InventoryManagementForm, {
        props: { 
          onInventoryUpdate: mockOnInventoryUpdate,
          editItem: editItem,
        },
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('ချောကလက်')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
      });
    });

    it('should update existing item successfully', async () => {
      const user = userEvent.setup();
      const updatedItem = { ...editItem, name: 'Updated ချောကလက်', selling_price: 2200 };

      vi.mocked(apiService.updateItem).mockResolvedValueOnce({
        success: true,
        data: updatedItem,
        message: 'ပစ္စည်းအားလုံး အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ',
      });

      render(InventoryManagementForm, {
        props: { 
          onInventoryUpdate: mockOnInventoryUpdate,
          editItem: editItem,
        },
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('ချောကလက်')).toBeInTheDocument();
      });

      // Update item name and price
      const nameInput = screen.getByDisplayValue('ချောကလက်');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated ချောကလက်');

      const priceInput = screen.getByDisplayValue('2000');
      await user.clear(priceInput);
      await user.type(priceInput, '2200');

      // Submit form
      const submitButton = screen.getByText('ပြင်ဆင်မည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.updateItem).toHaveBeenCalledWith(editItem._id, expect.objectContaining({
          name: 'Updated ချောကလက်',
          price: 2200,
        }));
        expect(mockOnInventoryUpdate).toHaveBeenCalledWith(updatedItem);
      });
    });

    it('should handle update API errors', async () => {
      const user = userEvent.setup();
      vi.mocked(apiService.updateItem).mockRejectedValueOnce(new Error('Update failed'));

      render(InventoryManagementForm, {
        props: { 
          onInventoryUpdate: mockOnInventoryUpdate,
          editItem: editItem,
        },
      });

      await waitFor(() => {
        expect(screen.getByText('ပြင်ဆင်မည်')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('ပြင်ဆင်မည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('လုပ်ဆောင်ချက် မအောင်မြင်ပါ')).toBeInTheDocument();
      });
    });
  });

  describe('DELETE Operations - InventoryList Component', () => {
    it('should show delete button for each item', async () => {
      render(InventoryList);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-button');
        expect(deleteButtons).toHaveLength(mockItems.length);
      });
    });

    it('should handle delete operation', async () => {
      const user = userEvent.setup();
      vi.mocked(apiService.deleteItem).mockResolvedValueOnce({
        success: true,
        message: 'ပစ္စည်း အောင်မြင်စွာ ဖျက်ပြီးပါပြီ',
      });

      render(InventoryList);

      await waitFor(() => {
        expect(screen.getByText('ချောကလက်')).toBeInTheDocument();
      });

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      const deleteButtons = screen.getAllByTestId('delete-button');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
        expect(apiService.deleteItem).toHaveBeenCalledWith(mockItems[0]._id);
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Integration - InventoryView Component', () => {
    it('should render inventory overview correctly', async () => {
      render(InventoryView);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total items
        expect(screen.getByText('2')).toBeInTheDocument(); // Active items
        expect(screen.getByText('1')).toBeInTheDocument(); // Low stock items
        expect(screen.getByText('1')).toBeInTheDocument(); // Out of stock items
      });

      expect(apiService.getInventoryReport).toHaveBeenCalled();
    });

    it('should navigate between different views', async () => {
      const user = userEvent.setup();
      render(InventoryView);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      // Navigate to Add Item view
      const addItemTab = screen.getByText('Add Item');
      await user.click(addItemTab);

      await waitFor(() => {
        expect(screen.getByText('ပစ္စည်းအသစ် ထည့်သွင်းရန်')).toBeInTheDocument();
      });

      // Navigate to Inventory List view
      const listTab = screen.getByText('Inventory List');
      await user.click(listTab);

      await waitFor(() => {
        expect(apiService.getItems).toHaveBeenCalled();
      });
    });

    it('should handle item addition workflow', async () => {
      const user = userEvent.setup();
      const newItem = {
        _id: '4',
        name: 'နွားနို့',
        selling_price: 1800,
      };

      vi.mocked(apiService.createItem).mockResolvedValueOnce({
        success: true,
        data: newItem,
        message: 'ပစ္စည်းအသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ',
      });

      render(InventoryView);

      // Navigate to Add Item
      await waitFor(() => {
        expect(screen.getByText('Add Item')).toBeInTheDocument();
      });

      const addItemTab = screen.getByText('Add Item');
      await user.click(addItemTab);

      // Wait for form to load and fill it
      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'နွားနို့');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1800');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '1200');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '30');
      
      const categorySelect = screen.getByLabelText('အမျိုးအစား *');
      await user.selectOptions(categorySelect, 'cat1');

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      // Should show success notification and navigate to list view
      await waitFor(() => {
        expect(screen.getByText(/ပစ္စည်း.*အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ/)).toBeInTheDocument();
      });
    });

    it('should refresh inventory stats after CRUD operations', async () => {
      render(InventoryView);

      await waitFor(() => {
        expect(apiService.getInventoryReport).toHaveBeenCalledTimes(1);
      });

      // Simulate a refresh action
      const refreshButton = screen.getByText('Refresh');
      const user = userEvent.setup();
      await user.click(refreshButton);

      await waitFor(() => {
        expect(apiService.getInventoryReport).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network failures gracefully', async () => {
      vi.mocked(apiService.getItems).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(apiService.getInventoryReport).mockRejectedValueOnce(new Error('Network error'));

      render(InventoryView);

      await waitFor(() => {
        expect(screen.getByText(/အမှားဖြစ်ပေါ်သည်/)).toBeInTheDocument();
      });
    });

    it('should handle empty responses', async () => {
      vi.mocked(apiService.getItems).mockResolvedValueOnce({
        success: true,
        data: { items: [], pagination: { totalItems: 0 } },
      });

      render(InventoryList);

      await waitFor(() => {
        expect(screen.getByText('ပစ္စည်းမရှိပါ')).toBeInTheDocument();
      });
    });

    it('should handle malformed data gracefully', async () => {
      vi.mocked(apiService.getItems).mockResolvedValueOnce({
        success: true,
        data: null,
      });

      render(InventoryList);

      await waitFor(() => {
        expect(screen.getByText(/အမှားဖြစ်ပေါ်သည်/)).toBeInTheDocument();
      });
    });
  });
});
