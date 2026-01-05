<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { addNotification } from '$lib/stores/stores'
  import { settings, formatCurrency, currencySymbol } from '$lib/stores/settings'
  import type { Item } from '$lib/types'
  
  let items: Item[] = []
  let filteredItems: Item[] = []
  let loading = true
  let searchQuery = ''
  let categoryFilter = ''
  let sortBy = 'name'
  let sortOrder: 'asc' | 'desc' = 'asc'
  let showModal = false
  let editingItem: Item | null = null
  let highlightItemId: number | null = null
  
  let formData = {
    name: '',
    itemCode: '',
    price: 0,
    stockQuantity: 0,
    lowStockThreshold: 10,
    category: ''
  }
  
  let formErrors: Record<string, string> = {}
  let isSubmitting = false
  
  const categories = ['Beverages', 'Snacks', 'Groceries', 'Dairy', 'Household', 'Personal Care', 'Electronics', 'Other']
  
  onMount(async () => {
    settings.load()
    
    const highlight = $page.url.searchParams.get('highlight')
    const search = $page.url.searchParams.get('search')
    
    if (highlight) {
      highlightItemId = parseInt(highlight) || null
    }
    
    if (search) {
      searchQuery = search
    }
    
    await loadItems()
  })
  
  async function loadItems() {
    try {
      const res = await fetch('/api/items')
      const data = await res.json()
      if (data.success) {
        items = data.data
        filterItems()
        
        if (highlightItemId) {
          setTimeout(() => {
            const element = document.getElementById(`item-${highlightItemId}`)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error('Error loading items:', error)
      addNotification('Failed to load items', 'error')
    } finally {
      loading = false
    }
  }
  
  function filterItems() {
    let result = [...items]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.itemCode.toLowerCase().includes(query)
      )
    }
    
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter)
    }
    
    result.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name)
      else if (sortBy === 'price') comparison = a.price - b.price
      else if (sortBy === 'stockQuantity') comparison = a.stockQuantity - b.stockQuantity
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    filteredItems = result
  }
  
  $: {
    if (searchQuery || categoryFilter || sortBy || sortOrder) {
      filterItems()
    }
  }
  
  function validateForm(): boolean {
    formErrors = {}
    
    if (!formData.name.trim()) {
      formErrors.name = 'Item name is required'
    } else if (formData.name.length < 2) {
      formErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!formData.itemCode.trim()) {
      formErrors.itemCode = 'Item code is required'
    } else if (!/^[A-Za-z0-9-_]+$/.test(formData.itemCode)) {
      formErrors.itemCode = 'Item code can only contain letters, numbers, hyphens, and underscores'
    }
    
    if (formData.price < 0) {
      formErrors.price = 'Price cannot be negative'
    }
    
    if (formData.stockQuantity < 0) {
      formErrors.stockQuantity = 'Stock quantity cannot be negative'
    }
    
    if (formData.lowStockThreshold < 0) {
      formErrors.lowStockThreshold = 'Threshold cannot be negative'
    }
    
    return Object.keys(formErrors).length === 0
  }
  
  function openModal(item?: Item) {
    if (item) {
      editingItem = item
      formData = {
        name: item.name,
        itemCode: item.itemCode,
        price: item.price,
        stockQuantity: item.stockQuantity,
        lowStockThreshold: item.lowStockThreshold,
        category: item.category || ''
      }
    } else {
      editingItem = null
      formData = {
        name: '',
        itemCode: '',
        price: 0,
        stockQuantity: 0,
        lowStockThreshold: $settings.lowStockThreshold,
        category: ''
      }
    }
    formErrors = {}
    showModal = true
  }
  
  function closeModal() {
    showModal = false
    editingItem = null
    formErrors = {}
  }
  
  async function saveItem() {
    if (!validateForm()) return
    
    isSubmitting = true
    
    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items'
      const method = editingItem ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (data.success) {
        await loadItems()
        closeModal()
        addNotification(
          editingItem ? 'Item updated successfully!' : 'Item created successfully!',
          'success'
        )
      } else {
        addNotification(data.error || 'Failed to save item', 'error')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      addNotification('Failed to save item', 'error')
    } finally {
      isSubmitting = false
    }
  }
  
  async function deleteItem(id: number) {
    const item = items.find(i => i.id === id)
    if (!confirm(`Are you sure you want to delete "${item?.name}"?`)) return
    
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        await loadItems()
        addNotification('Item deleted successfully', 'success')
      } else {
        addNotification(data.error || 'Failed to delete item', 'error')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      addNotification('Failed to delete item', 'error')
    }
  }
  
  function toggleSort(field: string) {
    if (sortBy === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy = field
      sortOrder = 'asc'
    }
  }
  
  function getStockStatus(item: Item) {
    if (item.stockQuantity === 0) return { label: 'Out of Stock', class: 'badge-danger' }
    if (item.stockQuantity <= item.lowStockThreshold) return { label: 'Low Stock', class: 'badge-warning' }
    return { label: 'In Stock', class: 'badge-success' }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && showModal) {
      e.preventDefault()
      saveItem()
    }
    if (e.key === 'Escape' && showModal) {
      closeModal()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
  <title>Inventory - Mini Store Inventory</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Inventory</h1>
      <p class="page-subtitle">Manage your products and stock levels.</p>
    </div>
    <button on:click={() => openModal()} class="btn btn-primary">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Item
    </button>
  </div>
  
  <!-- Search and Filters -->
  <div class="card">
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="flex-1 relative">
        <svg class="search-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          placeholder="Search by name or code..." 
          bind:value={searchQuery}
          class="input pl-10"
        />
      </div>
      <div class="w-full lg:w-48">
        <select bind:value={categoryFilter} class="input">
          <option value="">All Categories</option>
          {#each categories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>
  
  <!-- Items Table -->
  <div class="card p-0">
    {#if loading}
      <div class="p-6 space-y-4">
        {#each Array(5) as _}
          <div class="skeleton h-16 w-full"></div>
        {/each}
      </div>
    {:else if filteredItems.length === 0}
      <div class="empty-state py-16">
        <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p class="empty-state-title">No items found</p>
        <p class="empty-state-description">
          {searchQuery || categoryFilter ? 'Try adjusting your search or filters.' : 'Get started by adding your first item.'}
        </p>
        {#if !searchQuery && !categoryFilter}
          <button on:click={() => openModal()} class="btn btn-primary mt-4">
            Add First Item
          </button>
        {/if}
      </div>
    {:else}
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th class="cursor-pointer hover:bg-gray-100 px-6" on:click={() => toggleSort('name')}>
                <div class="flex items-center gap-2">
                  Item
                  {#if sortBy === 'name'}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                    </svg>
                  {/if}
                </div>
              </th>
              <th>Category</th>
              <th class="cursor-pointer hover:bg-gray-100" on:click={() => toggleSort('price')}>
                <div class="flex items-center gap-2">
                  Price
                  {#if sortBy === 'price'}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                    </svg>
                  {/if}
                </div>
              </th>
              <th class="cursor-pointer hover:bg-gray-100" on:click={() => toggleSort('stockQuantity')}>
                <div class="flex items-center gap-2">
                  Stock
                  {#if sortBy === 'stockQuantity'}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                    </svg>
                  {/if}
                </div>
              </th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredItems as item}
              {@const status = getStockStatus(item)}
              {@const isHighlighted = highlightItemId === item.id}
              <tr 
                id="item-{item.id}"
                class="hover:bg-gray-50 transition-colors {isHighlighted ? 'bg-amber-50 ring-2 ring-amber-400 ring-inset' : ''}"
              >
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{item.name}</p>
                      <p class="text-sm text-gray-500 font-mono">{item.itemCode}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge badge-primary">{item.category || 'Uncategorized'}</span>
                </td>
                <td class="font-medium">{formatCurrency(item.price, $settings.currency)}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{item.stockQuantity}</span>
                    {#if item.stockQuantity <= item.lowStockThreshold}
                      <svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    {/if}
                  </div>
                </td>
                <td>
                  <span class="badge {status.class}">{status.label}</span>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button 
                      on:click={() => openModal(item)}
                      class="btn-icon"
                      title="Edit"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      on:click={() => deleteItem(item.id)}
                      class="btn-icon text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Add/Edit Item Modal -->
{#if showModal}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal max-w-xl w-full" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold text-gray-900">
          {editingItem ? 'Edit Item' : 'Add New Item'}
        </h2>
        <button on:click={closeModal} class="btn-icon" aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form on:submit|preventDefault={saveItem} class="p-6 space-y-6">
        <!-- Item Name - Full Width -->
        <div class="form-group">
          <label for="itemName" class="form-label">Item Name</label>
          <input 
            type="text" 
            id="itemName"
            bind:value={formData.name}
            class="input {formErrors.name ? 'border-red-500' : ''}"
            placeholder="Enter item name"
            disabled={isSubmitting}
            autofocus
          />
          {#if formErrors.name}
            <p class="form-error">{formErrors.name}</p>
          {/if}
        </div>
        
        <!-- 2-Column Grid -->
        <div class="grid grid-cols-2 gap-6">
          <!-- Item Code -->
          <div class="form-group">
            <label for="itemCode" class="form-label">Item Code</label>
            <input 
              type="text" 
              id="itemCode"
              bind:value={formData.itemCode}
              class="input font-mono {formErrors.itemCode ? 'border-red-500' : ''}"
              placeholder="e.g., BEV-001"
              disabled={isSubmitting}
            />
            {#if formErrors.itemCode}
              <p class="form-error">{formErrors.itemCode}</p>
            {/if}
          </div>
          
          <!-- Category -->
          <div class="form-group">
            <label for="category" class="form-label">Category</label>
            <select 
              id="category"
              bind:value={formData.category} 
              class="input"
              disabled={isSubmitting}
            >
              <option value="">Select category</option>
              {#each categories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>
          
          <!-- Price -->
          <div class="form-group">
            <label for="price" class="form-label">Price</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none select-none whitespace-nowrap {currencySymbol($settings.currency).length > 1 ? 'text-sm' : ''}">
                {currencySymbol($settings.currency)}
              </span>
              <input 
                type="number" 
                id="price"
                step="0.01" 
                min="0"
                bind:value={formData.price}
                 class="input {currencySymbol($settings.currency).length === 3 ? 'pl-16' : currencySymbol($settings.currency).length > 1 ? 'pl-14' : 'pl-10'} {formErrors.price ? 'border-red-500' : ''}"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            {#if formErrors.price}
              <p class="form-error">{formErrors.price}</p>
            {/if}
          </div>
          
          <!-- Stock Quantity -->
          <div class="form-group">
            <label for="stockQuantity" class="form-label">Stock Quantity</label>
            <input 
              type="number" 
              id="stockQuantity"
              min="0"
              bind:value={formData.stockQuantity}
              class="input {formErrors.stockQuantity ? 'border-red-500' : ''}"
              placeholder="0"
              disabled={isSubmitting}
            />
            {#if formErrors.stockQuantity}
              <p class="form-error">{formErrors.stockQuantity}</p>
            {/if}
          </div>
          
          <!-- Low Stock Alert -->
          <div class="form-group">
            <label for="lowStockThreshold" class="form-label">Low Stock Alert</label>
            <input 
              type="number" 
              id="lowStockThreshold"
              min="0"
              bind:value={formData.lowStockThreshold}
              class="input"
              placeholder="10"
              disabled={isSubmitting}
            />
            <p class="form-hint">Alert when stock falls below</p>
          </div>
          
          <!-- Unit (Read-only display) -->
          <div class="form-group">
            <label class="form-label">Unit</label>
            <div class="input bg-gray-50 text-gray-600">Piece</div>
            <p class="form-hint">Default unit for this item</p>
          </div>
        </div>
        
        <!-- Total Value Preview -->
        {#if formData.price > 0 && formData.stockQuantity > 0}
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Total Stock Value</span>
              <span class="text-xl font-semibold text-gray-900">
                {formatCurrency(formData.price * formData.stockQuantity, $settings.currency)}
              </span>
            </div>
          </div>
        {/if}
        
        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            on:click={closeModal}
            class="btn btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary flex-1"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <svg class="animate-spin w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            {:else}
              {editingItem ? 'Update Item' : 'Create Item'}
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
