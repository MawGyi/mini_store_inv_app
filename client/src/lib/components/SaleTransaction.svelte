<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService } from '../services/api';
  import POSItemSearch from './POSItemSearch.svelte';
  import NotificationToast from './NotificationToast.svelte';

  export let onSaleComplete: (sale: any) => void;

  interface CartItem {
    item: any;
    quantity: number;
    subtotal: number;
  }

  let cart: CartItem[] = [];
  let paymentMethod = 'cash';
  let customerName = '';
  let customerPhone = '';
  let discount = 0;
  let loading = false;
  let error: string | null = null;
  let success: string | null = null;
  let showReceipt = false;
  let currentSale: any = null;

  $: subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  $: total = Math.max(0, subtotal - discount);

  function addToCart(item: any) {
    const existingItem = cart.find(cartItem => cartItem.item._id === item._id);
    
    if (existingItem) {
      if (existingItem.quantity < item.stock) {
        existingItem.quantity += 1;
        existingItem.subtotal = existingItem.quantity * item.price;
      } else {
        error = `${item.name} သည် လက်ကျန်မလုံလောက်ပါ`;
        setTimeout(() => error = null, 3000);
        return;
      }
    } else {
      cart = [...cart, {
        item,
        quantity: 1,
        subtotal: item.price
      }];
    }
  }

  function removeFromCart(index: number) {
    cart = cart.filter((_, i) => i !== index);
  }

  function updateQuantity(index: number, newQuantity: number) {
    const cartItem = cart[index];
    if (newQuantity <= 0) {
      removeFromCart(index);
    } else if (newQuantity <= cartItem.item.stock) {
      cart[index].quantity = newQuantity;
      cart[index].subtotal = newQuantity * cartItem.item.price;
      cart = [...cart];
    } else {
      error = `${cartItem.item.name} သည် လက်ကျန်မလုံလောက်ပါ`;
      setTimeout(() => error = null, 3000);
    }
  }

  async function completeSale() {
    if (cart.length === 0) {
      error = 'ကတ်ထဲတွင် ပစ္စည်းမရှိပါ';
      return;
    }

    if (total <= 0) {
      error = 'စုစုပေါင်းငွေပမာဏ မမှန်ကန်ပါ';
      return;
    }

    try {
      loading = true;
      error = null;

      const saleData = {
        items: cart.map(item => ({
          item: item.item._id,
          quantity: item.quantity,
          price: item.item.price
        })),
        totalAmount: total,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        discount
      };

      const response = await apiService.createSale(saleData);

      if (response.success) {
        currentSale = response.data;
        showReceipt = true;
        success = 'အရောင်းအားလုံး အောင်မြင်စွာ ပြီးစီးပါသည်';
        
        cart = [];
        customerName = '';
        customerPhone = '';
        discount = 0;
        
        onSaleComplete(currentSale);
        
        setTimeout(() => {
          success = null;
        }, 3000);
      } else {
        throw new Error(response.message || 'Sale creation failed');
      }
    } catch (err: any) {
      console.error('Sale creation failed:', err);
      error = err.message || 'အရောင်းပြုလုပ်ခြင်း မအောင်မြင်ပါ';
    } finally {
      loading = false;
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('my-MM', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function printReceipt() {
    if (!currentSale) return;
    
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
          <h2>Seinsus Store</h2>
          <p>Invoice: ${currentSale.invoiceNumber}</p>
          <p>Date: ${new Date(currentSale.createdAt).toLocaleDateString('my-MM')}</p>
        </div>
        
        <div style="margin-bottom: 10px;">
          ${currentSale.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>${item.item.name} x${item.quantity}</span>
              <span>${formatCurrency(item.quantity * item.price)}</span>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 2px dashed #000; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Total:</span>
            <span>${formatCurrency(currentSale.totalAmount)}</span>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px;">
            <p>Thank you for shopping with us!</p>
          </div>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }
</script>

<div class="sale-transaction">
  {#if success}
    <NotificationToast type="success" message={success} id={`success-${Date.now()}`} />
  {/if}
  
  {#if error}
    <NotificationToast type="error" message={error} id={`error-${Date.now()}`} />
  {/if}

  <div class="transaction-header">
    <h2>အရောင်းပြုလုပ်မှု</h2>
    <p>ပစ္စည်းများကို ရွေးချယ်ပြီး အရောင်းပြုလုပ်ပါ</p>
  </div>

  <div class="transaction-content">
    <div class="search-section">
      <h3>ပစ္စည်းရှာဖွေခြင်း</h3>
      <POSItemSearch onItemSelect={addToCart} />
    </div>

    {#if cart.length > 0}
      <div class="cart-section">
        <h3>ကတ်ထဲရှိပစ္စည်းများ</h3>
        <div class="cart-items">
          {#each cart as cartItem, index}
            <div class="cart-item">
              <div class="item-info">
                <div class="item-name">{cartItem.item.name}</div>
                <div class="item-price">{formatCurrency(cartItem.item.price)}</div>
              </div>
              <div class="item-controls">
                <button 
                  class="quantity-btn" 
                  on:click={() => updateQuantity(index, cartItem.quantity - 1)}
                  disabled={cartItem.quantity <= 1}
                >
                  -
                </button>
                <span class="quantity">{cartItem.quantity}</span>
                <button 
                  class="quantity-btn" 
                  on:click={() => updateQuantity(index, cartItem.quantity + 1)}
                  disabled={cartItem.quantity >= cartItem.item.stock}
                >
                  +
                </button>
                <button class="remove-btn" on:click={() => removeFromCart(index)}>
                  ✕
                </button>
              </div>
              <div class="item-subtotal">
                {formatCurrency(cartItem.subtotal)}
              </div>
            </div>
          {/each}
        </div>

        <div class="cart-summary">
          <div class="summary-row">
            <span>စုစုပေါင်း:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          <div class="summary-row">
            <label for="discount">လျှော့ဈေး:</label>
            <input 
              id="discount" 
              type="number" 
              bind:value={discount} 
              min="0" 
              max={subtotal}
              class="discount-input"
            />
          </div>

          <div class="summary-row total">
            <span>ဖောက်သည်ပေးရန်ငွေ:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div class="customer-info">
          <h4>ဖောက်သည်အချက်အလက် (မဖြစ်မနေ)</h4>
          <div class="form-row">
            <input 
              type="text" 
              bind:value={customerName} 
              placeholder="အမည်"
              class="form-input"
            />
            <input 
              type="tel" 
              bind:value={customerPhone} 
              placeholder="ဖုန်းနံပါတ်"
              class="form-input"
            />
          </div>
        </div>

        <div class="payment-section">
          <h4>ငွေပေးချေမှု</h4>
          <select bind:value={paymentMethod} class="payment-select">
            <option value="cash">ငွ现款</option>
            <option value="credit">အကြွေး</option>
            <option value="transfer">ငွေလွှဲ</option>
          </select>
        </div>

        <button 
          class="complete-sale-btn" 
          on:click={completeSale}
          disabled={loading || cart.length === 0}
        >
          {loading ? 'လုပ်ဆောင်နေသည်...' : 'အရောင်းပြီးစီးမည်'}
        </button>
      </div>
    {:else}
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>ကတ်ထဲတွင် ပစ္စည်းမရှိပါ</p>
        <p>အထက်ရှိ ရှာဖွေမှုဖြင့် ပစ္စည်းများကို ရွေးချယ်ပါ</p>
      </div>
    {/if}
  </div>

  <!-- Receipt Modal -->
  {#if showReceipt && currentSale}
    <div class="receipt-modal">
      <div class="receipt-content">
        <div class="receipt-header">
          <h3>အရောင်းလက်ခံစာ</h3>
          <button class="close-btn" on:click={() => showReceipt = false}>✕</button>
        </div>
        
        <div class="receipt-details">
          <div class="invoice-info">
            <p><strong>Invoice:</strong> {currentSale.invoiceNumber}</p>
            <p><strong>Date:</strong> {new Date(currentSale.createdAt).toLocaleDateString('my-MM')}</p>
          </div>
          
          <div class="receipt-items">
            {#each currentSale.items as item}
              <div class="receipt-item">
                <span>{item.item.name} x{item.quantity}</span>
                <span>{formatCurrency(item.quantity * item.price)}</span>
              </div>
            {/each}
          </div>
          
          <div class="receipt-total">
            <div><strong>Total:</strong> {formatCurrency(currentSale.totalAmount)}</div>
            <div><strong>Payment:</strong> {paymentMethod === 'cash' ? 'ငွ现款' : paymentMethod === 'credit' ? 'အကြွေး' : 'ငွေလွှဲ'}</div>
          </div>
        </div>
        
        <div class="receipt-actions">
          <button class="print-btn" on:click={printReceipt}>
            🖨️ ပရင့်မည်
          </button>
          <button class="close-receipt-btn" on:click={() => showReceipt = false}>
            ပိတ်မည်
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .sale-transaction {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .transaction-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .transaction-header h2 {
    color: #1f2937;
    margin-bottom: 8px;
  }

  .transaction-header p {
    color: #6b7280;
  }

  .transaction-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .search-section h3,
  .cart-section h3 {
    margin-bottom: 16px;
    color: #1f2937;
  }

  .cart-items {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .cart-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .item-info {
    flex: 1;
  }

  .item-name {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .item-price {
    color: #059669;
    font-size: 14px;
  }

  .item-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 16px;
  }

  .quantity-btn {
    width: 30px;
    height: 30px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .quantity-btn:hover:not(:disabled) {
    background: #f9fafb;
  }

  .quantity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quantity {
    min-width: 30px;
    text-align: center;
    font-weight: 600;
  }

  .remove-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 4px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .item-subtotal {
    font-weight: 600;
    color: #1f2937;
    min-width: 80px;
    text-align: right;
  }

  .cart-summary {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .summary-row.total {
    font-size: 18px;
    font-weight: bold;
    border-top: 2px solid #e5e7eb;
    padding-top: 12px;
    margin-top: 12px;
  }

  .discount-input {
    width: 100px;
    padding: 4px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
  }

  .customer-info,
  .payment-section {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .form-row {
    display: flex;
    gap: 12px;
  }

  .form-input,
  .payment-select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
  }

  .complete-sale-btn {
    width: 100%;
    padding: 16px;
    background: #059669;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .complete-sale-btn:hover:not(:disabled) {
    background: #047857;
  }

  .complete-sale-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .empty-cart {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .receipt-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .receipt-content {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
  }

  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
  }

  .receipt-details {
    padding: 20px;
  }

  .invoice-info {
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
  }

  .receipt-items {
    margin-bottom: 20px;
  }

  .receipt-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .receipt-total {
    border-top: 1px solid #e5e7eb;
    padding-top: 10px;
    font-weight: bold;
  }

  .receipt-actions {
    display: flex;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid #e5e7eb;
  }

  .print-btn,
  .close-receipt-btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .print-btn {
    background: #3b82f6;
    color: white;
  }

  .close-receipt-btn {
    background: #6b7280;
    color: white;
  }

  @media (max-width: 640px) {
    .form-row {
      flex-direction: column;
    }
    
    .cart-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .item-subtotal {
      align-self: flex-end;
    }
  }
</style>
