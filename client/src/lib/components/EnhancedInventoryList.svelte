<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService } from '../services/api';
  import SkeletonLoader from './SkeletonLoader.svelte';
  import NotificationToast from './NotificationToast.svelte';

  interface Item {
    _id: string;
    name: string;
    item_code: string;
    selling_price: number;
    cost_price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    category_id: { category_name_my: string } | null;
    createdAt: string;
    updatedAt: string;
  }

  let items: Item[] = [];
  let filteredItems: Item[] = [];
  let loading = false;
  let error: string | null = null;
  let searchQuery = '';
  let sortBy = 'name';
  let sortOrder: 'asc' | 'desc' = 'asc';
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalPages = 1;
  let notification: { type: 'success' | 'error' | 'info'; message: string; id: string } | null = null;
  
  // Filter states
  let stockFilter = 'all'; // all, low, out, available
  let categoryFilter = 'all';
  let priceRange = { min: 0, max: 100000 };

  // Animation states
  let itemsVisible = false;
  let searchVisible = false;

  onMount(async () => {
    await loadItems();
    setTimeout(() => searchVisible = true, 200);
    setTimeout(() => itemsVisible = true, 400);
  });

  async function loadItems() {
    try {
      loading = true;
      error = null;
      
      const response = await apiService.getItems({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery
      });

      if (response.success && response.data) {
        const data = response.data as any;
        items = Array.isArray(data.items) ? data.items : [];
        totalPages = Math.ceil((data.pagination?.totalItems || items.length) / itemsPerPage);
        applyFilters();
        console.log('✅ Items loaded:', items);
      } else {
        throw new Error(response.message || 'Failed to load items');
      }
    } catch (err: any) {
      console.error('❌ Error loading items:', err);
      error = 'ပစ္စည်းများ ဖတ်ရှုခြင်းတွင် အမှားဖြစ်ပေါ်သည်။';
      showNotification('error', error);
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    filteredItems = items.filter(item => {
      // Search filter
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.item_code.toLowerCase().includes(searchQuery.toLowerCase());

      // Stock filter
      const matchesStock = stockFilter === 'all' ||
        (stockFilter === 'low' && item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0) ||
        (stockFilter === 'out' && item.stock_quantity === 0) ||
        (stockFilter === 'available' && item.stock_quantity > item.low_stock_threshold);

      // Price filter
      const matchesPrice = item.selling_price >= priceRange.min && item.selling_price <= priceRange.max;

      return matchesSearch && matchesStock && matchesPrice;
    });

    // Apply sorting
    filteredItems.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.selling_price - b.selling_price;
          break;
        case 'stock':
          comparison = a.stock_quantity - b.stock_quantity;
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  function handleSearch() {
    currentPage = 1;
    loadItems();
  }

  function formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US') + ' ကျပ်';
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStockStatus(item: Item) {
    if (item.stock_quantity === 0) return { class: 'out-of-stock', text: 'ကုန်သွားပြီ' };
    if (item.stock_quantity <= item.low_stock_threshold) return { class: 'low-stock', text: 'လက်ကျန်နည်း' };
    return { class: 'in-stock', text: 'ရရှိနေသည်' };
  }

  function showNotification(type: 'success' | 'error' | 'info', message: string) {
    notification = {
      type,
      message,
      id: Date.now().toString()
    };
    setTimeout(() => notification = null, 5000);
  }

  // Reactive statements
  $: applyFilters();
</script>

<!-- Enhanced Modern Inventory List -->
<div class="inventory-container">
  {#if notification}
    <NotificationToast 
      type={notification.type} 
      message={notification.message} 
      id={notification.id}
      on:close={() => notification = null} 
    />
  {/if}

  <!-- Header Section -->
  <div class="inventory-header" class:visible={searchVisible}>
    <div class="header-content">
      <div class="title-section">
        <h1>📦 ကုန်စာရင်းစီမံခန့်ခွဲမှု</h1>
        <p>ပစ္စည်းများကို ရှာဖွေ၊ စီမံ၊ အစီရင်ခံနိုင်ပါသည်</p>
      </div>
      
      <div class="header-stats">
        <div class="stat-pill">
          <span class="stat-value">{items.length}</span>
          <span class="stat-label">စုစုပေါင်း</span>
        </div>
        <div class="stat-pill warning">
          <span class="stat-value">{items.filter(i => i.stock_quantity <= i.low_stock_threshold).length}</span>
          <span class="stat-label">လက်ကျန်နည်း</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Search and Filter Section -->
  <div class="search-section" class:visible={searchVisible}>
    <div class="search-container">
      <!-- Main Search -->
      <div class="search-input-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="ပစ္စည်းအမည် သို့မဟုတ် ကုဒ် ရှာရန်..."
            bind:value={searchQuery}
            on:input={handleSearch}
            class="search-input"
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

      <!-- Filter Controls -->
      <div class="filter-controls">
        <!-- Stock Filter -->
        <div class="filter-group">
          <label class="filter-label" for="stock-filter">လက်ကျန်အခြေအနေ</label>
          <select id="stock-filter" bind:value={stockFilter} class="filter-select">
            <option value="all">အားလုံး</option>
            <option value="available">ရရှိနေသည်</option>
            <option value="low">လက်ကျန်နည်း</option>
            <option value="out">ကုန်သွားပြီ</option>
          </select>
        </div>

        <!-- Sort Controls -->
        <div class="filter-group">
          <label class="filter-label" for="sort-by">အစီအစဉ်</label>
          <div class="sort-controls">
            <select id="sort-by" bind:value={sortBy} class="filter-select">
              <option value="name">အမည်အလိုက်</option>
              <option value="price">ဈေးနှုန်းအလိုက်</option>
              <option value="stock">လက်ကျန်အလိုက်</option>
              <option value="updated">နောက်ဆုံးပြင်ဆင်ချိန်</option>
            </select>
            <button 
              class="sort-order-btn {sortOrder === 'desc' ? 'desc' : 'asc'}"
              on:click={() => sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'}
              title={sortOrder === 'asc' ? 'အနည်းမှအများ' : 'အများမှအနည်း'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {#if sortOrder === 'asc'}
                  <path d="M3 8L12 17L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                {:else}
                  <path d="M21 16L12 7L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                {/if}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Content Section -->
  <div class="content-section" class:visible={itemsVisible}>
    {#if loading}
      <div class="skeleton-container">
        {#each Array(6) as _, i}
          <SkeletonLoader type="card" lines={3} />
        {/each}
      </div>
    {:else if error}
      <div class="error-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
        </svg>
        <h3>အမှားဖြစ်ပေါ်သည်</h3>
        <p>{error}</p>
        <button class="retry-btn" on:click={loadItems}>ထပ်မံကြိုးစားရန်</button>
      </div>
    {:else if filteredItems.length === 0}
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L16 2H8L4 6V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 12H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3>ပစ္စည်းမရှိပါ</h3>
        <p>ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းများ မတွေ့ရှိပါ</p>
      </div>
    {:else}
      <!-- Items Grid -->
      <div class="items-grid">
        {#each filteredItems as item, index (item._id)}
          <div class="item-card animate-fade-in" style="animation-delay: {index * 0.05}s">
            <div class="item-header">
              <div class="item-info">
                <h3 class="item-name">{item.name}</h3>
                <p class="item-code">#{item.item_code}</p>
                {#if item.category_id?.category_name_my}
                  <span class="category-tag">{item.category_id.category_name_my}</span>
                {/if}
              </div>
              <div class="item-status">
                <span class="status-badge {getStockStatus(item).class}">
                  {getStockStatus(item).text}
                </span>
              </div>
            </div>

            <div class="item-body">
              <div class="item-metrics">
                <div class="metric">
                  <span class="metric-label">ရောင်းဈေး</span>
                  <span class="metric-value primary">{formatCurrency(item.selling_price)}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">လက်ကျန်</span>
                  <span class="metric-value {item.stock_quantity <= item.low_stock_threshold ? 'warning' : 'success'}">
                    {item.stock_quantity}
                  </span>
                </div>
              </div>

              <div class="item-progress">
                <div class="progress-info">
                  <span>Stock Level</span>
                  <span>{Math.round((item.stock_quantity / (item.low_stock_threshold * 2)) * 100)}%</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill {getStockStatus(item).class}"
                    style="width: {Math.min(100, (item.stock_quantity / (item.low_stock_threshold * 2)) * 100)}%"
                  ></div>
                </div>
              </div>
            </div>

            <div class="item-footer">
              <div class="item-meta">
                <span class="update-time">{formatDate(item.updatedAt)}</span>
              </div>
              <div class="item-actions">
                <button class="action-btn edit" title="Edit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 20H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16.5 3.5C16.8978 3.10218 17.4374 2.87868 18 2.87868C18.5626 2.87868 19.1022 3.10218 19.5 3.5C19.8978 3.89782 20.1213 4.43739 20.1213 5C20.1213 5.56261 19.8978 6.10218 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="action-btn delete" title="Delete">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .inventory-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  /* Header Section */
  .inventory-header {
    margin-bottom: 2rem;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .inventory-header.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
    border-radius: 1rem;
    color: white;
    position: relative;
    overflow: hidden;
  }

  .header-content::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  .title-section {
    position: relative;
    z-index: 1;
  }

  .title-section h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .title-section p {
    font-size: 1.125rem;
    opacity: 0.9;
    margin: 0;
  }

  .header-stats {
    display: flex;
    gap: 1rem;
    position: relative;
    z-index: 1;
  }

  .stat-pill {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 1rem;
    padding: 1rem 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
  }

  .stat-pill:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .stat-pill.warning {
    background: rgba(245, 158, 11, 0.2);
    border-color: rgba(245, 158, 11, 0.3);
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .stat-label {
    display: block;
    font-size: 0.875rem;
    opacity: 0.8;
  }

  /* Search Section */
  .search-section {
    margin-bottom: 2rem;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
  }

  .search-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .search-container {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .search-input-container {
    margin-bottom: 1.5rem;
  }

  .search-input-wrapper {
    position: relative;
    max-width: 500px;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .search-input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: #f9fafb;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: white;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .clear-search {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
  }

  .clear-search:hover {
    color: #6b7280;
    background: #f3f4f6;
  }

  .filter-controls {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .filter-select {
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    font-size: 0.875rem;
    transition: all 0.3s ease;
    min-width: 150px;
  }

  .filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .sort-controls {
    display: flex;
    gap: 0.5rem;
  }

  .sort-order-btn {
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sort-order-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .sort-order-btn.desc {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  /* Content Section */
  .content-section {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s;
  }

  .content-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .skeleton-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: #6b7280;
  }

  .error-state svg,
  .empty-state svg {
    margin-bottom: 1rem;
    color: #d1d5db;
  }

  .error-state h3,
  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .retry-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  /* Items Grid */
  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
  }

  .item-card {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .item-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.15);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .item-name {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    color: #1e293b;
  }

  .item-code {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0 0 0.5rem 0;
    font-family: monospace;
  }

  .category-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: #f1f5f9;
    color: #475569;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-badge.in-stock {
    background: #dcfce7;
    color: #166534;
  }

  .status-badge.low-stock {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge.out-of-stock {
    background: #fee2e2;
    color: #991b1b;
  }

  .item-body {
    margin-bottom: 1rem;
  }

  .item-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .metric {
    text-align: center;
  }

  .metric-label {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
  }

  .metric-value {
    display: block;
    font-size: 1.125rem;
    font-weight: 700;
  }

  .metric-value.primary { color: #3b82f6; }
  .metric-value.success { color: #10b981; }
  .metric-value.warning { color: #f59e0b; }

  .item-progress {
    margin-bottom: 1rem;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .progress-bar {
    height: 6px;
    background: #f1f5f9;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-fill.in-stock { background: #10b981; }
  .progress-fill.low-stock { background: #f59e0b; }
  .progress-fill.out-of-stock { background: #ef4444; }

  .item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid #f1f5f9;
  }

  .update-time {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .item-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover {
    background: #f9fafb;
  }

  .action-btn.edit:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .action-btn.delete:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .inventory-container {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .header-stats {
      flex-direction: column;
      width: 100%;
    }

    .stat-pill {
      padding: 0.75rem 1rem;
    }

    .filter-controls {
      flex-direction: column;
      gap: 1rem;
    }

    .items-grid {
      grid-template-columns: 1fr;
    }

    .item-metrics {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }
</style>
