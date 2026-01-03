<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'
  import { notifications, removeNotification } from '$lib/stores/stores'
  import { auth, currentUser, isAuthenticated, isLoading } from '$lib/stores/auth'
  import { settings } from '$lib/stores/settings'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { browser } from '$app/environment'
  
  let isMobileMenuOpen = false
  let isSidebarCollapsed = false
  let isProfileOpen = false
  let isNotificationsOpen = false
  let authChecked = false
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/inventory', label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { href: '/sales', label: 'Sales', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { href: '/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ]
  
  $: user = $currentUser
  $: isAuth = $isAuthenticated
  $: loading = $isLoading
  
  $: if (browser && authChecked && !loading) {
    const publicPaths = ['/login', '/register', '/forgot-password']
    const isPublic = publicPaths.some(p => $page.url.pathname.startsWith(p))
    
    if (!isAuth && !isPublic && $page.url.pathname !== '/') {
      goto('/login')
    } else if (isAuth && $page.url.pathname === '/login') {
      goto('/dashboard')
    }
  }
  
  function getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U'
  }
  
  function isActive(href: string) {
    return $page.url.pathname.startsWith(href)
  }
  
  function toggleNotifications() {
    isNotificationsOpen = !isNotificationsOpen
    isProfileOpen = false
  }
  
  function toggleProfile() {
    isProfileOpen = !isProfileOpen
    isNotificationsOpen = false
  }
  
  async function handleLogout() {
    await auth.logout()
  }
  
  onMount(() => {
    if (browser) {
      auth.initialize().then(() => {
        authChecked = true
      })
    }
    
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-dropdown')) {
        isProfileOpen = false
      }
      if (!target.closest('.notifications-dropdown')) {
        isNotificationsOpen = false
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  })
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

{#if loading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
{:else if !isAuth}
  <slot />
{:else}
  <div class="min-h-screen bg-gray-50">
    <aside class="fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 {isSidebarCollapsed ? 'w-20' : 'w-64'}">
      <div class="flex items-center gap-3 h-16 px-4 border-b border-gray-100">
        <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        {#if !isSidebarCollapsed}
          <span class="text-lg font-bold text-gray-900">{$settings.storeName}</span>
        {/if}
      </div>
      
      <nav class="p-4 space-y-1">
        {#each navItems as item}
          <a 
            href={item.href}
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all {isActive(item.href) 
              ? 'bg-primary-50 text-primary-700 font-medium' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
            title={isSidebarCollapsed ? item.label : ''}
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
            </svg>
            {#if !isSidebarCollapsed}
              <span>{item.label}</span>
            {/if}
          </a>
        {/each}
      </nav>
      
      <button 
        on:click={() => isSidebarCollapsed = !isSidebarCollapsed}
        class="absolute bottom-4 right-0 translate-x-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-sm"
      >
        <svg class="w-4 h-4 transition-transform {isSidebarCollapsed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
    
    <main class="transition-all duration-300 {isSidebarCollapsed ? 'ml-20' : 'ml-64'}">
      <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div class="flex items-center justify-between h-16 px-6">
          <div class="flex items-center gap-4">
            <button 
              on:click={() => isMobileMenuOpen = !isMobileMenuOpen}
              class="lg:hidden btn-icon"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          <div class="flex items-center gap-3">
            <div class="notifications-dropdown relative">
              <button 
                on:click={toggleNotifications}
                class="btn-icon relative"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {#if $notifications.length > 0}
                  <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {$notifications.length}
                  </span>
                {/if}
              </button>
              
              {#if isNotificationsOpen}
                <div class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                  <div class="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">Notifications</h3>
                    {#if $notifications.length > 0}
                      <button on:click={() => notifications.set([])} class="text-xs text-primary-600 hover:text-primary-700">
                        Clear all
                      </button>
                    {/if}
                  </div>
                  
                  {#if $notifications.length > 0}
                    <div class="max-h-96 overflow-y-auto">
                      {#each $notifications as notification}
                        <div class="flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 {notification.type === 'error' ? 'bg-red-50' : notification.type === 'success' ? 'bg-green-50' : ''}">
                          <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center {notification.type === 'error' ? 'bg-red-100 text-red-600' : notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}">
                            {#if notification.type === 'success'}
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                              </svg>
                            {:else if notification.type === 'error'}
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            {:else}
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            {/if}
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900">{notification.message}</p>
                          </div>
                          <button 
                            on:click={() => removeNotification(notification.id)}
                            class="text-gray-400 hover:text-gray-600"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="p-8 text-center">
                      <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p class="text-gray-500">No notifications</p>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
            
            <div class="profile-dropdown relative">
              <button 
                on:click={toggleProfile}
                class="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100"
              >
                <div class="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                  {user?.name ? getInitials(user.name) : 'U'}
                </div>
                <div class="hidden md:block text-left">
                  <p class="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p class="text-xs text-gray-500">{user?.role || 'Guest'}</p>
                </div>
                <svg class="w-4 h-4 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {#if isProfileOpen}
                <div class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                  <div class="p-4 border-b border-gray-100">
                    <p class="font-medium text-gray-900">{user?.name || 'User'}</p>
                    <p class="text-sm text-gray-500">{user?.email || ''}</p>
                  </div>
                  <div class="p-2">
                    <a href="/settings" class="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </a>
                    <a href="/profile" class="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </a>
                    <button 
                      on:click={handleLogout}
                      class="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </header>
      
      <div class="p-6">
        <slot />
      </div>
    </main>
    
    {#if isMobileMenuOpen}
      <div class="fixed inset-0 z-50 lg:hidden">
        <div class="fixed inset-0 bg-black/50" on:click={() => isMobileMenuOpen = false}></div>
        <div class="fixed left-0 top-0 h-full w-64 bg-white shadow-xl">
          <div class="flex items-center justify-between h-16 px-4 border-b border-gray-100">
            <span class="text-lg font-bold text-gray-900">{$settings.storeName}</span>
            <button on:click={() => isMobileMenuOpen = false} class="btn-icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav class="p-4 space-y-1">
            {#each navItems as item}
              <a 
                href={item.href}
                on:click={() => isMobileMenuOpen = false}
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg {isActive(item.href) 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'}"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </a>
            {/each}
          </nav>
        </div>
      </div>
    {/if}
  </div>
{/if}

<svelte:window on:keydown={(e) => {
  if (e.key === 'Escape') {
    isProfileOpen = false
    isNotificationsOpen = false
    isMobileMenuOpen = false
  }
}} />
