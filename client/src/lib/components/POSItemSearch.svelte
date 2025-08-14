<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService } from '../services/api';
  import SkeletonLoader from './SkeletonLoader.svelte';

  export let onItemSelect: (item: any) => void;
  export let maxResults: number = 10;

  let searchQuery = '';
  let searchResults: any[] = [];
  let loading = false;
  let error: string | null = null;
  let selectedIndex = -1;
  let showResults = false;

  let searchTimeout: NodeJS.Timeout;

  // Debounced search function
  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        await searchItems();
      } else {
        searchResults = [];
        showResults = false;
      }
    }, 300);
  }

  async function searchItems() {
    try {
      loading = true;
      error = null;
      
      const response = await apiService.getItems({ 
        search: searchQuery.trim(), 
        limit: maxResults 
      });
      
      if (response.success) {
        const data = response.data as any;
        searchResults = Array.isArray(data?.items) ? data.items : 
                       Array.isArray(data) ? data : [];
        showResults = true;
        selectedIndex = -1;
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      error = err.message || 'ပစ္စည်းရှာဖွေခြင်း မအောင်မြင်ပါ';
      searchResults = [];
      showResults = false;
    } finally {
      loading = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!showResults || searchResults.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          selectItem(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        hideResults();
        break;
    }
  }

  function selectItem(item: any) {
    if (item.stock <= 0) {
      error = `${item.name} သည် လက်ကျန်မရှိပါ`;
      return;
    }
    
    onItemSelect(item);
    hideResults();
    searchQuery = '';
  }

  function hideResults() {
    showResults = false;
    selectedIndex = -1;
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('my-MM', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function getStockStatus(stock: number): { text: string; class: string } {
    if (stock <= 0) return { text: 'ကုန်သွားပြီ', class: 'out-of-stock' };
    if (stock <= 10) return { text: 'လက်ကျန်နည်း', class: 'low-stock' };
    return { text: `လက်ကျန် ${stock}`, class: 'in-stock' };
  }

  // Close results when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.pos-search-container')) {
      hideResults();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(searchTimeout);
    };
  });
</script>

<div class="pos-search-container">
  <div class="search-input-group">
    <input
      type="text"
      bind:value={searchQuery}
      on:input={handleSearch}
      on:keydown={handleKeyDown}
      placeholder="ပစ္စည်းအမည် ရိုက်ထည့်ပါ..."
      class="search-input"
      autocomplete="off"
    />
    <div class="search-icon">🔍</div>
  </div>

  {#if loading}
    <div class="search-loading">
      <SkeletonLoader />
      <p>ရှာဖွေနေပါသည်...</p>
    </div>
  {/if}

  {#if error}
    <div class="search-error">
      <span>⚠️</span>
      <p>{error}</p>
    </div>
  {/if}

  {#if showResults && searchResults.length > 0}
    <div class="search-results">
      {#each searchResults as item, index}
        <div
          class="search-result-item {index === selectedIndex ? 'selected' : ''} {item.stock <= 0 ? 'disabled' : ''}"
          role="button"
          tabindex="0"
          on:click={() => selectItem(item)}
          on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectItem(item); } }}
          on:mouseenter={() => selectedIndex = index}
        >
          <div class="item-image">
            {#if item.image}
              <img src={item.image} alt={item.name} />
            {:else}
              <div class="placeholder-image">📦</div>
            {/if}
          </div>
          <div class="item-details">
            <div class="item-name">{item.name}</div>
            <div class="item-price">{formatCurrency(item.price)}</div>
            <div class="item-category">{item.category?.name || 'အမျိုးအစား မရှိ'}</div>
          </div>
          <div class="item-stock-info">
            <span class="stock-status {getStockStatus(item.stock).class}">
              {getStockStatus(item.stock).text}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if showResults && searchResults.length === 0 && !loading && searchQuery.trim().length >= 2}
    <div class="no-results">
      <span>🔍</span>
      <p>"{searchQuery}" အတွက် ရလဒ်မတွေ့ပါ</p>
    </div>
  {/if}
</div>

<style>
  .pos-search-container {
    position: relative;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  .search-input-group {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px 12px 45px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 16px;
    background: white;
    transition: all 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-icon {
    position: absolute;
    left: 16px;
    color: #9ca3af;
    font-size: 18px;
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    margin-top: 4px;
  }

  .search-result-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .search-result-item:hover,
  .search-result-item.selected {
    background-color: #f8fafc;
  }

  .search-result-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .item-image {
    width: 50px;
    height: 50px;
    margin-right: 12px;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-image {
    font-size: 24px;
  }

  .item-details {
    flex: 1;
  }

  .item-name {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 2px;
  }

  .item-price {
    font-size: 14px;
    color: #059669;
    font-weight: 600;
  }

  .item-category {
    font-size: 12px;
    color: #6b7280;
  }

  .item-stock-info {
    text-align: right;
  }

  .stock-status {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .in-stock {
    background-color: #dcfce7;
    color: #166534;
  }

  .low-stock {
    background-color: #fef3c7;
    color: #92400e;
  }

  .out-of-stock {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .search-loading,
  .search-error,
  .no-results {
    text-align: center;
    padding: 20px;
    color: #6b7280;
  }

  .search-error,
  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  @media (max-width: 640px) {
    .search-result-item {
      padding: 8px 12px;
    }

    .item-image {
      width: 40px;
      height: 40px;
    }

    .item-name {
      font-size: 14px;
    }
  }
</style>
