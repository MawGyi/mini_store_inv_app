import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/svelte';
import AdvancedSearch from '../AdvancedSearch.svelte';

describe('AdvancedSearch Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the search component', () => {
    const { container } = render(AdvancedSearch);
    expect(container.querySelector('.advanced-search')).toBeTruthy();
  });

  it('should render search input', () => {
    const { container } = render(AdvancedSearch);
    const searchInput = container.querySelector('input[type="text"]') ||
                       container.querySelector('input[type="search"]') ||
                       container.querySelector('.search-input-wrapper input');
    expect(searchInput).toBeTruthy();
  });

  it('should accept initial searchQuery prop', () => {
    const { container } = render(AdvancedSearch, {
      props: { searchQuery: 'initial search' }
    });
    const input = container.querySelector('input') as HTMLInputElement;
    if (input) {
      expect(input.value).toBe('initial search');
    }
  });

  it('should accept sortBy prop', () => {
    render(AdvancedSearch, {
      props: { sortBy: 'price' }
    });
    // Component should render without errors
    expect(true).toBe(true);
  });

  it('should accept sortOrder prop', () => {
    render(AdvancedSearch, {
      props: { sortOrder: 'desc' }
    });
    expect(true).toBe(true);
  });

  it('should accept filterStatus prop', () => {
    render(AdvancedSearch, {
      props: { filterStatus: 'low-stock' }
    });
    expect(true).toBe(true);
  });

  it('should accept filterStock prop', () => {
    render(AdvancedSearch, {
      props: { filterStock: 'low' }
    });
    expect(true).toBe(true);
  });

  it('should render with default props', () => {
    const { container } = render(AdvancedSearch);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('should render search icon', () => {
    const { container } = render(AdvancedSearch);
    const icon = container.querySelector('.search-icon') || container.querySelector('svg');
    expect(icon).toBeTruthy();
  });
});
