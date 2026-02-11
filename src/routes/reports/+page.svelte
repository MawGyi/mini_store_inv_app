<script lang="ts">
  import { onMount } from 'svelte'
  import { formatCurrency, currencySymbol, settings } from '$lib/stores/settings'
  import { addNotification } from '$lib/stores/stores'

  let activeTab = 'sales'
  let isLoading = false

  let salesData: any = null
  let inventoryData: any = null
  let topProductsData: any = null
  let dailySummaryData: any = null

  let salesStartDate = ''
  let salesEndDate = ''
  let salesPaymentMethod = ''

  let inventoryCategory = 'all'
  let inventoryStatus = ''

  let topProductsStartDate = ''
  let topProductsEndDate = ''
  let topProductsLimit = '10'

  let dailySummaryDays = '30'
  let dailySummaryStartDate = ''
  let dailySummaryEndDate = ''

  onMount(() => {
    const today = new Date()
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    salesStartDate = lastMonth.toISOString().split('T')[0]
    salesEndDate = today.toISOString().split('T')[0]
    topProductsStartDate = lastMonth.toISOString().split('T')[0]
    topProductsEndDate = today.toISOString().split('T')[0]
    dailySummaryDays = '30'
    
    setTimeout(() => {
      loadSalesReport()
      loadInventoryReport()
      loadTopProductsReport()
      loadDailySummaryReport()
    }, 100)
  })

  async function loadSalesReport() {
    isLoading = true
    try {
      const params = new URLSearchParams()
      if (salesStartDate) params.set('startDate', salesStartDate)
      if (salesEndDate) params.set('endDate', salesEndDate)
      if (salesPaymentMethod) params.set('paymentMethod', salesPaymentMethod)
      
      const res = await fetch(`/api/reports/sales?${params}`)
      const data = await res.json()
      if (data.error) {
        addNotification(data.error, 'error')
      } else {
        salesData = data
      }
    } catch (error) {
      addNotification('Failed to load sales report', 'error')
    }
    isLoading = false
  }

  async function loadInventoryReport() {
    isLoading = true
    try {
      const params = new URLSearchParams()
      if (inventoryCategory) params.set('category', inventoryCategory)
      if (inventoryStatus) params.set('status', inventoryStatus)
      
      const res = await fetch(`/api/reports/inventory?${params}`)
      const data = await res.json()
      if (data.error) {
        addNotification(data.error, 'error')
      } else {
        inventoryData = data
      }
    } catch (error) {
      addNotification('Failed to load inventory report', 'error')
    }
    isLoading = false
  }

  async function loadTopProductsReport() {
    isLoading = true
    try {
      const params = new URLSearchParams()
      if (topProductsStartDate) params.set('startDate', topProductsStartDate)
      if (topProductsEndDate) params.set('endDate', topProductsEndDate)
      if (topProductsLimit) params.set('limit', topProductsLimit)
      
      const res = await fetch(`/api/reports/top-products?${params}`)
      const data = await res.json()
      if (data.error) {
        addNotification(data.error, 'error')
      } else {
        topProductsData = data
      }
    } catch (error) {
      addNotification('Failed to load top products report', 'error')
    }
    isLoading = false
  }

  async function loadDailySummaryReport() {
    isLoading = true
    try {
      const params = new URLSearchParams()
      if (dailySummaryStartDate && dailySummaryEndDate) {
        params.set('startDate', dailySummaryStartDate)
        params.set('endDate', dailySummaryEndDate)
      } else {
        params.set('days', dailySummaryDays)
      }
      
      const res = await fetch(`/api/reports/daily-summary?${params}`)
      const data = await res.json()
      if (data.error) {
        addNotification(data.error, 'error')
      } else {
        dailySummaryData = data
      }
    } catch (error) {
      addNotification('Failed to load daily summary report', 'error')
    }
    isLoading = false
  }

  function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) {
      addNotification('No data to export', 'error')
      return
    }
    const headers = Object.keys(data[0])
    const csv = [headers.join(','), ...data.map(row => headers.map(h => {
      const val = row[h]
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`
      return val
    }).join(','))].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addNotification('CSV exported successfully', 'success')
  }

  async function exportToPDF(title: string, data: any[], columns: string[], filename: string) {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text(title, 14, 22)
    
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)

    const tableData = data.map(row => columns.map(col => {
      const val = row[col]
      if (typeof val === 'number') return val.toFixed(2)
      return val || ''
    }))

    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
    addNotification('PDF exported successfully', 'success')
  }

  $: if (activeTab === 'sales' && salesStartDate && salesEndDate) loadSalesReport()
  $: if (activeTab === 'inventory' && inventoryCategory !== undefined) loadInventoryReport()
  $: if (activeTab === 'top-products' && topProductsStartDate && topProductsEndDate) loadTopProductsReport()
  $: if (activeTab === 'daily-summary' && (dailySummaryDays || (dailySummaryStartDate && dailySummaryEndDate))) loadDailySummaryReport()
</script>

<svelte:head>
  <title>Reports - Mini Store Inventory</title>
</svelte:head>

<div class="space-y-6">
  <div class="page-header">
    <div>
      <h1 class="page-title">Reports</h1>
      <p class="page-subtitle">View and export sales, inventory, and performance reports.</p>
    </div>
  </div>

  <div class="flex gap-2 border-b-2 border-ink">
    <button 
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'sales' ? 'border-crimson text-crimson' : 'border-transparent text-ink-faint hover:text-ink'}"
      on:click={() => activeTab = 'sales'}
    >
      Sales Report
    </button>
    <button 
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'inventory' ? 'border-crimson text-crimson' : 'border-transparent text-ink-faint hover:text-ink'}"
      on:click={() => activeTab = 'inventory'}
    >
      Inventory Report
    </button>
    <button 
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'top-products' ? 'border-crimson text-crimson' : 'border-transparent text-ink-faint hover:text-ink'}"
      on:click={() => activeTab = 'top-products'}
    >
      Top Products
    </button>
    <button 
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'daily-summary' ? 'border-crimson text-crimson' : 'border-transparent text-ink-faint hover:text-ink'}"
      on:click={() => activeTab = 'daily-summary'}
    >
      Daily Summary
    </button>
  </div>

  {#if activeTab === 'sales'}
    <div class="card">
      <h2 class="card-header flex items-center gap-2">
        <svg class="w-5 h-5" style="color: var(--ink-faint)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Sales Report
      </h2>
      
      <div class="flex flex-wrap gap-4 mb-6">
        <div>
          <label class="form-label">Start Date</label>
          <input type="date" bind:value={salesStartDate} class="input" />
        </div>
        <div>
          <label class="form-label">End Date</label>
          <input type="date" bind:value={salesEndDate} class="input" />
        </div>
        <div>
          <label class="form-label">Payment Method</label>
          <select bind:value={salesPaymentMethod} class="input">
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="mobile_payment">Mobile Payment</option>
          </select>
        </div>
        <div class="flex items-end">
          <button on:click={loadSalesReport} class="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {#if salesData?.summary}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="p-4 rounded-xl" style="background: rgba(196,30,58,0.04); border: 2px solid rgba(196,30,58,0.1); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--crimson)">Total Revenue</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{formatCurrency(salesData.summary.totalAmount, $settings.currency)}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: rgba(58,107,62,0.06); border: 2px solid rgba(58,107,62,0.12); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--success)">Transactions</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{salesData.summary.totalTransactions}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: var(--gold-ghost); border: 2px solid rgba(201,149,44,0.15); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--gold-dark)">Items Sold</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{salesData.summary.itemsSold}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: var(--ink-ghost); border: 2px solid var(--border-ink); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--ink-faint)">Avg. Sale</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{formatCurrency(salesData.summary.avgSaleValue, $settings.currency)}</p>
          </div>
        </div>

        <div class="flex gap-2 mb-4">
          <button on:click={() => exportToCSV(salesData.sales, 'sales_report')} class="btn btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button on:click={() => exportToPDF('Sales Report', salesData.sales, ['id', 'saleDate', 'invoiceNumber', 'customerName', 'paymentMethod', 'totalAmount'], 'sales_report')} class="btn btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export PDF
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-transparent">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Invoice</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Customer</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Payment</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase" style="color: var(--ink-faint)">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each salesData.sales as sale}
                <tr class="hover:bg-transparent">
                  <td class="px-4 py-3 text-sm" style="color: var(--ink)">#{sale.id}</td>
                  <td class="px-4 py-3 text-sm" style="color: var(--ink)">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : '-'}</td>
                  <td class="px-4 py-3 text-sm" style="color: var(--ink)">{sale.invoiceNumber}</td>
                  <td class="px-4 py-3 text-sm" style="color: var(--ink)">{sale.customerName || '-'}</td>
                  <td class="px-4 py-3 text-sm capitalize" style="color: var(--ink)">{sale.paymentMethod.replace('_', ' ')}</td>
                  <td class="px-4 py-3 text-sm text-right font-medium" style="color: var(--ink)">{formatCurrency(sale.totalAmount, $settings.currency)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if isLoading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color: var(--crimson) mx-auto"></div>
          <p class="mt-4" style="color: var(--ink-faint)">Loading report...</p>
        </div>
      {:else}
        <div class="text-center py-12" style="color: var(--ink-faint)">Select date range and click Refresh</div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'inventory'}
    <div class="card">
      <h2 class="card-header flex items-center gap-2">
        <svg class="w-5 h-5" style="color: var(--ink-faint)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Inventory Report
      </h2>
      
      <div class="flex flex-wrap gap-4 mb-6">
        <div>
          <label class="form-label">Category</label>
          <select bind:value={inventoryCategory} class="input">
            <option value="all">All Categories</option>
            <option value="">Uncategorized</option>
            <option value="Food">Food</option>
            <option value="Beverages">Beverages</option>
            <option value="Snacks">Snacks</option>
            <option value="Household">Household</option>
            <option value="Personal Care">Personal Care</option>
          </select>
        </div>
        <div>
          <label class="form-label">Stock Status</label>
          <select bind:value={inventoryStatus} class="input">
            <option value="">All</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
        <div class="flex items-end">
          <button on:click={loadInventoryReport} class="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {#if inventoryData?.summary}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="p-4 rounded-xl" style="background: var(--gold-ghost); border: 2px solid rgba(201,149,44,0.15); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--gold-dark)">Total Items</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{inventoryData.summary.totalItems}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: rgba(58,107,62,0.06); border: 2px solid rgba(58,107,62,0.12); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--success)">Total Stock</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{inventoryData.summary.totalStock}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: rgba(196,30,58,0.04); border: 2px solid rgba(196,30,58,0.1); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--crimson)">Total Value</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{formatCurrency(inventoryData.summary.totalValue, $settings.currency)}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: var(--crimson-ghost); border: 2px solid rgba(184,28,46,0.12); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--crimson)">Low Stock</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{inventoryData.summary.lowStockCount}</p>
          </div>
        </div>

        <div class="flex gap-2 mb-4">
          <button on:click={() => exportToCSV(inventoryData.items, 'inventory_report')} class="btn btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button on:click={() => exportToPDF('Inventory Report', inventoryData.items, ['id', 'name', 'itemCode', 'price', 'stockQuantity', 'category'], 'inventory_report')} class="btn btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export PDF
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-transparent">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Code</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Category</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase" style="color: var(--ink-faint)">Price</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase" style="color: var(--ink-faint)">Stock</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each inventoryData.items as item}
                {@const isLow = item.stockQuantity <= item.lowStockThreshold}
                {@const isOut = item.stockQuantity === 0}
                <tr class="hover:bg-transparent">
                  <td class="px-4 py-3 text-sm" style="color: var(--ink)">#{item.id}</td>
                  <td class="px-4 py-3 text-sm" style="color: var(--ink)">{item.name}</td>
                  <td class="px-4 py-3 text-sm" style="color: var(--ink-faint)">{item.itemCode}</td>
                  <td class="px-4 py-3 text-sm" style="color: var(--ink-faint)">{item.category || '-'}</td>
                  <td class="px-4 py-3 text-sm text-right" style="color: var(--ink)">{formatCurrency(item.price, $settings.currency)}</td>
                  <td class="px-4 py-3 text-sm text-right" style="color: var(--ink)">{item.stockQuantity}</td>
                  <td class="px-4 py-3">
                    <span class="badge {isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}">
                      {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if isLoading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color: var(--crimson) mx-auto"></div>
          <p class="mt-4" style="color: var(--ink-faint)">Loading report...</p>
        </div>
      {:else}
        <div class="text-center py-12" style="color: var(--ink-faint)">Select options and click Refresh</div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'top-products'}
    <div class="card">
      <h2 class="card-header flex items-center gap-2">
        <svg class="w-5 h-5" style="color: var(--ink-faint)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Top Products
      </h2>
      
      <div class="flex flex-wrap gap-4 mb-6">
        <div>
          <label class="form-label">Start Date</label>
          <input type="date" bind:value={topProductsStartDate} class="input" />
        </div>
        <div>
          <label class="form-label">End Date</label>
          <input type="date" bind:value={topProductsEndDate} class="input" />
        </div>
        <div>
          <label class="form-label">Limit</label>
          <select bind:value={topProductsLimit} class="input">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
        <div class="flex items-end">
          <button on:click={loadTopProductsReport} class="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {#if topProductsData?.summary}
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div class="p-4 rounded-xl" style="background: rgba(196,30,58,0.04); border: 2px solid rgba(196,30,58,0.1); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--crimson)">Total Sold</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{topProductsData.summary.totalQuantity}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: rgba(58,107,62,0.06); border: 2px solid rgba(58,107,62,0.12); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--success)">Total Revenue</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{formatCurrency(topProductsData.summary.totalRevenue, $settings.currency)}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: var(--gold-ghost); border: 2px solid rgba(201,149,44,0.15); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--gold-dark)">Products</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{topProductsData.summary.productCount}</p>
          </div>
        </div>

        <div class="flex gap-2 mb-4">
          <button on:click={() => exportToCSV(topProductsData.products, 'top_products')} class="btn btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button on:click={() => exportToPDF('Top Products', topProductsData.products, ['name', 'itemCode', 'quantity', 'revenue'], 'top_products')} class="btn btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export PDF
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-transparent">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">#</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Product</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Code</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase" style="color: var(--ink-faint)">Qty Sold</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase" style="color: var(--ink-faint)">Revenue</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each topProductsData.products as product, i}
                <tr class="hover:bg-transparent">
                  <td class="px-4 py-3 text-sm" style="color: var(--ink-faint)">{i + 1}</td>
                  <td class="px-4 py-3 text-sm font-medium" style="color: var(--ink)">{product.name}</td>
                  <td class="px-4 py-3 text-sm" style="color: var(--ink-faint)">{product.itemCode}</td>
                  <td class="px-4 py-3 text-sm text-right" style="color: var(--ink)">{product.quantity}</td>
                  <td class="px-4 py-3 text-sm text-right font-medium" style="color: var(--ink)">{formatCurrency(product.revenue, $settings.currency)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if isLoading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color: var(--crimson) mx-auto"></div>
          <p class="mt-4" style="color: var(--ink-faint)">Loading report...</p>
        </div>
      {:else}
        <div class="text-center py-12" style="color: var(--ink-faint)">Select date range and click Refresh</div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'daily-summary'}
    <div class="card">
      <h2 class="card-header flex items-center gap-2">
        <svg class="w-5 h-5" style="color: var(--ink-faint)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Daily Summary
      </h2>
      
      <div class="flex flex-wrap gap-4 mb-6">
        <div>
          <label class="form-label">Period</label>
          <select bind:value={dailySummaryDays} class="input">
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
        <div class="flex items-end">
          <button on:click={loadDailySummaryReport} class="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {#if dailySummaryData?.summary}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="p-4 rounded-xl" style="background: rgba(196,30,58,0.04); border: 2px solid rgba(196,30,58,0.1); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--crimson)">Total Revenue</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{formatCurrency(dailySummaryData.summary.totalRevenue, $settings.currency)}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: rgba(58,107,62,0.06); border: 2px solid rgba(58,107,62,0.12); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--success)">Transactions</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{dailySummaryData.summary.totalTransactions}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: var(--gold-ghost); border: 2px solid rgba(201,149,44,0.15); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--gold-dark)">Avg. Daily</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{formatCurrency(dailySummaryData.summary.avgDailySales, $settings.currency)}</p>
          </div>
          <div class="p-4 rounded-xl" style="background: var(--ink-ghost); border: 2px solid var(--border-ink); border-radius: 6px 8px 6px 7px">
            <p class="text-sm font-medium" style="color: var(--ink-faint)">Avg. Transaction</p>
            <p class="text-2xl font-bold" style="color: var(--ink)">{formatCurrency(dailySummaryData.summary.avgTransactionValue, $settings.currency)}</p>
          </div>
        </div>

        <div class="flex gap-2 mb-4">
          <button on:click={() => exportToCSV(dailySummaryData.daily, 'daily_summary')} class="btn btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button on:click={() => exportToPDF('Daily Summary', dailySummaryData.daily, ['date', 'totalSales', 'transactionCount', 'avgSaleValue'], 'daily_summary')} class="btn btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export PDF
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-transparent">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: var(--ink-faint)">Date</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase" style="color: var(--ink-faint)">Total Sales</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase" style="color: var(--ink-faint)">Transactions</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase" style="color: var(--ink-faint)">Avg. Sale</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each dailySummaryData.daily as day}
                <tr class="hover:bg-transparent">
                  <td class="px-4 py-3 text-sm" style="color: var(--ink)">{day.date}</td>
                  <td class="px-4 py-3 text-sm text-right font-medium" style="color: var(--ink)">{formatCurrency(day.totalSales, $settings.currency)}</td>
                  <td class="px-4 py-3 text-sm" style="color: var(--ink-faint) text-right">{day.transactionCount}</td>
                  <td class="px-4 py-3 text-sm" style="color: var(--ink-faint) text-right">{formatCurrency(day.avgSaleValue, $settings.currency)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if isLoading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color: var(--crimson) mx-auto"></div>
          <p class="mt-4" style="color: var(--ink-faint)">Loading report...</p>
        </div>
      {:else}
        <div class="text-center py-12" style="color: var(--ink-faint)">Select period and click Refresh</div>
      {/if}
    </div>
  {/if}
</div>
