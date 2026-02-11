<script lang="ts">
  import { items as itemsStore } from "$lib/stores";
  import type { Item } from "$lib/types";
  import { onMount } from "svelte";
  import AdvancedSearch from "./AdvancedSearch.svelte";
  import SkeletonLoader from "./SkeletonLoader.svelte";
  import { settings, formatCurrency, currencySymbol } from '$lib/stores/settings';

  let searchQuery = "";
  let filteredItems: Item[] = [];
  let loading = false;
  let error: string | null = null;
  let sortBy = "name";
  let sortOrder: "asc" | "desc" = "asc";
  let filterStatus = "all";
  let filterStock = "all";
  let showAddModal = false;
  let newItem = {
    name: "",
    itemCode: "",
    price: "",
    stockQuantity: "",
    lowStockThreshold: 5,
  };
  let formError: string | null = null;
  let showEditModal = false;
  let editItem: Item | null = null;
  let editForm = {
    name: "",
    itemCode: "",
    price: "",
    stockQuantity: "",
    lowStockThreshold: 5,
  };
  let editFormError: string | null = null;

  let currentPage = 1;
  let totalPages = 1;
  let totalItems = 0;
  let itemsPerPage = 10;
  let apiItems: Item[] = [];

  onMount(async () => {
    await loadItems(currentPage);
  });

  async function loadItems(page: number) {
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/items?page=${page}&limit=${itemsPerPage}`);
      const data = await res.json();
      if (data.success) {
        apiItems = data.data;
        itemsPerPage = data.pagination.limit;
        totalItems = data.pagination.total;
        totalPages = data.pagination.totalPages;
        currentPage = data.pagination.page;
        itemsStore.set(apiItems);
      } else {
        error = 'Failed to load items';
      }
    } catch (err) {
      error = 'Error loading items';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function changePage(page: number) {
    if (page >= 1 && page <= totalPages) {
      loadItems(page);
    }
  }

  function exportToCsv() {
    window.open('/api/export/items', '_blank');
  }

  // Event handlers for parent component
  function handleEdit(item: Item) {
    // Dispatch custom event
    const event = new CustomEvent("edit", { detail: item });
    document.dispatchEvent(event);
  }

  function handleDeleteEvent(item: Item) {
    const event = new CustomEvent("delete", { detail: item });
    document.dispatchEvent(event);
  }

  function handleSaleEvent(item: Item) {
    const event = new CustomEvent("sale", { detail: item });
    document.dispatchEvent(event);
  }

  function handleAdvancedSearch(event: CustomEvent) {
    const {
      searchQuery: query,
      sortBy: sort,
      sortOrder: order,
      filterStatus: status,
      filterStock: stock,
    } = event.detail;
    searchQuery = query;
    sortBy = sort;
    sortOrder = order;
    filterStatus = status;
    filterStock = stock;
    filterAndSortItems();
  }

  function filterAndSortItems() {
    let filtered = [...$itemsStore];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => {
        if (filterStatus === "available")
          return !isLowStock(item) && !isOutOfStock(item);
        if (filterStatus === "low-stock")
          return isLowStock(item) && !isOutOfStock(item);
        if (filterStatus === "out-of-stock") return isOutOfStock(item);
        return true;
      });
    }

    // Apply stock level filter
    if (filterStock !== "all") {
      filtered = filtered.filter((item) => {
        if (filterStock === "high") return item.stockQuantity > 20;
        if (filterStock === "medium")
          return item.stockQuantity >= 6 && item.stockQuantity <= 20;
        if (filterStock === "low")
          return item.stockQuantity >= 1 && item.stockQuantity <= 5;
        if (filterStock === "out") return item.stockQuantity === 0;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Item];
      let bValue: any = b[sortBy as keyof Item];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    filteredItems = filtered;
  }

  $: {
    if (apiItems.length > 0) {
      filterAndSortItems();
    }
  }

  function isLowStock(item: Item): boolean {
    const threshold = item.lowStockThreshold ?? 5;
    return item.stockQuantity <= threshold;
  }

  function isOutOfStock(item: Item): boolean {
    return item.stockQuantity === 0;
  }

  async function handleDelete(item: Item) {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      try {
        loading = true;
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/items/${item.id}`,
          {
            method: "DELETE",
          },
        );

          if (response.ok) {
            // Remove from store
            itemsStore.update((currentItems) =>
              currentItems.filter((i) => i.id !== item.id),
            );
          handleDeleteEvent(item);
        } else {
          error = "Failed to delete item";
        }
      } catch (err) {
        error = "Error deleting item";
      } finally {
        loading = false;
      }
    }
  }

  async function handleSale(item: Item) {
    const quantity = prompt(
      `Enter quantity to sell for ${item.name} (max: ${item.stockQuantity}):`,
    );
    if (quantity && !isNaN(Number(quantity))) {
      const qty = Number(quantity);
      if (qty > 0 && qty <= item.stockQuantity) {
        try {
          loading = true;
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/sales`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                itemId: item.id,
                quantity: qty,
              }),
            },
          );

          if (response.ok) {
            // Refresh items to get updated stock
            const itemsResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/api/items`,
            );
            if (itemsResponse.ok) {
              const updatedItems = await itemsResponse.json();
              itemsStore.set(updatedItems);
            }
            handleSaleEvent(item);
          } else {
            error = "Failed to record sale";
          }
        } catch (err) {
          error = "Error recording sale";
        } finally {
          loading = false;
        }
      } else {
        error = "Invalid quantity";
      }
    }
  }

  async function addItem() {
    formError = null;
    if (
      !newItem.name ||
      !newItem.itemCode ||
      !newItem.price ||
      !newItem.stockQuantity
    ) {
      formError = "Please fill in all required fields.";
      return;
    }
    loading = true;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newItem.name,
            itemCode: newItem.itemCode,
            price: Number(newItem.price),
            stockQuantity: Number(newItem.stockQuantity),
            lowStockThreshold: Number(newItem.lowStockThreshold) || 5,
          }),
        },
      );
      if (response.ok) {
        const created = await response.json();
        itemsStore.update((current) => [created, ...current]);
        showAddModal = false;
        newItem = {
          name: "",
          itemCode: "",
          price: "",
          stockQuantity: "",
          lowStockThreshold: 5,
        };
      } else {
        const err = await response.json();
        formError = err.message || "Failed to add item.";
      }
    } catch (e) {
      formError = "Network error.";
    } finally {
      loading = false;
    }
  }

  function openEditModal(item: Item) {
    editItem = item;
    editForm = {
      name: item.name,
      itemCode: item.itemCode,
      price: item.price.toString(),
      stockQuantity: item.stockQuantity.toString(),
      lowStockThreshold: item.lowStockThreshold ?? 5,
    };
    editFormError = null;
    showEditModal = true;
  }

  async function updateItem() {
    if (!editItem) return;
    editFormError = null;
    if (
      !editForm.name ||
      !editForm.itemCode ||
      !editForm.price ||
      !editForm.stockQuantity
    ) {
      editFormError = "Please fill in all required fields.";
      return;
    }
    loading = true;
    try {
      const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/items/${editItem.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editForm.name,
            itemCode: editForm.itemCode,
            price: Number(editForm.price),
            stockQuantity: Number(editForm.stockQuantity),
            lowStockThreshold: Number(editForm.lowStockThreshold) || 5,
          }),
        },
      );
      if (response.ok) {
        const updated = await response.json();
        itemsStore.update((current) =>
            current.map((i) => (i.id === updated.id ? updated : i)),
        );
        showEditModal = false;
        editItem = null;
      } else {
        const err = await response.json();
        editFormError = err.message || "Failed to update item.";
      }
    } catch (e) {
      editFormError = "Network error.";
    } finally {
      loading = false;
    }
  }
</script>

<div class="inventory-list">
  <!-- Header Section -->
  <div class="inventory-header">
    <div class="header-content">
      <h2>Inventory</h2>
      <div class="header-actions">
        {#if $itemsStore.length > 0}
          <button
            class="btn btn-secondary"
            on:click={exportToCsv}
            aria-label="Export to CSV"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button
            class="btn btn-primary icon-hover-effect"
            on:click={() => (showAddModal = true)}
            aria-label="Add new item">Add Item</button
          >
        {/if}
      </div>
    </div>
  </div>

  <!-- Advanced Search and Filters -->
  <AdvancedSearch
    bind:searchQuery
    bind:sortBy
    bind:sortOrder
    bind:filterStatus
    bind:filterStock
    on:search={handleAdvancedSearch}
  />

  <!-- Search Stats -->
  <div class="search-stats">
    <span class="stat-badge">
      {filteredItems.length} of {$itemsStore.length} items
    </span>
  </div>

  <!-- Loading State -->
  {#if loading && $itemsStore.length === 0}
    <div class="loading-state">
      <div class="loading-header">
        <SkeletonLoader type="text" width="200px" height="24px" />
        <SkeletonLoader type="text" width="150px" height="16px" />
      </div>
      <div class="loading-table">
        <div class="skeleton-table-header">
          <SkeletonLoader type="text" width="15%" height="16px" customClass="hidden md:table-cell" />
          <SkeletonLoader type="text" width="25%" height="16px" />
          <SkeletonLoader type="text" width="15%" height="16px" customClass="hidden lg:table-cell" />
          <SkeletonLoader type="text" width="20%" height="16px" />
          <SkeletonLoader type="text" width="15%" height="16px" customClass="hidden lg:table-cell" />
          <SkeletonLoader type="text" width="10%" height="16px" />
        </div>
        {#each Array(5) as _, i}
          <div class="skeleton-table-row">
            <div class="skeleton-cell hidden md:table-cell" style="width: 15%" data-label="Item Code">
              <SkeletonLoader type="text" width="100%" height="16px" />
            </div>
            <div class="skeleton-cell" style="width: 25%" data-label="Name">
              <SkeletonLoader type="text" width="100%" height="16px" />
            </div>
            <div class="skeleton-cell hidden lg:table-cell" style="width: 15%" data-label="Price">
              <SkeletonLoader type="text" width="100%" height="16px" />
            </div>
            <div class="skeleton-cell" style="width: 20%" data-label="Stock">
              <SkeletonLoader type="text" width="100%" height="16px" />
            </div>
            <div class="skeleton-cell hidden lg:table-cell" style="width: 15%" data-label="Status">
              <SkeletonLoader type="text" width="100%" height="16px" />
            </div>
            <div class="skeleton-cell" style="width: 10%" data-label="Actions">
              <SkeletonLoader type="text" width="60px" height="16px" />
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Error Message -->
  {#if error}
    <div class="error-message">
      <div class="error-content">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
            fill="currentColor"
          />
        </svg>
        <span>{error}</span>
      </div>
      <button
        class="error-close"
        on:click={() => (error = null)}
        aria-label="Close error message"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  {/if}

  <!-- Inventory Table -->
  <div class="table-container">
    {#if showAddModal}
      <button
        class="modal-backdrop"
        on:click={() => (showAddModal = false)}
        on:keydown={(e) => {
          if (e.key === "Escape") showAddModal = false;
        }}
        aria-label="Close modal"
        tabindex="0"
      ></button>
      <div
        class="modal"
        role="dialog"
        aria-labelledby="modal-title-add"
        on:click|stopPropagation
      >
        <h3 id="modal-title-add">Add New Item</h3>
        <form on:submit|preventDefault={addItem} class="modal-form">
          <div class="form-group">
            <label for="name">Name*</label>
            <input id="name" type="text" bind:value={newItem.name} required />
          </div>
          <div class="form-group">
            <label for="itemCode">Item Code*</label>
            <input
              id="itemCode"
              type="text"
              bind:value={newItem.itemCode}
              required
            />
          </div>
            <div class="form-group">
              <label for="price">Price*</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none select-none whitespace-nowrap {currencySymbol($settings.currency).length > 1 ? 'text-sm' : ''}">
                  {currencySymbol($settings.currency)}
                </span>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  bind:value={newItem.price}
                   class="input {currencySymbol($settings.currency).length === 3 ? 'pl-16' : currencySymbol($settings.currency).length > 1 ? 'pl-14' : 'pl-10'}"
                  required
                />
              </div>
            </div>
          <div class="form-group">
            <label for="stockQuantity">Stock Quantity*</label>
            <input
              id="stockQuantity"
              type="number"
              min="0"
              step="1"
              bind:value={newItem.stockQuantity}
              required
            />
          </div>
          <div class="form-group">
            <label for="lowStockThreshold">Low Stock Threshold</label>
            <input
              id="lowStockThreshold"
              type="number"
              min="1"
              step="1"
              bind:value={newItem.lowStockThreshold}
            />
          </div>
          {#if formError}
            <div class="form-error">{formError}</div>
          {/if}
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={() => (showAddModal = false)}>Cancel</button
            >
            <button type="submit" class="btn btn-primary" disabled={loading}
              >{loading ? "Saving..." : "Save Item"}</button
            >
          </div>
        </form>
      </div>
    {/if}
    {#if showEditModal}
      <button
        class="modal-backdrop"
        on:click={() => (showEditModal = false)}
        on:keydown={(e) => {
          if (e.key === "Escape") showEditModal = false;
        }}
        aria-label="Close modal"
        tabindex="0"
      ></button>
      <div
        class="modal"
        role="dialog"
        aria-labelledby="modal-title-edit"
        on:click|stopPropagation
      >
        <h3 id="modal-title-edit">Edit Item</h3>
        <form on:submit|preventDefault={updateItem} class="modal-form">
          <div class="form-group">
            <label for="edit-name">Name*</label>
            <input
              id="edit-name"
              type="text"
              bind:value={editForm.name}
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-itemCode">Item Code*</label>
            <input
              id="edit-itemCode"
              type="text"
              bind:value={editForm.itemCode}
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-price">Price*</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none select-none whitespace-nowrap {currencySymbol($settings.currency).length > 1 ? 'text-sm' : ''}">
                {currencySymbol($settings.currency)}
              </span>
              <input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                bind:value={editForm.price}
                 class="input {currencySymbol($settings.currency).length === 3 ? 'pl-16' : currencySymbol($settings.currency).length > 1 ? 'pl-14' : 'pl-10'}"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label for="edit-stockQuantity">Stock Quantity*</label>
            <input
              id="edit-stockQuantity"
              type="number"
              min="0"
              step="1"
              bind:value={editForm.stockQuantity}
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-lowStockThreshold">Low Stock Threshold</label>
            <input
              id="edit-lowStockThreshold"
              type="number"
              min="1"
              step="1"
              bind:value={editForm.lowStockThreshold}
            />
          </div>
          {#if editFormError}
            <div class="form-error">{editFormError}</div>
          {/if}
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={() => (showEditModal = false)}>Cancel</button
            >
            <button type="submit" class="btn btn-primary" disabled={loading}
              >{loading ? "Saving..." : "Save Changes"}</button
            >
          </div>
        </form>
      </div>
    {/if}
    {#if $itemsStore.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h3>No Items Found</h3>
        <p>Get started by adding your first inventory item</p>
        <div class="header-actions">
          <button
            class="btn btn-primary icon-hover-effect"
            on:click={() => (showAddModal = true)}
            aria-label="Add first item">Add First Item</button
          >
        </div>
      </div>
    {:else if filteredItems.length === 0 && !searchQuery}
      <div class="empty-state">
        <div class="empty-icon">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z"
              fill="currentColor"
            />
            <path
              d="M14 15l3-3-3-3"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h3>No Items Yet</h3>
        <p>Get started by adding your first item to the inventory</p>
        <button
          class="btn btn-primary add-first-item-btn"
          on:click={() => (showAddModal = true)}
          aria-label="Add item"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5v14m-7-7h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Add Item
        </button>
      </div>
    {:else if filteredItems.length === 0 && searchQuery}
      <div class="empty-state">
        <div class="empty-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h3>No Matching Items</h3>
        <p>No items match "{searchQuery}"</p>
        <button class="btn btn-secondary" on:click={() => (searchQuery = "")}
          >Clear Search</button
        >
      </div>
    {:else}
      <table class="table">
        <thead>
          <tr>
            <th class="hidden md:table-cell">Item Code</th>
            <th>Name</th>
            <th class="hidden lg:table-cell">Price</th>
            <th>Stock Level</th>
            <th class="hidden lg:table-cell">Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredItems as item, index}
            <tr
              class:low-stock={isLowStock(item)}
              class:out-of-stock={isOutOfStock(item)}
              class="row-hover"
            >
              <td class="hidden md:table-cell" data-label="Item Code">
                <div class="item-code">
                  <span class="code-badge">{item.itemCode}</span>
                </div>
              </td>
              <td data-label="Name">
                <div class="item-name">
                  <h4 class="item-title">{item.name}</h4>
                  <p class="item-description md:hidden">Code: {item.itemCode}</p>
                </div>
              </td>
              <td class="hidden lg:table-cell" data-label="Price">
                <div class="item-price">
                  <span class="price-amount">{formatCurrency(item.price)}</span>
                </div>
              </td>
              <td data-label="Stock">
                <div class="stock-level">
                  <div class="stock-quantity">
                    <span class="quantity-number">{item.stockQuantity}</span>
                    <span class="quantity-unit">units</span>
                  </div>
                  <div class="stock-indicator md:hidden">
                    {#if isLowStock(item) && !isOutOfStock(item)}
                      <span class="stock-badge warning">Low</span>
                    {:else if isOutOfStock(item)}
                      <span class="stock-badge danger">Out</span>
                    {:else}
                      <span class="stock-badge success">In</span>
                    {/if}
                  </div>
                  <div class="stock-indicator hidden md:block">
                    {#if isLowStock(item) && !isOutOfStock(item)}
                      <span class="stock-badge warning">Low Stock</span>
                    {:else if isOutOfStock(item)}
                      <span class="stock-badge danger">Out of Stock</span>
                    {:else}
                      <span class="stock-badge success">In Stock</span>
                    {/if}
                  </div>
                </div>
              </td>
              <td class="hidden lg:table-cell" data-label="Status">
                <div class="status-indicator">
                  {#if isOutOfStock(item)}
                    <span class="status-badge danger">Unavailable</span>
                  {:else if isLowStock(item)}
                    <span class="status-badge warning">Limited</span>
                  {:else}
                    <span class="status-badge success">Available</span>
                  {/if}
                </div>
              </td>
              <td data-label="Actions">
                <div class="action-buttons">
                  <button
                    class="btn btn-secondary btn-sm action-btn icon-hover-effect"
                    on:click={() => openEditModal(item)}
                    title="Edit item"
                    aria-label="Edit item"
                    data-testid="edit-button"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.586 4.586C18.9611 4.21071 19.4696 4 20 4C20.5304 4 21.0391 4.21071 21.4142 4.58579C21.7893 4.96086 22 5.46957 22 6C22 6.53043 21.7893 7.03914 21.4142 7.41421L11 17.828V22H7.172L18.586 4.586Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    class="btn btn-success btn-sm action-btn icon-hover-effect"
                    on:click={() => handleSaleEvent(item)}
                    title="Record sale"
                    aria-label="Record sale"
                    data-testid="sale-button"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    class="btn btn-danger btn-sm action-btn icon-hover-effect"
                    on:click={() => handleDelete(item)}
                    title="Delete item"
                    aria-label="Delete item"
                    data-testid="delete-button"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      {#if totalPages > 1}
        <div class="pagination-bar">
          <button
            class="btn btn-sm btn-secondary"
            on:click={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div class="pagination-pages">
            {#each Array(totalPages) as _, i}
              {@const pageNum = i + 1}
              <button
                class="pagination-page-btn {pageNum === currentPage ? 'active' : ''}"
                on:click={() => changePage(pageNum)}
              >
                {pageNum}
              </button>
            {/each}
          </div>
          <button
            class="btn btn-sm btn-secondary"
            on:click={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  /* ============================================
     INVENTORY LIST — THE SHOPKEEPER'S LEDGER THEME
     ============================================ */
  .inventory-list {
    background: var(--paper);
  }

  /* --- Header Section --- */
  .inventory-header {
    background: var(--paper-warm);
    border-bottom: 2px dashed var(--border-ink);
    padding: var(--spacing-8);
    position: relative;
    overflow: hidden;
  }

  .inventory-header::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--crimson);
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-content h2 {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--ink);
    font-size: var(--font-size-3xl);
    font-family: 'Caveat Brush', cursive;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .header-actions .btn {
    transition: all 0.15s ease;
  }

  .header-actions .btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0px var(--border-ink);
  }

  .search-stats {
    display: flex;
    align-items: center;
    padding: 0 var(--spacing-8);
    margin-bottom: var(--spacing-4);
  }

  .stat-badge {
    background: var(--crimson-ghost);
    color: var(--crimson);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sketchy);
    font-size: var(--font-size-sm);
    font-weight: 600;
    border: 1.5px solid rgba(184, 28, 46, 0.15);
    font-family: 'Mali', sans-serif;
  }

  /* --- Error Message --- */
  .error-message {
    margin: var(--spacing-6) var(--spacing-8) 0;
    background: var(--crimson-ghost);
    border: 2px solid rgba(184, 28, 46, 0.2);
    border-radius: var(--radius-sketchy-lg);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  .error-message::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--crimson);
  }

  .error-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    color: var(--crimson);
  }

  .error-close {
    background: none;
    border: none;
    color: var(--crimson);
    cursor: pointer;
    padding: var(--spacing-1);
    border-radius: var(--radius-sketchy);
    transition: all 0.15s ease;
  }

  .error-close:hover {
    background: rgba(184, 28, 46, 0.12);
  }

  /* --- Table Container --- */
  .table-container {
    padding: var(--spacing-6) var(--spacing-8);
  }

  /* --- Empty State --- */
  .empty-state {
    text-align: center;
    padding: var(--spacing-16) var(--spacing-8);
    color: var(--ink-faint);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .empty-icon {
    margin-bottom: var(--spacing-6);
    color: var(--ink-faint);
    opacity: 0.6;
  }

  .empty-state h3 {
    margin-bottom: var(--spacing-3);
    color: var(--ink);
    font-size: var(--font-size-xl);
    font-weight: 600;
    font-family: 'Caveat Brush', cursive;
  }

  .empty-state p {
    margin-bottom: var(--spacing-6);
    color: var(--ink-faint);
    font-size: var(--font-size-base);
    max-width: 320px;
    line-height: 1.5;
    font-family: 'Mali', sans-serif;
  }

  .add-first-item-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-6);
    font-size: var(--font-size-base);
    font-weight: 700;
    border-radius: var(--radius-sketchy);
    box-shadow: 3px 3px 0px var(--border-ink);
    transition: all 0.15s ease;
    transform: translateY(0);
    border: 2.5px solid var(--ink);
    font-family: 'Mali', sans-serif;
  }

  .add-first-item-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0px var(--border-ink-strong);
  }

  .add-first-item-btn svg {
    transition: transform 0.15s ease;
  }

  .add-first-item-btn:hover svg {
    transform: scale(1.1);
  }

  /* --- Table Styles --- */
  .table {
    width: 100%;
    border-collapse: collapse;
    background: var(--paper-card);
    border-radius: var(--radius-sketchy-xl);
    overflow: hidden;
    box-shadow: 3px 3px 0px var(--border-ink);
    border: 2px solid var(--border-ink);
  }

  .table th {
    background: var(--paper-warm);
    padding: var(--spacing-4);
    text-align: left;
    font-weight: 700;
    color: var(--ink);
    border-bottom: 2px solid var(--border-ink);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: 'Mali', sans-serif;
    position: relative;
  }

  .table th::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border-ink);
  }

  .table td {
    padding: var(--spacing-4);
    border-bottom: 1px dashed var(--border-ink);
    color: var(--ink-light);
    font-family: 'Mali', sans-serif;
  }

  .table tbody tr:hover {
    background: var(--paper-warm);
  }

  /* Row Hover Effect */
  .row-hover {
    transition: all 0.15s ease;
  }

  .row-hover:hover {
    background-color: var(--paper-warm);
    box-shadow: inset 3px 0 0 var(--crimson);
  }

  .table tbody tr:last-child td {
    border-bottom: none;
  }

  /* Row States */
  .low-stock {
    background: rgba(184, 98, 27, 0.04);
  }

  .out-of-stock {
    background: var(--crimson-ghost);
  }

  /* Item Code */
  .item-code {
    display: flex;
    align-items: center;
  }

  .code-badge {
    background: var(--gold-ghost);
    color: var(--gold-dark);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sketchy);
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: var(--font-size-xs);
    font-weight: 600;
    border: 1px solid rgba(201, 149, 44, 0.2);
  }

  /* Item Name */
  .item-name h4 {
    margin: 0 0 var(--spacing-1) 0;
    color: var(--ink);
    font-size: var(--font-size-sm);
    font-weight: 600;
  }

  .item-description {
    margin: 0;
    color: var(--ink-faint);
    font-size: var(--font-size-xs);
  }

  /* Item Price */
  .price-amount {
    font-weight: 700;
    color: var(--ink);
    font-size: var(--font-size-sm);
    font-family: 'Caveat Brush', cursive;
  }

  /* Stock Level */
  .stock-level {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .stock-quantity {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-1);
  }

  .quantity-number {
    font-weight: 700;
    color: var(--ink);
    font-size: var(--font-size-sm);
    font-family: 'Caveat Brush', cursive;
  }

  .quantity-unit {
    color: var(--ink-faint);
    font-size: var(--font-size-xs);
  }

  /* Stock Indicator */
  .stock-indicator {
    display: flex;
    gap: var(--spacing-1);
  }

  .stock-badge {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sketchy);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
    overflow: hidden;
    font-family: 'Mali', sans-serif;
  }

  .stock-badge::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
    background: currentColor;
  }

  .stock-badge.warning {
    background: rgba(184, 98, 27, 0.08);
    color: var(--warning);
    border: 1px solid rgba(184, 98, 27, 0.15);
  }

  .stock-badge.danger {
    background: var(--crimson-ghost);
    color: var(--crimson);
    border: 1px solid rgba(184, 28, 46, 0.15);
  }

  .stock-badge.success {
    background: rgba(58, 107, 62, 0.08);
    color: var(--success);
    border: 1px solid rgba(58, 107, 62, 0.15);
  }

  /* Item Status */
  .status-indicator {
    display: flex;
    gap: var(--spacing-1);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sketchy);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
    overflow: hidden;
    font-family: 'Mali', sans-serif;
  }

  .status-badge::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
    background: currentColor;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: var(--spacing-2);
  }

  .action-buttons .btn {
    padding: var(--spacing-2);
    min-width: 32px;
    height: 32px;
    transition: all 0.15s ease;
    position: relative;
    overflow: hidden;
    opacity: 0.85;
  }

  .icon-hover-effect:hover {
    transform: scale(1.05);
    opacity: 1;
  }

  .icon-hover-effect::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left 0.3s ease;
  }

  .icon-hover-effect:hover::before {
    left: 100%;
  }

  /* --- Loading State --- */
  .loading-state {
    padding: var(--spacing-8);
    background: var(--paper-card);
    border-radius: var(--radius-sketchy-xl);
    border: 2px dashed var(--border-ink);
  }

  .loading-header {
    margin-bottom: var(--spacing-6);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .loading-table {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .skeleton-table-header {
    display: flex;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-bottom: 2px solid var(--border-ink);
  }

  .skeleton-table-row {
    display: flex;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    align-items: center;
  }

  .skeleton-cell {
    height: 1rem;
  }

  @media (max-width: 640px) {
    .skeleton-table-header {
      display: none;
    }

    .skeleton-table-row {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3);
      padding: var(--spacing-4);
      border-bottom: 1px dashed var(--border-ink);
    }

    .skeleton-cell {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100% !important;
    }

    .skeleton-cell::before {
      content: attr(data-label);
      font-weight: 600;
      color: var(--ink-faint);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
    }
  }

  /* --- Responsive Design --- */
  @media (max-width: 1024px) {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-4);
    }
  }

  @media (max-width: 768px) {
    .inventory-header {
      padding: var(--spacing-6);
    }

    .table-container {
      padding: var(--spacing-4) var(--spacing-6);
    }

    .table {
      font-size: var(--font-size-sm);
    }

    .table th,
    .table td {
      padding: var(--spacing-3);
    }

    .action-buttons {
      flex-direction: column;
      gap: var(--spacing-1);
    }

    .action-buttons .btn {
      min-width: 28px;
      height: 28px;
      padding: var(--spacing-1);
    }
  }

  @media (max-width: 640px) {
    .table {
      display: block;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .table thead {
      display: none;
    }

    .table tbody,
    .table tr {
      display: block;
    }

    .table tr {
      padding: var(--spacing-4);
      border-bottom: 2px dashed var(--border-ink);
    }

    .table td {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-2) 0;
      border-bottom: 1px dashed var(--border-ink);
    }

    .table td:last-child {
      border-bottom: none;
      padding-top: var(--spacing-4);
    }

    .table td::before {
      content: attr(data-label);
      font-weight: 600;
      color: var(--ink-faint);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
    }

    .header-content h2 {
      font-size: var(--font-size-2xl);
    }
  }

  /* --- Modal --- */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(26, 23, 20, 0.6);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
    font-family: inherit;
  }

  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--paper-card);
    border-radius: var(--radius-sketchy-xl);
    box-shadow: 6px 6px 0px var(--border-ink-strong);
    padding: 2rem;
    z-index: 1001;
    min-width: 320px;
    max-width: 90vw;
    width: 400px;
    animation: fadeIn 0.2s;
    border: 2.5px solid var(--ink);
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -60%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .form-group label {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--ink);
    font-family: 'Mali', sans-serif;
  }
  .form-group input {
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--border-ink);
    border-radius: var(--radius-sketchy);
    font-size: 1rem;
    outline: none;
    transition: border-color 0.15s ease;
    background: var(--paper);
    color: var(--ink);
    font-family: 'Mali', sans-serif;
  }
  .form-group input:focus {
    border-color: var(--crimson);
    box-shadow: 0 0 0 2px var(--crimson-ghost);
  }
  .form-error {
    color: var(--crimson);
    background: var(--crimson-ghost);
    border-radius: var(--radius-sketchy);
    padding: 0.5rem 0.75rem;
    font-size: 0.95rem;
    border: 1px solid rgba(184, 28, 46, 0.15);
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  /* --- Pagination Bar --- */
  .pagination-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    border-top: 2px dashed var(--border-ink);
    background: var(--paper-warm);
    margin-top: -1px;
  }
  
  .pagination-pages {
    display: flex;
    gap: 0.25rem;
  }
  
  .pagination-page-btn {
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--border-ink);
    border-radius: var(--radius-sketchy);
    background: var(--paper-card);
    color: var(--ink);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: 'Mali', sans-serif;
    font-weight: 600;
  }
  
  .pagination-page-btn:hover {
    background: var(--paper-warm);
    border-color: var(--ink);
  }
  
  .pagination-page-btn.active {
    background: var(--crimson);
    border-color: var(--crimson-dark);
    color: var(--paper-card);
    box-shadow: 2px 2px 0px var(--crimson-dark);
  }
</style>
