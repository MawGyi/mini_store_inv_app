<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService } from '../services/api';
  import NotificationToast from './NotificationToast.svelte';

  export let onInventoryUpdate: (item: any) => void;
  export let editItem: any = null;

  let formData = {
    name: '',
    price: 0,
    cost: 0,
    stock: 0,
    category: '',
    description: '',
    barcode: '',
    image: ''
  };

  let categories: any[] = [];
  let loading = false;
  let submitting = false;
  let error: string | null = null;
  let success: string | null = null;
  let isEditMode = false;

  onMount(async () => {
    await loadCategories();
    if (editItem) {
      isEditMode = true;
      formData = {
        name: editItem.name || '',
        price: editItem.price || 0,
        cost: editItem.cost || 0,
        stock: editItem.stock || 0,
        category: editItem.category?._id || '',
        description: editItem.description || '',
        barcode: editItem.barcode || '',
        image: editItem.image || ''
      };
    }
  });

  async function loadCategories() {
    try {
      loading = true;
      const response = await apiService.getCategories();
      if (response.success) {
        categories = Array.isArray(response.data) ? response.data : [];
        console.log('Categories loaded:', categories);
      } else {
        throw new Error(response.message || 'Failed to load categories');
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      error = err.message || 'အမျိုးအစားများကို မရယူနိုင်ပါ';
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    try {
      submitting = true;
      error = null;

      // Validation
      if (!formData.name.trim()) {
        error = 'ပစ္စည်းအမည် ဖြည့်ရန်လိုအပ်ပါသည်';
        return;
      }

      if (formData.price <= 0) {
        error = 'ဈေးနှုန်း 0 ထက်မြင့်ရန်လိုအပ်ပါသည်';
        return;
      }

      if (formData.cost < 0) {
        error = 'ကုန်ကျစရိတ် 0 ထက်နည်းမဖြစ်ပါ';
        return;
      }

      if (formData.stock < 0) {
        error = 'လက်ကျန်အရေအတွက် 0 ထက်နည်းမဖြစ်ပါ';
        return;
      }

      if (!formData.category) {
        error = 'အမျိုးအစား ရွေးချယ်ရန်လိုအပ်ပါသည်';
        return;
      }

      const itemData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        barcode: formData.barcode.trim()
      };

      let response;
      if (isEditMode && editItem) {
        response = await apiService.updateItem(editItem._id, itemData);
      } else {
        response = await apiService.createItem(itemData);
      }

      if (response.success) {
        success = isEditMode 
          ? 'ပစ္စည်းအားလုံး အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ'
          : 'ပစ္စည်းအားလုံး အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ';
        
        // Ensure we pass the correct data structure to parent
        const resultData = response.data || { ...itemData, name: formData.name };
        console.log('Calling onInventoryUpdate with:', resultData);
        onInventoryUpdate(resultData);
        
        if (!isEditMode) {
          resetForm();
        }
        
        setTimeout(() => success = null, 3000);
      } else {
        throw new Error(response.message || 'Operation failed');
      }
    } catch (err: any) {
      console.error('Operation failed:', err);
      error = err.message || 'လုပ်ဆောင်ချက် မအောင်မြင်ပါ';
    } finally {
      submitting = false;
    }
  }

  function resetForm() {
    formData = {
      name: '',
      price: 0,
      cost: 0,
      stock: 0,
      category: '',
      description: '',
      barcode: '',
      image: ''
    };
  }

  function handleImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        formData.image = e.target?.result as string;
      };
      reader.readAsDataURL(file);
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
</script>

<div class="inventory-form">
  {#if success}
    <NotificationToast type="success" message={success} id={`success-${Date.now()}`} />
  {/if}
  
  {#if error}
    <NotificationToast type="error" message={error} id={`error-${Date.now()}`} />
  {/if}

  <div class="form-header">
    <h2>{isEditMode ? 'ပစ္စည်းပြင်ဆင်ခြင်း' : 'ပစ္စည်းအသစ်ထည့်ခြင်း'}</h2>
    <p>{isEditMode ? 'ပစ္စည်းအချက်အလက်များကို ပြင်ဆင်ပါ' : 'အသစ်ပစ္စည်းအသစ်ကို ထည့်သွင်းပါ'}</p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="form-content">
    <div class="form-grid">
      <div class="form-group">
        <label for="name">ပစ္စည်းအမည် *</label>
        <input 
          id="name" 
          type="text" 
          bind:value={formData.name} 
          required
          class="form-input"
          placeholder="ပစ္စည်းအမည် ရိုက်ထည့်ပါ"
        />
      </div>

      <div class="form-group">
        <label for="category">အမျိုးအစား *</label>
        {#if loading}
          <div class="loading-select">Loading...</div>
        {:else}
          <select id="category" bind:value={formData.category} required class="form-select">
            <option value="">အမျိုးအစား ရွေးချယ်ပါ</option>
            {#each categories as category}
              <option value={category._id}>{category.category_name_my}</option>
            {/each}
          </select>
        {/if}
      </div>

      <div class="form-group">
        <label for="price">ရောင်းဈေး *</label>
        <input 
          id="price" 
          type="number" 
          bind:value={formData.price} 
          min="0" 
          step="0.01"
          required
          class="form-input"
          placeholder="0"
        />
      </div>

      <div class="form-group">
        <label for="cost">ကုန်ကျစရိတ် *</label>
        <input 
          id="cost" 
          type="number" 
          bind:value={formData.cost} 
          min="0" 
          step="0.01"
          required
          class="form-input"
          placeholder="0"
        />
      </div>

      <div class="form-group">
        <label for="stock">လက်ကျန်အရေအတွက် *</label>
        <input 
          id="stock" 
          type="number" 
          bind:value={formData.stock} 
          min="0" 
          required
          class="form-input"
          placeholder="0"
        />
      </div>

      <div class="form-group">
        <label for="barcode">ဘားကုဒ်</label>
        <input 
          id="barcode" 
          type="text" 
          bind:value={formData.barcode} 
          class="form-input"
          placeholder="ဘားကုဒ် ရိုက်ထည့်ပါ"
        />
      </div>
    </div>

    <div class="form-group full-width">
      <label for="description">ဖော်ပြချက်</label>
      <textarea 
        id="description" 
        bind:value={formData.description} 
        rows="3"
        class="form-textarea"
        placeholder="ပစ္စည်းအကြောင်းအရာ ဖော်ပြချက်"
      ></textarea>
    </div>

    <div class="form-group full-width">
      <label for="image">ပုံထည့်ခြင်း</label>
      <div class="image-upload">
        {#if formData.image}
          <div class="image-preview">
            <img src={formData.image} alt="Item preview" />
            <button type="button" class="remove-image" on:click={() => formData.image = ''}>✕</button>
          </div>
        {:else}
          <div class="upload-placeholder">
            <input 
              type="file" 
              id="image" 
              accept="image/*" 
              on:change={handleImageUpload}
              class="file-input"
            />
            <div class="upload-icon">📷</div>
            <p>ပုံထည့်ရန် နှိပ်ပါ</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="form-actions">
      <button 
        type="submit" 
        class="submit-btn"
        disabled={submitting || loading}
      >
        {submitting ? 'လုပ်ဆောင်နေသည်...' : (isEditMode ? 'ပြင်ဆင်မည်' : 'ထည့်သွင်းမည်')}
      </button>
      
      {#if !isEditMode}
        <button 
          type="button" 
          class="reset-btn"
          on:click={resetForm}
          disabled={submitting}
        >
          ပြန်စမည်
        </button>
      {/if}
    </div>
  </form>
</div>

<style>
  .inventory-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .form-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .form-header h2 {
    color: #1f2937;
    margin-bottom: 8px;
  }

  .form-header p {
    color: #6b7280;
  }

  .form-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  label {
    font-weight: 600;
    margin-bottom: 8px;
    color: #374151;
  }

  .form-input,
  .form-select,
  .form-textarea {
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.2s;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }

  .loading-select {
    padding: 12px;
    background: #f3f4f6;
    border-radius: 6px;
    color: #6b7280;
  }

  .image-upload {
    margin-top: 8px;
  }

  .image-preview {
    position: relative;
    display: inline-block;
  }

  .image-preview img {
    max-width: 200px;
    max-height: 200px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .remove-image {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .upload-placeholder {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .upload-placeholder:hover {
    border-color: #3b82f6;
  }

  .file-input {
    display: none;
  }

  .upload-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 30px;
  }

  .submit-btn,
  .reset-btn {
    flex: 1;
    padding: 16px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .submit-btn {
    background: #059669;
    color: white;
  }

  .submit-btn:hover:not(:disabled) {
    background: #047857;
  }

  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .reset-btn {
    background: #6b7280;
    color: white;
  }

  .reset-btn:hover:not(:disabled) {
    background: #4b5563;
  }

  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .form-content {
      padding: 20px;
    }
    
    .form-actions {
      flex-direction: column;
    }
  }
</style>
