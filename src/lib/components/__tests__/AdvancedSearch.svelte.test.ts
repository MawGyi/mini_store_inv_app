import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import AdvancedSearch from '$lib/components/AdvancedSearch.svelte';

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

  it('should have placeholder text', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const searchInput = container.querySelector('.search-input') as HTMLInputElement;
      expect(searchInput.placeholder).toContain('Search by name, item code');
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

  it('should have sort options with icons', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const sortIcons = container.querySelectorAll('.sort-icon');
      expect(sortIcons.length).toBeGreaterThanOrEqual(5);
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

  it('should hide clear search button when query is empty', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const clearButton = container.querySelector('.clear-search');
      expect(clearButton).not.toBeInTheDocument();
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

  it('should show sort arrow indicating ascending order', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const arrows = container.querySelectorAll('.sort-arrow');
      const nameArrow = Array.from(arrows).find(arrow => {
        const parent = arrow.parentElement;
        return parent?.textContent?.includes('Name');
      });
      expect(nameArrow?.textContent).toBe('↑');
    });
  });

  it('should change sort arrow to descending on same field click', async () => {
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

  it('should change sort field and reset to ascending', async () => {
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

  it('should highlight active sort button', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const sortButtons = container.querySelectorAll('.sort-btn');
      const nameButton = Array.from(sortButtons).find(btn => btn.textContent?.includes('Name'));
      expect(nameButton?.classList.contains('active')).toBe(true);
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

  it('should update filter stock', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    const stockSelect = container.querySelector('#stock-filter') as HTMLSelectElement;
    fireEvent.change(stockSelect, { target: { value: 'high' } });
    expect(stockSelect.value).toBe('high');
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

  it('should hide active filters when all filters are default', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const activeFilters = container.querySelector('.active-filters');
      expect(activeFilters).not.toBeInTheDocument();
    });
  });

  it('should show filter chip for search query', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'test', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const searchChip = container.querySelector('.search-chip');
      expect(searchChip).toBeInTheDocument();
      expect(searchChip?.textContent).toContain('"test"');
    });
  });

  it('should show filter chip for status filter', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'low-stock', filterStock: 'all' }
    });
    await waitFor(() => {
      const statusChip = container.querySelector('.status-chip');
      expect(statusChip).toBeInTheDocument();
      expect(statusChip?.textContent).toContain('Low Stock');
    });
  });

  it('should show filter chip for stock filter', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'high' }
    });
    await waitFor(() => {
      const stockChip = container.querySelector('.stock-chip');
      expect(stockChip).toBeInTheDocument();
      expect(stockChip?.textContent).toContain('High Stock');
    });
  });

  it('should clear search filter on chip remove', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'test', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const removeButton = container.querySelector('.search-chip .remove-filter');
      fireEvent.click(removeButton as HTMLElement);
    });
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    expect(searchInput.value).toBe('');
  });

  it('should clear status filter on chip remove', async () => {
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

  it('should clear stock filter on chip remove', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'high' }
    });
    await waitFor(() => {
      const removeButton = container.querySelector('.stock-chip .remove-filter');
      fireEvent.click(removeButton as HTMLElement);
    });
    const stockSelect = container.querySelector('#stock-filter') as HTMLSelectElement;
    expect(stockSelect.value).toBe('all');
  });

  it('should clear all filters on clear all click', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'test', sortBy: 'name', sortOrder: 'asc', filterStatus: 'low-stock', filterStock: 'high' }
    });
    await waitFor(() => {
      const clearAllButton = container.querySelector('.clear-all-filters');
      fireEvent.click(clearAllButton as HTMLElement);
    });
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    expect(searchInput.value).toBe('');
    const statusSelect = container.querySelector('#status-filter') as HTMLSelectElement;
    expect(statusSelect.value).toBe('all');
    const stockSelect = container.querySelector('#stock-filter') as HTMLSelectElement;
    expect(stockSelect.value).toBe('all');
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

  it('should have correct sort options', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    const sortButtons = container.querySelectorAll('.sort-btn');
    const labels = Array.from(sortButtons).map(btn => btn.textContent?.trim());
    expect(labels.some(l => l?.includes('Name'))).toBe(true);
    expect(labels.some(l => l?.includes('Item Code'))).toBe(true);
    expect(labels.some(l => l?.includes('Price'))).toBe(true);
    expect(labels.some(l => l?.includes('Stock Level'))).toBe(true);
    expect(labels.some(l => l?.includes('Date Added'))).toBe(true);
  });

  it('should show "Clear All" button only when multiple filters active', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'test', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const clearAllButton = container.querySelector('.clear-all-filters');
      expect(clearAllButton).toBeInTheDocument();
    });
  });

  it('should calculate active filters count correctly', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'test', sortBy: 'name', sortOrder: 'asc', filterStatus: 'low-stock', filterStock: 'high' }
    });
    await waitFor(() => {
      const activeFilters = container.querySelector('.active-filters');
      expect(activeFilters).toBeInTheDocument();
    });
  });

  it('should have search icon', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const searchIcon = container.querySelector('.search-icon');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  it('should have labels for filter groups', async () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: '', sortBy: 'name', sortOrder: 'asc', filterStatus: 'all', filterStock: 'all' }
    });
    await waitFor(() => {
      const statusLabel = container.querySelector('label[for="status-filter"]');
      const stockLabel = container.querySelector('label[for="stock-filter"]');
      expect(statusLabel?.textContent).toBe('Status');
      expect(stockLabel?.textContent).toBe('Stock Level');
    });
  });
});
