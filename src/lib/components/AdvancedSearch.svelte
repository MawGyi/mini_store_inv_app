<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let searchQuery: string = '';
  export let sortBy: string = 'name';
  export let sortOrder: 'asc' | 'desc' = 'asc';
  export let filterStatus: string = 'all';
  export let filterStock: string = 'all';
  
  const dispatch = createEventDispatcher();
  
  const sortOptions = [
    { value: 'name', label: 'Name', icon: '📝' },
    { value: 'itemCode', label: 'Item Code', icon: '🏷️' },
    { value: 'price', label: 'Price', icon: '💰' },
    { value: 'stockQuantity', label: 'Stock Level', icon: '📦' },
    { value: 'createdAt', label: 'Date Added', icon: '📅' }
  ];
  
  const statusOptions = [
    { value: 'all', label: 'All Statuses', color: 'gray' },
    { value: 'available', label: 'Available', color: 'success' },
    { value: 'low-stock', label: 'Low Stock', color: 'warning' },
    { value: 'out-of-stock', label: 'Out of Stock', color: 'danger' }
  ];
  
  const stockOptions = [
    { value: 'all', label: 'All Stock Levels', color: 'gray' },
    { value: 'high', label: 'High Stock (>20)', color: 'success' },
    { value: 'medium', label: 'Medium Stock (6-20)', color: 'warning' },
    { value: 'low', label: 'Low Stock (1-5)', color: 'danger' },
    { value: 'out', label: 'Out of Stock (0)', color: 'danger' }
  ];
  
  function handleSearch() {
    dispatch('search', { searchQuery, sortBy, sortOrder, filterStatus, filterStock });
  }
  
  function handleSort(field: string) {
    if (sortBy === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortOrder = 'asc';
    }
    handleSearch();
  }
  
  function handleFilter() {
    handleSearch();
  }
  
  function clearFilters() {
    searchQuery = '';
    sortBy = 'name';
    sortOrder = 'asc';
    filterStatus = 'all';
    filterStock = 'all';
    handleSearch();
  }
  
  function getSortIcon(field: string) {
    if (sortBy !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  }

  function getActiveFiltersCount() {
    let count = 0;
    if (searchQuery) count++;
    if (filterStatus !== 'all') count++;
    if (filterStock !== 'all') count++;
    return count;
  }
</script>

<div class="advanced-search">
  <!-- Search Bar -->
  <div class="search-section">
    <div class="search-input-wrapper">
      <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search by name, item code, or description..."
        class="search-input"
        on:input={handleSearch}
      />
      {#if searchQuery}
        <button class="clear-search" on:click={() => { searchQuery = ''; handleSearch(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Active Filters Display -->
  {#if getActiveFiltersCount() > 0}
    <div class="active-filters">
      <div class="active-filters-header">
        <span class="active-filters-label">Active Filters:</span>
        <button class="clear-all-filters" on:click={clearFilters}>
          Clear All
        </button>
      </div>
      <div class="filter-chips">
        {#if searchQuery}
          <span class="filter-chip search-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            "{searchQuery}"
            <button class="remove-filter" on:click={() => { searchQuery = ''; handleSearch(); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </span>
        {/if}
        {#if filterStatus !== 'all'}
          <span class="filter-chip status-chip">
            {statusOptions.find(opt => opt.value === filterStatus)?.label}
            <button class="remove-filter" on:click={() => { filterStatus = 'all'; handleSearch(); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </span>
        {/if}
        {#if filterStock !== 'all'}
          <span class="filter-chip stock-chip">
            {stockOptions.find(opt => opt.value === filterStock)?.label}
            <button class="remove-filter" on:click={() => { filterStock = 'all'; handleSearch(); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </span>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Filters and Sorting -->
  <div class="filters-section">
    <div class="filters-row">
      <div class="filter-group">
        <label for="status-filter">Status</label>
        <select id="status-filter" bind:value={filterStatus} on:change={handleFilter} class="filter-select">
          {#each statusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      
      <div class="filter-group">
        <label for="stock-filter">Stock Level</label>
        <select id="stock-filter" bind:value={filterStock} on:change={handleFilter} class="filter-select">
          {#each stockOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      
      <div class="filter-group">
        <label>Sort By</label>
        <div class="sort-buttons">
          {#each sortOptions as option}
            <button 
              class="sort-btn {sortBy === option.value ? 'active' : ''}"
              on:click={() => handleSort(option.value)}
            >
              <span class="sort-icon">{option.icon}</span>
              <span class="sort-label">{option.label}</span>
              <span class="sort-arrow">{getSortIcon(option.value)}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* ============================================
     ADVANCED SEARCH — THE SHOPKEEPER'S LEDGER THEME
     ============================================ */
  .advanced-search {
    background: var(--paper-card);
    border-radius: var(--radius-sketchy-xl);
    padding: var(--spacing-6);
    box-shadow: 3px 3px 0px var(--border-ink);
    border: 2px solid var(--border-ink);
    margin-bottom: var(--spacing-6);
  }

  /* --- Search Section --- */
  .search-section {
    margin-bottom: var(--spacing-6);
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: var(--spacing-4);
    color: var(--ink-faint);
    z-index: 1;
  }

  .search-input {
    width: 100%;
    padding: var(--spacing-4) var(--spacing-12) var(--spacing-4) var(--spacing-12);
    font-size: var(--font-size-base);
    border: 2px solid var(--border-ink);
    border-radius: var(--radius-sketchy-lg);
    background: var(--paper);
    transition: all 0.15s ease;
    color: var(--ink);
    font-family: 'Mali', sans-serif;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--crimson);
    background: var(--paper-card);
    box-shadow: 0 0 0 3px var(--crimson-ghost);
  }

  .search-input::placeholder {
    color: var(--ink-faint);
  }

  .clear-search {
    position: absolute;
    right: var(--spacing-4);
    background: var(--paper-aged);
    border: 1.5px solid var(--border-ink);
    border-radius: var(--radius-sketchy);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--ink-faint);
    transition: all 0.15s ease;
  }

  .clear-search:hover {
    background: var(--paper-warm);
    color: var(--ink);
    border-color: var(--ink);
  }

  /* --- Active Filters --- */
  .active-filters {
    margin-bottom: var(--spacing-6);
    padding: var(--spacing-4);
    background: var(--paper-warm);
    border-radius: var(--radius-sketchy-lg);
    border: 1.5px dashed var(--border-ink);
  }

  .active-filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-3);
  }

  .active-filters-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--ink);
    font-family: 'Mali', sans-serif;
  }

  .clear-all-filters {
    background: none;
    border: none;
    color: var(--crimson);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.15s ease;
    font-family: 'Mali', sans-serif;
  }

  .clear-all-filters:hover {
    color: var(--crimson-dark);
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
  }

  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--paper-card);
    border: 1.5px solid var(--border-ink);
    border-radius: var(--radius-sketchy);
    font-size: var(--font-size-sm);
    color: var(--ink);
    font-family: 'Mali', sans-serif;
  }

  .search-chip {
    background: var(--crimson-ghost);
    border-color: rgba(184, 28, 46, 0.2);
    color: var(--crimson);
  }

  .status-chip {
    background: rgba(58, 107, 62, 0.08);
    border-color: rgba(58, 107, 62, 0.2);
    color: var(--success);
  }

  .stock-chip {
    background: rgba(184, 98, 27, 0.06);
    border-color: rgba(184, 98, 27, 0.15);
    color: var(--warning);
  }

  .remove-filter {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.15s ease;
  }

  .remove-filter:hover {
    opacity: 1;
  }

  /* --- Filters Section --- */
  .filters-section {
    border-top: 2px dashed var(--border-ink);
    padding-top: var(--spacing-6);
  }

  .filters-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-6);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .filter-group label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: 'Mali', sans-serif;
  }

  .filter-select {
    padding: var(--spacing-3) var(--spacing-4);
    border: 2px solid var(--border-ink);
    border-radius: var(--radius-sketchy);
    background: var(--paper);
    font-size: var(--font-size-sm);
    color: var(--ink);
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: 'Mali', sans-serif;
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--crimson);
    box-shadow: 0 0 0 3px var(--crimson-ghost);
  }

  /* --- Sort Buttons --- */
  .sort-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .sort-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--paper-warm);
    border: 1.5px solid var(--border-ink);
    border-radius: var(--radius-sketchy);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: var(--font-size-sm);
    color: var(--ink-light);
    font-family: 'Mali', sans-serif;
  }

  .sort-btn:hover {
    background: var(--paper-card);
    border-color: var(--ink);
  }

  .sort-btn.active {
    background: var(--crimson-ghost);
    border-color: rgba(184, 28, 46, 0.3);
    color: var(--crimson);
    font-weight: 600;
  }

  .sort-icon {
    font-size: var(--font-size-sm);
  }

  .sort-label {
    flex: 1;
    text-align: left;
  }

  .sort-arrow {
    font-weight: bold;
    color: var(--crimson);
  }

  /* --- Responsive Design --- */
  @media (max-width: 768px) {
    .advanced-search {
      padding: var(--spacing-4);
    }

    .filters-row {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
    }

    .search-input {
      font-size: var(--font-size-base);
    }

    .filter-chips {
      gap: var(--spacing-1);
    }

    .filter-chip {
      font-size: var(--font-size-xs);
      padding: var(--spacing-1) var(--spacing-2);
    }
  }
</style>
