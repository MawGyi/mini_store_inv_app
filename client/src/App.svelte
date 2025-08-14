<script lang="ts">
  import Dashboard from './lib/components/Dashboard.svelte';
  import EnhancedPOS from './lib/components/EnhancedPOS.svelte';
  import InventoryView from './lib/components/InventoryView.svelte';
  import EnhancedReports from './lib/components/EnhancedReports.svelte';
  import NotificationContainer from './lib/components/NotificationContainer.svelte';
  import NotificationToast from './lib/components/NotificationToast.svelte';
  import LanguageSwitcher from './lib/components/LanguageSwitcherEnhanced.svelte';
  import UIEnhancements from './lib/components/UIEnhancements.svelte';
  import { onMount } from 'svelte';
  import { apiService } from './lib/services/api';
  import { currentLanguage, translate } from './lib/stores/language';
  
  let currentView = 'dashboard';
  let notifications: any[] = [];
  
  function addNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      duration: 5000
    };
    notifications = [...notifications, notification];
  }

  function removeNotification(id: number) {
    notifications = notifications.filter(n => n.id !== id);
  }

  function handleInventoryUpdate(item: any) {
    addNotification(translate('notification.itemUpdated', $currentLanguage), 'success');
    // Refresh dashboard data
    if (currentView === 'dashboard') {
      // Dashboard will auto-refresh
    }
  }

  function handleSaleComplete(sale: any) {
    addNotification(translate('notification.saleCompleted', $currentLanguage), 'success');
    // Refresh dashboard data
    if (currentView === 'dashboard') {
      // Dashboard will auto-refresh
    }
  }
</script>

<div class="app">
  <!-- UI Enhancements -->
  <UIEnhancements />
  
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <div class="logo">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 7L10 17L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1>Inventory Pro</h1>
      </div>
      
      <div class="header-actions">
        <LanguageSwitcher />
        <button class="btn btn-secondary btn-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {translate('header.notifications', $currentLanguage)}
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main-content">
    <div class="container">
      <!-- Navigation -->
      <nav class="navigation">
        <div class="nav-tabs">
          <button 
            class="nav-tab {currentView === 'dashboard' ? 'active' : ''}"
            on:click={() => currentView = 'dashboard'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
            </svg>
            {translate('nav.dashboard', $currentLanguage)}
          </button>
          <button 
            class="nav-tab {currentView === 'inventory' ? 'active' : ''}"
            on:click={() => currentView = 'inventory'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4Z" fill="currentColor"/>
            </svg>
            {translate('nav.inventory', $currentLanguage)}
          </button>
          <button 
            class="nav-tab {currentView === 'pos' ? 'active' : ''}"
            on:click={() => currentView = 'pos'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V16.5M9 19.5C9.8 19.5 10.5 20.2 10.5 21S9.8 22.5 9 22.5 7.5 21.8 7.5 21 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21S20.8 22.5 20 22.5 18.5 21.8 18.5 21 19.2 19.5 20 19.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {translate('nav.pos', $currentLanguage)}
          </button>
          <button 
            class="nav-tab {currentView === 'reports' ? 'active' : ''}"
            on:click={() => currentView = 'reports'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V21H21M7 14L12 9L16 13L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {translate('nav.reports', $currentLanguage)}
          </button>
        </div>
      </nav>

      <!-- Content Area -->
      <main class="main">
        <div class="container">
          {#if currentView === 'dashboard'}
            <Dashboard />
          {:else if currentView === 'pos'}
            <EnhancedPOS />
          {:else if currentView === 'inventory'}
            <InventoryView />
          {:else if currentView === 'reports'}
            <EnhancedReports />
          {/if}
        </div>
      </main>

      <!-- Notification System -->
      <div class="notification-container">
        {#each notifications as notification (notification.id)}
          <div 
            class="notification {notification.type}"
            role="alert"
            aria-live="polite"
          >
            <div class="notification-content">
              <span class="notification-icon">
                {#if notification.type === 'success'}✅{/if}
                {#if notification.type === 'error'}❌{/if}
                {#if notification.type === 'warning'}⚠️{/if}
                {#if notification.type === 'info'}ℹ️{/if}
              </span>
              <span class="notification-message">{notification.message}</span>
            </div>
            <button 
              class="notification-close"
              on:click={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        {/each}
      </div>
    </div>
  </main>

  <!-- Enhanced Notification Container -->
  <div class="notification-container">
    {#if notifications.length > 0}
      {#each notifications as notification (notification.id)}
        <NotificationToast
          type={notification.type}
          message={notification.message}
          id={notification.id.toString()}
          duration={notification.duration}
          on:close={(e) => removeNotification(Number(e.detail.id))}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  .app {
    min-height: 100vh;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 206, 84, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
    position: relative;
    overflow-x: hidden;
  }

  .app::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 70% 10%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 30% 90%, rgba(168, 85, 247, 0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }

  .dark .app {
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 206, 84, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, var(--gray-900) 0%, var(--gray-800) 100%);
  }

  .header {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dark .header {
    background: rgba(31, 41, 55, 0.85);
    border-bottom-color: rgba(75, 85, 99, 0.3);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--spacing-4) var(--spacing-6);
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s ease;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .logo:hover {
    transform: translateY(-1px);
  }

  .logo-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 
      0 4px 6px rgba(0, 0, 0, 0.1),
      0 1px 3px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .logo-icon::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s ease;
  }

  .logo-icon::after {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
    pointer-events: none;
  }

  .logo:hover .logo-icon::before {
    left: 100%;
  }

  .logo:hover .logo-icon {
    transform: scale(1.08) rotate(5deg);
    box-shadow: 
      0 8px 15px rgba(0, 0, 0, 0.15),
      0 3px 6px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .logo h1 {
    font-size: var(--font-size-2xl);
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary-600), var(--primary-800), var(--purple-600));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    letter-spacing: -0.025em;
    position: relative;
  }

  .logo h1::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-500), var(--purple-500));
    border-radius: 1px;
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  .logo:hover h1::after {
    transform: scaleX(1);
  }

  .dark .logo h1 {
    background: linear-gradient(135deg, var(--primary-400), var(--primary-300), var(--purple-400));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-4);
    align-items: center;
  }

  .btn {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s ease;
  }

  .btn:hover::before {
    left: 100%;
  }

  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .main-content {
    flex: 1;
    padding: var(--spacing-8) 0;
    position: relative;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 var(--spacing-6);
    position: relative;
  }

  .navigation {
    margin-bottom: var(--spacing-8);
    perspective: 1000px;
  }

  .nav-tabs {
    display: flex;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-2);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 6px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-tabs::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
    pointer-events: none;
  }

  .dark .nav-tabs {
    background: rgba(31, 41, 55, 0.9);
    border-color: rgba(75, 85, 99, 0.3);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 2px 6px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .nav-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-4) var(--spacing-6);
    background: transparent;
    border: none;
    border-radius: var(--radius-xl);
    color: var(--gray-600);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: var(--font-size-sm);
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
  }

  .nav-tab::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: inherit;
  }

  .nav-tab::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-500), var(--purple-500));
    border-radius: 1px;
    transform: translateX(-50%);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dark .nav-tab {
    color: var(--gray-300);
  }

  .nav-tab:hover::before {
    opacity: 1;
  }

  .nav-tab:hover {
    color: var(--primary-600);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 
      0 4px 12px rgba(59, 130, 246, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.08);
  }

  .nav-tab:hover::after {
    width: 80%;
  }

  .dark .nav-tab:hover {
    color: var(--primary-400);
    box-shadow: 
      0 4px 12px rgba(59, 130, 246, 0.25),
      0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .nav-tab.active {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600), var(--purple-600));
    color: white;
    box-shadow: 
      0 6px 20px rgba(59, 130, 246, 0.3),
      0 2px 6px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
    transform: translateY(-1px) scale(1.02);
  }

  .nav-tab.active::before {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
    opacity: 1;
  }

  .nav-tab.active::after {
    width: 100%;
    background: rgba(255, 255, 255, 0.3);
  }

  .nav-tab svg {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }

  .nav-tab:hover svg {
    transform: scale(1.1) rotate(5deg);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  }

  .nav-tab.active svg {
    transform: scale(1.05);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .content-area {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: var(--radius-3xl);
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    position: relative;
    transition: all 0.3s ease;
  }

  .content-area::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
    pointer-events: none;
  }

  .dark .content-area {
    background: rgba(31, 41, 55, 0.95);
    border-color: rgba(75, 85, 99, 0.3);
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.25),
      0 10px 10px -5px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .header-content {
      padding: var(--spacing-3) var(--spacing-4);
    }

    .logo h1 {
      font-size: var(--font-size-xl);
    }

    .container {
      padding: 0 var(--spacing-4);
    }

    .nav-tabs {
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .nav-tab {
      justify-content: flex-start;
      padding: var(--spacing-3) var(--spacing-4);
    }

    .notification-container {
      right: var(--spacing-4);
      left: var(--spacing-4);
      max-width: none;
    }
  }

  @media (max-width: 480px) {
    .header-content {
      flex-direction: column;
      gap: var(--spacing-3);
      text-align: center;
    }

    .logo {
      justify-content: center;
    }

    .header-actions {
      justify-content: center;
    }

    .notification-container {
      right: var(--spacing-2);
      left: var(--spacing-2);
    }
  }

  /* Enhanced Notification Container */
  .notification-container {
    position: fixed;
    top: 80px;
    right: var(--spacing-6);
    z-index: 1000;
    max-width: 420px;
    width: 100%;
    pointer-events: none;
  }

  .notification-container :global(.notification-toast) {
    pointer-events: auto;
    margin-bottom: var(--spacing-3);
  }
</style>