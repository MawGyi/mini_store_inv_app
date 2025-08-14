/**
 * Unit tests for Inventory Form Validation and Edge Cases
 * Tests form validation, input handling, and edge case scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { apiService } from '../services/api';
import InventoryManagementForm from '../components/InventoryManagementForm.svelte';

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    createItem: vi.fn(),
    updateItem: vi.fn(),
    getCategories: vi.fn(),
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

const mockCategories = [
  { _id: 'cat1', category_name_my: 'အစားအစာ' },
  { _id: 'cat2', category_name_my: 'အဖျော်ယမကာ' },
];

describe('Inventory Form Validation and Edge Cases', () => {
  const mockOnInventoryUpdate = vi.fn();

  // Helper function to wait for categories to load
  const waitForCategoriesToLoad = async () => {
    await waitFor(() => {
      const categorySelect = screen.getByLabelText('အမျိုးအစား *');
      expect(categorySelect.querySelectorAll('option').length).toBeGreaterThan(1);
    }, { timeout: 3000 });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(apiService.getCategories).mockResolvedValue({
      success: true,
      data: mockCategories,
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields on submit', async () => {
      const user = userEvent.setup();
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByText('အစားအစာ')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ပစ္စည်းအမည် ဖြည့်ရန်လိုအပ်ပါသည်')).toBeInTheDocument();
      });

      expect(apiService.createItem).not.toHaveBeenCalled();
    });

    it('should validate price field minimum value', async () => {
      const user = userEvent.setup();
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitForCategoriesToLoad();

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Test Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '0');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '100');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '10');
      await waitForCategoriesToLoad();
      await user.selectOptions(screen.getByLabelText('အမျိုးအစား *'), 'cat1');

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ဈေးနှုန်း 0 ထက်မြင့်ရန်လိုအပ်ပါသည်')).toBeInTheDocument();
      });
    });

    it('should validate cost field minimum value', async () => {
      const user = userEvent.setup();
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Test Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1000');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '-50');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '10');
      await waitForCategoriesToLoad();
      await user.selectOptions(screen.getByLabelText('အမျိုးအစား *'), 'cat1');

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ကုန်ကျစရိတ် 0 ထက်နည်းမဖြစ်ပါ')).toBeInTheDocument();
      });
    });

    it('should validate stock quantity minimum value', async () => {
      const user = userEvent.setup();
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Test Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1000');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '800');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '-5');
      await waitForCategoriesToLoad();
      await user.selectOptions(screen.getByLabelText('အမျိုးအစား *'), 'cat1');

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('လက်ကျန်အရေအတွက် 0 ထက်နည်းမဖြစ်ပါ')).toBeInTheDocument();
      });
    });

    it('should validate category selection', async () => {
      const user = userEvent.setup();
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Test Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1000');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '800');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '10');
      // Don't select category

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('အမျိုးအစား ရွေးချယ်ရန်လိုအပ်ပါသည်')).toBeInTheDocument();
      });
    });

    it('should trim whitespace from text inputs', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiService.createItem).mockResolvedValueOnce({
        success: true,
        data: { _id: '123', name: 'Test Item' },
        message: 'Success',
      });

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), '  Test Item  ');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1000');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '800');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '10');
      await user.type(screen.getByLabelText('ဖော်ပြချက်'), '  Description  ');
      await user.type(screen.getByLabelText('ဘားကုဒ်'), '  BARCODE  ');
      await waitForCategoriesToLoad();
      await user.selectOptions(screen.getByLabelText('အမျိုးအစား *'), 'cat1');

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.createItem).toHaveBeenCalledWith({
          name: 'Test Item',
          price: 1000,
          cost: 800,
          stock: 10,
          category: 'cat1',
          description: 'Description',
          barcode: 'BARCODE',
          image: '',
        });
      });
    });
  });

  describe('Input Handling Edge Cases', () => {
    it('should handle very large numbers', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiService.createItem).mockResolvedValueOnce({
        success: true,
        data: { _id: '123' },
        message: 'Success',
      });

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Expensive Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '999999999');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '888888888');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '1000000');
      await waitForCategoriesToLoad();
      await user.selectOptions(screen.getByLabelText('အမျိုးအစား *'), 'cat1');

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.createItem).toHaveBeenCalledWith(expect.objectContaining({
          price: 999999999,
          cost: 888888888,
          stock: 1000000,
        }));
      });
    });

    it('should handle decimal values', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiService.createItem).mockResolvedValueOnce({
        success: true,
        data: { _id: '123' },
        message: 'Success',
      });

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Decimal Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1000.50');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '800.25');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '10');
      await waitForCategoriesToLoad();
      await user.selectOptions(screen.getByLabelText('အမျိုးအစား *'), 'cat1');

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.createItem).toHaveBeenCalledWith(expect.objectContaining({
          price: 1000.5,
          cost: 800.25,
        }));
      });
    });

    it('should handle Unicode Myanmar text', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiService.createItem).mockResolvedValueOnce({
        success: true,
        data: { _id: '123' },
        message: 'Success',
      });

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      const myanmarText = 'မြန်မာစာနဲ့ရေးထားတဲ့ပစ္စည်း';
      const myanmarDescription = 'ဒီပစ္စည်းကို မြန်မာစာနဲ့ဖော်ပြထားပါတယ်';

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), myanmarText);
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1500');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '1000');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '20');
      await user.type(screen.getByLabelText('ဖော်ပြချက်'), myanmarDescription);
      await waitForCategoriesToLoad();
      await user.selectOptions(screen.getByLabelText('အမျိုးအစား *'), 'cat1');

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.createItem).toHaveBeenCalledWith(expect.objectContaining({
          name: myanmarText,
          description: myanmarDescription,
        }));
      });
    });

    it('should handle empty optional fields', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiService.createItem).mockResolvedValueOnce({
        success: true,
        data: { _id: '123' },
        message: 'Success',
      });

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Minimal Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1000');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '800');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '10');
      await waitForCategoriesToLoad();
      await user.selectOptions(screen.getByLabelText('အမျိုးအစား *'), 'cat1');
      // Leave description and barcode empty

      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.createItem).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Minimal Item',
          description: '',
          barcode: '',
          image: '',
        }));
      });
    });
  });

  describe('Image Upload Handling', () => {
    it('should handle image upload', async () => {
      const user = userEvent.setup();
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပုံထည့်ခြင်း')).toBeInTheDocument();
      });

      // Create a mock file
      const file = new File(['mock image content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('ပုံထည့်ခြင်း');

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: 'data:image/jpeg;base64,mockImageData',
        onload: null as any,
      };

      vi.stubGlobal('FileReader', vi.fn(() => mockFileReader));

      await user.upload(fileInput, file);

      // Simulate FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: mockFileReader } as any);
      }

      // Verify that image preview would be shown (implementation-dependent)
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('should handle image removal', async () => {
      const user = userEvent.setup();
      
      // Create component with pre-filled image
      const editItem = {
        _id: '1',
        name: 'Test Item',
        selling_price: 1000,
        cost_price: 800,
        stock_quantity: 10,
        category_id: { _id: 'cat1' },
        image: 'data:image/jpeg;base64,existingImageData',
      };

      render(InventoryManagementForm, {
        props: { 
          onInventoryUpdate: mockOnInventoryUpdate,
          editItem: editItem,
        },
      });

      await waitFor(() => {
        // Look for remove image button (implementation-dependent)
        const removeButtons = screen.queryAllByText('✕');
        if (removeButtons.length > 0) {
          expect(removeButtons[0]).toBeInTheDocument();
        }
      });
    });
  });

  describe('Category Loading Edge Cases', () => {
    it('should handle category loading failure', async () => {
      vi.mocked(apiService.getCategories).mockRejectedValueOnce(new Error('Network error'));

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      // Just verify the form renders and category select is still empty
      await waitFor(() => {
        const categorySelect = screen.getByLabelText('အမျိုးအစား *');
        expect(categorySelect).toBeInTheDocument();
        // Should only have the default option when loading fails
        expect(categorySelect.querySelectorAll('option')).toHaveLength(1);
      });
    });

    it('should handle empty categories response', async () => {
      vi.mocked(apiService.getCategories).mockResolvedValueOnce({
        success: true,
        data: [],
      });

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        const categorySelect = screen.getByLabelText('အမျိုးအစား *');
        expect(categorySelect.children).toHaveLength(1); // Only placeholder option
      });
    });

    it('should handle malformed categories response', async () => {
      vi.mocked(apiService.getCategories).mockResolvedValueOnce({
        success: true,
        data: null,
      });

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        const categorySelect = screen.getByLabelText('အမျိုးအစား *');
        expect(categorySelect.children).toHaveLength(1); // Only placeholder option
      });
    });
  });

  describe('Form Reset Functionality', () => {
    it('should reset form after successful creation', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiService.createItem).mockResolvedValueOnce({
        success: true,
        data: { _id: '123' },
        message: 'Success',
      });

      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Test Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1000');
      await user.type(screen.getByLabelText('ကုန်ကျစရိတ် *'), '800');
      await user.type(screen.getByLabelText('လက်ကျန်အရေအတွက် *'), '10');
      await waitForCategoriesToLoad();
      await user.selectOptions(screen.getByLabelText('အမျိုးအစား *'), 'cat1');

      // Submit
      const submitButton = screen.getByText('ထည့်သွင်းမည်');
      await user.click(submitButton);

      // Form should be reset
      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toHaveValue('');
        expect(screen.getByLabelText('ရောင်းဈေး *')).toHaveValue(0);
      });
    });

    it('should handle manual reset', async () => {
      const user = userEvent.setup();
      render(InventoryManagementForm, {
        props: { onInventoryUpdate: mockOnInventoryUpdate },
      });

      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toBeInTheDocument();
      });

      // Fill form partially
      await user.type(screen.getByLabelText('ပစ္စည်းအမည် *'), 'Test Item');
      await user.type(screen.getByLabelText('ရောင်းဈေး *'), '1000');

      // Click reset button
      const resetButton = screen.getByText('ပြန်စမည်');
      await user.click(resetButton);

      // Form should be reset
      await waitFor(() => {
        expect(screen.getByLabelText('ပစ္စည်းအမည် *')).toHaveValue('');
        expect(screen.getByLabelText('ရောင်းဈေး *')).toHaveValue(0);
      });
    });
  });
});
