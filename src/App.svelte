<script lang="ts">
  import Dashboard from './lib/components/Dashboard.svelte';
  import InventoryList from './lib/components/InventoryList.svelte';
  import NotificationContainer from './lib/components/NotificationContainer.svelte';
  import { items, addNotification } from './lib/stores/stores';
  
  let currentView = 'dashboard';
  
  // Fetch items on mount
  import { onMount } from 'svelte';
  
  onMount(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/items`);
      if (response.ok) {
        const fetchedItems = await response.json();
        items.set(fetchedItems);
      }
    } catch (error) {
      addNotification('Failed to fetch items', 'error');
    }
  });
  
  function handleInventoryEvent(event: CustomEvent) {
    const { type, item } = event.detail;
    
    switch (type) {
      case 'edit':
        addNotification(`Edit item: ${item.name}`, 'success');
        break;
      case 'delete':
        addNotification(`Delete item: ${item.name}`, 'success');
        break;
      case 'sale':
        addNotification(`Record sale for: ${item.name}`, 'success');
        break;
    }
  }
</script>

<div class="app">
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
        <button class="btn btn-secondary btn-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Notifications
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
            Dashboard
          </button>
          <button 
            class="nav-tab {currentView === 'inventory' ? 'active' : ''}"
            on:click={() => currentView = 'inventory'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4Z" fill="currentColor"/>
            </svg>
            Inventory
          </button>
        </div>
      </nav>

      <!-- Content Area -->
      <div class="content-area fade-in">
        {#if currentView === 'dashboard'}
          <Dashboard />
        {:else if currentView === 'inventory'}
          <InventoryList on:edit on:delete on:sale={handleInventoryEvent} />
        {/if}
      </div>
    </div>
  </main>
  
  <!-- Notification System -->
  <NotificationContainer />
</div>

<style>
  .app {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
  }

  .header {
    background: white;
    border-bottom: 1px solid var(--gray-200);
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--spacing-4) var(--spacing-6);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: var(--shadow-md);
    transition: all var(--transition-normal);
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
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left var(--transition-slow);
  }

  .logo:hover .logo-icon::before {
    left: 100%;
  }

  .logo:hover .logo-icon {
    transform: scale(1.05);
    box-shadow: var(--shadow-lg);
  }

  .logo h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-3);
  }

  .main-content {
    flex: 1;
    padding: var(--spacing-8) 0;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 var(--spacing-6);
  }

  .navigation {
    margin-bottom: var(--spacing-8);
  }

  .nav-tabs {
    display: flex;
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-2);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--gray-200);
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
    border-radius: var(--radius-lg);
    color: var(--gray-600);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal);
    font-size: var(--font-size-sm);
  }

  .nav-tab:hover {
    color: var(--primary-600);
    background: var(--primary-50);
  }

  .nav-tab.active {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
    box-shadow: var(--shadow-md);
    position: relative;
    overflow: hidden;
  }

  .nav-tab.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
  }

  .nav-tab svg {
    transition: transform var(--transition-normal);
  }

  .nav-tab:hover svg {
    transform: scale(1.1);
  }

  .content-area {
    background: white;
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--gray-200);
    overflow: hidden;
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
  }
</style>