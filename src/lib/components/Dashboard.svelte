<script lang="ts">
  import { onMount } from 'svelte';
  import type { Sale } from '$lib/types';
  import { settings, formatCurrency, currencySymbol } from '$lib/stores/settings';

  // Remove local formatCurrency - using imported one from settings

  let dailySales: Sale[] = [];
  let totalRevenue = 0;
  let topSellingItems: any[] = [];
  let loading = true;
  let error: string | null = null;
  let selectedPeriod = 'today';
  let showQuickActions = false;

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  onMount(async () => {
    settings.load();
    await fetchDashboardData();
  });

  async function fetchDashboardData() {
    try {
      loading = true;
      error = null;

      // Fetch daily sales summary
      const summaryResponse = await fetch(`${API_BASE_URL}/api/sales/summary/daily`);
      if (!summaryResponse.ok) {
        throw new Error(`HTTP error! status: ${summaryResponse.status}`);
      }
      const summaryData = await summaryResponse.json();
      
      dailySales = summaryData.sales || [];
      totalRevenue = summaryData.totalSales || 0;

      // Fetch top selling items
      const topResponse = await fetch(`${API_BASE_URL}/api/sales/top-selling`);
      if (!topResponse.ok) {
        throw new Error(`HTTP error! status: ${topResponse.status}`);
      }
      topSellingItems = await topResponse.json();

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      error = err instanceof Error ? err.message : 'Failed to load dashboard data';
      
      // Set default values when API is not available
      dailySales = [];
      totalRevenue = 0;
      topSellingItems = [];
    } finally {
      loading = false;
    }
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  function getRevenueChange(): { value: number; isPositive: boolean } {
    // Mock data - in real app this would come from API
    return { value: 12.5, isPositive: true };
  }

  function getSalesChange(): { value: number; isPositive: boolean } {
    // Mock data - in real app this would come from API
    return { value: 8.2, isPositive: true };
  }

  function getPerformanceChange(): { value: number; isPositive: boolean } {
    // Mock data - in real app this would come from API
    return { value: 2.1, isPositive: true };
  }

  function getStockLevel(): { level: string; percentage: number; color: string } {
    const totalItems = 24;
    const availableItems = 18;
    const percentage = Math.round((availableItems / totalItems) * 100);
    
    if (percentage >= 80) return { level: 'Excellent', percentage, color: 'success' };
    if (percentage >= 60) return { level: 'Good', percentage, color: 'warning' };
    return { level: 'Low', percentage, color: 'danger' };
  }

  const stockLevel = getStockLevel();
</script>

{#if loading}
  <div class="loading-container">
    <div class="loading-spinner"></div>
    <p>Loading dashboard data...</p>
  </div>
{:else if error}
  <div class="error-container">
    <div class="error-card">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
        </svg>
      </div>
      <h3>Unable to Load Dashboard</h3>
      <p class="error-message">{error}</p>
      <p class="error-note">This usually means the backend server is not running. Please start the server first.</p>
      <button class="btn btn-primary" on:click={fetchDashboardData}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 4V10H7M23 20V14H17M20.49 9C19.2214 7.33122 17.4722 6.11111 15.5 5.5M3.51 15C4.77859 16.6688 6.52779 17.8889 8.5 18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Retry
      </button>
    </div>
  </div>
{:else}
  <div class="dashboard">
    <!-- Welcome Header -->
    <div class="welcome-header">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1>Welcome back! 👋</h1>
          <p>Here's what's happening with your inventory today</p>
        </div>
        <div class="quick-actions">
          <button class="btn btn-primary" aria-label="Toggle Quick Actions Panel" on:click={() => showQuickActions = !showQuickActions}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Quick Actions
          </button>
        </div>
      </div>
      
      {#if showQuickActions}
        <div class="quick-actions-panel slide-in">
          <div class="quick-actions-grid">
            <button class="quick-action-btn" aria-label="Add New Item to Inventory">
              <div class="quick-action-icon primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span>Add Item</span>
            </button>
            <button class="quick-action-btn" aria-label="Record New Sale Transaction">
              <div class="quick-action-icon success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span>Record Sale</span>
            </button>
            <button class="quick-action-btn" aria-label="Check Current Stock Levels">
              <div class="quick-action-icon warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span>Check Stock</span>
            </button>
            <button class="quick-action-btn" aria-label="Generate Inventory Report">
              <div class="quick-action-icon info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Period Selector -->
    <div class="period-selector">
      <div class="period-tabs">
        <button 
          class="period-tab {selectedPeriod === 'today' ? 'active' : ''}"
          on:click={() => selectedPeriod = 'today'}
        >
          Today
        </button>
        <button 
          class="period-tab {selectedPeriod === 'week' ? 'active' : ''}"
          on:click={() => selectedPeriod = 'week'}
        >
          This Week
        </button>
        <button 
          class="period-tab {selectedPeriod === 'month' ? 'active' : ''}"
          on:click={() => selectedPeriod = 'month'}
        >
          This Month
        </button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card primary hover-lift">
          <div class="stat-header">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M7.76 7.76L6 12L7.76 16.24M16.24 16.24L18 12L16.24 7.76" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="stat-trend {getRevenueChange().isPositive ? 'positive' : 'negative'}">
              {getRevenueChange().isPositive ? '↗' : '↘'} {getRevenueChange().value}%
            </div>
          </div>
          <div class="stat-content">
            <h3>Total Revenue</h3>
            <p class="stat-value">{formatCurrency(totalRevenue)}</p>
            <p class="stat-period">{selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : 'This Month'}</p>
          </div>
        </div>

        <div class="stat-card success hover-lift">
          <div class="stat-header">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="stat-trend {getSalesChange().isPositive ? 'positive' : 'negative'}">
              {getSalesChange().isPositive ? '↗' : '↘'} {getSalesChange().value}%
            </div>
          </div>
          <div class="stat-content">
            <h3>Total Sales</h3>
            <p class="stat-value">{dailySales.length}</p>
            <p class="stat-period">Transactions</p>
          </div>
        </div>

        <div class="stat-card warning hover-lift">
          <div class="stat-header">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="stat-trend neutral">
              → {stockLevel.level}
            </div>
          </div>
          <div class="stat-content">
            <h3>Stock Level</h3>
            <p class="stat-value">{stockLevel.percentage}%</p>
            <p class="stat-period">{stockLevel.level} Stock</p>
          </div>
          <div class="stock-progress">
            <div class="progress-bar">
              <div class="progress-fill {stockLevel.color}" style="width: {stockLevel.percentage}%"></div>
            </div>
          </div>
        </div>

        <div class="stat-card info hover-lift">
          <div class="stat-header">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="stat-trend {getPerformanceChange().isPositive ? 'positive' : 'negative'}">
              {getPerformanceChange().isPositive ? '↗' : '↘'} {getPerformanceChange().value}%
            </div>
          </div>
          <div class="stat-content">
            <h3>Performance</h3>
            <p class="stat-value">94.2%</p>
            <p class="stat-period">Efficiency</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts and Data Section -->
    <div class="data-section">
      <div class="data-grid">
        <!-- Top Selling Items -->
        <div class="data-card hover-lift">
          <div class="card-header">
            <div class="header-left">
              <h3>Top Selling Items</h3>
              <p class="card-subtitle">Best performing products this period</p>
            </div>
            <button class="btn btn-secondary btn-sm">View All</button>
          </div>
          <div class="card-body">
            {#if topSellingItems.length > 0}
              <div class="top-items-list">
                {#each topSellingItems.slice(0, 5) as item, index}
                  <div class="top-item" style="animation-delay: {index * 0.1}s">
                    <div class="item-rank rank-{index + 1}">#{index + 1}</div>
                    <div class="item-info">
                      <h4>{item._id?.name || 'Unknown Item'}</h4>
                      <p class="item-details">
                        {item.totalQuantity || 0} units sold • {formatCurrency(item.totalRevenue || 0)}
                      </p>
                    </div>
                    <div class="item-trend">
                      <span class="trend-indicator positive">↗</span>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4Z" fill="currentColor"/>
                </svg>
                <p>No top selling items found</p>
                <span>Start recording sales to see analytics</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Recent Sales -->
        <div class="data-card hover-lift">
          <div class="card-header">
            <div class="header-left">
              <h3>Recent Sales</h3>
              <p class="card-subtitle">Latest transactions and activities</p>
            </div>
            <button class="btn btn-secondary btn-sm">View All</button>
          </div>
          <div class="card-body">
            {#if dailySales.length > 0}
              <div class="recent-sales-list">
                {#each dailySales.slice(0, 6) as sale, index}
                  <div class="sale-item" style="animation-delay: {index * 0.1}s">
                    <div class="sale-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="sale-info">
                      <h4>{sale.item?.name || 'Unknown Item'}</h4>
                      <p class="sale-details">
                        {sale.quantity || 0} units • {formatCurrency(sale.totalPrice || 0)}
                      </p>
                    </div>
                    <div class="sale-time">
                      {formatTime(sale.saleDate)}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>No recent sales found</p>
                <span>Sales will appear here as they're recorded</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .dashboard {
    padding: var(--spacing-8);
  }

  /* Welcome Header */
  .welcome-header {
    margin-bottom: var(--spacing-8);
    position: relative;
  }

  .welcome-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-4);
  }

  .welcome-text h1 {
    margin: 0 0 var(--spacing-2) 0;
    font-size: var(--font-size-3xl);
    background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .welcome-text p {
    margin: 0;
    color: var(--gray-600);
    font-size: var(--font-size-lg);
  }

  .quick-actions-panel {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--gray-200);
    margin-top: var(--spacing-4);
  }

  .quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
  }

  .quick-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    background: var(--gray-50);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal);
    text-decoration: none;
    color: var(--gray-700);
  }

  .quick-action-btn:hover {
    background: white;
    border-color: var(--primary-300);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .quick-action-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .quick-action-icon.primary {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  }

  .quick-action-icon.success {
    background: linear-gradient(135deg, var(--success-500), var(--success-600));
  }

  .quick-action-icon.warning {
    background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
  }

  .quick-action-icon.info {
    background: linear-gradient(135deg, var(--primary-400), var(--primary-500));
  }

  /* Period Selector */
  .period-selector {
    margin-bottom: var(--spacing-8);
  }

  .period-tabs {
    display: flex;
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-1);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--gray-200);
    max-width: fit-content;
  }

  .period-tab {
    padding: var(--spacing-3) var(--spacing-6);
    background: transparent;
    border: none;
    border-radius: var(--radius-lg);
    color: var(--gray-600);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal);
    font-size: var(--font-size-sm);
  }

  .period-tab:hover {
    color: var(--primary-600);
    background: var(--primary-50);
  }

  .period-tab.active {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
    box-shadow: var(--shadow-md);
  }

  /* Loading States */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-16);
    color: var(--gray-500);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--gray-200);
    border-top: 3px solid var(--primary-500);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-4);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-container {
    padding: var(--spacing-8);
    display: flex;
    justify-content: center;
  }

  .error-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-8);
    text-align: center;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--gray-200);
    max-width: 500px;
  }

  .error-icon {
    color: var(--danger-500);
    margin-bottom: var(--spacing-4);
  }

  .error-card h3 {
    color: var(--gray-900);
    margin-bottom: var(--spacing-2);
  }

  .error-message {
    color: var(--danger-600);
    font-weight: 500;
    margin-bottom: var(--spacing-2);
  }

  .error-note {
    color: var(--gray-600);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-6);
  }

  /* Stats Section */
  .stats-section {
    margin-bottom: var(--spacing-8);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-6);
  }

  .stat-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--gray-200);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  }

  .stat-card.primary::before {
    background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  }

  .stat-card.success::before {
    background: linear-gradient(90deg, var(--success-500), var(--success-600));
  }

  .stat-card.warning::before {
    background: linear-gradient(90deg, var(--warning-500), var(--warning-600));
  }

  .stat-card.info::before {
    background: linear-gradient(90deg, var(--primary-400), var(--primary-500));
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-4);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    background: var(--gray-100);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gray-600);
  }

  .stat-trend {
    font-size: var(--font-size-sm);
    font-weight: 600;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-full);
  }

  .stat-trend.positive {
    background: var(--success-100);
    color: var(--success-700);
  }

  .stat-trend.negative {
    background: var(--danger-100);
    color: var(--danger-700);
  }

  .stat-trend.neutral {
    background: var(--gray-100);
    color: var(--gray-600);
  }

  .stat-content h3 {
    font-size: var(--font-size-sm);
    color: var(--gray-600);
    margin-bottom: var(--spacing-2);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--gray-900);
    margin-bottom: var(--spacing-2);
  }

  .stat-period {
    font-size: var(--font-size-sm);
    color: var(--gray-500);
    font-weight: 500;
  }

  /* Stock Progress Bar */
  .stock-progress {
    margin-top: var(--spacing-4);
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: var(--gray-200);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width var(--transition-normal);
  }

  .progress-fill.success {
    background: linear-gradient(90deg, var(--success-500), var(--success-600));
  }

  .progress-fill.warning {
    background: linear-gradient(90deg, var(--warning-500), var(--warning-600));
  }

  .progress-fill.danger {
    background: linear-gradient(90deg, var(--danger-500), var(--danger-600));
  }

  /* Data Section */
  .data-section {
    margin-bottom: var(--spacing-8);
  }

  .data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--spacing-6);
  }

  .data-card {
    background: white;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--gray-200);
    overflow: hidden;
    transition: all var(--transition-normal);
  }

  .data-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .card-header {
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--gray-50);
  }

  .header-left h3 {
    margin: 0 0 var(--spacing-1) 0;
    color: var(--gray-900);
    font-size: var(--font-size-lg);
  }

  .card-subtitle {
    margin: 0;
    color: var(--gray-600);
    font-size: var(--font-size-sm);
  }

  .card-body {
    padding: var(--spacing-6);
  }

  /* Top Items List */
  .top-items-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .top-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-3);
    border-radius: var(--radius-lg);
    transition: background var(--transition-fast);
    animation: fadeIn 0.5s ease-out forwards;
    opacity: 0;
    transform: translateY(10px);
  }

  .top-item:hover {
    background: var(--gray-50);
  }

  .item-rank {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: var(--font-size-sm);
  }

  .rank-1 {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: white;
  }

  .rank-2 {
    background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
    color: white;
  }

  .rank-3 {
    background: linear-gradient(135deg, #CD7F32, #B8860B);
    color: white;
  }

  .rank-4, .rank-5 {
    background: var(--primary-100);
    color: var(--primary-700);
  }

  .item-info {
    flex: 1;
  }

  .item-info h4 {
    margin: 0 0 var(--spacing-1) 0;
    color: var(--gray-900);
    font-size: var(--font-size-sm);
  }

  .item-details {
    margin: 0;
    color: var(--gray-600);
    font-size: var(--font-size-xs);
  }

  .item-trend {
    color: var(--success-600);
    font-size: var(--font-size-lg);
  }

  /* Recent Sales List */
  .recent-sales-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .sale-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border-radius: var(--radius-lg);
    transition: background var(--transition-fast);
    animation: fadeIn 0.5s ease-out forwards;
    opacity: 0;
    transform: translateY(10px);
  }

  .sale-item:hover {
    background: var(--gray-50);
  }

  .sale-icon {
    width: 32px;
    height: 32px;
    background: var(--success-100);
    color: var(--success-600);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sale-info {
    flex: 1;
  }

  .sale-info h4 {
    margin: 0 0 var(--spacing-1) 0;
    color: var(--gray-900);
    font-size: var(--font-size-sm);
  }

  .sale-details {
    margin: 0;
    color: var(--gray-600);
    font-size: var(--font-size-xs);
  }

  .sale-time {
    color: var(--gray-500);
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: var(--spacing-8);
    color: var(--gray-500);
  }

  .empty-state svg {
    margin-bottom: var(--spacing-4);
    color: var(--gray-400);
  }

  .empty-state p {
    margin: 0 0 var(--spacing-2) 0;
    font-weight: 500;
    color: var(--gray-700);
  }

  .empty-state span {
    font-size: var(--font-size-sm);
    color: var(--gray-500);
  }

  /* Animations */
  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .dashboard {
      padding: var(--spacing-4);
    }

    .welcome-content {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-4);
    }

    .welcome-text h1 {
      font-size: var(--font-size-2xl);
    }

    .quick-actions-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
    }

    .data-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
    }

    .stat-card {
      padding: var(--spacing-4);
    }

    .card-header,
    .card-body {
      padding: var(--spacing-4);
    }

    .stat-value {
      font-size: var(--font-size-2xl);
    }

    .period-tabs {
      max-width: 100%;
    }

    .period-tab {
      flex: 1;
      text-align: center;
    }
  }
</style>