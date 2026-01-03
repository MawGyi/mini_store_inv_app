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
