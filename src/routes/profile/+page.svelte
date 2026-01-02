<script lang="ts">
  import { addNotification } from '$lib/stores/stores'
  
  let fullName = 'Store Admin'
  let email = 'admin@ministore.com'
  let phone = '+1 234 567 8900'
  let role = 'Administrator'
  let currentPassword = ''
  let newPassword = ''
  let confirmPassword = ''
  
  function saveProfile() {
    addNotification('Profile updated successfully!', 'success')
  }
  
  function changePassword() {
    if (newPassword !== confirmPassword) {
      addNotification('Passwords do not match!', 'error')
      return
    }
    if (newPassword.length < 6) {
      addNotification('Password must be at least 6 characters!', 'error')
      return
    }
    addNotification('Password changed successfully!', 'success')
    currentPassword = ''
    newPassword = ''
    confirmPassword = ''
  }
</script>

<svelte:head>
  <title>Profile - Mini Store Inventory</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="page-header">
    <div>
      <h1 class="page-title">Profile</h1>
      <p class="page-subtitle">Manage your account settings and profile information.</p>
    </div>
  </div>
  
  <!-- Profile Card -->
  <div class="card">
    <div class="flex items-center gap-6 mb-6">
      <div class="w-24 h-24 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center text-3xl font-bold">
        U
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-900">{fullName}</h2>
        <p class="text-gray-500">{role}</p>
        <span class="badge badge-success mt-2">Active</span>
      </div>
    </div>
  </div>
  
  <!-- Personal Information -->
  <div class="card">
    <h2 class="card-header flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      Personal Information
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" bind:value={fullName} class="input" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" bind:value={email} class="input" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input type="tel" bind:value={phone} class="input" />
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <input type="text" bind:value={role} class="input" disabled />
        <p class="form-hint">Contact administrator to change role</p>
      </div>
    </div>
    
    <div class="mt-6">
      <button on:click={saveProfile} class="btn btn-primary">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Save Changes
      </button>
    </div>
  </div>
  
  <!-- Change Password -->
  <div class="card">
    <h2 class="card-header flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Change Password
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-group md:col-span-2">
        <label class="form-label">Current Password</label>
        <input type="password" bind:value={currentPassword} class="input" />
      </div>
      <div class="form-group">
        <label class="form-label">New Password</label>
        <input type="password" bind:value={newPassword} class="input" />
      </div>
      <div class="form-group">
        <label class="form-label">Confirm New Password</label>
        <input type="password" bind:value={confirmPassword} class="input" />
      </div>
    </div>
    
    <div class="mt-6">
      <button on:click={changePassword} class="btn btn-secondary">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Change Password
      </button>
    </div>
  </div>
  
  <!-- Account Stats -->
  <div class="card">
    <h2 class="card-header flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      Account Statistics
    </h2>
    
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-4 bg-gray-50 rounded-xl text-center">
        <p class="text-3xl font-bold text-gray-900">6</p>
        <p class="text-sm text-gray-500">Total Sales</p>
      </div>
      <div class="p-4 bg-gray-50 rounded-xl text-center">
        <p class="text-3xl font-bold text-gray-900">7</p>
        <p class="text-sm text-gray-500">Items Managed</p>
      </div>
      <div class="p-4 bg-gray-50 rounded-xl text-center">
        <p class="text-3xl font-bold text-gray-900">Dec 2025</p>
        <p class="text-sm text-gray-500">Member Since</p>
      </div>
    </div>
  </div>
</div>
