<script lang="ts">
  import { items } from "$lib/stores";
  import type { Item } from "$lib/types";
  import { onMount } from "svelte";
  import AdvancedSearch from "./AdvancedSearch.svelte";
  import SkeletonLoader from "./SkeletonLoader.svelte";
  import { settings, formatCurrency, currencySymbol } from '$lib/stores/settings';

  // Remove local formatCurrency - using imported one from settings

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
    let filtered = [...$items];

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
    if ($items.length > 0) {
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
            items.update((currentItems) =>
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
              items.set(updatedItems);
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
        items.update((current) => [created, ...current]);
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
        items.update((current) =>
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
      {#if $items.length > 0}
        <button
          class="btn btn-primary icon-hover-effect"
          on:click={() => (showAddModal = true)}
          aria-label="Add new item">Add Item</button
        >
      {/if}
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
      {filteredItems.length} of {$items.length} items
    </span>
  </div>

  <!-- Loading State -->
  {#if $items.length === 0}
    <div class="loading-state">
      <div class="loading-header">
        <SkeletonLoader type="text" width="200px" height="24px" />
        <SkeletonLoader type="text" width="150px" height="16px" />
      </div>
      <div class="loading-table">
        {#each Array(5) as _, i}
          <SkeletonLoader type="table-row" />
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
                  class="input {currencySymbol($settings.currency).length > 1 ? 'pl-14' : 'pl-10'}"
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
                class="input {currencySymbol($settings.currency).length > 1 ? 'pl-14' : 'pl-10'}"
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
    {#if $items.length === 0}
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
            <th>Item Code</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock Level</th>
            <th>Status</th>
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
              <td>
                <div class="item-code">
                  <span class="code-badge">{item.itemCode}</span>
                </div>
              </td>
              <td>
                <div class="item-name">
                  <h4 class="item-title">{item.name}</h4>
                  <p class="item-description">Product description</p>
                </div>
              </td>
              <td>
                <div class="item-price">
                  <span class="price-amount">{formatCurrency(item.price)}</span>
                </div>
              </td>
              <td>
                <div class="stock-level">
                  <div class="stock-quantity">
                    <span class="quantity-number">{item.stockQuantity}</span>
                    <span class="quantity-unit">units</span>
                  </div>
                  <div class="stock-indicator">
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
              <td>
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
              <td>
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
    {/if}
  </div>
</div>

<style>
  .inventory-list {
    background: white;
  }

  /* Header Section */
  .inventory-header {
    background: linear-gradient(
      135deg,
      var(--gray-50) 0%,
      var(--gray-100) 100%
    );
    border-bottom: 1px solid var(--gray-200);
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
    background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-content h2 {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--gray-900);
    font-size: var(--font-size-3xl);
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-4);
  }

  .search-stats {
    display: flex;
    align-items: center;
    padding: 0 var(--spacing-8);
    margin-bottom: var(--spacing-4);
  }

  .stat-badge {
    background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
    color: var(--primary-700);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: 600;
    border: 1px solid var(--primary-200);
    box-shadow: var(--shadow-sm);
  }

  /* Error Message */
  .error-message {
    margin: var(--spacing-6) var(--spacing-8) 0;
    background: linear-gradient(135deg, var(--danger-50), var(--danger-100));
    border: 1px solid var(--danger-200);
    border-radius: var(--radius-lg);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--shadow-sm);
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
    background: var(--danger-500);
  }

  .error-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    color: var(--danger-700);
  }

  .error-close {
    background: none;
    border: none;
    color: var(--danger-500);
    cursor: pointer;
    padding: var(--spacing-1);
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
  }

  .error-close:hover {
    background: var(--danger-100);
  }

  /* Table Container */
  .table-container {
    padding: var(--spacing-6) var(--spacing-8);
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: var(--spacing-16) var(--spacing-8);
    color: var(--gray-600);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .empty-icon {
    margin-bottom: var(--spacing-6);
    color: var(--gray-400);
    opacity: 0.8;
  }

  .empty-state h3 {
    margin-bottom: var(--spacing-3);
    color: var(--gray-700);
    font-size: var(--font-size-xl);
    font-weight: 600;
  }

  .empty-state p {
    margin-bottom: var(--spacing-6);
    color: var(--gray-600);
    font-size: var(--font-size-base);
    max-width: 320px;
    line-height: 1.5;
  }

  .add-first-item-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-6);
    font-size: var(--font-size-base);
    font-weight: 600;
    border-radius: var(--border-radius-lg);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease-in-out;
    transform: translateY(0);
  }

  .add-first-item-btn:hover {
    transform: translateY(-1px);
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .add-first-item-btn svg {
    transition: transform 0.2s ease-in-out;
  }

  .add-first-item-btn:hover svg {
    transform: scale(1.1);
  }

  /* Table Styles */
  .table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--gray-200);
  }

  .table th {
    background: linear-gradient(
      135deg,
      var(--gray-50) 0%,
      var(--gray-100) 100%
    );
    padding: var(--spacing-4);
    text-align: left;
    font-weight: 600;
    color: var(--gray-700);
    border-bottom: 1px solid var(--gray-200);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
  }

  .table th::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--gray-300),
      transparent
    );
  }

  .table td {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--gray-100);
    color: var(--gray-700);
  }

  .table tbody tr:hover {
    background: var(--gray-50);
  }

  /* Row Hover Effect */
  .row-hover {
    transition: all var(--transition-fast);
  }

  .row-hover:hover {
    background-color: var(--gray-50);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .table tbody tr:last-child td {
    border-bottom: none;
  }

  /* Row States */
  .low-stock {
    background: var(--warning-50);
  }

  .out-of-stock {
    background: var(--danger-50);
  }

  /* Item Code */
  .item-code {
    display: flex;
    align-items: center;
  }

  .code-badge {
    background: var(--primary-100);
    color: var(--primary-700);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: var(--font-size-xs);
    font-weight: 600;
  }

  /* Item Name */
  .item-name h4 {
    margin: 0 0 var(--spacing-1) 0;
    color: var(--gray-900);
    font-size: var(--font-size-sm);
  }

  .item-description {
    margin: 0;
    color: var(--gray-500);
    font-size: var(--font-size-xs);
  }

  /* Item Price */
  .price-amount {
    font-weight: 600;
    color: var(--gray-900);
    font-size: var(--font-size-sm);
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
    font-weight: 600;
    color: var(--gray-900);
    font-size: var(--font-size-sm);
  }

  .quantity-unit {
    color: var(--gray-500);
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
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
    overflow: hidden;
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
    background: var(--warning-100);
    color: var(--warning-700);
  }

  .stock-badge.danger {
    background: var(--danger-100);
    color: var(--danger-700);
  }

  .stock-badge.success {
    background: var(--success-100);
    color: var(--success-700);
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
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
    overflow: hidden;
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
    transition:
      background var(--transition-fast),
      transform var(--transition-fast),
      box-shadow var(--transition-fast),
      opacity var(--transition-normal);
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
    transition: left var(--transition-normal);
  }

  .icon-hover-effect:hover::before {
    left: 100%;
  }

  /* Loading State */
  .loading-state {
    padding: var(--spacing-8);
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
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

  /* Responsive Design */
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
    }

    .header-content h2 {
      font-size: var(--font-size-2xl);
    }
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
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
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    padding: 2rem;
    z-index: 1001;
    min-width: 320px;
    max-width: 90vw;
    width: 400px;
    animation: fadeIn 0.2s;
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
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  .form-group input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
    transition: border 0.2s;
  }
  .form-group input:focus {
    border-color: #6366f1;
  }
  .form-error {
    color: #dc2626;
    background: #fee2e2;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    font-size: 0.95rem;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 0.5rem;
  }
</style>
