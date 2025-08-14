<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService } from '../services/api';
  import SkeletonLoader from './SkeletonLoader.svelte';
  import NotificationToast from './NotificationToast.svelte';
  import { t, formatCurrency, formatDate } from '../stores/translationHelpers';

  interface ReportData {
    salesReport: {
      totalSales: number;
      totalTransactions: number;
      averageOrderValue: number;
      salesByCategory: Array<{category: string, amount: number, count: number}>;
      salesByDate: Array<{date: string, amount: number, count: number}>;
    };
    inventoryReport: {
      totalItems: number;
      lowStockItems: number;
      outOfStockItems: number;
      topSellingItems: Array<any>;
      slowMovingItems: Array<any>;
    };
    financialReport: {
      totalRevenue: number;
      totalCost: number;
      grossProfit: number;
      profitMargin: number;
    };
  }

  let reportData: ReportData | null = null;
  let loading = false;
  let error: string | null = null;
  let selectedPeriod = 'week'; // week, month, quarter, year
  let selectedReport = 'overview'; // overview, sales, inventory, financial
  let dateRange = {
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  };
  let notification: { type: 'success' | 'error' | 'info'; message: string; id: string } | null = null;

  // Animation states
  let reportsVisible = false;
  let chartsVisible = false;

  onMount(async () => {
    await loadReportData();
    setTimeout(() => reportsVisible = true, 200);
    setTimeout(() => chartsVisible = true, 400);
  });

  async function loadReportData() {
    try {
      loading = true;
      error = null;
      
      // Simulate API calls for reports
      const [salesResponse, inventoryResponse] = await Promise.all([
        apiService.getSalesReport(dateRange.from, dateRange.to),
        apiService.getInventoryReport()
      ]);

      if (salesResponse.success && inventoryResponse.success) {
        reportData = {
          salesReport: {
            totalSales: 2500000,
            totalTransactions: 156,
            averageOrderValue: 16025,
            salesByCategory: [
              { category: 'အစားအစာ', amount: 1200000, count: 89 },
              { category: 'အဖျော်ယမကာ', amount: 800000, count: 45 },
              { category: 'နေ့စဉ်လိုအပ်သော', amount: 500000, count: 22 }
            ],
            salesByDate: generateMockSalesData()
          },
          inventoryReport: {
            totalItems: 245,
            lowStockItems: 12,
            outOfStockItems: 3,
            topSellingItems: salesResponse.data?.topSelling || [],
            slowMovingItems: []
          },
          financialReport: {
            totalRevenue: 2500000,
            totalCost: 1750000,
            grossProfit: 750000,
            profitMargin: 30
          }
        };
        showNotification('success', 'အစီရင်ခံစာ ဒေတာများ အောင်မြင်စွာ ရယူပြီးပါပြီ');
      } else {
        throw new Error('Failed to load report data');
      }
    } catch (err: any) {
      console.error('❌ Error loading reports:', err);
      error = 'အစီရင်ခံစာ ဒေတာ ရယူခြင်းတွင် အမှားဖြစ်ပေါ်သည်။';
      showNotification('error', error);
    } finally {
      loading = false;
    }
  }

  function generateMockSalesData() {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 200000) + 100000,
        count: Math.floor(Math.random() * 20) + 10
      });
    }
    return data;
  }

  function showNotification(type: 'success' | 'error' | 'info', message: string) {
    notification = {
      type,
      message,
      id: Date.now().toString()
    };
    setTimeout(() => notification = null, 5000);
  }

  function exportReport(format: 'pdf' | 'csv' | 'excel') {
    showNotification('info', `${format.toUpperCase()} ဖိုင်အဖြစ် Export လုပ်ခြင်း မကြာမီ ထည့်သွင်းမည်ဖြစ်သည်`);
  }

  // Chart rendering function (simplified)
  function renderChart(containerId: string, data: any[], type: 'bar' | 'line' | 'pie') {
    // This would integrate with a charting library like Chart.js or D3.js
    console.log(`Rendering ${type} chart in ${containerId}`, data);
  }

  $: {
    if (reportData && chartsVisible) {
      setTimeout(() => {
        renderChart('sales-chart', reportData.salesReport.salesByDate, 'line');
        renderChart('category-chart', reportData.salesReport.salesByCategory, 'pie');
      }, 100);
    }
  }
</script>

<!-- Enhanced Reports Dashboard -->
<div class="reports-container">
  {#if notification}
    <NotificationToast 
      type={notification.type} 
      message={notification.message} 
      id={notification.id}
      on:close={() => notification = null} 
    />
  {/if}

  <!-- Reports Header -->
  <div class="reports-header">
    <div class="header-content">
      <div class="title-section">
        <h1>📊 အစီရင်ခံစာနှင့် ခွဲခြမ်းစိတ်ဖြာမှု</h1>
        <p>လုပ်ငန်းအခြေအနေကို အသေးစိတ် ခွဲခြမ်းစိတ်ဖြာနိုင်ပါသည်</p>
      </div>
      
      <div class="header-actions">
        <div class="date-range">
          <label for="from-date">မှ:</label>
          <input id="from-date" type="date" bind:value={dateRange.from} class="date-input" />
          <label for="to-date">အထိ:</label>
          <input id="to-date" type="date" bind:value={dateRange.to} class="date-input" />
        </div>
        <button class="btn btn-primary" on:click={loadReportData}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
          </svg>
          အသစ်ရယူရန်
        </button>
      </div>
    </div>
  </div>

  <!-- Report Navigation -->
  <div class="report-navigation" class:visible={reportsVisible}>
    <div class="nav-tabs">
      <button 
        class="nav-tab {selectedReport === 'overview' ? 'active' : ''}"
        on:click={() => selectedReport = 'overview'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
        </svg>
        ခြုံငုံသုံးမှုခြင်း
      </button>
      
      <button 
        class="nav-tab {selectedReport === 'sales' ? 'active' : ''}"
        on:click={() => selectedReport = 'sales'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        အရောင်းအစီရင်ခံစာ
      </button>
      
      <button 
        class="nav-tab {selectedReport === 'inventory' ? 'active' : ''}"
        on:click={() => selectedReport = 'inventory'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4Z" fill="currentColor"/>
        </svg>
        စတော့အစီရင်ခံစာ
      </button>
      
      <button 
        class="nav-tab {selectedReport === 'financial' ? 'active' : ''}"
        on:click={() => selectedReport = 'financial'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1V23M17 5H9.5C8.57 5 7.785 5.57 7.785 6.5S8.57 8 9.5 8H14.5C15.43 8 16.215 8.57 16.215 9.5S15.43 11 14.5 11H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ငွေကြေးအစီရင်ခံစာ
      </button>
    </div>
  </div>

  <!-- Export Actions -->
  <div class="export-section" class:visible={reportsVisible}>
    <div class="export-actions">
      <span class="export-label">Export အဖြစ်:</span>
      <button class="export-btn pdf" on:click={() => exportReport('pdf')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        PDF
      </button>
      <button class="export-btn csv" on:click={() => exportReport('csv')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 9L8 15L10 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 9L16 15L14 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        CSV
      </button>
      <button class="export-btn excel" on:click={() => exportReport('excel')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 9H14M10 13H14M10 17H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Excel
      </button>
    </div>
  </div>

  <!-- Report Content -->
  <div class="report-content" class:visible={chartsVisible}>
    {#if loading}
      <div class="loading-container">
        <div class="skeleton-grid">
          {#each Array(6) as _, i}
            <SkeletonLoader type="card" lines={4} />
          {/each}
        </div>
      </div>
    {:else if error}
      <div class="error-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
        </svg>
        <h3>အမှားဖြစ်ပေါ်သည်</h3>
        <p>{error}</p>
        <button class="retry-btn" on:click={loadReportData}>ထပ်မံကြိုးစားရန်</button>
      </div>
    {:else if reportData}
      <!-- Overview Report -->
      {#if selectedReport === 'overview'}
        <div class="overview-grid">
          <!-- Key Metrics Cards -->
          <div class="metrics-row">
            <div class="metric-card primary">
              <div class="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <div class="metric-content">
                <h3>{$formatCurrency(reportData.salesReport.totalSales)}</h3>
                <p>စုစုပေါင်းအရောင်း</p>
                <span class="metric-trend positive">+15.2%</span>
              </div>
            </div>

            <div class="metric-card success">
              <div class="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 3H7A4 4 0 0 0 3 7V17A4 4 0 0 0 7 21H17A4 4 0 0 0 21 17V7A4 4 0 0 0 17 3Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <div class="metric-content">
                <h3>{reportData.salesReport.totalTransactions}</h3>
                <p>အရောင်းအရေအတွက်</p>
                <span class="metric-trend positive">+8.5%</span>
              </div>
            </div>

            <div class="metric-card warning">
              <div class="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23M17 5H9.5C8.57 5 7.785 5.57 7.785 6.5S8.57 8 9.5 8H14.5C15.43 8 16.215 8.57 16.215 9.5S15.43 11 14.5 11H7" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <div class="metric-content">
                <h3>{$formatCurrency(reportData.salesReport.averageOrderValue)}</h3>
                <p>ပျမ်းမျှအရောင်းတန်ဖိုး</p>
                <span class="metric-trend positive">+3.2%</span>
              </div>
            </div>

            <div class="metric-card info">
              <div class="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23M17 5H9.5C8.57 5 7.785 5.57 7.785 6.5S8.57 8 9.5 8H14.5C15.43 8 16.215 8.57 16.215 9.5S15.43 11 14.5 11H7" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <div class="metric-content">
                <h3>{reportData.financialReport.profitMargin}%</h3>
                <p>အမြတ်အစွန်းနှုန်း</p>
                <span class="metric-trend positive">+2.1%</span>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="charts-row">
            <div class="chart-card">
              <div class="chart-header">
                <h3>အရောင်းခြေဆင်းမှု (7 ရက်)</h3>
              </div>
              <div class="chart-container">
                <div id="sales-chart" class="chart-placeholder">
                  <svg width="100%" height="200" viewBox="0 0 400 200">
                    <defs>
                      <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.1" />
                      </linearGradient>
                    </defs>
                    {#each reportData.salesReport.salesByDate as point, i}
                      <circle 
                        cx={50 + i * 50} 
                        cy={150 - (point.amount / 3000)} 
                        r="4" 
                        fill="#3b82f6"
                        class="chart-point"
                        style="animation-delay: {i * 0.1}s"
                      />
                    {/each}
                    <polyline
                      fill="url(#salesGradient)"
                      stroke="#3b82f6"
                      stroke-width="2"
                      points="50,150 100,120 150,100 200,130 250,80 300,110 350,90"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div class="chart-card">
              <div class="chart-header">
                <h3>အမျိုးအစားအလိုက် အရောင်း</h3>
              </div>
              <div class="chart-container">
                <div id="category-chart" class="chart-placeholder">
                  <div class="category-bars">
                    {#each reportData.salesReport.salesByCategory as category, i}
                      <div class="category-bar" style="animation-delay: {i * 0.2}s">
                        <div class="bar-label">{category.category}</div>
                        <div class="bar-container">
                          <div 
                            class="bar-fill"
                            style="width: {(category.amount / reportData.salesReport.totalSales) * 100}%"
                          ></div>
                        </div>
                        <div class="bar-value">{$formatCurrency(category.amount)}</div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Sales Report -->
      {#if selectedReport === 'sales'}
        <div class="sales-report">
          <div class="report-summary">
            <h2>အရောင်းအသေးစိတ်အစီရင်ခံစာ</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="label">စုစုပေါင်းအရောင်း:</span>
                <span class="value">{$formatCurrency(reportData.salesReport.totalSales)}</span>
              </div>
              <div class="summary-item">
                <span class="label">အရောင်းအရေအတွက်:</span>
                <span class="value">{reportData.salesReport.totalTransactions}</span>
              </div>
              <div class="summary-item">
                <span class="label">ပျမ်းမျှအရောင်း:</span>
                <span class="value">{$formatCurrency(reportData.salesReport.averageOrderValue)}</span>
              </div>
            </div>
          </div>

          <div class="sales-details">
            <div class="detail-card">
              <h3>နေ့စဉ်အရောင်းအခြေအနေ</h3>
              <div class="daily-sales">
                {#each reportData.salesReport.salesByDate as daily}
                  <div class="daily-item">
                    <span class="date">{$formatDate(daily.date)}</span>
                    <span class="amount">{$formatCurrency(daily.amount)}</span>
                    <span class="count">{daily.count} ရောင်းချမှု</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Inventory Report -->
      {#if selectedReport === 'inventory'}
        <div class="inventory-report">
          <div class="inventory-summary">
            <h2>စတော့အခြေအနေ အစီရင်ခံစာ</h2>
            <div class="inventory-stats">
              <div class="stat-item">
                <div class="stat-number">{reportData.inventoryReport.totalItems}</div>
                <div class="stat-label">စုစုပေါင်းပစ္စည်း</div>
              </div>
              <div class="stat-item warning">
                <div class="stat-number">{reportData.inventoryReport.lowStockItems}</div>
                <div class="stat-label">လက်ကျန်နည်းသော</div>
              </div>
              <div class="stat-item danger">
                <div class="stat-number">{reportData.inventoryReport.outOfStockItems}</div>
                <div class="stat-label">ကုန်သွားသော</div>
              </div>
            </div>
          </div>

          <div class="inventory-alerts">
            <div class="alert-card">
              <h3>အရေးကြီးသောသတိပေးချက်များ</h3>
              <div class="alert-list">
                {#if reportData.inventoryReport.lowStockItems > 0}
                  <div class="alert-item warning">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>{reportData.inventoryReport.lowStockItems} ပစ္စည်းများ လက်ကျန်နည်းနေပါသည်</span>
                  </div>
                {/if}
                {#if reportData.inventoryReport.outOfStockItems > 0}
                  <div class="alert-item danger">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>{reportData.inventoryReport.outOfStockItems} ပစ္စည်းများ လုံးဝကုန်သွားပါပြီ</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Financial Report -->
      {#if selectedReport === 'financial'}
        <div class="financial-report">
          <div class="financial-summary">
            <h2>ငွေကြေးအခြေအနေ အစီရင်ခံစာ</h2>
            <div class="financial-metrics">
              <div class="metric-row">
                <div class="metric-item revenue">
                  <div class="metric-icon">💰</div>
                  <div class="metric-data">
                    <div class="metric-amount">{$formatCurrency(reportData.financialReport.totalRevenue)}</div>
                    <div class="metric-label">စုစုပေါင်းဝင်ငွေ</div>
                  </div>
                </div>
                
                <div class="metric-item cost">
                  <div class="metric-icon">📊</div>
                  <div class="metric-data">
                    <div class="metric-amount">{$formatCurrency(reportData.financialReport.totalCost)}</div>
                    <div class="metric-label">စုစုပေါင်းကုန်ကျစရိတ်</div>
                  </div>
                </div>
                
                <div class="metric-item profit">
                  <div class="metric-icon">📈</div>
                  <div class="metric-data">
                    <div class="metric-amount">{$formatCurrency(reportData.financialReport.grossProfit)}</div>
                    <div class="metric-label">စုစုပေါင်းအမြတ်</div>
                  </div>
                </div>
                
                <div class="metric-item margin">
                  <div class="metric-icon">🎯</div>
                  <div class="metric-data">
                    <div class="metric-amount">{reportData.financialReport.profitMargin}%</div>
                    <div class="metric-label">အမြတ်အစွန်းနှုန်း</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="financial-breakdown">
            <div class="breakdown-card">
              <h3>ငွေကြေးစီးဆင်းမှု ခွဲခြမ်းစိတ်ဖြာချက်</h3>
              <div class="flow-chart">
                <div class="flow-item positive">
                  <span class="flow-label">ဝင်ငွေ</span>
                  <span class="flow-amount">+{$formatCurrency(reportData.financialReport.totalRevenue)}</span>
                </div>
                <div class="flow-arrow">↓</div>
                <div class="flow-item negative">
                  <span class="flow-label">ကုန်ကျစရိတ်</span>
                  <span class="flow-amount">-{$formatCurrency(reportData.financialReport.totalCost)}</span>
                </div>
                <div class="flow-arrow">↓</div>
                <div class="flow-item profit">
                  <span class="flow-label">အမြတ်</span>
                  <span class="flow-amount">={$formatCurrency(reportData.financialReport.grossProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .reports-container {
    background: #f8fafc;
    min-height: 100vh;
    padding: 2rem;
  }

  /* Header */
  .reports-header {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .title-section h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .title-section p {
    color: #64748b;
    font-size: 1.125rem;
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .date-range {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
  }

  .date-range label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .date-input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
  }

  /* Navigation */
  .report-navigation {
    margin-bottom: 1.5rem;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s ease;
  }

  .report-navigation.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .nav-tabs {
    display: flex;
    background: white;
    border-radius: 0.75rem;
    padding: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .nav-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    border-radius: 0.5rem;
    color: #64748b;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .nav-tab:hover {
    color: #3b82f6;
    background: #f1f5f9;
  }

  .nav-tab.active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }

  /* Export Section */
  .export-section {
    margin-bottom: 2rem;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s ease 0.2s;
  }

  .export-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .export-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .export-label {
    font-weight: 500;
    color: #374151;
  }

  .export-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .export-btn:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .export-btn.pdf:hover {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #dc2626;
  }

  .export-btn.csv:hover {
    background: #f0fdf4;
    border-color: #86efac;
    color: #16a34a;
  }

  .export-btn.excel:hover {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #2563eb;
  }

  /* Report Content */
  .report-content {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s ease 0.4s;
  }

  .report-content.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .loading-container {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
  }

  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .error-state {
    background: white;
    border-radius: 1rem;
    padding: 3rem;
    text-align: center;
    color: #6b7280;
  }

  /* Overview Report */
  .overview-grid {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .metrics-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .metric-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 1rem;
    padding: 1.5rem;
    border-left: 4px solid;
    transition: all 0.3s ease;
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .metric-card.primary {
    border-color: #3b82f6;
  }

  .metric-card.success {
    border-color: #10b981;
  }

  .metric-card.warning {
    border-color: #f59e0b;
  }

  .metric-card.info {
    border-color: #8b5cf6;
  }

  .metric-icon {
    width: 48px;
    height: 48px;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    margin-bottom: 1rem;
  }

  .metric-content h3 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .metric-content p {
    color: #64748b;
    font-weight: 500;
    margin: 0 0 0.5rem 0;
  }

  .metric-trend {
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
  }

  .metric-trend.positive {
    background: #dcfce7;
    color: #166534;
  }

  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .chart-card {
    background: #f8fafc;
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
  }

  .chart-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
  }

  .chart-container {
    height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chart-placeholder {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @keyframes chartPoint {
    from {
      opacity: 0;
      transform: scale(0);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .chart-point {
    animation: chartPoint 0.5s ease forwards;
    opacity: 0;
  }

  .category-bars {
    width: 100%;
    padding: 1rem;
  }

  .category-bar {
    margin-bottom: 1rem;
    animation: slideIn 0.6s ease forwards;
    opacity: 0;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .bar-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .bar-container {
    height: 24px;
    background: #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 0.25rem;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: 12px;
    transition: width 1s ease;
  }

  .bar-value {
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Sales Report */
  .sales-report {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .report-summary h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 1.5rem 0;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
  }

  .summary-item .label {
    color: #64748b;
    font-weight: 500;
  }

  .summary-item .value {
    color: #1e293b;
    font-weight: 700;
  }

  .detail-card {
    background: #f8fafc;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
  }

  .detail-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
  }

  .daily-sales {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .daily-item {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    padding: 0.75rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .daily-item .date {
    font-weight: 500;
    color: #374151;
  }

  .daily-item .amount {
    font-weight: 700;
    color: #059669;
  }

  .daily-item .count {
    color: #6b7280;
    font-size: 0.875rem;
  }

  /* Inventory Report */
  .inventory-report {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .inventory-summary h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 1.5rem 0;
  }

  .inventory-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-item {
    text-align: center;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 0.75rem;
    border: 2px solid #e2e8f0;
  }

  .stat-item.warning {
    border-color: #fbbf24;
    background: #fffbeb;
  }

  .stat-item.danger {
    border-color: #f87171;
    background: #fef2f2;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
  }

  .stat-label {
    color: #64748b;
    font-weight: 500;
    margin-top: 0.5rem;
  }

  .alert-card {
    background: #f8fafc;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
  }

  .alert-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
  }

  .alert-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .alert-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid;
  }

  .alert-item.warning {
    background: #fffbeb;
    border-color: #fbbf24;
    color: #92400e;
  }

  .alert-item.danger {
    background: #fef2f2;
    border-color: #f87171;
    color: #b91c1c;
  }

  /* Financial Report */
  .financial-report {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .financial-summary h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 1.5rem 0;
  }

  .financial-metrics {
    margin-bottom: 2rem;
  }

  .metric-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .metric-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
  }

  .metric-item.revenue {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border-color: #86efac;
  }

  .metric-item.cost {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border-color: #fca5a5;
  }

  .metric-item.profit {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #93c5fd;
  }

  .metric-item.margin {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-color: #fbbf24;
  }

  .metric-icon {
    font-size: 2rem;
  }

  .metric-amount {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
  }

  .metric-label {
    color: #64748b;
    font-weight: 500;
  }

  .breakdown-card {
    background: #f8fafc;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
  }

  .breakdown-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1.5rem 0;
  }

  .flow-chart {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .flow-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 400px;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    border: 2px solid;
  }

  .flow-item.positive {
    background: #dcfce7;
    border-color: #16a34a;
    color: #166534;
  }

  .flow-item.negative {
    background: #fee2e2;
    border-color: #dc2626;
    color: #991b1b;
  }

  .flow-item.profit {
    background: #dbeafe;
    border-color: #2563eb;
    color: #1e40af;
  }

  .flow-label {
    font-weight: 600;
  }

  .flow-amount {
    font-weight: 700;
    font-size: 1.125rem;
  }

  .flow-arrow {
    font-size: 1.5rem;
    color: #6b7280;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .reports-container {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .nav-tabs {
      flex-direction: column;
      gap: 0.5rem;
    }

    .export-actions {
      flex-wrap: wrap;
    }

    .charts-row {
      grid-template-columns: 1fr;
    }

    .metrics-row {
      grid-template-columns: 1fr;
    }

    .metric-row {
      grid-template-columns: 1fr;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .inventory-stats {
      grid-template-columns: 1fr;
    }

    .daily-item {
      grid-template-columns: 1fr;
      text-align: center;
    }
  }
</style>
