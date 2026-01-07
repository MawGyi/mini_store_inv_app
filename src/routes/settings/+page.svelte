<script lang="ts">
  import { addNotification } from '$lib/stores/stores'
  import { settings, formatCurrency, currencySymbol } from '$lib/stores/settings'
  import { onMount } from 'svelte'
  
  let storeName = $settings.storeName
  let storeAddress = $settings.storeAddress
  let storePhone = $settings.storePhone
  let storeEmail = $settings.storeEmail
  let currency = $settings.currency
  let timezone = $settings.timezone
  let lowStockThreshold = $settings.lowStockThreshold
  let enableNotifications = $settings.enableNotifications
  let enableEmailReports = $settings.enableEmailReports
  let isSaving = false

  let salesStartDate = ''
  let salesEndDate = ''
  let clearConfirmText = ''
  
  let importFile: File | null = null
  let importPreview: any[] = []
  let importErrors: string[] = []
  let showImportModal = false
  let isImporting = false

  onMount(() => {
    settings.load()
    storeName = $settings.storeName
    storeAddress = $settings.storeAddress
    storePhone = $settings.storePhone
    storeEmail = $settings.storeEmail
    currency = $settings.currency
    timezone = $settings.timezone
    lowStockThreshold = $settings.lowStockThreshold
    enableNotifications = $settings.enableNotifications
    enableEmailReports = $settings.enableEmailReports
    
    const today = new Date()
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    salesStartDate = lastMonth.toISOString().split('T')[0]
    salesEndDate = today.toISOString().split('T')[0]
  })
  
  async function saveSettings() {
    isSaving = true
    
    const changes: string[] = []
    if (storeName !== $settings.storeName) changes.push('store name')
    if (storeAddress !== $settings.storeAddress) changes.push('address')
    if (storePhone !== $settings.storePhone) changes.push('phone')
    if (storeEmail !== $settings.storeEmail) changes.push('email')
    if (currency !== $settings.currency) changes.push('currency')
    if (timezone !== $settings.timezone) changes.push('timezone')
    if (lowStockThreshold !== $settings.lowStockThreshold) changes.push('threshold')
    if (enableNotifications !== $settings.enableNotifications) changes.push('notifications')
    if (enableEmailReports !== $settings.enableEmailReports) changes.push('email reports')
    
    settings.set({
      storeName,
      storeAddress,
      storePhone,
      storeEmail,
      currency,
      timezone,
      lowStockThreshold,
      enableNotifications,
      enableEmailReports
    })
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (changes.length === 0) {
      addNotification('No changes detected', 'info')
    } else if (changes.length === 1) {
      addNotification(`${capitalize(changes[0])} updated`, 'success')
    } else if (changes.length <= 3) {
      addNotification(`${changes.map(capitalize).join(', ')} updated`, 'success')
    } else {
      addNotification('Settings updated', 'success')
    }
    isSaving = false
  }

  function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  
  function testNotification() {
    addNotification('Test notification', 'success')
  }

  function exportItems() {
    window.open('/api/export/items', '_blank')
    addNotification('Items exported', 'success')
  }

  function exportSales() {
    if (!salesStartDate || !salesEndDate) {
      addNotification('Please select date range', 'error')
      return
    }
    const params = new URLSearchParams({
      startDate: salesStartDate,
      endDate: salesEndDate
    })
    window.open(`/api/export/sales?${params}`, '_blank')
    addNotification('Sales exported', 'success')
  }

  function exportBackup() {
    window.open('/api/export/backup', '_blank')
    addNotification('Backup downloaded', 'success')
  }

  function handleImportFile(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      importFile = file
      parseCSV(file)
    }
  }

  function parseCSV(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        addNotification('CSV file is empty or invalid', 'error')
        return
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
      importPreview = []
      importErrors = []
      
      for (let i = 1; i < Math.min(lines.length, 11); i++) {
        const values = parseCSVLine(lines[i])
        const row: any = {}
        headers.forEach((h, idx) => {
          row[h] = values[idx]?.trim().replace(/^['"]|['"]$/g, '') || ''
        })
        row._rowNum = i
        importPreview.push(row)
      }
      
      validatePreview()
      showImportModal = true
    }
    reader.readAsText(file)
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  function validatePreview() {
    importErrors = []
    
    for (let i = 0; i < importPreview.length; i++) {
      const row = importPreview[i]
      const errors: string[] = []
      
      if (!row.name) errors.push('Name required')
      if (!row.itemcode) errors.push('Item code required')
      if (!row.price || isNaN(parseFloat(row.price)) || parseFloat(row.price) <= 0) errors.push('Invalid price')
      if (!row.stockquantity || isNaN(parseInt(row.stockquantity))) errors.push('Invalid stock quantity')
      
      if (errors.length > 0) {
        importErrors.push(`Row ${row._rowNum}: ${errors.join(', ')}`)
      }
    }
  }

  async function confirmImport() {
    if (!importFile) return
    
    isImporting = true
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      
      const res = await fetch('/api/import/items', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (data.error) {
        addNotification(data.error, 'error')
      } else {
        addNotification(`Imported ${data.imported} items successfully${data.skipped > 0 ? ` (${data.skipped} skipped)` : ''}`, 'success')
        showImportModal = false
        importFile = null
        importPreview = []
      }
    } catch (error) {
      addNotification('Failed to import items', 'error')
    }
    isImporting = false
  }

  async function clearAllData() {
    if (clearConfirmText !== 'DELETE') {
      addNotification('Type DELETE to confirm', 'error')
      return
    }
    
    try {
      const res = await fetch('/api/import/clear-all', { method: 'POST' })
      const data = await res.json()
      
      if (data.error) {
        addNotification(data.error, 'error')
      } else {
        addNotification('All data cleared successfully', 'success')
        showImportModal = false
        clearConfirmText = ''
      }
    } catch (error) {
      addNotification('Failed to clear data', 'error')
    }
  }
  
  $: previewAmount = formatCurrency(1234.56, currency)
</script>

<svelte:head>
  <title>Settings - Mini Store Inventory</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="page-header">
    <div>
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Manage your store preferences and configuration.</p>
    </div>
  </div>
  
  <!-- Store Information -->
  <div class="card">
    <h2 class="card-header flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      Store Information
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-group">
        <label class="form-label">Store Name</label>
        <input type="text" bind:value={storeName} class="input" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input type="tel" bind:value={storePhone} class="input" />
      </div>
      <div class="form-group md:col-span-2">
        <label class="form-label">Address</label>
        <input type="text" bind:value={storeAddress} class="input" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" bind:value={storeEmail} class="input" />
      </div>
    </div>
  </div>
  
  <!-- General Settings -->
  <div class="card">
    <h2 class="card-header flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      General Settings
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-group">
        <label class="form-label">Currency</label>
        <select bind:value={currency} class="input">
          <option value="USD">USD - US Dollar ($)</option>
          <option value="EUR">EUR - Euro (€)</option>
          <option value="GBP">GBP - British Pound (£)</option>
          <option value="CAD">CAD - Canadian Dollar (C$)</option>
          <option value="AUD">AUD - Australian Dollar (A$)</option>
          <option value="THB">THB - Thai Baht (฿)</option>
          <option value="JPY">JPY - Japanese Yen (¥)</option>
          <option value="CNY">CNY - Chinese Yuan (¥)</option>
          <option value="MMK">MMK - Myanmar Kyat (MMK)</option>
        </select>
        <p class="form-hint">Select your local currency for prices</p>
      </div>
      <div class="form-group">
        <label class="form-label">Preview</label>
        <div class="p-3 bg-gray-50 rounded-lg">
          <span class="text-2xl font-bold text-gray-900">{previewAmount}</span>
          <p class="text-sm text-gray-500 mt-1">Sample price display</p>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Timezone</label>
        <select bind:value={timezone} class="input">
          <option value="Asia/Bangkok">Thailand (ICT) - UTC+7</option>
          <option value="Asia/Singapore">Singapore (SGT) - UTC+8</option>
          <option value="Asia/Tokyo">Japan (JST) - UTC+9</option>
          <option value="Asia/Shanghai">China (CST) - UTC+8</option>
          <option value="America/New_York">Eastern Time - UTC-5</option>
          <option value="America/Chicago">Central Time - UTC-6</option>
          <option value="America/Denver">Mountain Time - UTC-7</option>
          <option value="America/Los_Angeles">Pacific Time - UTC-8</option>
          <option value="Europe/London">London (GMT) - UTC+0</option>
          <option value="Europe/Paris">Paris (CET) - UTC+1</option>
          <option value="Australia/Sydney">Sydney (AEST) - UTC+10</option>
        </select>
        <p class="form-hint">Set your local timezone for sales dates</p>
      </div>
      <div class="form-group">
        <label class="form-label">Low Stock Threshold</label>
        <input type="number" min="1" bind:value={lowStockThreshold} class="input" />
        <p class="form-hint">Alert when stock falls below this number</p>
      </div>
    </div>
  </div>
  
  <!-- Notification Settings -->
  <div class="card">
    <h2 class="card-header flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      Notifications
    </h2>
    
    <div class="space-y-4">
      <label class="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900">Enable Notifications</p>
            <p class="text-sm text-gray-500">Get alerts for low stock and sales</p>
          </div>
        </div>
        <input type="checkbox" bind:checked={enableNotifications} class="w-5 h-5 text-primary-600 rounded" />
      </label>
      
      <label class="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900">Email Reports</p>
            <p class="text-sm text-gray-500">Receive daily sales summary via email</p>
          </div>
        </div>
        <input type="checkbox" bind:checked={enableEmailReports} class="w-5 h-5 text-primary-600 rounded" />
      </label>
      
      <button on:click={testNotification} class="btn btn-secondary">
        Test Notification
      </button>
    </div>
  </div>

  <!-- Data Management -->
  <div class="card">
    <h2 class="card-header flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      Data Management
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Full Backup Card -->
      <div class="data-card">
        <div class="data-card-icon success">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <h3 class="font-semibold text-gray-900">Full Backup</h3>
        <p class="text-sm text-gray-500 mt-1">Export all inventory, sales, and categories as JSON</p>
        <button on:click={exportBackup} class="btn btn-primary w-full mt-4">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Backup
        </button>
      </div>
      
      <!-- Export Items Card -->
      <div class="data-card">
        <div class="data-card-icon primary">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="font-semibold text-gray-900">Export Items</h3>
        <p class="text-sm text-gray-500 mt-1">Download all items as CSV spreadsheet</p>
        <button on:click={exportItems} class="btn btn-secondary w-full mt-4">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV
        </button>
      </div>
      
        <!-- Export Sales Card -->
        <div class="data-card">
          <div class="data-card-icon info">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">Export Sales</h3>
          <p class="text-sm text-gray-500 mt-1">Download sales by date range</p>
          <div class="date-range-container mt-3">
            <div class="date-inputs">
              <input type="date" bind:value={salesStartDate} class="input input-sm" aria-label="Start date" />
              <span class="date-separator">to</span>
              <input type="date" bind:value={salesEndDate} class="input input-sm" aria-label="End date" />
            </div>
            <button on:click={exportSales} class="btn btn-secondary btn-sm w-full mt-2" disabled={!salesStartDate || !salesEndDate}>
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>
    </div>
    
    <!-- Import Section -->
    <div class="mt-6 pt-6 border-t border-gray-100">
      <h3 class="text-sm font-medium text-gray-900 mb-4">Import Items</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="import-section">
          <p class="text-sm text-gray-500 mb-3">Upload a CSV file with columns: name, itemcode, price, stockquantity, category, lowstockthreshold</p>
          <div class="flex flex-wrap gap-3">
            <label class="btn btn-secondary cursor-pointer">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Choose CSV File
              <input type="file" accept=".csv" on:change={handleImportFile} class="hidden" />
            </label>
            
            <a href="/api/export/items" download="items_template.csv" class="btn btn-secondary">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Template
            </a>
          </div>
          {#if importFile}
            <p class="text-sm text-green-600 mt-2 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {importFile.name} selected
            </p>
          {/if}
        </div>
        
        <div class="bg-blue-50 rounded-xl p-4">
          <h4 class="font-medium text-blue-900 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Import Tips
          </h4>
          <ul class="text-sm text-blue-700 mt-2 space-y-1">
            <li>• First row must be column headers</li>
            <li>• Use UTF-8 encoded CSV files</li>
            <li>• Item codes must be unique</li>
            <li>• Preview shows errors before import</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Danger Zone -->
    <div class="mt-6 pt-6 border-t border-red-200">
      <div class="danger-zone">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-red-600">Danger Zone</h3>
            <p class="text-sm text-gray-500 mt-1">Permanently delete all data including items, sales, and categories. This action cannot be undone.</p>
          </div>
          <button on:click={() => showImportModal = true} class="btn btn-danger shrink-0">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Save Button -->
  <div class="flex justify-end">
    <button on:click={saveSettings} class="btn btn-primary" disabled={isSaving}>
      {#if isSaving}
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Saving...
      {:else}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Save Settings
      {/if}
    </button>
  </div>
</div>

<!-- Import Preview Modal -->
{#if showImportModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold">Import Items Preview</h3>
        <button on:click={() => { showImportModal = false; importFile = null; importPreview = []; }} class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="p-4 overflow-y-auto max-h-[60vh]">
        {#if importErrors.length > 0}
          <div class="mb-4 p-3 bg-red-50 rounded-lg">
            <p class="text-sm font-medium text-red-700 mb-2">Validation Errors:</p>
            <ul class="text-sm text-red-600 space-y-1">
              {#each importErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Row</th>
              <th class="px-3 py-2 text-left">Name</th>
              <th class="px-3 py-2 text-left">Item Code</th>
              <th class="px-3 py-2 text-right">Price</th>
              <th class="px-3 py-2 text-right">Stock</th>
              <th class="px-3 py-2 text-left">Category</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            {#each importPreview as row}
              {@const hasError = !row.name || !row.itemcode || !row.price || !row.stockquantity}
              <tr class="{hasError ? 'bg-red-50' : ''}">
                <td class="px-3 py-2 text-gray-500">{row._rowNum}</td>
                <td class="px-3 py-2 {hasError && !row.name ? 'text-red-600 font-medium' : ''}">{row.name || '—'}</td>
                <td class="px-3 py-2 {hasError && !row.itemcode ? 'text-red-600 font-medium' : ''}">{row.itemcode || '—'}</td>
                <td class="px-3 py-2 text-right {hasError && (!row.price || isNaN(parseFloat(row.price))) ? 'text-red-600 font-medium' : ''}">{row.price || '—'}</td>
                <td class="px-3 py-2 text-right {hasError && (!row.stockquantity || isNaN(parseInt(row.stockquantity))) ? 'text-red-600 font-medium' : ''}">{row.stockquantity || '—'}</td>
                <td class="px-3 py-2">{row.category || '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        
        {#if importPreview.length === 0}
          <p class="text-center text-gray-500 py-8">No data to preview</p>
        {/if}
      </div>
      
      <div class="flex justify-end gap-3 p-4 border-t bg-gray-50">
        <button on:click={() => { showImportModal = false; importFile = null; importPreview = []; }} class="btn btn-secondary">
          Cancel
        </button>
        <button on:click={confirmImport} class="btn btn-primary" disabled={isImporting}>
          {isImporting ? 'Importing...' : 'Skip Errors & Import'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Clear Data Modal -->
{#if showImportModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl max-w-md w-full">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Clear All Data</h3>
            <p class="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        
        <p class="text-sm text-gray-600 mb-4">
          This will permanently delete all items, sales, categories, and settings. Your account will remain but all data will be lost.
        </p>
        
        <label class="block mb-2 text-sm font-medium text-gray-700">
          Type <code class="px-1 bg-gray-100 rounded">DELETE</code> to confirm
        </label>
        <input 
          type="text" 
          bind:value={clearConfirmText}
          class="input mb-4" 
          placeholder="DELETE"
        />
        
        <div class="flex justify-end gap-3">
          <button on:click={() => { showImportModal = false; clearConfirmText = ''; }} class="btn btn-secondary">
            Cancel
          </button>
          <button on:click={clearAllData} class="btn btn-danger" disabled={clearConfirmText !== 'DELETE'}>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .data-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .data-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-color: #d1d5db;
  }

  .data-card-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.75rem;
  }

  .data-card-icon.success {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    color: #16a34a;
  }

  .data-card-icon.primary {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #2563eb;
  }

  .data-card-icon.info {
    background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
    color: #9333ea;
  }

  .import-section {
    background: #f9fafb;
    border-radius: 0.75rem;
    padding: 1rem;
  }

  .danger-zone {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    border: 1px solid #fecaca;
    border-radius: 0.75rem;
    padding: 1.25rem;
  }

  .date-range-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .date-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .date-inputs .input-sm {
    flex: 1;
    min-width: 0;
    font-size: 0.75rem;
    padding: 0.5rem 0.625rem;
  }

  .date-separator {
    color: #9ca3af;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .input-sm {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }

  .btn-sm {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }

  @media (max-width: 640px) {
    .data-card {
      padding: 1rem;
    }

    .danger-zone .flex {
      flex-direction: column;
      text-align: center;
    }

    .danger-zone .btn {
      width: 100%;
      justify-content: center;
    }

    .date-inputs {
      flex-direction: column;
    }

    .date-separator {
      display: none;
    }

    .date-inputs .input-sm {
      width: 100%;
    }
  }
</style>

