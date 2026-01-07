<script lang="ts">
  import { onMount } from 'svelte'
  import { addNotification } from '$lib/stores/stores'
  import { settings, formatCurrency, currencySymbol } from '$lib/stores/settings'
  import { generateSaleReceipt } from '$lib/utils/pdfGenerator'
  import type { Sale, SaleWithItems, Item } from '$lib/types'
  
  let sales: Sale[] = []
  let items: Item[] = []
  let loading = true
  let showNewSaleModal = false
  let showBackupModal = false
  let currentPage = 1
  let totalPages = 1
  let selectedSale: SaleWithItems | null = null
  let showDetailModal = false
  let isBackingUp = false
  let todayTotal = 0
  let todayTransactionCount = 0

  let newSaleForm = {
    customerName: '',
    paymentMethod: 'cash' as 'cash' | 'credit' | 'mobile_payment',
    items: [] as Array<{ itemId: number; quantity: number; unitPrice: number; totalPrice: number; name: string }>
  }
  
  let selectedItemId = ''
  let selectedQuantity = 1
  let isSubmitting = false
  
  $: totalAmount = newSaleForm.items.reduce((sum, item) => sum + item.totalPrice, 0)
  $: itemCount = newSaleForm.items.reduce((sum, item) => sum + item.quantity, 0)

  onMount(async () => {
    settings.load()
    await Promise.all([loadSales(), loadItems(), loadTodaySales()])
  })
  
  async function loadSales() {
    try {
      const res = await fetch(`/api/sales?page=${currentPage}&limit=10`)
      const data = await res.json()
      if (data.success) {
        sales = data.data
        totalPages = data.pagination.totalPages
      }
    } catch (error) {
      console.error('Error loading sales:', error)
      addNotification('Failed to load sales', 'error')
    } finally {
      loading = false
    }
  }
  
  async function loadItems() {
    try {
      const res = await fetch('/api/items')
      const data = await res.json()
      if (data.success) {
        items = data.data
      }
    } catch (error) {
      console.error('Error loading items:', error)
    }
  }

  async function loadTodaySales() {
    try {
      const res = await fetch('/api/reports/today-sales')
      const data = await res.json()
      if (data.success) {
        todayTotal = data.data.totalSales
        todayTransactionCount = data.data.transactionCount
      }
    } catch (error) {
      console.error('Error loading today sales:', error)
    }
  }
  
  async function backupSales() {
    isBackingUp = true
    try {
      const res = await fetch('/api/sales')
      const data = await res.json()
      
      if (data.success) {
        const backupData = {
          exportDate: new Date().toISOString(),
          version: '1.0',
          sales: data.data,
          summary: {
            totalSales: data.data.length,
            totalRevenue: data.data.reduce((sum: number, s: Sale) => sum + s.totalAmount, 0),
            transactionCount: data.data.length
          }
        }
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const dateStr = new Date().toISOString().split('T')[0]
        a.href = url
        a.download = `sales-backup-${dateStr}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        addNotification('Sales backup downloaded successfully!', 'success')
        showBackupModal = false
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      addNotification('Failed to create backup', 'error')
    } finally {
      isBackingUp = false
    }
  }
  
  function openNewSaleModal() {
    newSaleForm = {
      customerName: '',
      paymentMethod: 'cash',
      items: []
    }
    selectedItemId = ''
    selectedQuantity = 1
    showNewSaleModal = true
  }
  
  function closeNewSaleModal() {
    showNewSaleModal = false
  }
  
  function addItemToSale() {
    const itemId = parseInt(selectedItemId)
    if (isNaN(itemId) || selectedQuantity <= 0) {
      addNotification('Please select an item and enter a valid quantity', 'error')
      return
    }
    
    const item = items.find(i => i.id === itemId)
    if (!item) {
      addNotification('Item not found', 'error')
      return
    }
    
    if (selectedQuantity > item.stockQuantity) {
      addNotification(`Only ${item.stockQuantity} units available`, 'error')
      return
    }
    
    const existingIndex = newSaleForm.items.findIndex(i => i.itemId === itemId)
    if (existingIndex >= 0) {
      const newQty = newSaleForm.items[existingIndex].quantity + selectedQuantity
      if (newQty > item.stockQuantity) {
        addNotification(`Only ${item.stockQuantity} units available`, 'error')
        return
      }
      newSaleForm.items[existingIndex].quantity = newQty
      newSaleForm.items[existingIndex].totalPrice = newQty * item.price
    } else {
      newSaleForm.items = [...newSaleForm.items, {
        itemId: itemId,
        quantity: selectedQuantity,
        unitPrice: item.price,
        totalPrice: item.price * selectedQuantity,
        name: item.name
      }]
    }
    
    selectedItemId = ''
    selectedQuantity = 1
  }
  
  function removeItemFromSale(index: number) {
    newSaleForm.items = newSaleForm.items.filter((_, i) => i !== index)
  }
  
  function updateItemQuantity(index: number, newQty: number) {
    if (newQty < 1) return
    const item = items.find(i => i.id === newSaleForm.items[index].itemId)
    if (item && newQty <= item.stockQuantity) {
      newSaleForm.items[index].quantity = newQty
      newSaleForm.items[index].totalPrice = newQty * newSaleForm.items[index].unitPrice
      newSaleForm.items = newSaleForm.items
    } else {
      addNotification(`Maximum ${item?.stockQuantity || 0} units available`, 'error')
    }
  }
  
  async function createSale() {
    if (newSaleForm.items.length === 0) {
      addNotification('Please add at least one item', 'error')
      return
    }
    
    isSubmitting = true
    
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newSaleForm.customerName || null,
          paymentMethod: newSaleForm.paymentMethod,
          items: newSaleForm.items.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          })),
          saleDate: new Date().toISOString()
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        await loadSales()
        await loadTodaySales()
        closeNewSaleModal()
        addNotification('Sale completed successfully!', 'success')
      } else {
        addNotification(data.error || 'Failed to create sale', 'error')
      }
    } catch (error) {
      console.error('Error creating sale:', error)
      addNotification('Failed to create sale', 'error')
    } finally {
      isSubmitting = false
    }
  }
  
  async function viewSaleDetails(sale: Sale) {
    try {
      const res = await fetch(`/api/sales/${sale.id}`)
      const data = await res.json()
      if (data.success) {
        selectedSale = data.data
        showDetailModal = true
      }
    } catch (error) {
      console.error('Error fetching sale details:', error)
      addNotification('Failed to load sale details', 'error')
    }
  }
  
  function closeDetailModal() {
    showDetailModal = false
    selectedSale = null
  }
  
  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  function changePage(page: number) {
    currentPage = page
    loadSales()
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && showNewSaleModal) {
      closeNewSaleModal()
    }
    if (e.key === 'Escape' && showDetailModal) {
      closeDetailModal()
    }
  }
  
  function getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Cash',
      credit: 'Credit',
      mobile_payment: 'Mobile Payment'
    }
    return labels[method] || method
  }

  function exportSalesToCsv() {
    window.open('/api/export/sales', '_blank')
  }

  function printReceipt(sale: SaleWithItems) {
    const receiptItems = sale.items.map(item => ({
      name: item.itemName || `Item #${item.itemId}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }))
    
    generateSaleReceipt(sale, receiptItems, {
      storeName: $settings.storeName,
      storeAddress: $settings.storeAddress,
      storePhone: $settings.storePhone
    })
    addNotification('Receipt downloaded', 'success')
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
  <title>Sales - Mini Store Inventory</title>
</svelte:head>

  <div class="space-y-6">
  <!-- Page Header -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Sales</h1>
      <p class="page-subtitle">Track your sales and transactions.</p>
    </div>
    <div class="flex gap-3">
      <button on:click={() => showBackupModal = true} class="btn btn-secondary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Backup
      </button>
      <button on:click={exportSalesToCsv} class="btn btn-secondary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export CSV
      </button>
      <button on:click={openNewSaleModal} class="btn btn-primary">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Sale
      </button>
    </div>
  </div>
  
  <!-- Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon success">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{formatCurrency(todayTotal, $settings.currency)}</span>
        <span class="stat-label">Today's Sales</span>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon primary">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
        <div class="stat-info">
          <span class="stat-value">{todayTransactionCount}</span>
          <span class="stat-label">Transactions Today</span>
        </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon info">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{sales.length}</span>
        <span class="stat-label">Showing Sales</span>
      </div>
    </div>
  </div>
  
  <!-- Sales Table -->
  <div class="card">
    {#if loading}
      <div class="space-y-4">
        {#each Array(5) as _}
          <div class="skeleton h-16 w-full"></div>
        {/each}
      </div>
    {:else if sales.length === 0}
      <div class="empty-state py-16">
        <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="empty-state-title">No sales yet</p>
        <p class="empty-state-description">Start your first sale to see it here.</p>
        <button on:click={openNewSaleModal} class="btn btn-primary mt-4">
          Create First Sale
        </button>
      </div>
    {:else}
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Amount</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each sales as sale}
              <tr class="hover:bg-gray-50 transition-colors">
                <td>
                  <span class="font-mono text-sm font-medium">{sale.invoiceNumber}</span>
                </td>
                <td>{formatDate(sale.saleDate)}</td>
                <td>{sale.customerName || 'Walk-in'}</td>
                <td>
                  <span class="badge {
                    sale.paymentMethod === 'cash' ? 'badge-success' :
                    sale.paymentMethod === 'credit' ? 'badge-warning' : 'badge-info'
                  }">
                    {getPaymentMethodLabel(sale.paymentMethod)}
                  </span>
                </td>
                <td class="font-semibold">{formatCurrency(sale.totalAmount, $settings.currency)}</td>
                <td class="text-right">
                  <button 
                    on:click={() => viewSaleDetails(sale)}
                    class="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      {#if totalPages > 1}
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <p class="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div class="flex gap-2">
            <button 
              on:click={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              class="btn btn-sm btn-secondary"
            >
              Previous
            </button>
            <button 
              on:click={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="btn btn-sm btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- New Sale Modal -->
{#if showNewSaleModal}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="new-sale-title" on:click={closeNewSaleModal} on:keydown={(e) => e.key === 'Escape' && closeNewSaleModal()}>
    <div class="modal max-w-2xl w-full" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold text-gray-900">New Sale</h2>
        <button on:click={closeNewSaleModal} class="btn-icon" aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="p-6 space-y-5">
        <!-- Customer & Payment -->
        <div class="grid grid-cols-2 gap-6">
          <div class="form-group">
            <label for="customerName" class="form-label">Customer Name</label>
            <input 
              type="text" 
              id="customerName"
              bind:value={newSaleForm.customerName}
              placeholder="Optional"
              class="input"
            />
          </div>
          <div class="form-group">
            <label for="paymentMethod" class="form-label">Payment Method</label>
            <select 
              id="paymentMethod"
              bind:value={newSaleForm.paymentMethod} 
              class="input"
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
              <option value="mobile_payment">Mobile Payment</option>
            </select>
          </div>
        </div>
        
        <!-- Add Items Section -->
        <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <label class="form-label mb-3">Add Items</label>
          
          <div class="flex gap-3 mb-3">
            <div class="flex-1">
              <select 
                bind:value={selectedItemId}
                class="input"
              >
                <option value="">Select an item</option>
                {#each items.filter(i => i.stockQuantity > 0) as item}
                  <option value={item.id.toString()}>
                    {item.name} - {formatCurrency(item.price, $settings.currency)} (Stock: {item.stockQuantity})
                  </option>
                {/each}
              </select>
            </div>
            
            <div class="w-24">
              <input 
                type="number" 
                min="1" 
                max={selectedItemId ? items.find(i => i.id === parseInt(selectedItemId))?.stockQuantity : 999}
                bind:value={selectedQuantity}
                class="input text-center"
                placeholder="Qty"
              />
            </div>
            
            <button 
              type="button"
              on:click={addItemToSale}
              disabled={!selectedItemId || selectedQuantity < 1}
              class="btn btn-primary"
            >
              Add
            </button>
          </div>
          
          <!-- Selected Item Info -->
          {#if selectedItemId}
            {@const selectedItem = items.find(i => i.id === parseInt(selectedItemId))}
            {#if selectedItem}
              <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{selectedItem.name}</p>
                    <p class="text-sm text-gray-500">
                      Price: {formatCurrency(selectedItem.price, $settings.currency)} | Available: {selectedItem.stockQuantity}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  on:click={() => { selectedItemId = ''; selectedQuantity = 1; }}
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            {/if}
          {/if}
        </div>
        
        <!-- Items List -->
        {#if newSaleForm.items.length > 0}
          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="w-24">Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th class="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {#each newSaleForm.items as item, index}
                  <tr>
                    <td class="font-medium">{item.name}</td>
                    <td>
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity}
                        on:change={(e) => updateItemQuantity(index, parseInt(e.currentTarget.value) || 1)}
                        class="input w-16 text-center"
                      />
                    </td>
                    <td>{formatCurrency(item.unitPrice, $settings.currency)}</td>
                    <td class="font-medium">{formatCurrency(item.totalPrice, $settings.currency)}</td>
                    <td class="text-right">
                      <button 
                        type="button"
                        on:click={() => removeItemFromSale(index)}
                        class="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot>
                <tr class="bg-gray-50">
                  <td colspan="2" class="text-right font-semibold py-3 px-4">
                    Total: {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </td>
                  <td colspan="2" class="font-bold text-lg py-3 px-4 text-right">
                    {formatCurrency(totalAmount, $settings.currency)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        {:else}
          <div class="text-center py-8 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No items added yet. Search and select items above.</p>
          </div>
        {/if}
        
        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button"
            on:click={closeNewSaleModal} 
            class="btn btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="button"
            on:click={createSale}
            disabled={newSaleForm.items.length === 0 || isSubmitting}
            class="btn btn-primary flex-1"
          >
            {#if isSubmitting}
              <svg class="animate-spin w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            {:else}
              Complete Sale - {formatCurrency(totalAmount, $settings.currency)}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Sale Detail Modal -->
{#if showDetailModal && selectedSale}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="sale-detail-title" on:click={closeDetailModal} on:keydown={(e) => e.key === 'Escape' && closeDetailModal()}>
    <div class="modal max-w-lg w-full" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold text-gray-900">Sale Details</h2>
        <button on:click={closeDetailModal} class="btn-icon" aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="p-6 space-y-5">
        <!-- Sale Info -->
        <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
          <div>
            <p class="text-sm text-gray-500">Invoice Number</p>
            <p class="font-mono font-medium">{selectedSale.invoiceNumber}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Date</p>
            <p class="font-medium">{formatDate(selectedSale.saleDate)}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Customer</p>
            <p class="font-medium">{selectedSale.customerName || 'Walk-in Customer'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Payment Method</p>
            <span class="badge {
              selectedSale.paymentMethod === 'cash' ? 'badge-success' :
              selectedSale.paymentMethod === 'credit' ? 'badge-warning' : 'badge-info'
            }">
              {getPaymentMethodLabel(selectedSale.paymentMethod)}
            </span>
          </div>
        </div>
        
        <!-- Items -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Items ({selectedSale.items.length})</h3>
          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="w-16 text-center">Qty</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {#each selectedSale.items as item}
                  <tr>
                    <td class="font-medium">{item.itemName || `Item #${item.itemId}`}</td>
                    <td class="text-center">{item.quantity}</td>
                    <td class="text-right font-medium">{formatCurrency(item.totalPrice, $settings.currency)}</td>
                  </tr>
                {/each}
              </tbody>
              <tfoot>
                <tr class="bg-gray-50">
                  <td class="text-right font-semibold py-3 px-4">Total Amount:</td>
                  <td colspan="2" class="font-bold text-lg py-3 px-4 text-right">
                    {formatCurrency(selectedSale.totalAmount, $settings.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button 
            on:click={() => selectedSale && printReceipt(selectedSale)}
            class="btn btn-secondary flex-1"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
          <button on:click={closeDetailModal} class="btn btn-primary flex-1">Close</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Backup Modal -->
{#if showBackupModal}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="backup-modal-title" on:click={() => showBackupModal = false} on:keydown={(e) => e.key === 'Escape' && (showBackupModal = false)}>
    <div class="modal max-w-md w-full" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold text-gray-900">
          <svg class="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Backup Sales Data
        </h2>
        <button on:click={() => showBackupModal = false} class="btn-icon" aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="p-6">
        <div class="backup-section">
          <div class="backup-icon success">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">Export Sales</h3>
          <p class="text-sm text-gray-600">Download all sales data as a JSON file for backup or analysis.</p>
          <button 
            on:click={backupSales}
            class="btn btn-primary w-full"
            disabled={isBackingUp || sales.length === 0}
          >
            {#if isBackingUp}
              <svg class="animate-spin w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            {:else}
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Backup
            {/if}
          </button>
          {#if sales.length > 0}
            <p class="text-xs text-gray-500 text-center mt-2">
              {sales.length} transactions • {formatCurrency(sales.reduce((sum, s) => sum + s.totalAmount, 0), $settings.currency)} total
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: white;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stat-icon.success {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
  }
  
  .stat-icon.primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }
  
  .stat-icon.info {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
  }
  
  .stat-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  
  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .backup-section {
    text-align: center;
    padding: 1.5rem;
    border-radius: 0.75rem;
    background: #f9fafb;
  }
  
  .backup-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    background: #dcfce7;
    color: #16a34a;
  }
  
  @media (max-width: 640px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .page-header .flex {
      width: 100%;
      flex-direction: column;
    }
    
    .page-header .btn {
      width: 100%;
      justify-content: center;
    }
    
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .stat-card {
      padding: 1rem;
      gap: 0.75rem;
    }
    
    .stat-value {
      font-size: 1.1rem;
    }
  }
</style>
