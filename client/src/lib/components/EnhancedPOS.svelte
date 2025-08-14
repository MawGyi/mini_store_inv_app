<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { apiService } from '../services/api';
  import SkeletonLoader from './SkeletonLoader.svelte';
  import NotificationToast from './NotificationToast.svelte';
  import { t, formatCurrency, formatDate } from '../stores/translationHelpers';

  // Enhanced TypeScript interfaces with strict typing
  interface Category {
    _id: string;
    category_name_my: string;
    category_name_en?: string;
  }

  interface Item {
    _id: string;
    name: string;
    item_code: string;
    selling_price: number;
    stock_quantity: number;
    category_id: Category | null;
    description?: string;
    created_at?: string;
    updated_at?: string;
  }

  interface CartItem extends Item {
    quantity: number;
    subtotal: number;
  }

  interface NotificationData {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    id: string;
    timestamp: number;
  }

  interface SaleData {
    customer_name: string;
    customer_phone: string;
    items: Array<{
      item_id: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    amount_paid: number;
    change: number;
    payment_method: 'cash' | 'card' | 'mobile';
    sale_date: string;
  }

  // State variables with explicit typing
  let items: Item[] = [];
  let cart: CartItem[] = [];
  let searchQuery: string = '';
  let filteredItems: Item[] = [];
  let loading: boolean = false;
  let processing: boolean = false;
  let customerName: string = '';
  let customerPhone: string = '';
  let paymentMethod: 'cash' | 'card' | 'mobile' = 'cash';
  let amountPaid: number = 0;
  let discount: number = 0;
  let notification: NotificationData | null = null;

  // Animation states with error tracking
  let itemsVisible: boolean = false;
  let cartVisible: boolean = false;
  let errorCount: number = 0;
  let debugMode: boolean = false;
  let isDarkMode: boolean = false;

  // Performance tracking
  let loadStartTime: number = 0;
  let lastApiCallTime: number = 0;

  // Myanmar Unicode support state
  let myanmarInputSupported: boolean = false;
  let fontLoadingComplete: boolean = false;

  // Component lifecycle debugging
  console.log('🚀 EnhancedPOS Component: Initializing at', new Date().toISOString());

  onMount(async () => {
    console.log('🔄 EnhancedPOS Component: onMount started');
    loadStartTime = performance.now();
    
    // Check Myanmar Unicode support
    checkMyanmarSupport();
    
    // Load items with error handling
    await loadItems();
    
    // Animate in components with staggered timing
    setTimeout(() => {
      itemsVisible = true;
      console.log('✨ Items section made visible');
    }, 200);
    
    setTimeout(() => {
      cartVisible = true;
      console.log('✨ Cart section made visible');
    }, 400);

    const loadEndTime = performance.now();
    console.log(`⚡ EnhancedPOS Component: Mount completed in ${(loadEndTime - loadStartTime).toFixed(2)}ms`);
  });

  onDestroy(() => {
    console.log('🔄 EnhancedPOS Component: Destroying and cleaning up');
    // Clean up any subscriptions or timers here if needed
  });

  // Myanmar Unicode support detection
  function checkMyanmarSupport(): void {
    try {
      console.log('🔍 Checking Myanmar Unicode support...');
      
      // Check if Myanmar fonts are available
      const testElement = document.createElement('span');
      testElement.style.fontFamily = 'Myanmar Text, Pyidaungsu, Padauk, serif';
      testElement.textContent = 'မြန်မာ';
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);
      
      // Simple check for font rendering
      const rect = testElement.getBoundingClientRect();
      myanmarInputSupported = rect.width > 0;
      
      document.body.removeChild(testElement);
      
      console.log(`📝 Myanmar input support: ${myanmarInputSupported ? '✅' : '❌'}`);
      fontLoadingComplete = true;
    } catch (error) {
      console.error('❌ Error checking Myanmar support:', error);
      myanmarInputSupported = false;
      fontLoadingComplete = true;
    }
  }

  async function loadItems(): Promise<void> {
    console.log('📦 Loading items from API...');
    const apiStartTime = performance.now();
    
    try {
      loading = true;
      console.log('🔄 Setting loading state to true');
      
      lastApiCallTime = Date.now();
      const response = await apiService.getItems({});
      const apiEndTime = performance.now();
      
      console.log(`⚡ API call completed in ${(apiEndTime - apiStartTime).toFixed(2)}ms`);
      console.log('📊 API Response:', {
        success: response.success,
        hasData: !!response.data,
        timestamp: new Date().toISOString()
      });
      
      if (response.success && response.data) {
        const data = response.data as any;
        const itemsArray = Array.isArray(data.items) ? data.items : [];
        
        // Validate and sanitize items data
        items = itemsArray.filter((item: any) => {
          const isValid = item && 
            typeof item._id === 'string' && 
            typeof item.name === 'string' && 
            typeof item.selling_price === 'number' &&
            typeof item.stock_quantity === 'number';
          
          if (!isValid) {
            console.warn('⚠️ Invalid item filtered out:', item);
          }
          
          return isValid;
        });
        
        filteredItems = [...items];
        
        console.log('✅ Items loaded successfully:', {
          total: items.length,
          valid: items.length,
          filtered: itemsArray.length - items.length,
          categories: items.filter(item => item.category_id).length
        });
        
        // Log sample item for debugging
        if (items.length > 0) {
          console.log('📄 Sample item:', items[0]);
        }
        
        errorCount = 0; // Reset error count on success
      } else {
        throw new Error(response.message || 'Failed to load items - invalid response format');
      }
    } catch (error: any) {
      errorCount++;
      console.error('❌ Error loading items:', {
        error: error.message || error,
        attempt: errorCount,
        timestamp: new Date().toISOString(),
        apiCallTime: lastApiCallTime
      });
      
      showNotification('error', `ပစ္စည်းများ ဖတ်ရှုခြင်းတွင် အမှားဖြစ်ပေါ်သည်။ (အကြိမ်: ${errorCount})`);
      
      // Reset to empty state on error
      items = [];
      filteredItems = [];
    } finally {
      loading = false;
      console.log('🔄 Setting loading state to false');
    }
  }

  function filterItems(): void {
    console.log('🔍 Filtering items with query:', searchQuery);
    const startTime = performance.now();
    
    if (!searchQuery.trim()) {
      filteredItems = [...items];
      console.log('📋 No search query, showing all items:', items.length);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Enhanced filtering with Myanmar text support
    filteredItems = items.filter((item: Item) => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const codeMatch = item.item_code.toLowerCase().includes(query);
      
      // Myanmar category name matching
      let categoryMatch = false;
      if (item.category_id?.category_name_my) {
        categoryMatch = item.category_id.category_name_my.includes(searchQuery);
      }
      
      return nameMatch || codeMatch || categoryMatch;
    });
    
    const endTime = performance.now();
    console.log('🔍 Filter completed:', {
      query: searchQuery,
      originalCount: items.length,
      filteredCount: filteredItems.length,
      duration: `${(endTime - startTime).toFixed(2)}ms`
    });
  }

  function addToCart(item: Item): void {
    console.log('🛒 Adding item to cart:', {
      itemId: item._id,
      itemName: item.name,
      stockAvailable: item.stock_quantity,
      currentCartSize: cart.length
    });

    // Validate item stock
    if (item.stock_quantity <= 0) {
      console.warn('⚠️ Attempted to add out-of-stock item:', item.name);
      showNotification('error', 'ပစ္စည်း လက်ကျန်မရှိပါ');
      return;
    }

    const existingIndex = cart.findIndex((cartItem: CartItem) => cartItem._id === item._id);
    
    if (existingIndex >= 0) {
      const currentQuantity = cart[existingIndex].quantity;
      
      if (currentQuantity >= item.stock_quantity) {
        console.warn('⚠️ Quantity exceeds stock:', {
          item: item.name,
          requestedQty: currentQuantity + 1,
          availableStock: item.stock_quantity
        });
        showNotification('error', 'လက်ကျန်ကျော်လွန်နေပါသည်');
        return;
      }
      
      // Update existing item
      cart[existingIndex] = {
        ...cart[existingIndex],
        quantity: currentQuantity + 1,
        subtotal: (currentQuantity + 1) * cart[existingIndex].selling_price
      };
      
      console.log('✅ Updated existing cart item:', {
        item: item.name,
        newQuantity: currentQuantity + 1,
        newSubtotal: cart[existingIndex].subtotal
      });
    } else {
      // Add new item to cart
      const newCartItem: CartItem = {
        ...item,
        quantity: 1,
        subtotal: item.selling_price
      };
      
      cart = [...cart, newCartItem];
      
      console.log('✅ Added new item to cart:', {
        item: item.name,
        quantity: 1,
        subtotal: item.selling_price,
        newCartSize: cart.length
      });
    }
    
    showNotification('success', `${item.name} စျေးခြင်းထဲ ထည့်လိုက်ပါပြီ`);
    
    // Force reactivity update
    cart = cart;
    console.log('🔄 Cart state updated, new total items:', cart.length);
  }

  function updateCartQuantity(itemId: string, newQuantity: number): void {
    console.log('📝 Updating cart quantity:', {
      itemId,
      newQuantity,
      currentCartSize: cart.length
    });

    const item = items.find((i: Item) => i._id === itemId);
    if (!item) {
      console.error('❌ Item not found for quantity update:', itemId);
      return;
    }

    if (newQuantity <= 0) {
      console.log('🗑️ Quantity <= 0, removing item from cart');
      removeFromCart(itemId);
      return;
    }

    if (newQuantity > item.stock_quantity) {
      console.warn('⚠️ New quantity exceeds stock:', {
        item: item.name,
        requestedQty: newQuantity,
        availableStock: item.stock_quantity
      });
      showNotification('error', 'လက်ကျန်ကျော်လွန်နေပါသည်');
      return;
    }

    const oldCart = [...cart];
    cart = cart.map((cartItem: CartItem) => 
      cartItem._id === itemId 
        ? { 
            ...cartItem, 
            quantity: newQuantity, 
            subtotal: newQuantity * cartItem.selling_price 
          }
        : cartItem
    );

    const updatedItem = cart.find(item => item._id === itemId);
    console.log('✅ Cart quantity updated:', {
      item: item.name,
      oldQuantity: oldCart.find(i => i._id === itemId)?.quantity || 0,
      newQuantity,
      newSubtotal: updatedItem?.subtotal || 0
    });
  }

  function removeFromCart(itemId: string): void {
    const itemToRemove = cart.find((item: CartItem) => item._id === itemId);
    
    console.log('🗑️ Removing item from cart:', {
      itemId,
      itemName: itemToRemove?.name || 'Unknown',
      currentCartSize: cart.length
    });

    cart = cart.filter((item: CartItem) => item._id !== itemId);
    
    console.log('✅ Item removed from cart, new size:', cart.length);
    
    if (itemToRemove) {
      showNotification('info', `${itemToRemove.name} စျေးခြင်းမှ ဖယ်ရှားလိုက်ပါပြီ`);
    }
  }

  function clearCart(): void {
    console.log('🧹 Clearing entire cart:', {
      itemsBeforeClear: cart.length,
      totalValueCleared: finalTotal
    });

    cart = [];
    customerName = '';
    customerPhone = '';
    amountPaid = 0;
    discount = 0;
    
    console.log('✅ Cart cleared successfully');
    showNotification('info', 'စျေးခြင်း ရှင်းလင်းပြီးပါပြီ');
  }

  async function processSale(): Promise<void> {
    console.log('💰 Processing sale transaction...');
    const saleStartTime = performance.now();

    // Validation checks with detailed logging
    if (cart.length === 0) {
      console.warn('⚠️ Sale attempt with empty cart');
      showNotification('error', 'စျေးခြင်းတွင် ပစ္စည်းမရှိပါ');
      return;
    }

    if (amountPaid < finalTotal) {
      console.warn('⚠️ Insufficient payment:', {
        required: finalTotal,
        provided: amountPaid,
        shortage: finalTotal - amountPaid
      });
      showNotification('error', 'ငွေမလုံလောက်ပါ');
      return;
    }

    console.log('📊 Sale details:', {
      itemCount: cart.length,
      subtotal,
      discount,
      finalTotal,
      amountPaid,
      changeAmount,
      paymentMethod,
      customer: {
        name: customerName || 'Walk-in Customer',
        phone: customerPhone || 'Not provided'
      }
    });

    try {
      processing = true;
      console.log('🔄 Setting processing state to true');
      
      const saleData: SaleData = {
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone || '',
        items: cart.map((item: CartItem) => ({
          item_id: item._id,
          quantity: item.quantity,
          unit_price: item.selling_price,
          subtotal: item.subtotal
        })),
        subtotal,
        discount,
        total: finalTotal,
        amount_paid: amountPaid,
        change: changeAmount,
        payment_method: paymentMethod,
        sale_date: new Date().toISOString()
      };

      console.log('📤 Sending sale data to API:', saleData);
      
      lastApiCallTime = Date.now();
      const response = await apiService.createSale(saleData);
      const saleEndTime = performance.now();
      
      console.log(`⚡ Sale API call completed in ${(saleEndTime - saleStartTime).toFixed(2)}ms`);
      console.log('📥 Sale API response:', {
        success: response.success,
        hasData: !!response.data,
        message: response.message
      });
      
      if (response.success) {
        const responseData = response.data as any;
        const invoiceNumber = responseData?.invoice_number || responseData?.sale_id || 'N/A';
        
        console.log('✅ Sale processed successfully:', {
          invoiceNumber,
          totalAmount: finalTotal,
          itemsSold: cart.length
        });
        
        showNotification('success', `အရောင်း အောင်မြင်စွာ ပြီးစီးပါပြီ! ကိုးကားနံပါတ်: ${invoiceNumber}`);
        
        // Clear cart and reset form
        clearCart();
        
        // Reload items to update stock quantities
        console.log('🔄 Reloading items to update stock quantities...');
        await loadItems();
        
        errorCount = 0; // Reset error count on successful sale
      } else {
        throw new Error(response.message || 'Failed to process sale - invalid response');
      }
    } catch (error: any) {
      errorCount++;
      console.error('❌ Error processing sale:', {
        error: error.message || error,
        saleData: {
          itemCount: cart.length,
          total: finalTotal,
          paymentMethod
        },
        attempt: errorCount,
        timestamp: new Date().toISOString()
      });
      
      showNotification('error', `အရောင်းလုပ်ငန်းတွင် အမှားဖြစ်ပေါ်သည်။ (အကြိမ်: ${errorCount})`);
    } finally {
      processing = false;
      console.log('🔄 Setting processing state to false');
    }
  }

  function showNotification(type: NotificationData['type'], message: string): void {
    const timestamp = Date.now();
    const notificationId = `notification-${timestamp}`;
    
    console.log(`📢 Showing ${type} notification:`, {
      type,
      message,
      id: notificationId,
      timestamp: new Date(timestamp).toISOString()
    });

    notification = {
      type,
      message,
      id: notificationId,
      timestamp
    };
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      if (notification?.id === notificationId) {
        console.log('⏰ Auto-hiding notification:', notificationId);
        notification = null;
      }
    }, 5000);
  }

  // Enhanced input validation for Myanmar text
  function validateMyanmarInput(value: string): boolean {
    if (!value) return true;
    
    // Basic Myanmar Unicode range check (U+1000-U+109F)
    const myanmarRegex = /[\u1000-\u109F]/;
    const hasMyanmar = myanmarRegex.test(value);
    
    if (hasMyanmar && !myanmarInputSupported) {
      console.warn('⚠️ Myanmar text detected but support may be limited');
      showNotification('warning', 'မြန်မာစာ ထောက်ပံ့မှု အကန့်အသတ်ရှိနိုင်ပါသည်');
    }
    
    return true;
  }

  // Reactive statements with debugging
  $: {
    const newSubtotal = cart.reduce((sum: number, item: CartItem) => sum + item.subtotal, 0);
    if (subtotal !== newSubtotal) {
      console.log('💱 Subtotal updated:', { old: subtotal, new: newSubtotal });
    }
    subtotal = newSubtotal;
  }

  $: {
    const newFinalTotal = Math.max(0, subtotal - discount);
    if (finalTotal !== newFinalTotal) {
      console.log('💰 Final total updated:', { old: finalTotal, new: newFinalTotal, discount });
    }
    finalTotal = newFinalTotal;
  }

  $: {
    const newChangeAmount = Math.max(0, amountPaid - finalTotal);
    if (changeAmount !== newChangeAmount) {
      console.log('💵 Change amount updated:', { old: changeAmount, new: newChangeAmount });
    }
    changeAmount = newChangeAmount;
  }

  $: {
    if (searchQuery !== undefined) {
      console.log('🔍 Search query changed:', searchQuery);
      filterItems();
    }
  }

  // Computed values with explicit typing
  let subtotal: number = 0;
  let finalTotal: number = 0;
  let changeAmount: number = 0;
</script>

<!-- Enhanced POS Interface with Debugging Support -->
<div class="pos-container" class:myanmar-supported={myanmarInputSupported} class:dark={isDarkMode}>
  <!-- Debug Information (only in development) -->
  {#if debugMode}
    <div class="debug-panel">
      <h4>🐛 Debug Information</h4>
      <div class="debug-info">
        <span>Error Count: {errorCount}</span>
        <span>Cart Items: {cart.length}</span>
        <span>Filtered Items: {filteredItems.length}</span>
        <span>Myanmar Support: {myanmarInputSupported ? '✅' : '❌'}</span>
        <span>Font Loading: {fontLoadingComplete ? '✅' : '⏳'}</span>
        <span>Last API Call: {lastApiCallTime}</span>
      </div>
      <button on:click={() => debugMode = false} class="close-debug">×</button>
    </div>
  {/if}

  {#if notification}
    <NotificationToast 
      type={notification.type} 
      message={notification.message} 
      id={notification.id}
      on:close={() => {
        console.log('📢 Notification closed:', notification?.id);
        notification = null;
      }} 
    />
  {/if}

  <!-- POS Header -->
  <div class="pos-header">
    <div class="header-content">
      <div class="title-section">
        <h1>🛒 {$t('pos.title')}</h1>
        <p>{$t('pos.description')}</p>
        {#if errorCount > 0}
          <div class="error-indicator" title="Recent errors detected">
            ⚠️ {$t('pos.errors')} {errorCount} {$t('pos.errorsFound')}
          </div>
        {/if}
      </div>
      <div class="cart-summary">
        <div class="cart-count">
          <span class="count" role="status" aria-label="Cart item count">{cart.length}</span>
          <span class="label">{$t('pos.items')}</span>
        </div>
        <div class="cart-total">
          <span class="amount" role="status" aria-label="Total amount">{$formatCurrency(finalTotal)}</span>
          <span class="label">{$t('pos.total')}</span>
        </div>
      </div>
      <div class="debug-controls">
        <button 
          class="theme-toggle"
          on:click={() => {
            console.log('🌙 Toggling dark mode');
            isDarkMode = !isDarkMode;
          }}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          {#if isDarkMode}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/>
              <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/>
              <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/>
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2"/>
            </svg>
          {/if}
        </button>
        <button 
          class="debug-toggle"
          on:click={() => debugMode = !debugMode}
          title="Toggle debug mode"
          aria-label="Toggle debug information"
        >
          🐛
        </button>
      </div>
    </div>
  </div>

  <div class="pos-layout">
    <!-- Items Section -->
    <div class="items-section" class:visible={itemsVisible}>
      <!-- Search Bar -->
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="ပစ္စည်းအမည် သို့မဟုတ် ကုဒ် ရှာရန်..."
            bind:value={searchQuery}
            on:input={(e) => {
              const value = e.currentTarget.value;
              validateMyanmarInput(value);
              console.log('🔍 Search input changed:', value);
            }}
            class="search-input myanmar-text"
            aria-label="Search for items by name or code"
            autocomplete="off"
            spellcheck="false"
          />
          {#if searchQuery}
            <button 
              class="clear-search" 
              on:click={() => {
                console.log('🧹 Clearing search query');
                searchQuery = '';
              }}
              title="Clear search"
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          {/if}
        </div>
        {#if !fontLoadingComplete}
          <div class="font-loading-indicator">
            ⏳ ဖောင့် တင်နေသည်...
          </div>
        {/if}
      </div>

      <!-- Items Grid -->
      {#if loading}
        <div class="skeleton-container" role="status" aria-label="Loading items">
          {#each Array(8) as _, i}
            <SkeletonLoader type="card" lines={2} />
          {/each}
        </div>
      {:else if filteredItems.length === 0}
        <div class="empty-state" role="status">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M20 6L16 2H8L4 6V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3>ပစ္စည်းမတွေ့ရှိပါ</h3>
          <p>ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းများ မရှိပါ</p>
          {#if searchQuery}
            <button 
              class="retry-search" 
              on:click={() => {
                console.log('🔄 Retrying search, clearing query');
                searchQuery = '';
              }}
            >
              ရှာဖွေမှု ရှင်းလင်းရန်
            </button>
          {/if}
          {#if errorCount > 0}
            <button 
              class="retry-load" 
              on:click={() => {
                console.log('🔄 Retrying item load due to errors');
                loadItems();
              }}
            >
              ပစ္စည်းများ ပြန်တင်ရန်
            </button>
          {/if}
        </div>
      {:else}
        <div class="items-grid" role="grid" aria-label="Available items">
          {#each filteredItems as item, index (item._id)}
            <div 
              class="item-card animate-fade-in" 
              style="animation-delay: {index * 0.05}s"
              role="gridcell"
              tabindex="0"
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  addToCart(item);
                }
              }}
            >
              <div class="item-info">
                <h3 class="item-name myanmar-text">{item.name}</h3>
                <p class="item-code">#{item.item_code}</p>
                {#if item.category_id?.category_name_my}
                  <span class="category-tag myanmar-text">{item.category_id.category_name_my}</span>
                {/if}
              </div>
              
              <div class="item-details">
                <div class="price" role="status" aria-label="Price: {$formatCurrency(item.selling_price)}">
                  {$formatCurrency(item.selling_price)}
                </div>
                <div 
                  class="stock {item.stock_quantity <= 5 ? 'low' : 'normal'}"
                  role="status" 
                  aria-label="Stock: {item.stock_quantity} items"
                >
                  လက်ကျန်: {item.stock_quantity}
                </div>
              </div>
              
              <button 
                class="add-btn {item.stock_quantity <= 0 ? 'disabled' : ''}"
                on:click={() => addToCart(item)}
                disabled={item.stock_quantity <= 0}
                aria-label={item.stock_quantity <= 0 ? 
                  `${item.name} is out of stock` : 
                  `Add ${item.name} to cart`}
              >
                {#if item.stock_quantity <= 0}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  ကုန်သွားပြီ
                {:else}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  ထည့်ရန်
                {/if}
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Cart Section -->
    <div class="cart-section" class:visible={cartVisible}>
      <div class="cart-header">
        <h2>📋 စျေးခြင်း</h2>
        {#if cart.length > 0}
          <button class="clear-cart-btn" on:click={clearCart}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ရှင်းလင်းရန်
          </button>
        {/if}
      </div>

      <div class="cart-content">
        {#if cart.length === 0}
          <div class="empty-cart">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V16.5M9 19.5C9.8 19.5 10.5 20.2 10.5 21S9.8 22.5 9 22.5 7.5 21.8 7.5 21 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21S20.8 22.5 20 22.5 18.5 21.8 18.5 21 19.2 19.5 20 19.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>စျေးခြင်းတွင် ပစ္စည်းမရှိပါ</p>
            <small>ပစ္စည်းများကို ရွေးချယ်၍ ထည့်သွင်းပါ</small>
          </div>
        {:else}
          <!-- Cart Items -->
          <div class="cart-items">
            {#each cart as cartItem (cartItem._id)}
              <div class="cart-item">
                <div class="item-details">
                  <h4 class="item-name">{cartItem.name}</h4>
                  <p class="item-price">{$formatCurrency(cartItem.selling_price)} x {cartItem.quantity}</p>
                </div>
                
                <div class="quantity-controls">
                  <button 
                    class="qty-btn"
                    on:click={() => updateCartQuantity(cartItem._id, cartItem.quantity - 1)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    max={cartItem.stock_quantity}
                    bind:value={cartItem.quantity}
                    on:change={() => updateCartQuantity(cartItem._id, cartItem.quantity)}
                    class="qty-input"
                  />
                  <button 
                    class="qty-btn"
                    on:click={() => updateCartQuantity(cartItem._id, cartItem.quantity + 1)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                <div class="item-total">
                  {$formatCurrency(cartItem.subtotal)}
                </div>
                
                <button 
                  class="remove-btn"
                  on:click={() => removeFromCart(cartItem._id)}
                  title="Remove item"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            {/each}
          </div>

          <!-- Customer Information -->
          <div class="customer-section">
            <h3>👤 ဖောက်သည်အချက်အလက်</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="customer-name">အမည်</label>
                <input 
                  id="customer-name"
                  type="text" 
                  bind:value={customerName}
                  on:input={(e) => {
                    const value = e.currentTarget.value;
                    validateMyanmarInput(value);
                    console.log('👤 Customer name updated:', value);
                  }}
                  placeholder="ဖောက်သည်အမည် (ရွေးချယ်စရာ)"
                  class="form-input myanmar-text"
                  aria-describedby="customer-name-help"
                  autocomplete="name"
                  spellcheck="false"
                />
                <small id="customer-name-help" class="form-help">
                  မြန်မာစာ သို့မဟုတ် အင်္ဂလိပ်စာ ရေးနိုင်ပါသည်
                </small>
              </div>
              <div class="form-group">
                <label for="customer-phone">ဖုန်းနံပါတ်</label>
                <input 
                  id="customer-phone"
                  type="tel" 
                  bind:value={customerPhone}
                  on:input={(e) => {
                    const value = e.currentTarget.value;
                    // Basic phone number validation
                    if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
                      console.warn('⚠️ Invalid phone number format:', value);
                    }
                    console.log('📞 Customer phone updated:', value);
                  }}
                  placeholder="ဖုန်းနံပါတ် (ရွေးချယ်စရာ)"
                  class="form-input"
                  aria-describedby="customer-phone-help"
                  autocomplete="tel"
                  pattern="[\d\s\-\+\(\)]+"
                />
                <small id="customer-phone-help" class="form-help">
                  ဥပမာ: 09-123-456-789
                </small>
              </div>
            </div>
          </div>

          <!-- Payment Section -->
          <div class="payment-section">
            <h3>💰 ငွေပေးချေမှု</h3>
            
            <div class="payment-summary">
              <div class="summary-row">
                <span>စုစုပေါင်း:</span>
                <span>{$formatCurrency(subtotal)}</span>
              </div>
              <div class="summary-row">
                <span>လျှော့စျေး:</span>
                <div class="discount-input">
                  <input 
                    type="number" 
                    min="0" 
                    max={subtotal}
                    bind:value={discount} 
                    class="form-input discount"
                  />
                  <span>ကျပ်</span>
                </div>
              </div>
              <div class="summary-row total">
                <span>{$t('pos.grandTotal')}:</span>
                <span>{$formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <div class="payment-methods">
              <label class="payment-method">
                <input 
                  type="radio" 
                  bind:group={paymentMethod} 
                  value="cash"
                />
                <span>💵 {$t('pos.cash')}</span>
              </label>
              <label class="payment-method">
                <input 
                  type="radio" 
                  bind:group={paymentMethod} 
                  value="card"
                />
                <span>💳 {$t('pos.card')}</span>
              </label>
              <label class="payment-method">
                <input 
                  type="radio" 
                  bind:group={paymentMethod} 
                  value="mobile"
                />
                <span>📱 {$t('pos.mobile')}</span>
              </label>
            </div>

            <div class="amount-paid-section">
              <label for="amount-paid">ပေးချေငွေပမာණ:</label>
              <input 
                id="amount-paid"
                type="number" 
                min={finalTotal}
                bind:value={amountPaid} 
                placeholder="ပေးချေငွေပမာණ"
                class="form-input amount-input"
              />
              {#if changeAmount > 0}
                <div class="change-amount">
                  ကျန်ငွေ: <strong>{$formatCurrency(changeAmount)}</strong>
                </div>
              {/if}
            </div>
          </div>

          <!-- Process Sale Button -->
          <button 
            class="process-sale-btn {processing ? 'processing' : ''}"
            on:click={processSale}
            disabled={processing || cart.length === 0 || amountPaid < finalTotal}
          >
            {#if processing}
              <svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 3C16.9706 3 21 7.02944 21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              {$t('pos.processing')}
            {:else}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {$t('pos.processSale')}
            {/if}
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* Modern CSS Variables & Design System - Matching Dashboard & Inventory */
  .pos-container {
    --primary-50: #eff6ff;
    --primary-100: #dbeafe;
    --primary-500: #3b82f6;
    --primary-600: #2563eb;
    --primary-700: #1d4ed8;
    
    --secondary-50: #f5f3ff;
    --secondary-500: #8b5cf6;
    --secondary-600: #7c3aed;
    
    --success-50: #ecfdf5;
    --success-500: #10b981;
    --success-600: #059669;
    
    --warning-50: #fffbeb;
    --warning-500: #f59e0b;
    --warning-600: #d97706;
    
    --error-50: #fef2f2;
    --error-500: #ef4444;
    --error-600: #dc2626;
    
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-300: #d1d5db;
    --gray-400: #9ca3af;
    --gray-500: #6b7280;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-800: #1f2937;
    --gray-900: #111827;
    
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;
    
    --spacing-xs: 0.5rem;
    --spacing-sm: 0.75rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;
    
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* Dark Mode Support */
  .pos-container.dark {
    --gray-50: #111827;
    --gray-100: #1f2937;
    --gray-200: #374151;
    --gray-300: #4b5563;
    --gray-400: #6b7280;
    --gray-500: #9ca3af;
    --gray-600: #d1d5db;
    --gray-700: #e5e7eb;
    --gray-800: #f3f4f6;
    --gray-900: #f9fafb;
    
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: var(--gray-900);
  }

  /* Myanmar Unicode Font Support */
  .myanmar-text {
    font-family: 'Myanmar Text', 'Pyidaungsu', 'Padauk', 'Myanmar3', 'Inter', sans-serif;
    font-feature-settings: 'liga' 1, 'clig' 1;
    -webkit-font-feature-settings: 'liga' 1, 'clig' 1;
    text-rendering: optimizeLegibility;
  }

  .pos-container.myanmar-supported .myanmar-text {
    font-weight: 400;
    line-height: 1.6;
  }

  /* Debug Panel */
  .debug-panel {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    font-family: monospace;
    font-size: 0.75rem;
    z-index: 1000;
    max-width: 300px;
    backdrop-filter: blur(10px);
  }

  .debug-panel h4 {
    margin: 0 0 0.5rem 0;
    color: #10b981;
  }

  .debug-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .debug-info span {
    padding: 0.125rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .close-debug {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    line-height: 1;
  }

  .debug-controls {
    display: flex;
    align-items: center;
  }

  .debug-toggle {
    background: #374151;
    border: none;
    color: white;
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  .debug-toggle:hover {
    background: #4b5563;
  }

  /* Error Indicator */
  .error-indicator {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    border-left: 4px solid #dc2626;
  }

  /* Font Loading Indicator */
  .font-loading-indicator {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fef3c7;
    color: #92400e;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    text-align: center;
  }

  /* Enhanced Empty State */
  .retry-search,
  .retry-load {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .retry-search:hover,
  .retry-load:hover {
    background: #2563eb;
  }

  .retry-load {
    background: #10b981;
    margin-left: 0.5rem;
  }

  .retry-load:hover {
    background: #059669;
  }

  /* Form Help Text */
  .form-help {
    margin-top: 0.25rem;
    color: #6b7280;
    font-size: 0.75rem;
    font-style: italic;
  }

  /* Enhanced Accessibility */
  .item-card:focus {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
  }

  [role="status"] {
    position: relative;
  }

  [aria-label]:focus::after {
    content: attr(aria-label);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
  }

  /* High Contrast Mode Support */
  @media (prefers-contrast: high) {
    .item-card {
      border: 2px solid;
    }
    
    .add-btn {
      border: 2px solid transparent;
    }
    
    .add-btn:not(.disabled) {
      border-color: currentColor;
    }
  }

  /* Reduced Motion Support */
  @media (prefers-reduced-motion: reduce) {
    .animate-fade-in {
      animation: none;
      opacity: 1;
    }
    
    .items-section,
    .cart-section {
      transition: none;
      opacity: 1;
      transform: none;
    }
    
    .spin {
      animation: none;
    }
  }

  /* Dark Mode Support */
  @media (prefers-color-scheme: dark) {
    .pos-container {
      background: #111827;
      color: #f9fafb;
    }
    
    .pos-header {
      background: #1f2937;
      border-color: #374151;
    }
    
    .item-card,
    .cart-section,
    .customer-section,
    .payment-section {
      background: #1f2937;
      border-color: #374151;
      color: #f9fafb;
    }
    
    .form-input,
    .search-input {
      background: #374151;
      border-color: #4b5563;
      color: #f9fafb;
    }
    
    .form-input:focus,
    .search-input:focus {
      border-color: #60a5fa;
    }
  }

  .pos-container {
    min-height: 100vh;
    background: #f8fafc;
  }

  /* Modern Header Design */
  .pos-header {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-xl);
    margin: var(--spacing-xl);
    box-shadow: var(--shadow-lg);
  }

  .dark .pos-header {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
  }

  .title-section {
    flex: 1;
  }

  .title-section h1 {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 var(--spacing-xs) 0;
  }

  .title-section p {
    color: var(--gray-500);
    font-size: 1.125rem;
    margin: 0;
  }

  .dark .title-section p {
    color: var(--gray-400);
  }

  .cart-summary {
    display: flex;
    gap: var(--spacing-lg);
  }

  .cart-count,
  .cart-total {
    text-align: center;
    padding: var(--spacing-lg) var(--spacing-xl);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .cart-count {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
    border-color: var(--primary-500);
  }

  .cart-total {
    background: linear-gradient(135deg, var(--success-500), var(--success-600));
    color: white;
    border-color: var(--success-500);
  }

  .dark .cart-count,
  .dark .cart-total {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .cart-count:hover,
  .cart-total:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }

  .count,
  .amount {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    margin-bottom: var(--spacing-xs);
  }

  .label {
    display: block;
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 500;
  }

  /* Modern Layout */
  .pos-layout {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 var(--spacing-xl);
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: var(--spacing-xl);
    align-items: start;
  }

  /* Enhanced Items Section */
  .items-section {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .items-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Modern Search Container */
  .search-container {
    margin-bottom: var(--spacing-xl);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-md);
  }

  .dark .search-container {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .search-input-wrapper {
    position: relative;
    max-width: 600px;
  }

  .search-icon {
    position: absolute;
    left: var(--spacing-lg);
    top: 50%;
    transform: translateY(-50%);
    color: var(--gray-400);
    z-index: 2;
  }

  .search-input {
    width: 100%;
    padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-lg) 3.5rem;
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-xl);
    font-size: 1.125rem;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
  }

  .dark .search-input {
    background: rgba(30, 41, 59, 0.8);
    border-color: var(--gray-600);
    color: var(--gray-100);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-500);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }

  .dark .search-input:focus {
    background: rgba(30, 41, 59, 0.95);
    border-color: var(--primary-400);
  }

  .clear-search {
    position: absolute;
    right: var(--spacing-lg);
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--gray-400);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
    z-index: 2;
  }

  .clear-search:hover {
    color: var(--gray-600);
    background: var(--gray-100);
  }

  .dark .clear-search:hover {
    color: var(--gray-300);
    background: var(--gray-700);
  }

  /* Enhanced Items Grid */
  .skeleton-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    text-align: center;
    color: var(--gray-500);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-md);
  }

  .dark .empty-state {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--gray-400);
  }

  .empty-state svg {
    color: var(--gray-300);
    margin-bottom: var(--spacing-lg);
  }

  .dark .empty-state svg {
    color: var(--gray-600);
  }

  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--gray-700);
  }

  .dark .empty-state h3 {
    color: var(--gray-200);
  }

  .empty-state p {
    font-size: 1rem;
    margin: 0 0 var(--spacing-lg) 0;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
  }

  /* Enhanced Item Cards */
  .item-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-xl);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }

  .dark .item-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .item-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--primary-500), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .item-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
    border-color: var(--primary-200);
  }

  .item-card:hover::before {
    opacity: 1;
  }

  .dark .item-card:hover {
    border-color: var(--primary-400);
  }

  .item-card:focus {
    outline: 3px solid var(--primary-500);
    outline-offset: 2px;
  }

  .item-info {
    margin-bottom: var(--spacing-lg);
  }

  .item-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0 0 var(--spacing-xs) 0;
    line-height: 1.3;
  }

  .dark .item-name {
    color: var(--gray-100);
  }

  .item-code {
    font-size: 0.875rem;
    color: var(--gray-500);
    margin: 0 0 var(--spacing-sm) 0;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    background: var(--gray-100);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    display: inline-block;
  }

  .dark .item-code {
    color: var(--gray-400);
    background: var(--gray-700);
  }

  .category-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
    color: var(--primary-700);
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--primary-200);
  }

  .dark .category-tag {
    background: linear-gradient(135deg, var(--primary-900), var(--primary-800));
    color: var(--primary-300);
    border-color: var(--primary-600);
  }

  .item-details {
    margin: var(--spacing-lg) 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .price {
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--success-600), var(--success-500));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stock {
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-lg);
  }

  .stock.normal {
    color: var(--success-700);
    background: var(--success-50);
    border: 1px solid var(--success-200);
  }

  .stock.low {
    color: var(--warning-700);
    background: var(--warning-50);
    border: 1px solid var(--warning-200);
  }

  .dark .stock.normal {
    color: var(--success-300);
    background: var(--success-900);
    border-color: var(--success-600);
  }

  .dark .stock.low {
    color: var(--warning-300);
    background: var(--warning-900);
    border-color: var(--warning-600);
  }

  /* Enhanced Add Button */
  .add-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    background: linear-gradient(135deg, var(--success-500), var(--success-600));
    color: white;
    border: none;
    border-radius: var(--radius-xl);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .add-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transition: all 0.3s ease;
    transform: translate(-50%, -50%);
  }

  .add-btn:hover:not(.disabled)::before {
    width: 300px;
    height: 300px;
  }

  .add-btn:hover:not(.disabled) {
    background: linear-gradient(135deg, var(--success-600), var(--success-700));
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .add-btn.disabled {
    background: var(--gray-300);
    color: var(--gray-500);
    cursor: not-allowed;
    transform: none;
  }

  .dark .add-btn.disabled {
    background: var(--gray-600);
    color: var(--gray-400);
  }

  /* Enhanced Cart Section */
  .cart-section {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-xl);
    position: sticky;
    top: var(--spacing-xl);
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-lg);
  }

  .dark .cart-section {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .cart-section.visible {
    opacity: 1;
    transform: translateX(0);
  }

  /* Modern Cart Header */
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 2px solid var(--gray-100);
    position: relative;
  }

  .dark .cart-header {
    border-bottom-color: var(--gray-700);
  }

  .cart-header::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 50px;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
    border-radius: 1px;
  }

  .cart-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0;
    background: linear-gradient(135deg, var(--gray-900), var(--gray-700));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .dark .cart-header h2 {
    background: linear-gradient(135deg, var(--gray-100), var(--gray-300));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .clear-cart-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: linear-gradient(135deg, var(--error-500), var(--error-600));
    color: white;
    border: none;
    border-radius: var(--radius-lg);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
  }

  .clear-cart-btn:hover {
    background: linear-gradient(135deg, var(--error-600), var(--error-700));
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  /* Enhanced Empty Cart */
  .empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl) var(--spacing-lg);
    text-align: center;
    color: var(--gray-500);
    background: linear-gradient(135deg, var(--gray-50), var(--gray-100));
    border-radius: var(--radius-xl);
    border: 2px dashed var(--gray-200);
  }

  .dark .empty-cart {
    background: linear-gradient(135deg, var(--gray-800), var(--gray-700));
    border-color: var(--gray-600);
    color: var(--gray-400);
  }

  .empty-cart svg {
    color: var(--gray-300);
    margin-bottom: var(--spacing-lg);
  }

  .dark .empty-cart svg {
    color: var(--gray-600);
  }

  .empty-cart p {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--gray-700);
  }

  .dark .empty-cart p {
    color: var(--gray-200);
  }

  .empty-cart small {
    font-size: 0.875rem;
    color: var(--gray-500);
    margin: 0;
  }

  .dark .empty-cart small {
    color: var(--gray-400);
  }

  /* Enhanced Cart Items */
  .cart-items {
    margin-bottom: var(--spacing-xl);
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--gray-300) transparent;
  }

  .cart-items::-webkit-scrollbar {
    width: 6px;
  }

  .cart-items::-webkit-scrollbar-track {
    background: transparent;
  }

  .cart-items::-webkit-scrollbar-thumb {
    background: var(--gray-300);
    border-radius: 3px;
  }

  .cart-items::-webkit-scrollbar-thumb:hover {
    background: var(--gray-400);
  }

  .cart-item {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: var(--spacing-sm);
    align-items: center;
    padding: var(--spacing-lg);
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-xl);
    margin-bottom: var(--spacing-sm);
    transition: all 0.3s ease;
  }

  .dark .cart-item {
    background: rgba(30, 41, 59, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .cart-item:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateX(4px);
    box-shadow: var(--shadow-md);
  }

  .dark .cart-item:hover {
    background: rgba(30, 41, 59, 0.8);
  }

  .cart-item .item-details {
    margin: 0;
    display: block;
  }

  .cart-item .item-name {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--gray-900);
  }

  .dark .cart-item .item-name {
    color: var(--gray-100);
  }

  .cart-item .item-price {
    font-size: 0.875rem;
    color: var(--gray-500);
    margin: 0;
    font-weight: 500;
  }

  .dark .cart-item .item-price {
    color: var(--gray-400);
  }

  /* Enhanced Quantity Controls */
  .quantity-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    background: var(--gray-100);
    border-radius: var(--radius-lg);
    padding: 0.25rem;
  }

  .dark .quantity-controls {
    background: var(--gray-700);
  }

  .qty-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--gray-600);
  }

  .dark .qty-btn {
    background: var(--gray-600);
    border-color: var(--gray-500);
    color: var(--gray-200);
  }

  .qty-btn:hover {
    background: var(--primary-50);
    border-color: var(--primary-200);
    color: var(--primary-600);
    transform: scale(1.05);
  }

  .dark .qty-btn:hover {
    background: var(--primary-900);
    border-color: var(--primary-600);
    color: var(--primary-400);
  }

  .qty-input {
    width: 2.5rem;
    text-align: center;
    padding: 0.25rem;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    font-weight: 600;
    background: transparent;
    color: var(--gray-700);
  }

  .dark .qty-input {
    color: var(--gray-200);
  }

  .qty-input:focus {
    outline: 2px solid var(--primary-500);
    outline-offset: 1px;
  }

  .item-total {
    font-weight: 700;
    font-size: 1rem;
    background: linear-gradient(135deg, var(--success-600), var(--success-500));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .remove-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--error-50);
    color: var(--error-600);
    border: 1px solid var(--error-200);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dark .remove-btn {
    background: var(--error-900);
    color: var(--error-400);
    border-color: var(--error-600);
  }

  .remove-btn:hover {
    background: var(--error-100);
    border-color: var(--error-300);
    transform: scale(1.05);
  }

  .dark .remove-btn:hover {
    background: var(--error-800);
    border-color: var(--error-500);
  }

  /* Enhanced Customer & Payment Sections */
  .customer-section,
  .payment-section {
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-xl);
    background: linear-gradient(135deg, var(--gray-50), var(--gray-100));
    border-radius: var(--radius-xl);
    border: 1px solid var(--gray-200);
    position: relative;
    overflow: hidden;
  }

  .dark .customer-section,
  .dark .payment-section {
    background: linear-gradient(135deg, var(--gray-800), var(--gray-700));
    border-color: var(--gray-600);
  }

  .customer-section::before,
  .payment-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  .customer-section h3,
  .payment-section h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0 0 var(--spacing-lg) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .dark .customer-section h3,
  .dark .payment-section h3 {
    color: var(--gray-100);
  }

  .form-grid {
    display: grid;
    gap: var(--spacing-lg);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--gray-700);
  }

  .dark .form-group label {
    color: var(--gray-200);
  }

  .form-input {
    padding: var(--spacing-lg);
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-lg);
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
  }

  .dark .form-input {
    background: rgba(30, 41, 59, 0.8);
    border-color: var(--gray-600);
    color: var(--gray-100);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-1px);
  }

  .dark .form-input:focus {
    background: rgba(30, 41, 59, 0.95);
    border-color: var(--primary-400);
  }

  .form-help {
    font-size: 0.75rem;
    color: var(--gray-500);
    font-style: italic;
    margin-top: var(--spacing-xs);
  }

  .dark .form-help {
    color: var(--gray-400);
  }

  /* Enhanced Payment Summary */
  .payment-summary {
    margin-bottom: var(--spacing-lg);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    border: 1px solid var(--gray-200);
  }

  .dark .payment-summary {
    background: rgba(30, 41, 59, 0.8);
    border-color: var(--gray-600);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    font-weight: 500;
  }

  .summary-row.total {
    font-weight: 800;
    font-size: 1.25rem;
    border-top: 2px solid var(--gray-200);
    margin-top: var(--spacing-sm);
    padding-top: var(--spacing-lg);
    background: linear-gradient(135deg, var(--success-50), var(--success-100));
    margin: var(--spacing-sm) -var(--spacing-lg) -var(--spacing-lg);
    padding: var(--spacing-lg);
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }

  .dark .summary-row.total {
    background: linear-gradient(135deg, var(--success-900), var(--success-800));
    border-top-color: var(--gray-600);
  }

  .discount-input {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .discount-input input {
    width: 120px;
    padding: var(--spacing-sm);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    font-weight: 600;
  }

  .dark .discount-input input {
    border-color: var(--gray-500);
    background: var(--gray-700);
    color: var(--gray-100);
  }

  .discount-input span {
    font-weight: 600;
    color: var(--gray-600);
  }

  .dark .discount-input span {
    color: var(--gray-300);
  }

  /* Enhanced Payment Methods */
  .payment-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }

  .payment-method {
    position: relative;
    cursor: pointer;
  }

  .payment-method input[type="radio"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .payment-method span {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-lg);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-lg);
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: center;
  }

  .dark .payment-method span {
    background: rgba(30, 41, 59, 0.8);
    border-color: var(--gray-600);
    color: var(--gray-200);
  }

  .payment-method:hover span {
    background: var(--primary-50);
    border-color: var(--primary-300);
    transform: translateY(-1px);
  }

  .dark .payment-method:hover span {
    background: var(--primary-900);
    border-color: var(--primary-600);
  }

  .payment-method input[type="radio"]:checked + span {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    border-color: var(--primary-500);
    color: white;
    box-shadow: var(--shadow-md);
  }

  /* Enhanced Amount Input */
  .amount-paid-section {
    margin-bottom: var(--spacing-lg);
  }

  .amount-paid-section label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-weight: 600;
    color: var(--gray-700);
    font-size: 1rem;
  }

  .dark .amount-paid-section label {
    color: var(--gray-200);
  }

  .amount-input {
    width: 100%;
    font-size: 1.5rem;
    font-weight: 700;
    padding: var(--spacing-xl);
    border: 3px solid var(--gray-200);
    border-radius: var(--radius-xl);
    text-align: center;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .dark .amount-input {
    background: rgba(30, 41, 59, 0.9);
    border-color: var(--gray-600);
    color: var(--gray-100);
  }

  .amount-input:focus {
    border-color: var(--success-500);
    background: white;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  }

  .dark .amount-input:focus {
    background: var(--gray-800);
    border-color: var(--success-400);
  }

  .change-amount {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-lg);
    background: linear-gradient(135deg, var(--success-50), var(--success-100));
    color: var(--success-800);
    border-radius: var(--radius-lg);
    font-size: 1.125rem;
    font-weight: 600;
    text-align: center;
    border: 2px solid var(--success-200);
    animation: pulseChange 2s infinite;
  }

  .dark .change-amount {
    background: linear-gradient(135deg, var(--success-900), var(--success-800));
    color: var(--success-200);
    border-color: var(--success-600);
  }

  @keyframes pulseChange {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }

  /* Enhanced Process Sale Button */
  .process-sale-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xl);
    background: linear-gradient(135deg, var(--success-500), var(--success-600));
    color: white;
    border: none;
    border-radius: var(--radius-xl);
    font-size: 1.25rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  .process-sale-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transition: all 0.3s ease;
    transform: translate(-50%, -50%);
  }

  .process-sale-btn:hover:not(:disabled)::before {
    width: 300px;
    height: 300px;
  }

  .process-sale-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--success-600), var(--success-700));
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }

  .process-sale-btn:disabled {
    background: var(--gray-300);
    color: var(--gray-500);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .dark .process-sale-btn:disabled {
    background: var(--gray-600);
    color: var(--gray-400);
  }

  .process-sale-btn.processing {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    cursor: wait;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  /* Debug Panel */
  .debug-panel {
    position: fixed;
    top: var(--spacing-lg);
    right: var(--spacing-lg);
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.75rem;
    z-index: 1000;
    max-width: 350px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: var(--shadow-xl);
  }

  .debug-panel h4 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--success-400);
    font-size: 0.875rem;
  }

  .debug-info {
    display: grid;
    gap: 0.375rem;
  }

  .debug-info span {
    padding: 0.25rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
  }

  .close-debug {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    background: none;
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    line-height: 1;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
  }

  .close-debug:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .debug-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .theme-toggle {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-200);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dark .theme-toggle {
    background: rgba(30, 41, 59, 0.8);
    border-color: var(--gray-600);
    color: var(--gray-300);
  }

  .theme-toggle:hover {
    background: var(--gray-50);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .dark .theme-toggle:hover {
    background: var(--gray-700);
  }

  .debug-toggle {
    background: var(--gray-700);
    border: 1px solid var(--gray-600);
    color: white;
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  .debug-toggle:hover {
    background: var(--gray-600);
    border-color: var(--gray-500);
  }

  /* Error Indicator */
  .error-indicator {
    margin-top: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--error-50);
    color: var(--error-700);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    border-left: 4px solid var(--error-500);
    font-weight: 600;
  }

  .dark .error-indicator {
    background: var(--error-900);
    color: var(--error-200);
    border-left-color: var(--error-400);
  }

  /* Font Loading Indicator */
  .font-loading-indicator {
    margin-top: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--warning-50);
    color: var(--warning-800);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    text-align: center;
    border: 1px solid var(--warning-200);
  }

  .dark .font-loading-indicator {
    background: var(--warning-900);
    color: var(--warning-200);
    border-color: var(--warning-600);
  }

  /* Enhanced Empty State Buttons */
  .retry-search,
  .retry-load {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-sm) var(--spacing-xl);
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
  }

  .retry-search:hover,
  .retry-load:hover {
    background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .retry-load {
    background: linear-gradient(135deg, var(--success-500), var(--success-600));
    margin-left: var(--spacing-sm);
  }

  .retry-load:hover {
    background: linear-gradient(135deg, var(--success-600), var(--success-700));
  }

  /* Enhanced Accessibility */
  .item-card:focus {
    outline: 3px solid var(--primary-500);
    outline-offset: 2px;
  }

  [role="status"] {
    position: relative;
  }

  /* Tooltip for accessibility */
  [aria-label]:focus::after {
    content: attr(aria-label);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    box-shadow: var(--shadow-lg);
  }

  /* High Contrast Mode Support */
  @media (prefers-contrast: high) {
    .item-card {
      border: 2px solid;
    }
    
    .add-btn {
      border: 2px solid transparent;
    }
    
    .add-btn:not(.disabled) {
      border-color: currentColor;
    }
    
    .cart-section,
    .customer-section,
    .payment-section {
      border: 2px solid;
    }
  }

  /* Reduced Motion Support */
  @media (prefers-reduced-motion: reduce) {
    .animate-fade-in {
      animation: none;
      opacity: 1;
    }
    
    .items-section,
    .cart-section {
      transition: none;
      opacity: 1;
      transform: none;
    }
    
    .spin {
      animation: none;
    }
    
    .change-amount {
      animation: pulseChange 2s infinite;
    }
    
    * {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }

  /* Dark Mode Support */
  @media (prefers-color-scheme: dark) {
    .pos-container:not(.dark) {
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-900: #111827;
    }
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .pos-layout {
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }

    .cart-section {
      position: static;
      max-height: none;
    }

    .items-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .pos-container {
      background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
    }

    .pos-header {
      margin: var(--spacing-md);
      padding: var(--spacing-lg);
    }

    .header-content {
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .title-section h1 {
      font-size: 2rem;
    }

    .cart-summary {
      flex-direction: row;
      gap: var(--spacing-md);
      width: 100%;
      justify-content: center;
    }

    .pos-layout {
      padding: 0 var(--spacing-md);
    }

    .items-grid {
      grid-template-columns: 1fr;
    }

    .cart-item {
      grid-template-columns: 1fr;
      gap: var(--spacing-sm);
      text-align: center;
    }

    .cart-item .item-details {
      margin-bottom: var(--spacing-sm);
    }

    .quantity-controls {
      justify-content: center;
    }

    .payment-methods {
      grid-template-columns: 1fr;
    }

    .debug-panel {
      position: relative;
      top: auto;
      right: auto;
      margin: var(--spacing-md);
      max-width: none;
    }
  }

  @media (max-width: 480px) {
    .pos-header {
      margin: var(--spacing-sm);
      padding: var(--spacing-md);
    }

    .title-section h1 {
      font-size: 1.75rem;
    }

    .title-section p {
      font-size: 1rem;
    }

    .cart-summary {
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .cart-count,
    .cart-total {
      padding: var(--spacing-md) var(--spacing-lg);
    }

    .pos-layout {
      padding: 0 var(--spacing-sm);
    }

    .search-input {
      font-size: 1rem;
    }

    .items-grid {
      gap: var(--spacing-md);
    }

    .item-card {
      padding: var(--spacing-lg);
    }

    .cart-section {
      padding: var(--spacing-lg);
    }

    .customer-section,
    .payment-section {
      padding: var(--spacing-lg);
    }

    .amount-input {
      font-size: 1.25rem;
      padding: var(--spacing-lg);
    }

    .process-sale-btn {
      font-size: 1.125rem;
      padding: var(--spacing-lg);
    }
  }
</style>
