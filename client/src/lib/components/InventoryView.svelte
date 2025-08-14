<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { apiService } from '../services/api';
  import InventoryList from './InventoryList.svelte';
  import InventoryManagementForm from './InventoryManagementForm.svelte';
  import SkeletonLoader from './SkeletonLoader.svelte';
  import NotificationToast from './NotificationToast.svelte';

  interface Item {
    _id: string;
    name: string;
    itemCode: string;
    price: number;
    costPrice?: number;
    stockQuantity: number;
    lowStockThreshold: number;
    category?: string;
    description?: string;
    expiryDate?: string;
    createdAt: string;
    updatedAt: string;
  }

  let currentView = 'overview'; // overview, list, add, edit, analytics
  let items: Item[] = [];
  let loading = false;
  let error: string | null = null;
  let selectedItem: Item | null = null;
  let notification: { type: 'success' | 'error' | 'info'; message: string; id: string } | null = null;

  // Stats
  let totalItems = 0;
  let lowStockItems = 0;
  let outOfStockItems = 0;
  let totalValue = 0;
  let activeItems = 0;
  let lastUpdateTime: Date | null = null;

  // Animation states
  let headerVisible = false;
  let statsVisible = false;
  let contentVisible = false;
  
  // Dark mode support
  let isDarkMode = false;
  
  // Auto refresh functionality
  let autoRefreshEnabled = true;
  let refreshInterval = 30000; // 30 seconds
  let refreshTimer: NodeJS.Timeout;

  onMount(async () => {
    await loadInventoryStats();
    if (autoRefreshEnabled) {
      startAutoRefresh();
    }
    
    // Trigger entrance animations
    setTimeout(() => headerVisible = true, 200);
    setTimeout(() => statsVisible = true, 400);
    setTimeout(() => contentVisible = true, 600);
  });

  onDestroy(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
  });

  async function loadInventoryStats() {
    try {
      loading = true;
      error = null;
      console.log('🔄 Loading inventory stats...');
      
      const response = await apiService.getInventoryReport();
      
      if (response.success && response.data) {
        const data = response.data as any;
        totalItems = data.summary?.totalItems || 0;
        lowStockItems = data.summary?.lowStockItems || 0;
        outOfStockItems = data.summary?.outOfStockItems || 0;
        totalValue = data.summary?.totalValue || 0;
        activeItems = totalItems - outOfStockItems;
        lastUpdateTime = new Date();
        
        console.log('✅ Inventory stats loaded successfully:', data.summary);
        showNotification('success', 'Inventory data loaded successfully');
      } else {
        throw new Error('Failed to load inventory stats');
      }
    } catch (err: any) {
      console.error('❌ Error loading inventory stats:', err);
      error = 'ကုန်ပစ္စည်းဆိုင်ရာ ဒေတာများ ရယူခြင်းတွင် အမှားဖြစ်ပေါ်သည်။ ကျေးဇူးပြု၍ နောက်မှ ထပ်မံ ကြိုးစားပါ။';
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
      if (currentView === 'overview' || currentView === 'list') {
        loadInventoryStats();
      }
    }, refreshInterval);
  }

  function formatCurrency(amount: number): string {
    if (isNaN(amount) || amount === null || amount === undefined) return '0 ကျပ်';
    
    const formatted = amount.toLocaleString('en-US', { 
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
    
    return `${formatted} ကျပ်`;
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

  function getMetricIcon(type: string): string {
    const icons = {
      total: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 16V8A2 2 0 0 0 19 6H5A2 2 0 0 0 3 8V16A2 2 0 0 0 5 18H19A2 2 0 0 0 21 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      lowStock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      outStock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      value: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1V23M17 5H9.5C8.57 5 7.785 5.57 7.785 6.5S8.57 8 9.5 8H14.5C15.43 8 16.215 8.57 16.215 9.5S15.43 11 14.5 11H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      active: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    };
    return icons[type] || icons.total;
  }

  function showNotification(type: 'success' | 'error' | 'info', message: string) {
    notification = {
      type,
      message,
      id: Date.now().toString()
    };
    setTimeout(() => notification = null, 5000);
  }

  function handleItemAdded(event: any) {
    const newItem = event.detail;
    console.log('handleItemAdded received:', newItem);
    
    if (newItem && newItem.name) {
      showNotification('success', `ပစ္စည်း "${newItem.name}" အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ`);
    } else {
      showNotification('success', 'ပစ္စည်းအသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ');
    }
    currentView = 'list';
    loadInventoryStats();
  }

  function handleItemUpdated(event: any) {
    const updatedItem = event.detail;
    console.log('handleItemUpdated received:', updatedItem);
    
    if (updatedItem && updatedItem.name) {
      showNotification('success', `ပစ္စည်း "${updatedItem.name}" အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ`);
    } else {
      showNotification('success', 'ပစ္စည်း အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ');
    }
    currentView = 'list';
    selectedItem = null;
    loadInventoryStats();
  }

  function handleEditItem(event: any) {
    selectedItem = event.detail;
    currentView = 'edit';
  }


</script>

{#if loading && currentView === 'overview'}
  <div class="loading-container">
    <div class="modern-loader">
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
    </div>
    <p class="loading-text">ကုန်ပစ္စည်းဒေတာ ဖတ်နေသည်...</p>
  </div>
{:else if error && currentView === 'overview'}
  <div class="error-container">
    <div class="error-icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
      </svg>
    </div>
    <h3>အမှားဖြစ်ပေါ်သည်</h3>
    <p>{error}</p>
    <button class="retry-btn modern-btn" on:click={loadInventoryStats}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
      </svg>
      ထပ်မံကြိုးစားရန်
    </button>
  </div>
{:else}
  <div class="inventory-dashboard" class:dark={isDarkMode}>
    <!-- Modern Header with Navigation -->
    <header class="dashboard-header" class:visible={headerVisible}>
      <div class="header-content">
        <div class="header-left">
          <div class="greeting-section">
            <h1 class="main-title">
              <span class="greeting">📦 Inventory Pro</span>
              <span class="business-name">ကုန်ပစ္စည်းစီမံခန့်ခွဲမှု</span>
            </h1>
            <p class="subtitle">လုပ်ငန်းအတွက် ပစ္စည်းများကို ထိရောက်စွာ စီမံခန့်ခွဲပါ</p>
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
            <button class="refresh-btn modern-btn primary" on:click={loadInventoryStats} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class:spinning={loading}>
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
              </svg>
              Refresh
            </button>
          </div>
          <div class="status-info">
            <div class="live-indicator">
              <div class="live-dot"></div>
              <span>Live</span>
            </div>
            <span class="last-update">
              {lastUpdateTime ? `Updated ${formatTime(lastUpdateTime.toISOString())}` : 'Loading...'}
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
          class:active={currentView === 'overview'}
          on:click={() => currentView = 'overview'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
          </svg>
          Overview
        </button>
        <button 
          class="nav-tab" 
          class:active={currentView === 'list'}
          on:click={() => currentView = 'list'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Inventory List
        </button>
        <button 
          class="nav-tab" 
          class:active={currentView === 'add'}
          on:click={() => currentView = 'add'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Add Item
        </button>
        <button 
          class="nav-tab" 
          class:active={currentView === 'analytics'}
          on:click={() => currentView = 'analytics'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3V21H21M7 14L12 9L16 13L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Analytics
        </button>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="dashboard-main">
      {#if currentView === 'overview'}
        <!-- Enhanced Stats Section -->
        <section class="stats-section" class:visible={statsVisible}>
          <div class="stats-grid">
            <!-- Total Items Card -->
            <div class="stat-card primary slide-up" style="animation-delay: 0.1s">
              <div class="card-glow"></div>
              <div class="stat-icon-wrapper">
                <div class="stat-icon">
                  {@html getMetricIcon('total')}
                </div>
                <div class="trend-indicator neutral">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Total
                </div>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{formatMyanmarNumber(totalItems)}</h3>
                <p class="stat-label">စုစုပေါင်းပစ္စည်းအမျိုးအစား</p>
                <div class="stat-meta">
                  <span class="stat-change neutral">လက်ရှိအခြေအနေ</span>
                  <div class="progress-ring">
                    <svg class="progress-ring-svg" width="40" height="40">
                      <circle cx="20" cy="20" r="15" fill="transparent" stroke="currentColor" stroke-width="2" stroke-dasharray="94" stroke-dashoffset="8"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Items Card -->
            <div class="stat-card success slide-up" style="animation-delay: 0.2s">
              <div class="card-glow"></div>
              <div class="stat-icon-wrapper">
                <div class="stat-icon">
                  {@html getMetricIcon('active')}
                </div>
                <div class="trend-indicator positive">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Active
                </div>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{formatMyanmarNumber(activeItems)}</h3>
                <p class="stat-label">လက်ရှိရရှိနေသော ပစ္စည်းများ</p>
                <div class="stat-meta">
                  <span class="stat-change positive">အရောင်းအတွက်အဆင်သင့်</span>
                  <div class="progress-ring">
                    <svg class="progress-ring-svg" width="40" height="40">
                      <circle cx="20" cy="20" r="15" fill="transparent" stroke="currentColor" stroke-width="2" stroke-dasharray="94" stroke-dashoffset="15"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Low Stock Items Card -->
            <div class="stat-card {lowStockItems > 5 ? 'warning' : 'success'} slide-up" style="animation-delay: 0.3s">
              <div class="card-glow"></div>
              <div class="stat-icon-wrapper">
                <div class="stat-icon">
                  {@html getMetricIcon('lowStock')}
                </div>
                <div class="trend-indicator {lowStockItems > 5 ? 'negative' : 'positive'}">
                  {#if lowStockItems > 5}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Alert
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Good
                  {/if}
                </div>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{formatMyanmarNumber(lowStockItems)}</h3>
                <p class="stat-label">လက်ကျန်နည်းနေသော ပစ္စည်းများ</p>
                <div class="stat-meta">
                  <span class="stat-change {lowStockItems > 5 ? 'negative' : 'positive'}">
                    {lowStockItems > 5 ? 'ထပ်မံဝယ်ယူရန်လို' : 'အခြေအနေကောင်းသည်'}
                  </span>
                  <div class="progress-ring">
                    <svg class="progress-ring-svg" width="40" height="40">
                      <circle cx="20" cy="20" r="15" fill="transparent" stroke="currentColor" stroke-width="2" stroke-dasharray="94" stroke-dashoffset="{94 - Math.min(94, lowStockItems * 9)}"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Out of Stock Items Card -->
            <div class="stat-card {outOfStockItems > 0 ? 'error' : 'success'} slide-up" style="animation-delay: 0.4s">
              <div class="card-glow"></div>
              <div class="stat-icon-wrapper">
                <div class="stat-icon">
                  {@html getMetricIcon('outStock')}
                </div>
                <div class="trend-indicator {outOfStockItems > 0 ? 'negative' : 'positive'}">
                  {#if outOfStockItems > 0}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Critical
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Perfect
                  {/if}
                </div>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{formatMyanmarNumber(outOfStockItems)}</h3>
                <p class="stat-label">ကုန်သွားသော ပစ္စည်းများ</p>
                <div class="stat-meta">
                  <span class="stat-change {outOfStockItems > 0 ? 'negative' : 'positive'}">
                    {outOfStockItems > 0 ? 'ချက်ချင်းထပ်မံဝယ်ယူရန်' : 'အကုန်အလုံးရရှိသည်'}
                  </span>
                  <div class="progress-ring">
                    <svg class="progress-ring-svg" width="40" height="40">
                      <circle cx="20" cy="20" r="15" fill="transparent" stroke="currentColor" stroke-width="2" stroke-dasharray="94" stroke-dashoffset="{94 - Math.min(94, outOfStockItems * 15)}"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Value Card -->
            <div class="stat-card success slide-up" style="animation-delay: 0.5s">
              <div class="card-glow"></div>
              <div class="stat-icon-wrapper">
                <div class="stat-icon">
                  {@html getMetricIcon('value')}
                </div>
                <div class="trend-indicator positive">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 14L12 9L17 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Value
                </div>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{formatCurrency(totalValue)}</h3>
                <p class="stat-label">စုစုပေါင်းကုန်ပစ္စည်းတန်ဖိုး</p>
                <div class="stat-meta">
                  <span class="stat-change positive">လက်ရှိအင်ဗင်တာရီတန်ဖိုး</span>
                  <div class="progress-ring">
                    <svg class="progress-ring-svg" width="40" height="40">
                      <circle cx="20" cy="20" r="15" fill="transparent" stroke="currentColor" stroke-width="2" stroke-dasharray="94" stroke-dashoffset="25"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Quick Actions Section -->
        <section class="quick-actions-section" class:visible={contentVisible}>
          <div class="section-header">
            <h2>Quick Actions</h2>
            <p>အမြန်လုပ်ဆောင်ချက်များ</p>
          </div>
          <div class="actions-grid">
            <button class="action-card primary" on:click={() => currentView = 'add'}>
              <div class="action-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="action-content">
                <h3>Add New Item</h3>
                <p>ပစ္စည်းအသစ်ထည့်ရန်</p>
              </div>
            </button>

            <button class="action-card secondary" on:click={() => currentView = 'list'}>
              <div class="action-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="action-content">
                <h3>View All Items</h3>
                <p>ပစ္စည်းစာရင်းကြည့်ရှုရန်</p>
              </div>
            </button>

            <button class="action-card warning" on:click={() => currentView = 'analytics'}>
              <div class="action-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3V21H21M7 14L12 9L16 13L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="action-content">
                <h3>Analytics</h3>
                <p>အင်ဗင်တာရီခွဲခြမ်းစိတ်ဖြာမှု</p>
              </div>
            </button>

            <button class="action-card success" on:click={() => showNotification('info', 'Export functionality coming soon!')}>
              <div class="action-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="action-content">
                <h3>Export Data</h3>
                <p>ဒေတာများကို ထုတ်ယူရန်</p>
              </div>
            </button>
          </div>
        </section>
      {/if}

      {#if currentView === 'list'}
        <div class="content-card fade-in">
          <InventoryList 
            on:edit={handleEditItem}
            on:refresh={loadInventoryStats}
          />
        </div>
      {/if}

      {#if currentView === 'add'}
        <div class="content-card fade-in">
          <div class="form-header">
            <h2>ပစ္စည်းအသစ် ထည့်သွင်းရန်</h2>
            <button 
              class="modern-btn ghost"
              on:click={() => currentView = 'overview'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              ပြန်သွားရန်
            </button>
          </div>
          <InventoryManagementForm 
            onInventoryUpdate={handleItemAdded}
          />
        </div>
      {/if}

      {#if currentView === 'edit' && selectedItem}
        <div class="content-card fade-in">
          <div class="form-header">
            <h2>ပစ္စည်း ပြင်ဆင်ရန် - {selectedItem.name}</h2>
            <button 
              class="modern-btn ghost"
              on:click={() => { currentView = 'overview'; selectedItem = null; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              ပြန်သွားရန်
            </button>
          </div>
          <InventoryManagementForm 
            editItem={selectedItem}
            onInventoryUpdate={handleItemUpdated}
          />
        </div>
      {/if}

      {#if currentView === 'analytics'}
        <section class="analytics-section fade-in">
          <div class="section-header">
            <h2>Inventory Analytics</h2>
            <p>အင်ဗင်တာရီ ခွဲခြမ်းစိတ်ဖြာမှု</p>
          </div>
          
          <div class="analytics-grid">
            <div class="chart-card">
              <div class="card-header">
                <div class="header-info">
                  <h3>Stock Level Distribution</h3>
                  <span class="card-subtitle">လက်ကျန်အခြေအနေခွဲခြားမှု</span>
                </div>
              </div>
              <div class="card-content">
                <div class="metric-summary">
                  <div class="metric-item">
                    <span class="metric-label">ရရှိနေသည်:</span>
                    <span class="metric-value success">{activeItems}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">လက်ကျန်နည်း:</span>
                    <span class="metric-value warning">{lowStockItems}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">ကုန်သွားပြီ:</span>
                    <span class="metric-value error">{outOfStockItems}</span>
                  </div>
                </div>
                <div class="progress-chart">
                  <div class="progress-segment success" style="width: {totalItems > 0 ? (activeItems / totalItems) * 100 : 0}%"></div>
                  <div class="progress-segment warning" style="width: {totalItems > 0 ? (lowStockItems / totalItems) * 100 : 0}%"></div>
                  <div class="progress-segment error" style="width: {totalItems > 0 ? (outOfStockItems / totalItems) * 100 : 0}%"></div>
                </div>
              </div>
            </div>
            
            <div class="chart-card">
              <div class="card-header">
                <div class="header-info">
                  <h3>Inventory Value Summary</h3>
                  <span class="card-subtitle">အင်ဗင်တာရီတန်ဖိုးအနှစ်ချုပ်</span>
                </div>
              </div>
              <div class="card-content">
                <div class="value-display">
                  <div class="primary-value">
                    <span class="value-amount">{formatCurrency(totalValue)}</span>
                    <span class="value-label">စုစုပေါင်းတန်ဖိုး</span>
                  </div>
                  <div class="value-breakdown">
                    <div class="breakdown-item">
                      <span class="breakdown-label">Average per item:</span>
                      <span class="breakdown-value">{formatCurrency(totalItems > 0 ? totalValue / totalItems : 0)}</span>
                    </div>
                  </div>
                </div>
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
  /* Modern CSS Variables & Design System - Matching Dashboard */
  .inventory-dashboard {
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
  .inventory-dashboard.dark {
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
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dashboard-header.visible {
    opacity: 1;
    transform: translateY(0);
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

  .modern-btn.ghost {
    background: transparent;
    color: var(--gray-600);
    border: 1px solid var(--gray-200);
  }

  .modern-btn.ghost:hover {
    background: var(--gray-50);
    color: var(--gray-700);
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
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

  .stat-card.error {
    color: var(--error-500);
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

  /* Quick Actions Section */
  .quick-actions-section {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
    margin-bottom: var(--spacing-2xl);
  }

  .quick-actions-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .section-header {
    margin-bottom: var(--spacing-xl);
    text-align: center;
  }

  .section-header h2 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 var(--spacing-sm) 0;
    background: linear-gradient(135deg, var(--gray-900), var(--gray-700));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .dark .section-header h2 {
    background: linear-gradient(135deg, var(--gray-100), var(--gray-300));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .section-header p {
    color: var(--gray-500);
    font-size: 1.125rem;
    margin: 0;
  }

  .dark .section-header p {
    color: var(--gray-400);
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-lg);
  }

  .action-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-xl);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
  }

  .dark .action-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .action-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
  }

  .action-card.primary {
    color: var(--primary-600);
  }

  .action-card.secondary {
    color: var(--secondary-600);
  }

  .action-card.warning {
    color: var(--warning-600);
  }

  .action-card.success {
    color: var(--success-600);
  }

  .action-icon {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, currentColor, color-mix(in srgb, currentColor 80%, black));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    flex-shrink: 0;
  }

  .action-content h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--gray-900);
  }

  .dark .action-content h3 {
    color: var(--gray-100);
  }

  .action-content p {
    color: var(--gray-500);
    margin: 0;
  }

  .dark .action-content p {
    color: var(--gray-400);
  }

  /* Content Cards */
  .content-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    margin-bottom: var(--spacing-xl);
  }

  .dark .content-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-xl);
    border-bottom: 1px solid var(--gray-200);
    background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
  }

  .dark .form-header {
    background: linear-gradient(135deg, var(--gray-800) 0%, var(--gray-700) 100%);
    border-bottom-color: var(--gray-600);
  }

  .form-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: var(--gray-900);
  }

  .dark .form-header h2 {
    color: var(--gray-100);
  }

  /* Analytics Section */
  .analytics-section {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: var(--spacing-2xl);
  }

  .analytics-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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

  .card-content {
    padding: var(--spacing-xl);
  }

  .metric-summary {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm);
    background: var(--gray-50);
    border-radius: var(--radius-lg);
  }

  .dark .metric-item {
    background: var(--gray-800);
  }

  .metric-label {
    font-weight: 500;
    color: var(--gray-700);
  }

  .dark .metric-label {
    color: var(--gray-200);
  }

  .metric-value {
    font-weight: 700;
    font-size: 1.125rem;
  }

  .metric-value.success {
    color: var(--success-600);
  }

  .metric-value.warning {
    color: var(--warning-600);
  }

  .metric-value.error {
    color: var(--error-600);
  }

  .progress-chart {
    height: 8px;
    background: var(--gray-200);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
  }

  .dark .progress-chart {
    background: var(--gray-700);
  }

  .progress-segment {
    height: 100%;
    transition: width 1s ease;
  }

  .progress-segment.success {
    background: var(--success-500);
  }

  .progress-segment.warning {
    background: var(--warning-500);
  }

  .progress-segment.error {
    background: var(--error-500);
  }

  .value-display {
    text-align: center;
  }

  .primary-value {
    margin-bottom: var(--spacing-lg);
  }

  .value-amount {
    display: block;
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--success-600);
    margin-bottom: var(--spacing-xs);
  }

  .value-label {
    font-size: 1rem;
    color: var(--gray-500);
    font-weight: 500;
  }

  .value-breakdown {
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--gray-200);
  }

  .dark .value-breakdown {
    border-top-color: var(--gray-600);
  }

  .breakdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .breakdown-label {
    color: var(--gray-500);
    font-size: 0.875rem;
  }

  .breakdown-value {
    font-weight: 600;
    color: var(--gray-900);
  }

  .dark .breakdown-value {
    color: var(--gray-100);
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

  /* Responsive Design */
  @media (max-width: 1024px) {
    .inventory-dashboard {
      padding: var(--spacing-lg);
    }

    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .actions-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .analytics-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .inventory-dashboard {
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

    .actions-grid {
      grid-template-columns: 1fr;
    }

    .action-card {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-md);
    }

    .form-header {
      flex-direction: column;
      gap: var(--spacing-md);
      text-align: center;
    }
  }
</style>
