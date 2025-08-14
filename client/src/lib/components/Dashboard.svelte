<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { apiService } from '../services/api';
  import SkeletonLoader from './SkeletonLoader.svelte';
  import NotificationToast from './NotificationToast.svelte';
  import ChartComponent from './ChartComponent.svelte';
  import { t, formatCurrency, formatDate } from '../stores/translationHelpers';

  interface DashboardData {
    overview: {
      todaySales?: number;
      todayTransactions?: number;
      totalItems?: number;
      lowStockItems?: number;
      recentSales?: Array<any>;
    };
    alerts: any;
    trends: any;
    topSelling: Array<any>;
  }

  let dashboardData: DashboardData | null = null;
  let loading = true;
  let error: string | null = null;
  let refreshInterval: number = 30000;
  let autoRefreshEnabled = true;
  let lastUpdateTime: Date | null = null;
  let notification: { type: 'success' | 'error' | 'info'; message: string; id: string } | null = null;

  // Animation states
  let metricsVisible = false;
  let chartsVisible = false;
  let reportsVisible = false;
  let refreshTimer: NodeJS.Timeout;
  
  // Dark mode support
  let isDarkMode = false;
  
  // Dashboard views
  let activeView = 'overview'; // overview, analytics, reports

  onMount(async () => {
    await loadDashboardData();
    if (autoRefreshEnabled) {
      startAutoRefresh();
    }
    
    // Trigger entrance animations
    setTimeout(() => metricsVisible = true, 200);
    setTimeout(() => chartsVisible = true, 400);
    setTimeout(() => reportsVisible = true, 600);
  });

  onDestroy(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
  });

  async function loadDashboardData() {
    try {
      loading = true;
      error = null;
      console.log('🔄 Loading dashboard data...');

      const [overview, alerts, trends, topSelling] = await Promise.all([
        apiService.getDashboardOverview().then(res => {
          console.log('📊 Overview response:', res);
          return res;
        }),
        apiService.getDashboardAlerts().then(res => {
          console.log('🚨 Alerts response:', res);
          return res;
        }),
        apiService.getSalesTrends().then(res => {
          console.log('📈 Trends response:', res);
          return res;
        }),
        apiService.getTopSellingItems(10).then(res => {
          console.log('🏆 Top selling response:', res);
          return res;
        })
      ]);

      if (overview.success && alerts.success && trends.success && topSelling.success) {
        dashboardData = {
          overview: (typeof overview.data === 'object' && overview.data !== null) ? overview.data : {},
          alerts: alerts.data,
          trends: trends.data,
          topSelling: Array.isArray(topSelling.data) ? topSelling.data : []
        };
        lastUpdateTime = new Date();
        console.log('✅ Dashboard data loaded successfully:', dashboardData);
        showNotification('success', 'Dashboard data loaded successfully');
      } else {
        console.error('❌ Some API calls failed:', { overview, alerts, trends, topSelling });
        throw new Error('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('💥 Error loading dashboard data:', err);
      error = 'ဒေတာဖတ်ခြင်းတွင် အမှားဖြစ်ပေါ်သည်။ ကျေးဇူးပြု၍ နောက်မှ ထပ်မံ ကြိုးစားပါ။';
      showNotification('error', error);
    } finally {
      loading = false;
    }
  }

  function startAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(() => {
      loadDashboardData();
    }, refreshInterval);
  }

  function formatMyanmarNumber(num: number): string {
    if (isNaN(num) || num === null || num === undefined) return '0';
    return num.toLocaleString('en-US');
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatMyanmarDate(dateString: string): string {
    const date = new Date(dateString);
    const months = [
      'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
      'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'
    ];
    
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  function getMetricIcon(type: string): string {
    const icons = {
      sales: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      items: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 16V8A2 2 0 0 0 19 6H5A2 2 0 0 0 3 8V16A2 2 0 0 0 5 18H19A2 2 0 0 0 21 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      transactions: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 3H7A4 4 0 0 0 3 7V17A4 4 0 0 0 7 21H17A4 4 0 0 0 21 17V7A4 4 0 0 0 17 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 9H15V15H9V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      alerts: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    };
    return icons[type] || icons.items;
  }

  function showNotification(type: 'success' | 'error' | 'info', message: string) {
    notification = {
      type,
      message,
      id: Date.now().toString()
    };
    setTimeout(() => notification = null, 5000);
  }
</script>

{#if loading}
  <div class="loading-container">
    <div class="modern-loader">
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
    </div>
    <p class="loading-text">{$t('common.loading')}</p>
  </div>
{:else if error}
  <div class="error-container">
    <div class="error-icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
      </svg>
    </div>
    <h3>{$t('common.error')}</h3>
    <p>{error}</p>
    <button class="retry-btn modern-btn" on:click={loadDashboardData}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
      </svg>
      {$t('common.retry')}
    </button>
  </div>
{:else}
  <div class="dashboard" class:dark={isDarkMode}>
    <!-- Modern Header with Navigation -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <div class="greeting-section">
            <h1 class="main-title">
              <span class="greeting">{$t('dashboard.greeting')}</span>
              <span class="business-name">🏪 {$t('dashboard.title')}</span>
            </h1>
            <p class="subtitle">{$t('dashboard.subtitle')}</p>
          </div>
        </div>
        <div class="header-right">
          <div class="quick-actions">
            <button class="theme-toggle" on:click={() => isDarkMode = !isDarkMode}>
              {#if isDarkMode}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                  <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
                  <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/>
                  <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/>
                  <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/>
                </svg>
              {:else}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2"/>
                </svg>
              {/if}
            </button>
            <button class="refresh-btn modern-btn primary" on:click={loadDashboardData} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class:spinning={loading}>
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
              </svg>
              {$t('common.refresh')}
            </button>
          </div>
          <div class="status-info">
            <div class="live-indicator">
              <div class="live-dot"></div>
              <span>{$t('common.live')}</span>
            </div>
            <span class="last-update">
              {lastUpdateTime ? `${$t('common.updated')} ${formatTime(lastUpdateTime.toISOString())}` : $t('common.loading')}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Dashboard Navigation Tabs -->
    <nav class="dashboard-nav">
      <div class="nav-tabs">
        <button 
          class="nav-tab" 
          class:active={activeView === 'overview'}
          on:click={() => activeView = 'overview'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
          </svg>
          {$t('dashboard.overview')}
        </button>
        <button 
          class="nav-tab" 
          class:active={activeView === 'analytics'}
          on:click={() => activeView = 'analytics'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3V21H21M7 14L12 9L16 13L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {$t('dashboard.analytics')}
        </button>
        <button 
          class="nav-tab" 
          class:active={activeView === 'reports'}
          on:click={() => activeView = 'reports'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6A2 2 0 0 0 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
            <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"/>
          </svg>
          {$t('nav.reports')}
        </button>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="dashboard-main">
      {#if activeView === 'overview'}
        <!-- Enhanced Stats Section -->
        <section class="stats-section" class:visible={metricsVisible}>
          <div class="stats-grid">
            <!-- Today's Sales Card -->
            <div class="stat-card primary slide-up" style="animation-delay: 0.1s">
              <div class="card-glow"></div>
              <div class="stat-icon-wrapper">
                <div class="stat-icon">
                  {@html getMetricIcon('sales')}
                </div>
                <div class="trend-indicator positive">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 14L12 9L17 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  +12%
                </div>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{$formatCurrency(dashboardData?.overview?.todaySales || 0)}</h3>
                <p class="stat-label">{$t('dashboard.todaySales')}</p>
                <div class="stat-meta">
                  <span class="stat-change positive">{$t('dashboard.increasing')}</span>
                  <div class="progress-ring">
                    <svg class="progress-ring-svg" width="40" height="40">
                      <circle cx="20" cy="20" r="15" fill="transparent" stroke="currentColor" stroke-width="2" stroke-dasharray="94" stroke-dashoffset="20"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Today's Transactions Card -->
            <div class="stat-card secondary slide-up" style="animation-delay: 0.2s">
              <div class="card-glow"></div>
              <div class="stat-icon-wrapper">
                <div class="stat-icon">
                  {@html getMetricIcon('transactions')}
                </div>
                <div class="trend-indicator positive">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 14L12 9L17 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  +5
                </div>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{formatMyanmarNumber(dashboardData?.overview?.todayTransactions || 0)}</h3>
                <p class="stat-label">{$t('dashboard.todayTransactions')}</p>
                <div class="stat-meta">
                  <span class="stat-change positive">{$t('dashboard.totalSales')}</span>
                  <div class="progress-ring">
                    <svg class="progress-ring-svg" width="40" height="40">
                      <circle cx="20" cy="20" r="15" fill="transparent" stroke="currentColor" stroke-width="2" stroke-dasharray="94" stroke-dashoffset="30"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Items Card -->
            <div class="stat-card success slide-up" style="animation-delay: 0.3s">
              <div class="card-glow"></div>
              <div class="stat-icon-wrapper">
                <div class="stat-icon">
                  {@html getMetricIcon('items')}
                </div>
                <div class="trend-indicator neutral">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Active
                </div>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{formatMyanmarNumber(dashboardData?.overview?.totalItems || 0)}</h3>
                <p class="stat-label">{$t('dashboard.totalItems')}</p>
                <div class="stat-meta">
                  <span class="stat-change neutral">{$t('dashboard.totalProducts')}</span>
                  <div class="progress-ring">
                    <svg class="progress-ring-svg" width="40" height="40">
                      <circle cx="20" cy="20" r="15" fill="transparent" stroke="currentColor" stroke-width="2" stroke-dasharray="94" stroke-dashoffset="8"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Low Stock Alert Card -->
            <div class="stat-card {dashboardData?.overview?.lowStockItems > 5 ? 'warning' : 'success'} slide-up" style="animation-delay: 0.4s">
              <div class="card-glow"></div>
              <div class="stat-icon-wrapper">
                <div class="stat-icon">
                  {@html getMetricIcon('alerts')}
                </div>
                <div class="trend-indicator {dashboardData?.overview?.lowStockItems > 5 ? 'negative' : 'positive'}">
                  {#if dashboardData?.overview?.lowStockItems > 5}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Action
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Good
                  {/if}
                </div>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{formatMyanmarNumber(dashboardData?.overview?.lowStockItems || 0)}</h3>
                <p class="stat-label">{$t('dashboard.lowStock')}</p>
                <div class="stat-meta">
                  <span class="stat-change {dashboardData?.overview?.lowStockItems > 5 ? 'negative' : 'positive'}">
                    {dashboardData?.overview?.lowStockItems > 5 ? $t('dashboard.needsAction') : $t('dashboard.goodStatus')}
                  </span>
                  <div class="progress-ring">
                    <svg class="progress-ring-svg" width="40" height="40">
                      <circle cx="20" cy="20" r="15" fill="transparent" stroke="currentColor" stroke-width="2" stroke-dasharray="94" stroke-dashoffset="{94 - Math.min(94, (dashboardData?.overview?.lowStockItems || 0) * 9)}"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      {/if}

      {#if activeView === 'overview' || activeView === 'analytics'}
        <!-- Enhanced Data Visualization Section -->
        <section class="charts-section" class:visible={chartsVisible}>
          <div class="charts-grid">
            <!-- Top Selling Items with Enhanced Design -->
            <div class="chart-card fade-in" style="animation-delay: 0.5s">
              <div class="card-header">
                <div class="header-info">
                  <h3>{$t('dashboard.topSelling')}</h3>
                  <span class="card-subtitle">{$t('dashboard.toDate')}</span>
                </div>
                <div class="header-actions">
                  <button class="icon-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                      <circle cx="19" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                      <circle cx="5" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="card-content">
                {#if dashboardData && dashboardData.topSelling && dashboardData.topSelling.length > 0}
                  <div class="top-items-list">
                    {#each dashboardData.topSelling.slice(0, 5) as item, index}
                      <div class="top-item modern-item" style="animation-delay: {0.1 * index}s">
                        <div class="item-rank rank-{index + 1}">
                          <span>{index + 1}</span>
                        </div>
                        <div class="item-info">
                          <div class="item-details">
                            <h4 class="item-name">{item.name || 'Deleted Item'}</h4>
                            <div class="item-meta">
                              <span class="quantity-sold">{item.quantitySold || 0} sold</span>
                              <span class="revenue">{$formatCurrency(item.totalRevenue || 0)}</span>
                            </div>
                          </div>
                          <div class="item-progress">
                            <div class="progress-bar" style="width: {Math.max(20, Math.min(100, (item.quantitySold || 0) * 10))}%"></div>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="empty-state">
                    <div class="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 12L12 16L16 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <p>အချက်အလက်မရှိသေးပါ</p>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Recent Sales with Enhanced Design -->
            <div class="chart-card fade-in" style="animation-delay: 0.6s">
              <div class="card-header">
                <div class="header-info">
                  <h3>မကြာသေးမီက ရောင်းချမှုများ</h3>
                  <span class="card-subtitle">ယနေ့</span>
                </div>
                <div class="header-actions">
                  <button class="icon-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H21L19 14H5L3 6Z" stroke="currentColor" stroke-width="2"/>
                      <path d="M3 6L2.5 4H1" stroke="currentColor" stroke-width="2"/>
                      <circle cx="9" cy="20" r="1" stroke="currentColor" stroke-width="2"/>
                      <circle cx="20" cy="20" r="1" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="card-content">
                {#if dashboardData && dashboardData.overview && dashboardData.overview.recentSales && dashboardData.overview.recentSales.length > 0}
                  <div class="recent-sales-list">
                    {#each dashboardData.overview.recentSales.slice(0, 5) as sale, index}
                      <div class="recent-sale modern-sale" style="animation-delay: {0.1 * index}s">
                        <div class="sale-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>
                        <div class="sale-info">
                          <div class="sale-header">
                            <span class="sale-id">{sale.invoiceNumber || 'INV-' + sale._id?.slice(-6)}</span>
                            <span class="sale-amount">{$formatCurrency(sale.totalAmount || 0)}</span>
                          </div>
                          <div class="sale-meta">
                            <span class="sale-time">{formatTime(sale.createdAt)}</span>
                            <span class="sale-status completed">Completed</span>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="empty-state">
                    <div class="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H21L19 14H5L3 6Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M3 6L2.5 4H1" stroke="currentColor" stroke-width="2"/>
                        <circle cx="9" cy="20" r="1" stroke="currentColor" stroke-width="2"/>
                        <circle cx="20" cy="20" r="1" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </div>
                    <p>အရောင်းမရှိသေးပါ</p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </section>
      {/if}

      {#if activeView === 'analytics'}
        <!-- Analytics Specific Content -->
        <section class="analytics-section fade-in">
          <div class="analytics-grid">
            <div class="chart-card full-width">
              <ChartComponent 
                title="Sales Trends - Last 7 Days" 
                type="line"
                height={300}
                data={[
                  { label: 'Mon', value: dashboardData?.overview?.todaySales * 0.8 || 1200 },
                  { label: 'Tue', value: dashboardData?.overview?.todaySales * 0.6 || 900 },
                  { label: 'Wed', value: dashboardData?.overview?.todaySales * 1.2 || 1800 },
                  { label: 'Thu', value: dashboardData?.overview?.todaySales * 0.9 || 1350 },
                  { label: 'Fri', value: dashboardData?.overview?.todaySales * 1.5 || 2250 },
                  { label: 'Sat', value: dashboardData?.overview?.todaySales * 1.8 || 2700 },
                  { label: 'Sun', value: dashboardData?.overview?.todaySales || 1500 }
                ]}
              />
            </div>
            
            <div class="chart-card">
              <ChartComponent 
                title="Daily Transactions" 
                type="bar"
                height={280}
                data={[
                  { label: 'Mon', value: dashboardData?.overview?.todayTransactions * 0.7 || 12 },
                  { label: 'Tue', value: dashboardData?.overview?.todayTransactions * 0.5 || 8 },
                  { label: 'Wed', value: dashboardData?.overview?.todayTransactions * 1.1 || 18 },
                  { label: 'Thu', value: dashboardData?.overview?.todayTransactions * 0.8 || 13 },
                  { label: 'Fri', value: dashboardData?.overview?.todayTransactions * 1.4 || 23 },
                  { label: 'Sat', value: dashboardData?.overview?.todayTransactions * 1.6 || 26 },
                  { label: 'Sun', value: dashboardData?.overview?.todayTransactions || 16 }
                ]}
              />
            </div>
            
            <div class="chart-card">
              <ChartComponent 
                title="Revenue Growth" 
                type="line"
                height={280}
                data={[
                  { label: 'Week 1', value: 15000 },
                  { label: 'Week 2', value: 18000 },
                  { label: 'Week 3', value: 22000 },
                  { label: 'Week 4', value: 25000 },
                  { label: 'This Week', value: dashboardData?.overview?.todaySales * 7 || 28000 }
                ]}
              />
            </div>
          </div>
          
          <!-- Analytics Summary Cards -->
          <div class="analytics-summary">
            <div class="summary-card">
              <div class="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 3L21 7L17 11M3 21V16L12 7L16 11L7 20H3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="summary-content">
                <h4>Weekly Growth</h4>
                <p class="summary-value">+{Math.round(((dashboardData?.overview?.todaySales || 1500) / 1200) * 100 - 100)}%</p>
                <span class="summary-label">Compared to last week</span>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V5A2 2 0 0 0 14 3H10A2 2 0 0 0 8 5V21L12 18L16 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="summary-content">
                <h4>Top Customer</h4>
                <p class="summary-value">John Doe</p>
                <span class="summary-label">{$formatCurrency(3500)} this month</span>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="summary-content">
                <h4>Peak Hours</h4>
                <p class="summary-value">2-5 PM</p>
                <span class="summary-label">Highest sales activity</span>
              </div>
            </div>
          </div>
        </section>
      {/if}

      {#if activeView === 'reports'}
        <!-- Enhanced Reports Section with Myanmar Support -->
        <section class="reports-section fade-in" class:visible={reportsVisible}>
          <!-- Reports Header -->
          <div class="reports-header">
            <div class="header-content">
              <div class="title-section">
                <h2 class="section-title">📊 အစီရင်ခံစာများ</h2>
                <p class="section-subtitle">လုပ်ငန်းအကြောင်း အသေးစိတ် ခွဲခြမ်းစိတ်ဖြာမှုများ</p>
              </div>
              <div class="header-actions">
                <div class="date-filter">
                  <button class="filter-btn active">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    ယနေ့
                  </button>
                  <button class="filter-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    ရက်သတ္တပတ်
                  </button>
                  <button class="filter-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    လ
                  </button>
                </div>
                <button class="export-all-btn modern-btn primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2"/>
                    <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  အားလုံး ထုတ်ယူရန်
                </button>
              </div>
            </div>
          </div>

          <!-- Enhanced Reports Grid -->
          <div class="reports-grid">
            <!-- Sales Analytics Report Card -->
            <div class="report-card sales-report animate-slide-up" style="animation-delay: 0.1s">
              <div class="card-header">
                <div class="header-info">
                  <div class="report-icon sales">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3V21H21M7 14L12 9L16 13L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="header-text">
                    <h3>💰 အရောင်းအစီရင်ခံစာ</h3>
                    <span class="card-subtitle">အရောင်းရှင်းလင်းချက် နှင့် ခွဲခြမ်းစိတ်ဖြာမှု</span>
                  </div>
                </div>
                <div class="header-actions">
                  <div class="card-stats">
                    <div class="stat-mini positive">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 14L12 9L17 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      +15%
                    </div>
                  </div>
                  <button class="action-btn primary" title="PDF ထုတ်ယူရန်">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2"/>
                      <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2"/>
                      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="card-content">
                <div class="report-preview">
                  <div class="report-item highlight">
                    <div class="item-info">
                      <span class="report-label">ယနေ့ စုစုပေါင်းအရောင်း:</span>
                      <span class="report-meta">မနေ့ကထက် တိုးတက်မှု</span>
                    </div>
                    <span class="report-value primary">{$formatCurrency(dashboardData?.overview?.todaySales || 0)}</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">ရောင်းချမှုအရေအတွက်:</span>
                      <span class="report-meta">စုစုပေါင်း ငွေလွှဲမှုများ</span>
                    </div>
                    <span class="report-value">{formatMyanmarNumber(dashboardData?.overview?.todayTransactions || 0)} ခု</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">ပျမ်းမျှအရောင်းတန်ဖိုး:</span>
                      <span class="report-meta">တစ်ခုချင်းစီ၏ တန်ဖိုး</span>
                    </div>
                    <span class="report-value">{$formatCurrency((dashboardData?.overview?.todaySales || 0) / Math.max(1, dashboardData?.overview?.todayTransactions || 1))}</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">လှုပ်ရှားနေသော ပစ္စည်းများ:</span>
                      <span class="report-meta">ရောင်းချနိုင်သော ပစ္စည်းများ</span>
                    </div>
                    <span class="report-value success">{formatMyanmarNumber(dashboardData?.overview?.totalItems || 0)} မျိုး</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Inventory Status Report Card -->
            <div class="report-card inventory-report animate-slide-up" style="animation-delay: 0.2s">
              <div class="card-header">
                <div class="header-info">
                  <div class="report-icon inventory">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" stroke-width="2"/>
                      <path d="M3 10H21" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </div>
                  <div class="header-text">
                    <h3>📦 ကုန်စာရင်းအစီရင်ခံစာ</h3>
                    <span class="card-subtitle">လက်ကျန်ပမာណ နှင့် သတိပေးချက်များ</span>
                  </div>
                </div>
                <div class="header-actions">
                  <div class="card-stats">
                    <div class="stat-mini {dashboardData?.overview?.lowStockItems > 5 ? 'warning' : 'success'}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {#if dashboardData?.overview?.lowStockItems > 5}
                          <path d="M12 9V13M12 17H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2"/>
                        {:else}
                          <path d="M9 12L11 14L15 10M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2"/>
                        {/if}
                      </svg>
                      {dashboardData?.overview?.lowStockItems > 5 ? 'သတိပေး' : 'ကောင်းသည်'}
                    </div>
                  </div>
                  <button class="action-btn success" title="CSV ထုတ်ယူရန်">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6A2 2 0 0 0 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
                      <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
                      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="card-content">
                <div class="report-preview">
                  <div class="report-item highlight">
                    <div class="item-info">
                      <span class="report-label">စုစုပေါင်း ပစ္စည်းများ:</span>
                      <span class="report-meta">ကုန်စာရင်းတွင်ရှိသော ပစ္စည်းများ</span>
                    </div>
                    <span class="report-value primary">{formatMyanmarNumber(dashboardData?.overview?.totalItems || 0)} မျိုး</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">လက်ကျန်နည်းသော ပစ္စည်းများ:</span>
                      <span class="report-meta">ပြန်လည်ဝယ်ယူရမည့် ပစ္စည်းများ</span>
                    </div>
                    <span class="report-value {dashboardData?.overview?.lowStockItems > 5 ? 'warning' : 'success'}">{formatMyanmarNumber(dashboardData?.overview?.lowStockItems || 0)} မျိုး</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">လက်ကျန်တန်ဖိုး:</span>
                      <span class="report-meta">ခန့်မှန်းခြေ စုစုပေါင်းတန်ဖိုး</span>
                    </div>
                    <span class="report-value">{$formatCurrency((dashboardData?.overview?.totalItems || 0) * 15000)}</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">ပစ္စည်းအမျိုးအစားများ:</span>
                      <span class="report-meta">အမျိုးအစားခွဲခြားမှု</span>
                    </div>
                    <span class="report-value info">12 မျိုး</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Financial Performance Report Card -->
            <div class="report-card financial-report animate-slide-up" style="animation-delay: 0.3s">
              <div class="card-header">
                <div class="header-info">
                  <div class="report-icon financial">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 1V23M17 5H9.5C8.67157 5 8 5.67157 8 6.5V6.5C8 7.32843 8.67157 8 9.5 8H14.5C15.3284 8 16 8.67157 16 9.5V9.5C16 10.3284 15.3284 11 14.5 11H7" stroke="currentColor" stroke-width="2"/>
                      <path d="M9 3H15M9 21H15" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </div>
                  <div class="header-text">
                    <h3>💵 ဘဏ္ဍာရေးအစီရင်ခံစာ</h3>
                    <span class="card-subtitle">ဝင်ငွေ နှင့် အမြတ်အစွန်း ခွဲခြမ်းစိတ်ဖြာမှု</span>
                  </div>
                </div>
                <div class="header-actions">
                  <div class="card-stats">
                    <div class="stat-mini positive">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 14L12 9L17 14" stroke="currentColor" stroke-width="2"/>
                      </svg>
                      {Math.round(((dashboardData?.overview?.todaySales || 0) * 30 / 150000) * 100)}%
                    </div>
                  </div>
                  <button class="action-btn warning" title="ဘဏ္ဍာရေး Dashboard">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="card-content">
                <div class="report-preview">
                  <div class="report-item highlight">
                    <div class="item-info">
                      <span class="report-label">ယနေ့ဝင်ငွေ:</span>
                      <span class="report-meta">အရောင်းမှ ရရှိသော ငွေ</span>
                    </div>
                    <span class="report-value primary">{$formatCurrency(dashboardData?.overview?.todaySales || 0)}</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">ရက်သတ္တပတ် ခန့်မှန်းဝင်ငွေ:</span>
                      <span class="report-meta">7 ရက်စာ ခန့်မှန်းချက်</span>
                    </div>
                    <span class="report-value">{$formatCurrency((dashboardData?.overview?.todaySales || 0) * 7)}</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">လစဉ်ပစ်မှတ်:</span>
                      <span class="report-meta">တစ်လအတွက် ရည်မှန်းချက်</span>
                    </div>
                    <span class="report-value info">{$formatCurrency(150000)}</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">ပစ်မှတ်အောင်မြင်မှု:</span>
                      <span class="report-meta">လစဉ်ပစ်မှတ်နှင့် နှိုင်းယှဉ်ခြင်း</span>
                    </div>
                    <span class="report-value {((dashboardData?.overview?.todaySales || 0) * 30 / 150000) * 100 >= 80 ? 'success' : 'warning'}">
                      {Math.round(((dashboardData?.overview?.todaySales || 0) * 30 / 150000) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Advanced Analytics Report Card -->
            <div class="report-card analytics-report animate-slide-up" style="animation-delay: 0.4s">
              <div class="card-header">
                <div class="header-info">
                  <div class="report-icon analytics">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 4V20L12 18L8 20V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4Z" stroke="currentColor" stroke-width="2"/>
                      <path d="M6 8V20M18 8V20" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </div>
                  <div class="header-text">
                    <h3>📈 အဆင့်မြင့် ခွဲခြမ်းစိတ်ဖြာမှု</h3>
                    <span class="card-subtitle">လုပ်ငန်းတိုးတက်မှု နှင့် ကွန်ယက်ခွဲခြမ်းမှု</span>
                  </div>
                </div>
                <div class="header-actions">
                  <div class="card-stats">
                    <div class="stat-mini info">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2"/>
                      </svg>
                      လက်ရှိ
                    </div>
                  </div>
                  <button class="action-btn secondary" title="အသေးစိတ် ကြည့်ရှုရန်">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                      <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="card-content">
                <div class="report-preview">
                  <div class="report-item highlight">
                    <div class="item-info">
                      <span class="report-label">အရောင်းအကောင်းဆုံးအချိန်:</span>
                      <span class="report-meta">အများဆုံးရောင်းချသော အချိန်</span>
                    </div>
                    <span class="report-value primary">14:00 - 17:00</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">ရေပန်းစားဆုံး ပစ္စည်းအမျိုးအစား:</span>
                      <span class="report-meta">အများဆုံးရောင်းချသော ပစ္စည်း</span>
                    </div>
                    <span class="report-value success">အစားအသောက်</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">ဖောက်သည် ပြန်လာမှုနှုန်း:</span>
                      <span class="report-meta">အကြိမ်များစွာ ဝယ်ယူသော ဖောက်သည်များ</span>
                    </div>
                    <span class="report-value info">75%</span>
                  </div>
                  <div class="report-item">
                    <div class="item-info">
                      <span class="report-label">လုပ်ငန်း၏ ကျန်းမာရေး:</span>
                      <span class="report-meta">အလုံးစုံ လုပ်ငန်းအခြေအနေ</span>
                    </div>
                    <span class="report-value success">ကောင်းမွန်သည်</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reports Summary Footer -->
          <div class="reports-summary">
            <div class="summary-content">
              <div class="summary-text">
                <h4>📊 အစီရင်ခံစာ အကျဉ်းချုပ်</h4>
                <p>ယနေ့ {formatMyanmarDate(new Date().toISOString())} အပတ်စဉ် လုပ်ငန်းအကြောင်း အသေးစိတ် ခွဲခြမ်းစိတ်ဖြာမှုများ အသင့်ရရှိနိုင်ပါသည်။</p>
              </div>
              <div class="summary-actions">
                <button class="summary-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 16.5V18.75C3 19.9926 4.00736 21 5.25 21H18.75C19.9926 21 21 19.9926 21 18.75V16.5M16.5 12L12 16.5M12 16.5L7.5 12M12 16.5V3" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  အားလုံး PDF ထုတ်ယူရန်
                </button>
                <button class="summary-btn secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M15 9L12 12L9 9" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  အီးမေးလ် ပို့ရန်
                </button>
              </div>
            </div>
          </div>
        </section>
      {/if}
    </main>
  </div>
{/if}

{#if notification}
  <NotificationToast
    type={notification.type}
    message={notification.message}
    id={notification.id}
    on:close={() => notification = null}
  />
{/if}

<style>
  /* Modern CSS Variables & Design System */
  .dashboard {
    --primary-50: #eff6ff;
    --primary-100: #dbeafe;
    --primary-500: #3b82f6;
    --primary-600: #2563eb;
    --primary-700: #1d4ed8;
    
    --secondary-50: #f5f3ff;
    --secondary-500: #8b5cf6;
    --secondary-600: #7c3aed;
    
    --success-50: #ecfdf5;
    --success-500: #10b981;
    --success-600: #059669;
    
    --warning-50: #fffbeb;
    --warning-500: #f59e0b;
    --warning-600: #d97706;
    
    --error-50: #fef2f2;
    --error-500: #ef4444;
    --error-600: #dc2626;
    
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-300: #d1d5db;
    --gray-400: #9ca3af;
    --gray-500: #6b7280;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-800: #1f2937;
    --gray-900: #111827;
    
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;
    
    --spacing-xs: 0.5rem;
    --spacing-sm: 0.75rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;
    
    padding: var(--spacing-xl);
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* Dark Mode Support */
  .dashboard.dark {
    --gray-50: #111827;
    --gray-100: #1f2937;
    --gray-200: #374151;
    --gray-300: #4b5563;
    --gray-400: #6b7280;
    --gray-500: #9ca3af;
    --gray-600: #d1d5db;
    --gray-700: #e5e7eb;
    --gray-800: #f3f4f6;
    --gray-900: #f9fafb;
    
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: var(--gray-900);
  }

  /* Modern Loading Animation */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: var(--spacing-lg);
  }

  .modern-loader {
    position: relative;
    width: 80px;
    height: 80px;
  }

  .loader-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 3px solid transparent;
    border-top: 3px solid var(--primary-500);
    border-radius: 50%;
    animation: spin 1.5s linear infinite;
  }

  .loader-ring:nth-child(2) {
    animation-delay: 0.5s;
    border-top-color: var(--secondary-500);
    transform: scale(0.8);
  }

  .loader-ring:nth-child(3) {
    animation-delay: 1s;
    border-top-color: var(--success-500);
    transform: scale(0.6);
  }

  .loading-text {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--gray-600);
    animation: pulse 2s infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Enhanced Error State */
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: var(--spacing-lg);
    text-align: center;
  }

  .error-icon {
    width: 80px;
    height: 80px;
    color: var(--error-500);
    background: var(--error-50);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Modern Header Design */
  .dashboard-header {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    box-shadow: var(--shadow-lg);
  }

  .dark .dashboard-header {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
  }

  .greeting-section {
    flex: 1;
  }

  .main-title {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin: 0;
  }

  .greeting {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .business-name {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--gray-700);
  }

  .dark .business-name {
    color: var(--gray-200);
  }

  .subtitle {
    font-size: 1.125rem;
    color: var(--gray-500);
    margin: var(--spacing-sm) 0 0 0;
  }

  .dark .subtitle {
    color: var(--gray-400);
  }

  .header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-md);
  }

  .quick-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .theme-toggle {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-200);
    background: white;
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .theme-toggle:hover {
    background: var(--gray-50);
    transform: translateY(-1px);
  }

  .modern-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    font-size: 0.875rem;
  }

  .modern-btn.primary {
    background: var(--primary-500);
    color: white;
    box-shadow: var(--shadow-md);
  }

  .modern-btn.primary:hover {
    background: var(--primary-600);
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  .modern-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    font-size: 0.875rem;
    color: var(--gray-500);
  }

  .live-indicator {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .live-dot {
    width: 8px;
    height: 8px;
    background: var(--success-500);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  /* Dashboard Navigation */
  .dashboard-nav {
    margin-bottom: var(--spacing-xl);
  }

  .nav-tabs {
    display: flex;
    gap: var(--spacing-xs);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xs);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: var(--shadow-md);
  }

  .dark .nav-tabs {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .nav-tab {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-lg);
    background: transparent;
    border: none;
    color: var(--gray-600);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dark .nav-tab {
    color: var(--gray-300);
  }

  .nav-tab:hover {
    background: rgba(255, 255, 255, 0.5);
    color: var(--gray-700);
  }

  .dark .nav-tab:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--gray-200);
  }

  .nav-tab.active {
    background: white;
    color: var(--primary-600);
    box-shadow: var(--shadow-sm);
  }

  .dark .nav-tab.active {
    background: var(--gray-700);
    color: var(--primary-400);
  }

  /* Enhanced Stats Section */
  .stats-section {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: var(--spacing-2xl);
  }

  .stats-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--spacing-lg);
  }

  .stat-card {
    position: relative;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-xl);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }

  .dark .stat-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .stat-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
  }

  .card-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .stat-card:hover .card-glow {
    opacity: 1;
  }

  .stat-card.primary {
    color: var(--primary-500);
  }

  .stat-card.secondary {
    color: var(--secondary-500);
  }

  .stat-card.success {
    color: var(--success-500);
  }

  .stat-card.warning {
    color: var(--warning-500);
  }

  .stat-icon-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-lg);
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, currentColor, color-mix(in srgb, currentColor 80%, black));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
  }

  .trend-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .trend-indicator.positive {
    background: var(--success-50);
    color: var(--success-600);
  }

  .trend-indicator.negative {
    background: var(--error-50);
    color: var(--error-600);
  }

  .trend-indicator.neutral {
    background: var(--gray-100);
    color: var(--gray-600);
  }

  .stat-content {
    position: relative;
    z-index: 1;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0 0 var(--spacing-xs) 0;
    background: linear-gradient(135deg, var(--gray-900), var(--gray-700));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .dark .stat-value {
    background: linear-gradient(135deg, var(--gray-100), var(--gray-300));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--gray-600);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .dark .stat-label {
    color: var(--gray-300);
  }

  .stat-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-md);
  }

  .stat-change {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .stat-change.positive {
    color: var(--success-600);
  }

  .dark .stat-change.positive {
    color: var(--success-400);
  }

  .stat-change.negative {
    color: var(--error-600);
  }

  .dark .stat-change.negative {
    color: var(--error-400);
  }

  .stat-change.neutral {
    color: var(--gray-500);
  }

  .dark .stat-change.neutral {
    color: var(--gray-400);
  }

  .progress-ring-svg {
    transform: rotate(-90deg);
  }

  .progress-ring-svg circle {
    transition: stroke-dashoffset 1s ease;
  }

  /* Charts Section */
  .charts-section {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
    margin-bottom: var(--spacing-2xl);
  }

  .charts-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
    gap: var(--spacing-xl);
  }

  .chart-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    transition: all 0.3s ease;
  }

  .dark .chart-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .chart-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
  }

  .card-header {
    background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
    padding: var(--spacing-xl);
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dark .card-header {
    background: linear-gradient(135deg, var(--gray-800) 0%, var(--gray-700) 100%);
    border-bottom-color: var(--gray-600);
  }

  .header-info h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: var(--gray-900);
  }

  .dark .header-info h3 {
    color: var(--gray-100);
  }

  .card-subtitle {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--gray-500);
  }

  .dark .card-subtitle {
    color: var(--gray-400);
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    border: 1px solid var(--gray-200);
    background: white;
    color: var(--gray-500);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dark .icon-btn {
    border-color: var(--gray-600);
    background: var(--gray-700);
    color: var(--gray-300);
  }

  .icon-btn:hover {
    background: var(--gray-50);
    color: var(--gray-700);
  }

  .dark .icon-btn:hover {
    background: var(--gray-600);
    color: var(--gray-200);
  }

  .card-content {
    padding: var(--spacing-xl);
    max-height: 400px;
    overflow-y: auto;
  }

  .card-content::-webkit-scrollbar {
    width: 6px;
  }

  .card-content::-webkit-scrollbar-track {
    background: var(--gray-100);
  }

  .card-content::-webkit-scrollbar-thumb {
    background: var(--gray-300);
    border-radius: 3px;
  }

  /* Enhanced Top Items */
  .top-items-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .modern-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    border-radius: var(--radius-xl);
    border: 1px solid var(--gray-200);
    background: var(--gray-50);
    transition: all 0.2s ease;
    opacity: 0;
    animation: slideInUp 0.6s ease forwards;
  }

  .modern-item:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .item-rank {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
    box-shadow: var(--shadow-md);
  }

  .rank-1 {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: white;
  }

  .rank-2 {
    background: linear-gradient(135deg, #94a3b8, #64748b);
    color: white;
  }

  .rank-3 {
    background: linear-gradient(135deg, #fb7185, #e11d48);
    color: white;
  }

  .rank-4,
  .rank-5 {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
  }

  .item-info {
    flex: 1;
  }

  .item-details {
    margin-bottom: var(--spacing-xs);
  }

  .item-name {
    font-weight: 600;
    font-size: 1rem;
    margin: 0 0 4px 0;
    color: var(--gray-900);
  }

  .dark .item-name {
    color: var(--gray-100);
  }

  .item-meta {
    display: flex;
    gap: var(--spacing-md);
    font-size: 0.875rem;
    color: var(--gray-500);
  }

  .dark .item-meta {
    color: var(--gray-400);
  }

  .quantity-sold {
    font-weight: 500;
  }

  .dark .quantity-sold {
    color: var(--gray-300);
  }

  .revenue {
    font-weight: 600;
    color: var(--success-600);
  }

  .item-progress {
    height: 4px;
    background: var(--gray-200);
    border-radius: 2px;
    overflow: hidden;
    margin-top: var(--spacing-xs);
  }

  .dark .item-progress {
    background: var(--gray-700);
  }

  .item-progress .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
    border-radius: 2px;
    transition: width 1s ease;
  }

  /* Enhanced Recent Sales */
  .recent-sales-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .modern-sale {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    border-radius: var(--radius-xl);
    border: 1px solid var(--gray-200);
    background: var(--gray-50);
    transition: all 0.2s ease;
    opacity: 0;
    animation: slideInUp 0.6s ease forwards;
  }

  .dark .modern-sale {
    border-color: var(--gray-700);
    background: var(--gray-800);
  }

  .modern-sale:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .dark .modern-sale:hover {
    background: var(--gray-700);
  }

  .sale-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    background: var(--success-50);
    color: var(--success-600);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sale-info {
    flex: 1;
  }

  .sale-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .sale-id {
    font-weight: 600;
    color: var(--gray-900);
  }

  .dark .sale-id {
    color: var(--gray-100);
  }

  .sale-amount {
    font-weight: 700;
    color: var(--success-600);
    font-size: 1.125rem;
  }

  .dark .sale-amount {
    color: var(--success-400);
  }

  .sale-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sale-time {
    font-size: 0.875rem;
    color: var(--gray-500);
  }

  .dark .sale-time {
    color: var(--gray-400);
  }

  .sale-status {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: var(--radius-md);
  }

  .sale-status.completed {
    background: var(--success-50);
    color: var(--success-600);
  }

  /* Empty States */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    text-align: center;
    color: var(--gray-500);
  }

  .dark .empty-state {
    color: var(--gray-400);
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    color: var(--gray-400);
    margin-bottom: var(--spacing-md);
  }

  .dark .empty-icon {
    color: var(--gray-500);
  }

  /* Animations */
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .slide-up {
    animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
  }

  .fade-in {
    animation: fadeIn 0.6s ease forwards;
    opacity: 0;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Analytics & Reports Placeholders */
  .analytics-section,
  /* Enhanced Reports Section */
  .reports-section {
    margin-bottom: var(--spacing-2xl);
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .reports-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Reports Header */
  .reports-header {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    box-shadow: var(--shadow-lg);
  }

  .dark .reports-header {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .reports-header .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
  }

  .section-title {
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 var(--spacing-xs) 0;
  }

  .section-subtitle {
    color: var(--gray-500);
    font-size: 1.125rem;
    margin: 0;
  }

  .dark .section-subtitle {
    color: var(--gray-400);
  }

  /* Date Filter Buttons */
  .date-filter {
    display: flex;
    gap: var(--spacing-xs);
    background: rgba(255, 255, 255, 0.8);
    padding: 0.25rem;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
  }

  .dark .date-filter {
    background: rgba(30, 41, 59, 0.8);
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: transparent;
    border: none;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dark .filter-btn {
    color: var(--gray-300);
  }

  .filter-btn:hover {
    background: var(--gray-100);
    color: var(--gray-900);
  }

  .dark .filter-btn:hover {
    background: var(--gray-700);
    color: var(--gray-100);
  }

  .filter-btn.active {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
    box-shadow: var(--shadow-md);
  }

  .export-all-btn {
    background: linear-gradient(135deg, var(--success-500), var(--success-600));
    color: white;
    border: none;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-md);
  }

  .export-all-btn:hover {
    background: linear-gradient(135deg, var(--success-600), var(--success-700));
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  /* Enhanced Reports Grid */
  .reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-2xl);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
  }

  /* Enhanced Report Cards */
  .report-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .dark .report-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .report-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, var(--primary-500), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .report-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
    border-color: var(--primary-200);
  }

  .report-card:hover::before {
    opacity: 1;
  }

  .dark .report-card:hover {
    border-color: var(--primary-400);
  }

  /* Report Card Type Specific Styling */
  .sales-report::before {
    background: linear-gradient(90deg, var(--success-500), var(--success-400));
  }

  .inventory-report::before {
    background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
  }

  .financial-report::before {
    background: linear-gradient(90deg, var(--warning-500), var(--warning-400));
  }

  .analytics-report::before {
    background: linear-gradient(90deg, var(--secondary-500), var(--secondary-400));
  }

  /* Enhanced Card Header */
  .report-card .card-header {
    padding: var(--spacing-xl);
    border-bottom: 1px solid var(--gray-100);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dark .report-card .card-header {
    border-bottom-color: var(--gray-700);
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    flex: 1;
  }

  .report-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: var(--shadow-md);
  }

  .report-icon.sales {
    background: linear-gradient(135deg, var(--success-500), var(--success-600));
  }

  .report-icon.inventory {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  }

  .report-icon.financial {
    background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
  }

  .report-icon.analytics {
    background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
  }

  .header-text h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .dark .header-text h3 {
    color: var(--gray-100);
  }

  .header-text .card-subtitle {
    font-size: 0.875rem;
    color: var(--gray-500);
    margin: 0;
  }

  .dark .header-text .card-subtitle {
    color: var(--gray-400);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .card-stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .stat-mini {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-lg);
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid;
  }

  .stat-mini.positive {
    background: var(--success-50);
    color: var(--success-700);
    border-color: var(--success-200);
  }

  .stat-mini.warning {
    background: var(--warning-50);
    color: var(--warning-700);
    border-color: var(--warning-200);
  }

  .stat-mini.success {
    background: var(--success-50);
    color: var(--success-700);
    border-color: var(--success-200);
  }

  .stat-mini.info {
    background: var(--primary-50);
    color: var(--primary-700);
    border-color: var(--primary-200);
  }

  .dark .stat-mini.positive {
    background: var(--success-900);
    color: var(--success-300);
    border-color: var(--success-600);
  }

  .dark .stat-mini.warning {
    background: var(--warning-900);
    color: var(--warning-300);
    border-color: var(--warning-600);
  }

  .dark .stat-mini.success {
    background: var(--success-900);
    color: var(--success-300);
    border-color: var(--success-600);
  }

  .dark .stat-mini.info {
    background: var(--primary-900);
    color: var(--primary-300);
    border-color: var(--primary-600);
  }

  .action-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
  }

  .action-btn.primary {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
  }

  .action-btn.success {
    background: linear-gradient(135deg, var(--success-500), var(--success-600));
    color: white;
  }

  .action-btn.warning {
    background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
    color: white;
  }

  .action-btn.secondary {
    background: linear-gradient(135deg, var(--secondary-500), var(--secondary-600));
    color: white;
  }

  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  /* Enhanced Report Content */
  .report-card .card-content {
    padding: var(--spacing-xl);
  }

  .report-preview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .report-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--spacing-lg);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-xl);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .dark .report-item {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .report-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--gray-300);
    transition: all 0.3s ease;
  }

  .report-item.highlight::before {
    background: linear-gradient(180deg, var(--primary-500), var(--secondary-500));
  }

  .report-item:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: var(--primary-200);
    transform: translateX(4px);
    box-shadow: var(--shadow-md);
  }

  .dark .report-item:hover {
    background: rgba(30, 41, 59, 0.95);
    border-color: var(--primary-400);
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    flex: 1;
  }

  .report-label {
    font-weight: 600;
    color: var(--gray-900);
    font-size: 1rem;
  }

  .dark .report-label {
    color: var(--gray-100);
  }

  .report-meta {
    font-size: 0.75rem;
    color: var(--gray-500);
    font-style: italic;
  }

  .dark .report-meta {
    color: var(--gray-400);
  }

  .report-value {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--gray-900);
    text-align: right;
    white-space: nowrap;
  }

  .dark .report-value {
    color: var(--gray-100);
  }

  .report-value.primary {
    background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.25rem;
  }

  .report-value.warning {
    color: var(--warning-600);
  }

  .report-value.success {
    color: var(--success-600);
  }

  .report-value.info {
    color: var(--primary-600);
  }

  .dark .report-value.warning {
    color: var(--warning-400);
  }

  .dark .report-value.success {
    color: var(--success-400);
  }

  .dark .report-value.info {
    color: var(--primary-400);
  }

  /* Reports Summary Footer */
  .reports-summary {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-lg);
    margin-top: var(--spacing-xl);
  }

  .dark .reports-summary {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .summary-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
  }

  .summary-text h4 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .dark .summary-text h4 {
    color: var(--gray-100);
  }

  .summary-text p {
    color: var(--gray-600);
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .dark .summary-text p {
    color: var(--gray-300);
  }

  .summary-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .summary-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
    border: none;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-md);
  }

  .summary-btn:hover {
    background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  .summary-btn.secondary {
    background: linear-gradient(135deg, var(--gray-500), var(--gray-600));
  }

  .summary-btn.secondary:hover {
    background: linear-gradient(135deg, var(--gray-600), var(--gray-700));
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .dashboard {
      padding: var(--spacing-lg);
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }

    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .analytics-grid,
    .reports-grid {
      grid-template-columns: 1fr;
    }

    .analytics-summary {
      grid-template-columns: 1fr;
    }

    .reports-header .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .date-filter {
      order: 2;
      width: 100%;
      justify-content: center;
    }

    .export-all-btn {
      order: 1;
      align-self: flex-end;
    }
  }

  @media (max-width: 768px) {
    .dashboard {
      padding: var(--spacing-md);
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .header-right {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .greeting {
      font-size: 2rem;
    }

    .business-name {
      font-size: 1.25rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .stat-card {
      padding: var(--spacing-lg);
    }

    .stat-value {
      font-size: 2rem;
    }

    .nav-tabs {
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .nav-tabs::-webkit-scrollbar {
      display: none;
    }

    .modern-item,
    .modern-sale {
      padding: var(--spacing-md);
    }

    .summary-card {
      padding: var(--spacing-lg);
    }

    .summary-icon {
      width: 48px;
      height: 48px;
    }

    .summary-value {
      font-size: var(--font-size-xl);
    }

    /* Reports Responsive */
    .reports-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }

    .reports-header,
    .reports-summary {
      padding: var(--spacing-lg);
    }

    .section-title {
      font-size: 1.75rem;
    }

    .section-subtitle {
      font-size: 1rem;
    }

    .header-info {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .report-icon {
      width: 40px;
      height: 40px;
    }

    .header-text h3 {
      font-size: 1.125rem;
    }

    .header-text .card-subtitle {
      font-size: 0.8rem;
    }

    .report-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
      text-align: left;
    }

    .report-value {
      text-align: left;
      font-size: 1rem;
    }

    .report-value.primary {
      font-size: 1.125rem;
    }

    .summary-content {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .summary-actions {
      width: 100%;
      justify-content: center;
    }

    .date-filter {
      flex-direction: column;
      width: 100%;
    }

    .filter-btn {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .dashboard {
      padding: var(--spacing-sm);
    }

    .dashboard-header {
      padding: var(--spacing-lg);
    }

    .greeting {
      font-size: 1.75rem;
    }

    .stat-card {
      padding: var(--spacing-md);
    }

    .stat-value {
      font-size: 1.75rem;
    }

    .modern-item,
    .modern-sale {
      padding: var(--spacing-sm);
    }

    .item-rank {
      width: 32px;
      height: 32px;
      font-size: 0.75rem;
    }

    .card-content {
      padding: var(--spacing-md);
    }

    .summary-card {
      flex-direction: column;
      text-align: center;
      padding: var(--spacing-md);
    }

    .summary-icon {
      width: 40px;
      height: 40px;
    }
  }
</style>
