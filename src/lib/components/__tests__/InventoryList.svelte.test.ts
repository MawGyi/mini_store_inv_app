import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { items as itemsStore } from '$lib/stores';
import type { Item } from '$lib/types';
import InventoryList from '$lib/components/InventoryList.svelte';
import AdvancedSearch from '$lib/components/AdvancedSearch.svelte';
import { TEST_IDS } from '../../../test-setup';

const mockItems: Item[] = [
  { id: 1, name: 'Test Product A', itemCode: 'TPA001', price: 10.99, stockQuantity: 50, lowStockThreshold: 10, category: 'Electronics', expiryDate: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: 'Test Product B', itemCode: 'TPB002', price: 25.50, stockQuantity: 5, lowStockThreshold: 10, category: 'Electronics', expiryDate: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: 'Test Product C', itemCode: 'TPC003', price: 0.00, stockQuantity: 0, lowStockThreshold: 5, category: 'Electronics', expiryDate: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, name: 'Low Stock Item', itemCode: 'LSI001', price: 15.00, stockQuantity: 3, lowStockThreshold: 10, category: 'Office', expiryDate: null, createdAt: new Date(), updatedAt: new Date() }
];

function createMockItemsStore(initialItems: Item[] = []) {
  const { subscribe, set, update } = writable<Item[]>(initialItems);
  return {
    subscribe,
    set,
    update: (fn: (items: Item[]) => Item[]) => update(items => fn(items)),
    get: () => {
      let currentItems: Item[] = [];
      subscribe(items => currentItems = items)();
      return currentItems;
    }
  };
}

function createMockSettingsStore() {
  return {
    subscribe: writable({ currency: 'USD', storeName: 'Test Store', storeAddress: '123 Test St', storePhone: '555-1234' }).subscribe,
    load: vi.fn()
  };
}

describe('InventoryList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    itemsStore.set([]);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render empty state when no items', async () => {
    itemsStore.set([]);
    const { container } = render(InventoryList);
    await waitFor(() => {
      expect(container.querySelector('.empty-state')).toBeTruthy();
    });
    expect(screen.getByText('No Items Found')).toBeInTheDocument();
  });

  it('should render table with items', async () => {
    itemsStore.set(mockItems);
    const { container } = render(InventoryList);
    await waitFor(() => {
      expect(container.querySelector('.table')).toBeTruthy();
    });
    expect(screen.getByText('Test Product A')).toBeInTheDocument();
    expect(screen.getByText('Test Product B')).toBeInTheDocument();
    expect(screen.getByText('Test Product C')).toBeInTheDocument();
  });

  it('should display item code correctly', async () => {
    itemsStore.set([mockItems[0]]);
    const { container } = render(InventoryList);
    await waitFor(() => {
      const codeBadge = container.querySelector('.code-badge');
      expect(codeBadge).toBeTruthy();
      expect(codeBadge?.textContent).toBe('TPA001');
    });
  });

  it('should display price correctly', async () => {
    itemsStore.set([mockItems[0]]);
    render(InventoryList);
    await waitFor(() => {
      expect(screen.getByText('$10.99')).toBeInTheDocument();
    });
  });

  it('should display stock quantity', async () => {
    itemsStore.set([mockItems[0]]);
    render(InventoryList);
    await waitFor(() => {
      expect(screen.getByText('50 units')).toBeInTheDocument();
    });
  });

  it('should show low stock badge for items below threshold', async () => {
    itemsStore.set([mockItems[1]]);
    const { container } = render(InventoryList);
    await waitFor(() => {
      const lowStockBadge = container.querySelector('.stock-badge.warning');
      expect(lowStockBadge).toBeTruthy();
      expect(lowStockBadge?.textContent).toContain('Low Stock');
    });
  });

  it('should show out of stock badge for zero quantity items', async () => {
    itemsStore.set([mockItems[2]]);
    const { container } = render(InventoryList);
    await waitFor(() => {
      const outOfStockBadge = container.querySelector('.stock-badge.danger');
      expect(outOfStockBadge).toBeTruthy();
      expect(outOfStockBadge?.textContent).toContain('Out of Stock');
    });
  });

  it('should show available status for items above threshold', async () => {
    itemsStore.set([mockItems[0]]);
    const { container } = render(InventoryList);
    await waitFor(() => {
      const availableBadge = container.querySelector('.status-badge.success');
      expect(availableBadge).toBeTruthy();
      expect(availableBadge?.textContent).toContain('Available');
    });
  });

  it('should have edit button with correct test ID', async () => {
    itemsStore.set([mockItems[0]]);
    render(InventoryList);
    await waitFor(() => {
      const editButton = screen.getByTestId(TEST_IDS.EDIT_BUTTON);
      expect(editButton).toBeInTheDocument();
    });
  });

  it('should have delete button with correct test ID', async () => {
    itemsStore.set([mockItems[0]]);
    render(InventoryList);
    await waitFor(() => {
      const deleteButton = screen.getByTestId(TEST_IDS.DELETE_BUTTON);
      expect(deleteButton).toBeInTheDocument();
    });
  });

  it('should have sale button with correct test ID', async () => {
    itemsStore.set([mockItems[0]]);
    render(InventoryList);
    await waitFor(() => {
      const saleButton = screen.getByTestId(TEST_IDS.SALE_BUTTON);
      expect(saleButton).toBeInTheDocument();
    });
  });

  it('should apply low-stock class to rows', async () => {
    itemsStore.set([mockItems[1]]);
    const { container } = render(InventoryList);
    await waitFor(() => {
      const row = container.querySelector('.low-stock');
      expect(row).toBeTruthy();
    });
  });

  it('should apply out-of-stock class to rows', async () => {
    itemsStore.set([mockItems[2]]);
    const { container } = render(InventoryList);
    await waitFor(() => {
      const row = container.querySelector('.out-of-stock');
      expect(row).toBeTruthy();
    });
  });

  it('should filter items by search query', async () => {
    itemsStore.set(mockItems);
    const { container } = render(InventoryList);
    await waitFor(() => {
      expect(screen.getByText('Test Product A')).toBeInTheDocument();
    });
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    fireEvent.input(searchInput, { target: { value: 'Product B' } });
    await waitFor(() => {
      expect(screen.queryByText('Test Product A')).not.toBeInTheDocument();
      expect(screen.getByText('Test Product B')).toBeInTheDocument();
    });
  });

  it('should filter items by status (low stock)', async () => {
    itemsStore.set(mockItems);
    const { container } = render(InventoryList);
    const statusSelect = container.querySelector('#status-filter') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'low-stock' } });
    await waitFor(() => {
      expect(screen.queryByText('Test Product A')).not.toBeInTheDocument();
      expect(screen.getByText('Test Product B')).toBeInTheDocument();
    });
  });

  it('should filter items by status (out of stock)', async () => {
    itemsStore.set(mockItems);
    const { container } = render(InventoryList);
    const statusSelect = container.querySelector('#status-filter') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'out-of-stock' } });
    await waitFor(() => {
      expect(screen.queryByText('Test Product A')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Product B')).not.toBeInTheDocument();
      expect(screen.getByText('Test Product C')).toBeInTheDocument();
    });
  });

  it('should sort items by name', async () => {
    itemsStore.set(mockItems);
    const { container } = render(InventoryList);
    const sortButtons = container.querySelectorAll('.sort-btn');
    const nameSortButton = Array.from(sortButtons).find(btn => btn.textContent?.includes('Name'));
    fireEvent.click(nameSortButton as HTMLElement);
    await waitFor(() => {
      const rows = container.querySelectorAll('.table tbody tr');
      expect(rows[0].textContent).toContain('Low Stock Item');
    });
  });

  it('should display search stats correctly', async () => {
    itemsStore.set(mockItems);
    render(InventoryList);
    await waitFor(() => {
      expect(screen.getByText('4 of 4 items')).toBeInTheDocument();
    });
  });

  it('should show add item button when items exist', async () => {
    itemsStore.set([mockItems[0]]);
    const { container } = render(InventoryList);
    await waitFor(() => {
      const addButton = container.querySelector('.btn-primary');
      expect(addButton).toBeTruthy();
      expect(addButton?.textContent).toContain('Add Item');
    });
  });

  it('should show export CSV button when items exist', async () => {
    itemsStore.set([mockItems[0]]);
    const { container } = render(InventoryList);
    await waitFor(() => {
      const exportButton = container.querySelector('.btn-secondary');
      expect(exportButton).toBeTruthy();
      expect(exportButton?.textContent).toContain('Export CSV');
    });
  });

  it('should handle pagination', async () => {
    const manyItems = Array.from({ length: 25 }, (_, i) => ({
      ...mockItems[0],
      id: i + 1,
      name: `Product ${i + 1}`
    }));
    itemsStore.set(manyItems);
    const { container } = render(InventoryList);
    await waitFor(() => {
      const paginationBar = container.querySelector('.pagination-bar');
      expect(paginationBar).toBeTruthy();
    });
  });

  it('should handle add item modal', async () => {
    itemsStore.set([mockItems[0]]);
    const { container } = render(InventoryList);
    const addButton = container.querySelector('.btn-primary');
    fireEvent.click(addButton as HTMLElement);
    await waitFor(() => {
      const modal = container.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal?.textContent).toContain('Add New Item');
    });
  });

  it('should close modal on backdrop click', async () => {
    itemsStore.set([mockItems[0]]);
    const { container } = render(InventoryList);
    const addButton = container.querySelector('.btn-primary');
    fireEvent.click(addButton as HTMLElement);
    await waitFor(() => {
      const modal = container.querySelector('.modal');
      expect(modal).toBeTruthy();
    });
    const backdrop = container.querySelector('.modal-backdrop');
    fireEvent.click(backdrop as HTMLElement);
    await waitFor(() => {
      const closedModal = container.querySelector('.modal');
      expect(closedModal).toBeFalsy();
    });
  });

  it('should show form validation error for empty fields', async () => {
    itemsStore.set([mockItems[0]]);
    const { container } = render(InventoryList);
    const addButton = container.querySelector('.btn-primary');
    fireEvent.click(addButton as HTMLElement);
    await waitFor(() => {
      const modal = container.querySelector('.modal');
      expect(modal).toBeTruthy();
    });
    const submitButton = container.querySelector('.modal-form button[type="submit"]');
    fireEvent.click(submitButton as HTMLElement);
    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields.')).toBeInTheDocument();
    });
  });
});

describe('AdvancedSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render search input', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const searchInput = container.querySelector('.search-input');
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should render status filter select', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const statusSelect = container.querySelector('#status-filter');
      expect(statusSelect).toBeInTheDocument();
    });
  });

  it('should render stock filter select', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const stockSelect = container.querySelector('#stock-filter');
      expect(stockSelect).toBeInTheDocument();
    });
  });

  it('should render sort buttons', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const sortButtons = container.querySelectorAll('.sort-btn');
      expect(sortButtons.length).toBeGreaterThan(0);
    });
  });

  it('should update search query on input', async () => {
    const { container, component } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    fireEvent.input(searchInput, { target: { value: 'test query' } });
    await waitFor(() => {
      expect(searchInput.value).toBe('test query');
    });
  });

  it('should show clear search button when query exists', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'test', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const clearButton = container.querySelector('.clear-search');
      expect(clearButton).toBeInTheDocument();
    });
  });

  it('should clear search on clear button click', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'test', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const clearButton = container.querySelector('.clear-search');
      fireEvent.click(clearButton as HTMLElement);
    });
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    expect(searchInput.value).toBe('');
  });

  it('should toggle sort order on same field click', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    const sortButtons = container.querySelectorAll('.sort-btn');
    const nameButton = Array.from(sortButtons).find(btn => btn.textContent?.includes('Name')) as HTMLElement;
    fireEvent.click(nameButton);
    await waitFor(() => {
      const arrows = container.querySelectorAll('.sort-arrow');
      const nameArrow = Array.from(arrows).find(arrow => {
        const parent = arrow.parentElement;
        return parent?.textContent?.includes('Name');
      });
      expect(nameArrow?.textContent).toBe('↓');
    });
  });

  it('should change sort field on different field click', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    const sortButtons = container.querySelectorAll('.sort-btn');
    const priceButton = Array.from(sortButtons).find(btn => btn.textContent?.includes('Price')) as HTMLElement;
    fireEvent.click(priceButton);
    await waitFor(() => {
      const arrows = container.querySelectorAll('.sort-arrow');
      const priceArrow = Array.from(arrows).find(arrow => {
        const parent = arrow.parentElement;
        return parent?.textContent?.includes('Price');
      });
      expect(priceArrow?.textContent).toBe('↑');
    });
  });

  it('should update filter status', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    const statusSelect = container.querySelector('#status-filter') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'low-stock' } });
    expect(statusSelect.value).toBe('low-stock');
  });

  it('should show active filters when filters are applied', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'low-stock', filterStock: 'all' }
    });
    await waitFor(() => {
      const activeFilters = container.querySelector('.active-filters');
      expect(activeFilters).toBeInTheDocument();
    });
  });

  it('should show filter chip for status filter', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'low-stock', filterStock: 'all' }
    });
    await waitFor(() => {
      const filterChip = container.querySelector('.status-chip');
      expect(filterChip).toBeInTheDocument();
      expect(filterChip?.textContent).toContain('Low Stock');
    });
  });

  it('should clear individual filter on chip remove', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'low-stock', filterStock: 'all' }
    });
    await waitFor(() => {
      const removeButton = container.querySelector('.status-chip .remove-filter');
      fireEvent.click(removeButton as HTMLElement);
    });
    const statusSelect = container.querySelector('#status-filter') as HTMLSelectElement;
    expect(statusSelect.value).toBe('all');
  });

  it('should clear all filters on clear all', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'test', sortBy: 'name', sortOrder: 'asc', filterStatus: 'low-stock', filterStock: 'high' }
    });
    await waitFor(() => {
      const clearAllButton = container.querySelector('.clear-all-filters');
      fireEvent.click(clearAllButton as HTMLElement);
    });
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    expect(searchInput.value).toBe('');
  });

  it('should show active filters count correctly', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'test', sortBy: 'name', sortOrder: 'asc', filterStatus: 'low-stock', filterStock: 'all' }
    });
    await waitFor(() => {
      const activeFilters = container.querySelector('.active-filters');
      expect(activeFilters).toBeInTheDocument();
    });
  });

  it('should have correct sort options', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const sortButtons = container.querySelectorAll('.sort-btn');
      const labels = Array.from(sortButtons).map(btn => btn.textContent?.trim());
      expect(labels).toContain('Name');
      expect(labels).toContain('Item Code');
      expect(labels).toContain('Price');
      expect(labels).toContain('Stock Level');
      expect(labels).toContain('Date Added');
    });
  });

  it('should have correct status options', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    const statusSelect = container.querySelector('#status-filter') as HTMLSelectElement;
    const options = Array.from(statusSelect.options).map(opt => opt.value);
    expect(options).toContain('all');
    expect(options).toContain('available');
    expect(options).toContain('low-stock');
    expect(options).toContain('out-of-stock');
  });

  it('should have correct stock options', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    const stockSelect = container.querySelector('#stock-filter') as HTMLSelectElement;
    const options = Array.from(stockSelect.options).map(opt => opt.value);
    expect(options).toContain('all');
    expect(options).toContain('high');
    expect(options).toContain('medium');
    expect(options).toContain('low');
    expect(options).toContain('out');
  });
});
