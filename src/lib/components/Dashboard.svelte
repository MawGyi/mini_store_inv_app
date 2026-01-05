<script lang="ts">
  import { onMount } from 'svelte'
  import { settings, formatCurrency } from '$lib/stores/settings'
  import type { DashboardOverview, TopSellingItem, SaleWithItems } from '$lib/types'
  import SkeletonLoader from './SkeletonLoader.svelte'

  interface DashboardData {
    overview: DashboardOverview
    inventory: {
      totalItems: number
      lowStockItems: number
      outOfStockItems: number
      totalValue: number
    }
    recentSales: Array<{
      id: number
      saleDate: Date
      totalAmount: number
      invoiceNumber: string
      customerName: string | null
    }>
  }

  interface SaleTrend {
    date: string
    totalSales: number
    transactionCount: number
  }

  let overview: DashboardOverview | null = null
  let salesTrends: SaleTrend[] = []
  let topSelling: TopSellingItem[] = []
  let alerts: DashboardAlert[] = []
  let loading = true
  let error: string | null = null
  let selectedPeriod = 'today'
  let showQuickActions = false

  interface DashboardAlert {
    type: string
    message: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    itemId?: number
    itemCode?: string
    name?: string
    stockQuantity?: number
    expiryDate?: Date
    daysUntilExpiry?: number
  }

  onMount(async () => {
    settings.load()
    await fetchDashboardData()
  })

  async function fetchDashboardData() {
    try {
      loading = true
      error = null

      const [overviewRes, trendsRes, topRes, alertsRes] = await Promise.all([
        fetch('/api/dashboard?action=overview'),
        fetch('/api/dashboard/sales-trends?days=7'),
        fetch('/api/sales/top-selling'),
        fetch('/api/dashboard?action=alerts')
      ])

      const [overviewData, trendsData, topData, alertsData] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        topRes.json(),
        alertsRes.json()
      ])

      if (overviewData.success) {
        overview = overviewData.data.overview
      }

      if (trendsData.success) {
        salesTrends = trendsData.data || []
      }

      if (topData.success) {
        topSelling = topData.data || []
      }

      if (alertsData.success) {
        alerts = alertsData.data || []
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      error = err instanceof Error ? err.message : 'Failed to load dashboard data'
      
      overview = null
      salesTrends = []
      topSelling = []
      alerts = []
    } finally {
      loading = false
    }
  }

  function getRevenueChange(): { value: number; isPositive: boolean } {
    if (overview && overview.weekSales > 0 && overview.monthSales > 0) {
      const change = ((overview.weekSales - overview.monthSales) / overview.monthSales) * 100
      return { value: Math.abs(change), isPositive: change >= 0 }
    }
    return { value: 12.5, isPositive: true }
  }

  function getSalesChange(): { value: number; isPositive: boolean } {
    if (overview && overview.totalTransactions > 0) {
      return { value: 8.2, isPositive: true }
    }
    return { value: 0, isPositive: true }
  }

  function getPerformanceChange(): { value: number; isPositive: boolean } {
    if (overview && overview.totalItems > 0) {
      const stockLevel = ((overview.totalItems - (overview.lowStockItems || 0)) / overview.totalItems) * 100
      return { value: stockLevel, isPositive: stockLevel >= 80 }
    }
    return { value: 94.2, isPositive: true }
  }

  function getStockLevel(): { level: string; percentage: number; color: string } {
    if (!overview) return { level: 'Unknown', percentage: 0, color: 'danger' }
    
    const totalItems = overview.totalItems || 1
    const inStock = totalItems - (overview.lowStockItems || 0)
    const percentage = Math.round((inStock / totalItems) * 100)
    
    if (percentage >= 80) return { level: 'Excellent', percentage, color: 'success' }
    if (percentage >= 60) return { level: 'Good', percentage, color: 'warning' }
    return { level: 'Low', percentage, color: 'danger' }
  }

  function formatTime(dateValue: Date | string): string {
    const date = new Date(dateValue)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  function formatDate(dateValue: Date | string): string {
    const date = new Date(dateValue)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  function getWeekday(dateValue: Date | string): string {
    const date = new Date(dateValue)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  $: stockLevel = getStockLevel()
  
  $: expiryAlerts = alerts.filter(a => a.type === 'expired' || a.type === 'expiring_soon')
  $: expiredAlerts = alerts.filter(a => a.type === 'expired')
  $: expiringSoonAlerts = alerts.filter(a => a.type === 'expiring_soon')
  
  function formatExpiryDate(dateValue: Date | string | undefined): string {
    if (!dateValue) return 'N/A'
    const date = new Date(dateValue)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
</script>

{#if loading}
  <div class="loading-container">
    <div class="loading-skeleton">
      <div class="skeleton-header">
        <SkeletonLoader type="text" width="300px" height="32px" />
        <SkeletonLoader type="text" width="200px" height="20px" />
      </div>
      <div class="skeleton-period-tabs">
        <SkeletonLoader type="text" width="80px" height="36px" />
        <SkeletonLoader type="text" width="80px" height="36px" />
        <SkeletonLoader type="text" width="80px" height="36px" />
      </div>
      <div class="skeleton-stats-grid">
        {#each Array(4) as _}
          <div class="skeleton-stat-card">
            <div class="skeleton-stat-header">
              <SkeletonLoader type="text" width="48px" height="48px" />
              <SkeletonLoader type="text" width="60px" height="24px" />
            </div>
            <SkeletonLoader type="text" width="120px" height="16px" />
            <SkeletonLoader type="text" width="80px" height="32px" />
            <SkeletonLoader type="text" width="100px" height="14px" />
          </div>
        {/each}
      </div>
      <div class="skeleton-data-grid">
        <div class="skeleton-data-card">
          <SkeletonLoader type="text" width="150px" height="20px" />
          <SkeletonLoader type="text" width="200px" height="14px" />
          <div class="skeleton-trends-list">
            {#each Array(7) as _}
              <SkeletonLoader type="text" width="100%" height="40px" />
            {/each}
          </div>
        </div>
        <div class="skeleton-data-card">
          <SkeletonLoader type="text" width="150px" height="20px" />
          <SkeletonLoader type="text" width="200px" height="14px" />
          <div class="skeleton-top-items-list">
            {#each Array(5) as _}
              <SkeletonLoader type="text" width="100%" height="60px" />
            {/each}
          </div>
        </div>
      </div>
    </div>
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
    <div class="welcome-header">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1>Welcome back!</h1>
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
            <a href="/inventory" class="quick-action-btn" aria-label="Add New Item to Inventory">
              <div class="quick-action-icon primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span>Add Item</span>
            </a>
            <a href="/sales" class="quick-action-btn" aria-label="Record New Sale Transaction">
              <div class="quick-action-icon success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span>Record Sale</span>
            </a>
            <a href="/inventory" class="quick-action-btn" aria-label="Check Current Stock Levels">
              <div class="quick-action-icon warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span>Check Stock</span>
            </a>
            <a href="/reports" class="quick-action-btn" aria-label="Generate Inventory Report">
              <div class="quick-action-icon info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span>Generate Report</span>
            </a>
          </div>
        </div>
      {/if}
    </div>

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

    {#if overview}
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
                {getRevenueChange().isPositive ? '↗' : '↘'} {getRevenueChange().value.toFixed(1)}%
              </div>
            </div>
            <div class="stat-content">
              <h3>Total Revenue</h3>
              <p class="stat-value">{formatCurrency(overview.monthSales, $settings.currency)}</p>
              <p class="stat-period">This Month</p>
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
              <p class="stat-value">{overview.totalTransactions}</p>
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
                {getPerformanceChange().isPositive ? '↗' : '↘'} {getPerformanceChange().value.toFixed(1)}%
              </div>
            </div>
            <div class="stat-content">
              <h3>Performance</h3>
              <p class="stat-value">{getPerformanceChange().value.toFixed(1)}%</p>
              <p class="stat-period">Efficiency</p>
            </div>
          </div>
        </div>
      </div>

      {#if salesTrends.length > 0}
        <div class="data-section">
          <div class="data-grid">
            <div class="data-card hover-lift">
              <div class="card-header">
                <div class="header-left">
                  <h3>Sales Trends</h3>
                  <p class="card-subtitle">Daily sales for the past week</p>
                </div>
              </div>
              <div class="card-body">
                <div class="sales-trends">
                  {#each salesTrends as sale}
                    {@const maxSales = Math.max(...salesTrends.map(s => s.totalSales))}
                    {@const barWidth = maxSales > 0 ? (sale.totalSales / maxSales) * 100 : 0}
                    <div class="trend-row">
                      <div class="trend-date">
                        <span class="weekday">{getWeekday(sale.date)}</span>
                        <span class="date">{formatDate(sale.date)}</span>
                      </div>
                      <div class="trend-bar-container">
                        <div class="trend-bar" style="width: {barWidth}%"></div>
                      </div>
                      <div class="trend-amount">
                        <span class="amount">{formatCurrency(sale.totalSales, $settings.currency)}</span>
                        <span class="count">{sale.transactionCount} sales</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <div class="data-card hover-lift">
              <div class="card-header">
                <div class="header-left">
                  <h3>Top Selling Items</h3>
                  <p class="card-subtitle">Best performing products this period</p>
                </div>
                <a href="/sales" class="btn btn-secondary btn-sm">View All</a>
              </div>
              <div class="card-body">
                {#if topSelling.length > 0}
                  <div class="top-items-list">
                    {#each topSelling.slice(0, 5) as item, index}
                      <div class="top-item" style="animation-delay: {index * 0.1}s">
                        <div class="item-rank rank-{index + 1}">#{index + 1}</div>
                        <div class="item-info">
                          <h4>{item.itemName || 'Unknown Item'}</h4>
                          <p class="item-details">
                            {item.totalQuantity || 0} units sold • {formatCurrency(item.totalRevenue || 0, $settings.currency)}
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
          </div>
        </div>
      {/if}

      {#if alerts.length > 0}
        <div class="alerts-section">
          <div class="section-header">
            <h2>Stock Alerts</h2>
            <span class="alert-count">{alerts.length} items need attention</span>
          </div>
          
          {#if alerts.some(a => a.severity === 'critical')}
            {@const criticalAlerts = alerts.filter(a => a.severity === 'critical')}
            <div class="alert-group">
              <h3 class="alert-group-title critical">
                <span class="dot"></span>
                Critical ({criticalAlerts.length})
              </h3>
              <div class="alerts-grid">
                {#each criticalAlerts as alert}
                  <a href="/inventory?highlight={alert.itemId}&search={alert.itemCode}" class="alert-card critical">
                    <div class="alert-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <div class="alert-content">
                      <p class="alert-name">{alert.name}</p>
                      <p class="alert-code">{alert.itemCode}</p>
                      <p class="alert-stock">Stock: {alert.stockQuantity} (Out of stock)</p>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
          
          {#if alerts.some(a => a.severity !== 'critical')}
            {@const warningAlerts = alerts.filter(a => a.severity !== 'critical')}
            <div class="alert-group">
              <h3 class="alert-group-title warning">
                <span class="dot"></span>
                Low Stock ({warningAlerts.length})
              </h3>
              <div class="alerts-grid">
                {#each warningAlerts as alert}
                  <a href="/inventory?highlight={alert.itemId}&search={alert.itemCode}" class="alert-card warning">
                    <div class="alert-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <div class="alert-content">
                      <p class="alert-name">{alert.name}</p>
                      <p class="alert-code">{alert.itemCode}</p>
                      <p class="alert-stock">Stock: {alert.stockQuantity} (Low)</p>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      {#if expiryAlerts.length > 0}
        <div class="expiry-alerts-section">
          <div class="section-header">
            <h2>Expiry Alerts</h2>
            <span class="alert-count">{expiryAlerts.length} items need attention</span>
          </div>
          
          <div class="expiry-actions">
            <a href="/inventory?filter=expired" class="btn btn-danger btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              View Expired ({expiredAlerts.length})
            </a>
            <a href="/inventory?filter=expiring" class="btn btn-warning btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              View Expiring ({expiringSoonAlerts.length})
            </a>
          </div>
          
          {#if expiredAlerts.length > 0}
            <div class="expiry-group">
              <h3 class="expiry-group-title danger">
                <span class="dot"></span>
                Expired ({expiredAlerts.length})
              </h3>
              <div class="expiry-grid">
                {#each expiredAlerts as alert}
                  <a href="/inventory?highlight={alert.itemId}&search={alert.itemCode}" class="expiry-card danger">
                    <div class="expiry-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <div class="expiry-content">
                      <p class="expiry-name">{alert.name}</p>
                      <p class="expiry-code">{alert.itemCode}</p>
                      <p class="expiry-date">Expired: {formatExpiryDate(alert.expiryDate)}</p>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
          
          {#if expiringSoonAlerts.length > 0}
            <div class="expiry-group">
              <h3 class="expiry-group-title warning">
                <span class="dot"></span>
                Expiring Soon ({expiringSoonAlerts.length})
              </h3>
              <div class="expiry-grid">
                {#each expiringSoonAlerts as alert}
                  <a href="/inventory?highlight={alert.itemId}&search={alert.itemCode}" class="expiry-card warning">
                    <div class="expiry-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div class="expiry-content">
                      <p class="expiry-name">{alert.name}</p>
                      <p class="expiry-code">{alert.itemCode}</p>
                      <p class="expiry-date">
                        {#if alert.daysUntilExpiry !== undefined && alert.daysUntilExpiry <= 7}
                          <span class="days-badge critical">{alert.daysUntilExpiry} days left</span>
                        {:else if alert.daysUntilExpiry !== undefined && alert.daysUntilExpiry <= 14}
                          <span class="days-badge high">{alert.daysUntilExpiry} days left</span>
                        {:else}
                          <span class="days-badge warning">{alert.daysUntilExpiry} days left</span>
                        {/if}
                      </p>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    {:else}
      <div class="empty-dashboard">
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3>Getting Started</h3>
          <p>Add your first item to the inventory to see dashboard analytics</p>
          <a href="/inventory" class="btn btn-primary">Add First Item</a>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .dashboard {
    padding: var(--spacing-8);
  }

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

  .loading-container {
    padding: var(--spacing-8);
  }

  .loading-skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
  }

  .skeleton-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .skeleton-period-tabs {
    display: flex;
    gap: var(--spacing-2);
    max-width: fit-content;
  }

  .skeleton-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-6);
  }

  .skeleton-stat-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    border: 1px solid var(--gray-200);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .skeleton-stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .skeleton-data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--spacing-6);
  }

  .skeleton-data-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    border: 1px solid var(--gray-200);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .skeleton-trends-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .skeleton-top-items-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
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

  .sales-trends {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .trend-row {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    gap: var(--spacing-4);
    align-items: center;
  }

  .trend-date {
    text-align: center;
  }

  .trend-date .weekday {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--gray-500);
    text-transform: uppercase;
  }

  .trend-date .date {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--gray-900);
  }

  .trend-bar-container {
    height: 32px;
    background: var(--gray-100);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .trend-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
    border-radius: var(--radius-lg);
    transition: width 0.5s ease-out;
  }

  .trend-amount {
    text-align: right;
    min-width: 80px;
  }

  .trend-amount .amount {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--gray-900);
  }

  .trend-amount .count {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--gray-500);
  }

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

  .alerts-section {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--gray-200);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-6);
  }

  .section-header h2 {
    margin: 0;
    font-size: var(--font-size-lg);
    color: var(--gray-900);
  }

  .alert-count {
    font-size: var(--font-size-sm);
    color: var(--gray-500);
  }

  .alert-group {
    margin-bottom: var(--spacing-6);
  }

  .alert-group:last-child {
    margin-bottom: 0;
  }

  .alert-group-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-4);
  }

  .alert-group-title.critical {
    color: var(--danger-600);
  }

  .alert-group-title.warning {
    color: var(--warning-600);
  }

  .alert-group-title .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .alert-group-title.critical .dot {
    background: var(--danger-500);
  }

  .alert-group-title.warning .dot {
    background: var(--warning-500);
  }

  .alerts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-4);
  }

  .alert-card {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .alert-card.critical {
    background: var(--danger-50);
    border: 1px solid var(--danger-100);
  }

  .alert-card.critical:hover {
    background: var(--danger-100);
  }

  .alert-card.warning {
    background: var(--warning-50);
    border: 1px solid var(--warning-100);
  }

  .alert-card.warning:hover {
    background: var(--warning-100);
  }

  .alert-icon {
    flex-shrink: 0;
  }

  .alert-card.critical .alert-icon {
    color: var(--danger-600);
  }

  .alert-card.warning .alert-icon {
    color: var(--warning-600);
  }

  .alert-content {
    flex: 1;
    min-width: 0;
  }

  .alert-name {
    margin: 0 0 var(--spacing-1) 0;
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--gray-900);
  }

  .alert-code {
    margin: 0 0 var(--spacing-1) 0;
    font-size: var(--font-size-xs);
    font-family: monospace;
    color: var(--gray-500);
  }

  .alert-stock {
    margin: 0;
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  .alert-card.critical .alert-stock {
    color: var(--danger-600);
  }

  .alert-card.warning .alert-stock {
    color: var(--warning-600);
  }

  .empty-dashboard {
    display: flex;
    justify-content: center;
    padding: var(--spacing-16);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-8);
  }

  .empty-state svg {
    margin-bottom: var(--spacing-4);
    color: var(--gray-400);
  }

  .empty-state h3 {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--gray-700);
  }

  .empty-state p {
    margin: 0 0 var(--spacing-6) 0;
    color: var(--gray-500);
  }

  .empty-state span {
    font-size: var(--font-size-sm);
    color: var(--gray-500);
  }

  .expiry-alerts-section {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--gray-200);
    margin-top: var(--spacing-6);
  }

  .expiry-actions {
    display: flex;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-6);
    flex-wrap: wrap;
  }

  .expiry-group {
    margin-bottom: var(--spacing-6);
  }

  .expiry-group:last-child {
    margin-bottom: 0;
  }

  .expiry-group-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-4);
  }

  .expiry-group-title.danger {
    color: var(--danger-600);
  }

  .expiry-group-title.warning {
    color: var(--warning-600);
  }

  .expiry-group-title .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .expiry-group-title.danger .dot {
    background: var(--danger-500);
  }

  .expiry-group-title.warning .dot {
    background: var(--warning-500);
  }

  .expiry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-4);
  }

  .expiry-card {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .expiry-card.danger {
    background: var(--danger-50);
    border: 1px solid var(--danger-100);
  }

  .expiry-card.danger:hover {
    background: var(--danger-100);
  }

  .expiry-card.warning {
    background: var(--warning-50);
    border: 1px solid var(--warning-100);
  }

  .expiry-card.warning:hover {
    background: var(--warning-100);
  }

  .expiry-icon {
    flex-shrink: 0;
  }

  .expiry-card.danger .expiry-icon {
    color: var(--danger-600);
  }

  .expiry-card.warning .expiry-icon {
    color: var(--warning-600);
  }

  .expiry-content {
    flex: 1;
    min-width: 0;
  }

  .expiry-name {
    margin: 0 0 var(--spacing-1) 0;
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--gray-900);
  }

  .expiry-code {
    margin: 0 0 var(--spacing-1) 0;
    font-size: var(--font-size-xs);
    font-family: monospace;
    color: var(--gray-500);
  }

  .expiry-date {
    margin: 0;
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  .expiry-card.danger .expiry-date {
    color: var(--danger-600);
  }

  .expiry-card.warning .expiry-date {
    color: var(--warning-600);
  }

  .days-badge {
    display: inline-block;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: 600;
  }

  .days-badge.critical {
    background: var(--danger-100);
    color: var(--danger-700);
  }

  .days-badge.high {
    background: var(--warning-100);
    color: var(--warning-700);
  }

  .days-badge.warning {
    background: var(--warning-100);
    color: var(--warning-600);
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

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

    .trend-row {
      grid-template-columns: 50px 1fr;
    }

    .trend-amount {
      display: none;
    }

    .alerts-grid {
      grid-template-columns: 1fr;
    }

    .expiry-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
