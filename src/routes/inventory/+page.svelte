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
  let showBackupModal = false
  let editingItem: Item | null = null
  let highlightItemId: number | null = null
  let isBackingUp = false
  let isRestoring = false
  
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
  
  $: totalValue = items.reduce((sum, item) => sum + (item.price * item.stockQuantity), 0)
  $: lowStockCount = items.filter(item => item.stockQuantity > 0 && item.stockQuantity <= item.lowStockThreshold).length
  $: outOfStockCount = items.filter(item => item.stockQuantity === 0).length
  
  onMount(async () => {
    settings.load()
    
    const highlight = $page.url.searchParams.get('highlight')
    const search = $page.url.searchParams.get('search')
    const filter = $page.url.searchParams.get('filter')
    
    if (highlight) {
      highlightItemId = parseInt(highlight) || null
    }
    
    if (search) {
      searchQuery = search
    }
    
    if (filter === 'expired') {
      categoryFilter = 'expired'
    } else if (filter === 'expiring') {
      categoryFilter = 'expiring'
    }
    
    await loadItems()
  })
  
  $: {
    if (highlightItemId && items.length > 0) {
      scrollToHighlight()
    }
  }
  
  function scrollToHighlight() {
    if (!highlightItemId) return
    
    setTimeout(() => {
      const element = document.getElementById(`item-${highlightItemId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.classList.add('bg-yellow-100', 'ring-2', 'ring-yellow-400')
        setTimeout(() => {
          element.classList.remove('bg-yellow-100', 'ring-2', 'ring-yellow-400')
        }, 5000)
      }
    }, 100)
  }
  
  async function loadItems() {
    try {
      let url = '/api/items'
      
      if (searchQuery) {
        url += `?search=${encodeURIComponent(searchQuery)}&limit=100`
      }
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        items = data.data
        filterItems()
      }
    } catch (error) {
      console.error('Error loading items:', error)
      addNotification('Failed to load items', 'error')
    } finally {
      loading = false
    }
  }
  
  async function backupToJson() {
    isBackingUp = true
    try {
      const backupData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        items: items,
        summary: {
          totalItems: items.length,
          totalValue: totalValue,
          categories: [...new Set(items.map(i => i.category).filter(Boolean))].length,
          lowStockCount,
          outOfStockCount
        }
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `inventory-backup-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      addNotification('Inventory backup downloaded successfully!', 'success')
      showBackupModal = false
    } catch (error) {
      console.error('Error creating backup:', error)
      addNotification('Failed to create backup', 'error')
    } finally {
      isBackingUp = false
    }
  }
  
  async function restoreFromJson(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    
    isRestoring = true
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!data.items || !Array.isArray(data.items)) {
        addNotification('Invalid backup file format', 'error')
        return
      }
      
      let imported = 0
      let updated = 0
      
      for (const item of data.items) {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            itemCode: item.itemCode,
            price: item.price,
            stockQuantity: item.stockQuantity,
            lowStockThreshold: item.lowStockThreshold || 10,
            category: item.category
          })
        })
        
        const result = await res.json()
        if (result.success) {
          imported++
        } else if (result.error === 'Item code already exists') {
          const updateRes = await fetch(`/api/items/${item.id || item.itemCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              price: item.price,
              stockQuantity: item.stockQuantity,
              lowStockThreshold: item.lowStockThreshold || 10,
              category: item.category
            })
          })
          if (updateRes.ok) updated++
        }
      }
      
      await loadItems()
      addNotification(`Imported ${imported} items, updated ${updated} items`, 'success')
      showBackupModal = false
    } catch (error) {
      console.error('Error restoring backup:', error)
      addNotification('Failed to restore backup', 'error')
    } finally {
      isRestoring = false
      input.value = ''
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
  
  function clearFilters() {
    searchQuery = ''
    categoryFilter = ''
    sortBy = 'name'
    sortOrder = 'asc'
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
    <div class="header-actions">
      <button on:click={() => showBackupModal = true} class="btn btn-secondary">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        <span class="hidden sm:inline">Backup</span>
      </button>
      <button on:click={() => openModal()} class="btn btn-primary">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="hidden sm:inline">Add Item</span>
      </button>
    </div>
  </div>
  
  <!-- Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon primary">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{items.length}</span>
        <span class="stat-label">Total Items</span>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon success">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{formatCurrency(totalValue, $settings.currency)}</span>
        <span class="stat-label">Total Value</span>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon warning">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{lowStockCount}</span>
        <span class="stat-label">Low Stock</span>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon danger">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{outOfStockCount}</span>
        <span class="stat-label">Out of Stock</span>
      </div>
    </div>
  </div>
  
  <!-- Search and Filters -->
  <div class="card">
    <div class="flex flex-col sm:flex-row gap-4 flex-wrap">
      <div class="flex-1 min-w-[200px] relative">
        <svg class="search-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          placeholder="Search by name or code..." 
          bind:value={searchQuery}
          class="input pl-10 pr-10"
        />
        {#if searchQuery}
          <button 
            on:click={() => searchQuery = ''}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
      <div class="w-full sm:w-48">
        <select bind:value={categoryFilter} class="input">
          <option value="">All Categories</option>
          {#each categories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>
      {#if searchQuery || categoryFilter}
        <button 
          on:click={clearFilters}
          class="btn btn-secondary shrink-0"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      {/if}
      <div class="text-sm text-gray-500 shrink-0 ml-auto flex items-center">
        <span class="font-semibold text-gray-900">{filteredItems.length}</span>
        <span class="mx-1">of</span>
        <span class="font-semibold text-gray-900">{items.length}</span>
        <span class="ml-1">items</span>
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
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="item-modal-title" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()}>
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
            <div class="currency-input-wrapper">
              <span class="currency-input-prefix">{currencySymbol($settings.currency)}</span>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0"
                bind:value={formData.price}
                class="input {currencySymbol($settings.currency).length > 1 ? 'currency-input-long' : 'currency-input-short'} {formErrors.price ? 'border-red-500' : ''}"
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

<!-- Backup/Restore Modal -->
{#if showBackupModal}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="backup-modal-title" on:click={() => showBackupModal = false} on:keydown={(e) => e.key === 'Escape' && (showBackupModal = false)}>
    <div class="modal max-w-md w-full" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="text-xl font-semibold text-gray-900">
          <svg class="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Backup & Restore
        </h2>
        <button on:click={() => showBackupModal = false} class="btn-icon" aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="p-6 space-y-6">
        <!-- Backup Section -->
        <div class="backup-section">
          <div class="backup-icon success">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">Export Inventory</h3>
          <p class="text-sm text-gray-600">Download all inventory data as a JSON file for backup or transfer.</p>
          <button 
            on:click={backupToJson}
            class="btn btn-primary w-full"
            disabled={isBackingUp || items.length === 0}
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
          {#if items.length > 0}
            <p class="text-xs text-gray-500 text-center mt-2">
              {items.length} items • {formatCurrency(totalValue, $settings.currency)} total value
            </p>
          {/if}
        </div>
        
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>
        
        <!-- Restore Section -->
        <div class="backup-section">
          <div class="backup-icon warning">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">Import Inventory</h3>
          <p class="text-sm text-gray-600">Restore inventory from a previously exported JSON file.</p>
          <label class="btn btn-secondary w-full cursor-pointer">
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {#if isRestoring}
              <svg class="animate-spin w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Restoring...
            {:else}
              Choose File
            {/if}
            <input 
              type="file" 
              accept=".json" 
              class="hidden" 
              on:change={restoreFromJson}
              disabled={isRestoring}
            />
          </label>
          <p class="text-xs text-gray-500 text-center mt-2">
            Supports JSON files exported from this system
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .header-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
    transition: all 0.2s ease;
  }
  
  .stat-card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .stat-icon.primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }
  
  .stat-icon.success {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
  }
  
  .stat-icon.warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
  }
  
  .stat-icon.danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
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
    white-space: nowrap;
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
  }
  
  .backup-icon.success {
    background: #dcfce7;
    color: #16a34a;
  }
  
  .backup-icon.warning {
    background: #fef3c7;
    color: #d97706;
  }
  
  @media (max-width: 640px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .header-actions {
      width: 100%;
    }
    
    .header-actions .btn {
      flex: 1;
      justify-content: center;
      min-width: 120px;
    }
    
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    
    .stat-card {
      padding: 1rem;
      gap: 0.75rem;
    }
    
    .stat-value {
      font-size: 1.1rem;
    }
    
    .stat-icon {
      width: 2.5rem;
      height: 2.5rem;
    }
    
    .stat-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
</style>
