<script lang="ts">
  import { onMount } from 'svelte'
  import { settings, formatCurrency } from '$lib/stores/settings'
  import type { DashboardOverview, SalesSummary, TopSellingItem } from '$lib/types'
  import { goto } from '$app/navigation'
  
  let overview: DashboardOverview | null = null
  let salesTrends: SalesSummary[] = []
  let topSelling: TopSellingItem[] = []
  let alerts: Array<{ 
    type: string; 
    message: string; 
    severity: string; 
    itemId: number;
    itemCode: string;
    name: string;
    stockQuantity: number;
  }> = []
  let loading = true
  let searchQuery = ''
  let searchResults: any[] = []
  let showSearchResults = false
  let allItems: any[] = []
  
  onMount(async () => {
    settings.load()
    try {
      const [overviewRes, trendsRes, topRes, alertsRes, itemsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/dashboard/sales-trends?days=7'),
        fetch('/api/sales/top-selling'),
        fetch('/api/dashboard/alerts'),
        fetch('/api/items')
      ])
      
      const [overviewData, trendsData, topData, alertsData, itemsData] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        topRes.json(),
        alertsRes.json(),
        itemsRes.json()
      ])
      
      if (overviewData.success) overview = overviewData.data
      if (trendsData.success) salesTrends = trendsData.data
      if (topData.success) topSelling = topData.data
      if (alertsData.success) alerts = alertsData.data
      if (itemsData.success) allItems = itemsData.data
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      loading = false
    }
  })
  
  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  function getWeekday(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }
  
  function navigateToInventory(itemId?: number, itemCode?: string) {
    const params = new URLSearchParams()
    if (itemId) params.set('highlight', itemId.toString())
    if (itemCode) params.set('search', itemCode)
    goto(`/inventory?${params.toString()}`)
  }
  
  function handleSearch() {
    if (!searchQuery.trim()) {
      searchResults = []
      showSearchResults = false
      return
    }
    
    const query = searchQuery.toLowerCase()
    searchResults = allItems
      .filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.itemCode.toLowerCase().includes(query)
      )
      .slice(0, 8)
    showSearchResults = searchResults.length > 0
  }
  
  function clearSearch() {
    searchQuery = ''
    searchResults = []
    showSearchResults = false
  }
  
  function navigateTo(path: string) {
    goto(path)
    clearSearch()
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      clearSearch()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
  <title>Dashboard - Mini Store Inventory</title>
</svelte:head>

<div class="space-y-8">
  <!-- Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-sm text-gray-500 mt-1">Welcome back! Here's your store overview.</p>
    </div>
    
    <!-- Search Bar -->
    <div class="relative w-full sm:w-80">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text"
          bind:value={searchQuery}
          on:input={handleSearch}
          on:focus={() => { if (searchResults.length > 0) showSearchResults = true }}
          placeholder="Search items, sales..."
          class="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
        {#if searchQuery}
          <button 
            on:click={clearSearch}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
      
      <!-- Search Results Dropdown -->
      {#if showSearchResults && searchResults.length > 0}
        <div class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
          <div class="p-2 border-b border-gray-100">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Items ({searchResults.length})</p>
          </div>
          <div class="max-h-64 overflow-y-auto">
            {#each searchResults as item}
              <button 
                on:click={() => navigateToInventory(item.id, item.itemCode)}
                class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p class="text-xs text-gray-500 font-mono">{item.itemCode}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-sm font-medium text-gray-900">{formatCurrency(item.price, $settings.currency)}</p>
                  <p class="text-xs {item.stockQuantity <= item.lowStockThreshold ? 'text-amber-600' : 'text-gray-500'}">
                    Stock: {item.stockQuantity}
                  </p>
                </div>
              </button>
            {/each}
          </div>
          <div class="p-2 bg-gray-50 border-t border-gray-100">
            <button 
              on:click={() => navigateTo('/inventory')}
              class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all inventory
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      {:else if showSearchResults && searchQuery}
        <div class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
          <div class="p-6 text-center">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p class="text-sm text-gray-500">No items found for "{searchQuery}"</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  {#if loading}
    <!-- Loading Skeleton -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each Array(4) as _}
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="skeleton h-4 w-24 mb-4"></div>
          <div class="skeleton h-8 w-32"></div>
        </div>
      {/each}
    </div>
  {:else if overview}
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Sales -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            +12.5%
          </span>
        </div>
        <p class="text-sm font-medium text-gray-500 mb-1">Total Sales</p>
        <p class="text-2xl font-bold text-gray-900">{formatCurrency(overview.totalSales, $settings.currency)}</p>
      </div>
      
      <!-- Transactions -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {overview.todaySales > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
            {overview.todaySales > 0 ? 'Today' : 'No sales'}
          </span>
        </div>
        <p class="text-sm font-medium text-gray-500 mb-1">Transactions</p>
        <p class="text-2xl font-bold text-gray-900">{overview.totalTransactions}</p>
      </div>
      
      <!-- Monthly Sales -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
            This month
          </span>
        </div>
        <p class="text-sm font-medium text-gray-500 mb-1">Monthly Sales</p>
        <p class="text-2xl font-bold text-gray-900">{formatCurrency(overview.monthSales, $settings.currency)}</p>
      </div>
      
      <!-- Low Stock -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          {#if overview.lowStockItems > 0}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Alert
            </span>
          {:else}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Good
            </span>
          {/if}
        </div>
        <p class="text-sm font-medium text-gray-500 mb-1">Low Stock Items</p>
        <p class="text-2xl font-bold text-gray-900">{overview.lowStockItems}</p>
        <a href="/inventory" class="text-sm text-amber-600 hover:text-amber-700 font-medium mt-2 inline-block">
          View inventory →
        </a>
      </div>
    </div>
    
    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sales Trends -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Sales Trends</h2>
            <p class="text-sm text-gray-500 mt-0.5">Daily sales for the past week</p>
          </div>
          <select class="input w-auto text-sm py-2">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        
        {#if salesTrends.length > 0}
          <div class="space-y-3">
            {#each salesTrends as sale, index}
              {@const maxSales = Math.max(...salesTrends.map(s => s.totalSales))}
              {@const barWidth = maxSales > 0 ? (sale.totalSales / maxSales) * 100 : 0}
              <div class="relative">
                <div class="flex items-center gap-4 mb-2">
                  <div class="w-12 text-center">
                    <span class="text-xs font-medium text-gray-500">{getWeekday(sale.date)}</span>
                    <p class="text-sm font-semibold text-gray-900">{formatDate(sale.date)}</p>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <div class="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg transition-all duration-500"
                          style="width: {barWidth}%"
                        ></div>
                      </div>
                      <div class="w-24 text-right">
                        <p class="text-sm font-semibold text-gray-900">{formatCurrency(sale.totalSales, $settings.currency)}</p>
                        <p class="text-xs text-gray-500">{sale.transactionCount} sales</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-sm font-medium text-gray-900 mb-1">No sales data yet</h3>
            <p class="text-sm text-gray-500">Start making sales to see your trends here.</p>
          </div>
        {/if}
      </div>
      
      <!-- Top Selling Items -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900">Top Selling Items</h2>
          <p class="text-sm text-gray-500 mt-0.5">Best performers this week</p>
        </div>
        
        {#if topSelling.length > 0}
          <div class="space-y-4">
            {#each topSelling as item, index}
              <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span class="text-sm font-bold text-gray-700">{index + 1}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900 truncate">{item.itemName}</p>
                  <p class="text-xs text-gray-500">{item.totalQuantity} units sold</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-gray-900">{formatCurrency(item.totalRevenue, $settings.currency)}</p>
                </div>
              </div>
            {/each}
          </div>
          
          <a href="/sales" class="block text-center text-sm font-medium text-primary-600 hover:text-primary-700 mt-6 py-2 border-t border-gray-100">
            View all sales →
          </a>
        {:else}
          <div class="text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 class="text-sm font-medium text-gray-900 mb-1">No sales yet</h3>
            <p class="text-sm text-gray-500">Your top selling items will appear here.</p>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Stock Alerts Section -->
    {#if alerts.length > 0}
      {@const criticalAlerts = alerts.filter(a => a.severity === 'critical')}
      {@const warningAlerts = alerts.filter(a => a.severity !== 'critical')}
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Stock Alerts</h2>
              <p class="text-sm text-gray-500 mt-0.5">{alerts.length} item{alerts.length !== 1 ? 's' : ''} need attention</p>
            </div>
          </div>
          <a href="/inventory" class="btn btn-secondary text-sm">
            Manage Inventory
          </a>
        </div>
        
        {#if criticalAlerts.length > 0}
          <div class="mb-6">
            <h3 class="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-2 h-2 bg-red-500 rounded-full"></span>
              Critical ({criticalAlerts.length})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each criticalAlerts as alert}
                <button 
                  on:click={() => navigateToInventory(alert.itemId, alert.itemCode)}
                  class="group relative bg-red-50 border border-red-100 rounded-xl p-4 hover:bg-red-100 transition-all text-left w-full"
                >
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-900">{alert.name}</p>
                      <p class="text-xs text-gray-500 font-mono mb-1">{alert.itemCode}</p>
                      <p class="text-xs text-red-600 font-medium">Stock: {alert.stockQuantity} (Out of stock)</p>
                    </div>
                    <svg class="w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
        
        {#if warningAlerts.length > 0}
          <div>
            <h3 class="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
              Low Stock ({warningAlerts.length})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each warningAlerts as alert}
                <button 
                  on:click={() => navigateToInventory(alert.itemId, alert.itemCode)}
                  class="group relative bg-amber-50 border border-amber-100 rounded-xl p-4 hover:bg-amber-100 transition-all text-left w-full"
                >
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-900">{alert.name}</p>
                      <p class="text-xs text-gray-500 font-mono mb-1">{alert.itemCode}</p>
                      <p class="text-xs text-amber-600 font-medium">Stock: {alert.stockQuantity} (Low)</p>
                    </div>
                    <svg class="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
