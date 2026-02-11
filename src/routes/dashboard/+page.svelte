<script lang="ts">
  import { onMount } from "svelte";
  import { settings, formatCurrency } from "$lib/stores/settings";
  import type {
    DashboardOverview,
    SalesSummary,
    TopSellingItem,
  } from "$lib/types";
  import { goto } from "$app/navigation";

  let overview: DashboardOverview | null = null;
  let salesTrends: SalesSummary[] = [];
  let topSelling: TopSellingItem[] = [];
  let alerts: Array<{
    type: string;
    message: string;
    severity: string;
    itemId: number;
    itemCode: string;
    name: string;
    stockQuantity: number;
  }> = [];
  let loading = true;
  let searchQuery = "";
  let searchResults: any[] = [];
  let showSearchResults = false;
  let allItems: any[] = [];

  onMount(async () => {
    settings.load();
    try {
      const [overviewRes, trendsRes, topRes, alertsRes, itemsRes] =
        await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/dashboard/sales-trends?days=7"),
          fetch("/api/sales/top-selling"),
          fetch("/api/dashboard/alerts"),
          fetch("/api/items"),
        ]);

      const [overviewData, trendsData, topData, alertsData, itemsData] =
        await Promise.all([
          overviewRes.json(),
          trendsRes.json(),
          topRes.json(),
          alertsRes.json(),
          itemsRes.json(),
        ]);

      if (overviewData.success) overview = overviewData.data.overview;
      if (trendsData.success) salesTrends = trendsData.data;
      if (topData.success) topSelling = topData.data;
      if (alertsData.success) alerts = alertsData.data;
      if (itemsData.success) allItems = itemsData.data;
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      loading = false;
    }
  });

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function getWeekday(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  function navigateToInventory(itemId?: number, itemCode?: string) {
    const params = new URLSearchParams();
    if (itemId) params.set("highlight", itemId.toString());
    if (itemCode) params.set("search", itemCode);
    goto(`/inventory?${params.toString()}`);
  }

  function handleSearch() {
    if (!searchQuery.trim()) {
      searchResults = [];
      showSearchResults = false;
      return;
    }

    const query = searchQuery.toLowerCase();
    searchResults = allItems
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.itemCode.toLowerCase().includes(query),
      )
      .slice(0, 8);
    showSearchResults = searchResults.length > 0;
  }

  function clearSearch() {
    searchQuery = "";
    searchResults = [];
    showSearchResults = false;
  }

  function navigateTo(path: string) {
    goto(path);
    clearSearch();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      clearSearch();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
  <title>Dashboard - Mini Store Inventory</title>
</svelte:head>

<div class="space-y-8">
  <!-- Page Header -->
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold" style="color: var(--ink); font-family: 'Caveat Brush', cursive; font-size: 2rem;">Dashboard</h1>
      <p class="text-sm mt-1" style="color: var(--ink-faint)">
        Welcome back! Here's your store overview.
      </p>
    </div>

    <!-- Search Bar -->
    <div class="relative w-full sm:w-80">
      <div class="relative">
        <svg
          class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
          style="color: var(--ink-faint)"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          on:input={handleSearch}
          on:focus={() => {
            if (searchResults.length > 0) showSearchResults = true;
          }}
          placeholder="Search items, sales..."
          class="input pl-10"
        />
        {#if searchQuery}
          <button
            on:click={clearSearch}
            class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style="color: var(--ink-faint)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Search Results Dropdown -->
      {#if showSearchResults && searchResults.length > 0}
        <div
          class="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-20"
          style="background: rgba(30,41,59,0.95); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 16px 48px rgba(0,0,0,0.4);"
        >
          <div
            class="px-4 py-2.5"
            style="border-bottom: 2px dashed var(--border-ink)"
          >
            <p
              class="text-xs font-medium uppercase tracking-wider" style="color: var(--ink-faint)"
            >
              Items ({searchResults.length})
            </p>
          </div>
          <div class="max-h-64 overflow-y-auto">
            {#each searchResults as item}
              <button
                on:click={() => navigateToInventory(item.id, item.itemCode)}
                class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style="border-bottom: 1px solid var(--border-ink)"
                on:mouseenter={(e) =>
                  (e.currentTarget.style.background = "var(--paper-warm)")}
                on:mouseleave={(e) =>
                  (e.currentTarget.style.background = "transparent")}
              >
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style="background: rgba(196,30,58,0.1); border: 1.5px solid rgba(196,30,58,0.2);"
                >
                  <svg
                    class="w-5 h-5" style="color: var(--crimson)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate" style="color: var(--ink)">
                    {item.name}
                  </p>
                  <p class="text-xs font-mono" style="color: var(--ink-faint)">
                    {item.itemCode}
                  </p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-sm font-medium" style="color: var(--ink)">
                    {formatCurrency(item.price, $settings.currency)}
                  </p>
                  <p
                    class="text-xs" style="color: {item.stockQuantity <= item.lowStockThreshold ? 'var(--gold-dark)' : 'var(--ink-faint)'}"
                  >
                    Stock: {item.stockQuantity}
                  </p>
                </div>
              </button>
            {/each}
          </div>
          <div
            class="p-2"
            style="border-top: 2px dashed var(--border-ink); background: var(--paper-warm)"
          >
            <button
              on:click={() => navigateTo("/inventory")}
              class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors" style="color: var(--crimson)"
            >
              View all inventory
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      {:else if showSearchResults && searchQuery}
        <div
          class="absolute top-full left-0 right-0 mt-2 overflow-hidden z-20"
          style="background: var(--paper-card); border: 2px solid var(--ink); border-radius: 6px 8px 6px 7px; box-shadow: 4px 4px 0px rgba(33,33,33,0.12);"
        >
          <div class="p-6 text-center">
            <svg
              class="w-12 h-12 mx-auto mb-3"
              style="color: var(--ink-faint)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p class="text-sm" style="color: var(--ink-faint)">
              No items found for "{searchQuery}"
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if loading}
    <!-- Loading Skeleton -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each Array(4) as _}
        <div class="card">
          <div class="skeleton h-4 w-24 mb-4"></div>
          <div class="skeleton h-8 w-32"></div>
        </div>
      {/each}
    </div>
  {:else if overview}
    <!-- Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Sales -->
      <div class="dash-stat-card">
        <div class="dash-stat-header">
          <div class="stat-icon success">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span class="badge badge-success text-xs">+12.5%</span>
        </div>
        <div class="dash-stat-body">
          <span class="dash-stat-label">Total Sales</span>
          <span class="dash-stat-value"
            >{formatCurrency(
              overview?.totalSales ?? 0,
              $settings.currency,
            )}</span
          >
        </div>
      </div>

      <!-- Transactions -->
      <div class="dash-stat-card">
        <div class="dash-stat-header">
          <div class="stat-icon primary">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          {#if (overview?.todaySales ?? 0) > 0}
            <span class="badge badge-success text-xs">Today</span>
          {:else}
            <span
              class="badge text-xs"
              style="background: rgba(100,116,139,0.1); color: var(--ink-faint); border: 1px solid var(--border-ink);"
              >No sales</span
            >
          {/if}
        </div>
        <div class="dash-stat-body">
          <span class="dash-stat-label">Transactions</span>
          <span class="dash-stat-value">{overview?.totalTransactions ?? 0}</span
          >
        </div>
      </div>

      <!-- Monthly Sales -->
      <div class="dash-stat-card">
        <div class="dash-stat-header">
          <div class="stat-icon info">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <span class="badge badge-primary text-xs">This month</span>
        </div>
        <div class="dash-stat-body">
          <span class="dash-stat-label">Monthly Sales</span>
          <span class="dash-stat-value"
            >{formatCurrency(
              overview?.monthSales ?? 0,
              $settings.currency,
            )}</span
          >
        </div>
      </div>

      <!-- Low Stock -->
      <div class="dash-stat-card">
        <div class="dash-stat-header">
          <div class="stat-icon warning">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          {#if (overview?.lowStockItems ?? 0) > 0}
            <span class="badge badge-warning text-xs">Alert</span>
          {:else}
            <span class="badge badge-success text-xs">Good</span>
          {/if}
        </div>
        <div class="dash-stat-body">
          <span class="dash-stat-label">Low Stock Items</span>
          <span class="dash-stat-value">{overview?.lowStockItems ?? 0}</span>
          <a
            href="/inventory"
            class="text-xs font-medium mt-1 inline-block transition-colors" style="color: var(--gold-dark)"
          >
            View inventory →
          </a>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sales Trends -->
      <div class="lg:col-span-2 card">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold" style="color: var(--ink); font-family: 'Caveat Brush', cursive; font-size: 1.5rem;">Sales Trends</h2>
            <p class="text-sm mt-0.5" style="color: var(--ink-faint)">
              Daily sales for the past week
            </p>
          </div>
          <select class="input w-auto text-sm py-2">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        {#if salesTrends.length > 0}
          <div class="space-y-3">
            {#each salesTrends as sale, index}
              {@const maxSales = Math.max(
                ...salesTrends.map((s) => s.totalSales),
              )}
              {@const barWidth =
                maxSales > 0 ? (sale.totalSales / maxSales) * 100 : 0}
              <div class="relative">
                <div class="flex items-center gap-4 mb-2">
                  <div class="w-12 text-center">
                    <span class="text-xs font-medium" style="color: var(--ink-faint)"
                      >{getWeekday(sale.date)}</span
                    >
                    <p class="text-sm font-semibold" style="color: var(--ink)">
                      {formatDate(sale.date)}
                    </p>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex-1 h-10 rounded-lg overflow-hidden"
                        style="background: var(--paper-warm); border: 1px solid var(--border-ink)"
                      >
                        <div
                          class="h-full rounded-lg transition-all duration-500"
                          style="width: {barWidth}%; background: linear-gradient(90deg, var(--crimson), var(--gold)); box-shadow: 0 0 8px rgba(196,30,58,0.15)"
                        ></div>
                      </div>
                      <div class="w-24 text-right">
                        <p class="text-sm font-semibold" style="color: var(--ink)">
                          {formatCurrency(
                            sale.totalSales ?? 0,
                            $settings.currency,
                          )}
                        </p>
                        <p class="text-xs" style="color: var(--ink-faint)">
                          {sale.transactionCount} sales
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-12">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style="background: var(--paper-warm)"
            >
              <svg
                class="w-8 h-8" style="color: var(--ink-faint)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 class="text-sm font-medium mb-1" style="color: var(--ink)">
              No sales data yet
            </h3>
            <p class="text-sm" style="color: var(--ink-faint)">
              Start making sales to see your trends here.
            </p>
          </div>
        {/if}
      </div>

      <!-- Top Selling Items -->
      <div class="card">
        <div class="mb-6">
          <h2 class="text-lg font-semibold" style="color: var(--ink); font-family: 'Caveat Brush', cursive; font-size: 1.5rem;">
            Top Selling Items
          </h2>
          <p class="text-sm mt-0.5" style="color: var(--ink-faint)">Best performers this week</p>
        </div>

        {#if topSelling.length > 0}
          <div class="space-y-3">
            {#each topSelling as item, index}
              <div
                class="flex items-start gap-3 p-3 rounded-xl transition-colors"
                style="background: var(--paper-warm); border: 1px solid var(--border-ink)"
                on:mouseenter={(e) => {
                  e.currentTarget.style.background = "var(--paper)";
                  e.currentTarget.style.borderColor = "var(--ink)";
                }}
                on:mouseleave={(e) => {
                  e.currentTarget.style.background = "var(--paper-warm)";
                  e.currentTarget.style.borderColor = "var(--border-ink)";
                }}
              >
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style="background: rgba(196,30,58,0.08); border: 2px solid rgba(196,30,58,0.15); border-radius: 6px 8px 6px 7px"
                >
                  <span class="text-sm font-bold" style="color: var(--crimson)"
                    >{index + 1}</span
                  >
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold leading-snug" style="color: var(--ink)">
                    {item.itemName}
                  </p>
                  <div class="flex items-center justify-between mt-1">
                    <p class="text-xs" style="color: var(--ink-faint)">
                      {item.totalQuantity} units sold
                    </p>
                    <p class="text-sm font-bold" style="color: var(--ink)">
                      {formatCurrency(
                        item.totalRevenue ?? 0,
                        $settings.currency,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <a
            href="/sales"
            class="block text-center text-sm font-medium mt-6 py-2 transition-colors" style="color: var(--crimson); border-top: 2px dashed var(--border-ink)"
          >
            View all sales →
          </a>
        {:else}
          <div class="text-center py-12">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style="background: var(--paper-warm)"
            >
              <svg
                class="w-8 h-8" style="color: var(--ink-faint)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 class="text-sm font-medium mb-1" style="color: var(--ink)">
              No sales yet
            </h3>
            <p class="text-sm" style="color: var(--ink-faint)">
              Your top selling items will appear here.
            </p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Stock Alerts Section -->
    {#if alerts.length > 0}
      {@const criticalAlerts = alerts.filter((a) => a.severity === "critical")}
      {@const warningAlerts = alerts.filter((a) => a.severity !== "critical")}
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <div class="stat-icon warning">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold" style="color: var(--ink); font-family: 'Caveat Brush', cursive; font-size: 1.5rem;">Stock Alerts</h2>
              <p class="text-sm mt-0.5" style="color: var(--ink-faint)">
                {alerts.length} item{alerts.length !== 1 ? "s" : ""} need attention
              </p>
            </div>
          </div>
          <a href="/inventory" class="btn btn-secondary text-sm">
            Manage Inventory
          </a>
        </div>

        {#if criticalAlerts.length > 0}
          <div class="mb-6">
            <h3
              class="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
              style="color: #f87171"
            >
              <span
                class="w-2 h-2 rounded-full"
                style="background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5)"
              ></span>
              Critical ({criticalAlerts.length})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each criticalAlerts as alert}
                <button
                  on:click={() =>
                    navigateToInventory(alert.itemId, alert.itemCode)}
                  class="group relative rounded-xl p-4 text-left w-full transition-all"
                  style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15)"
                  on:mouseenter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
                  }}
                  on:mouseleave={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)";
                  }}
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style="background: rgba(239,68,68,0.12)"
                    >
                      <svg
                        class="w-5 h-5 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold" style="color: var(--ink)">
                        {alert.name}
                      </p>
                      <p class="text-xs font-mono mb-1" style="color: var(--ink-faint)">
                        {alert.itemCode}
                      </p>
                      <p class="text-xs text-red-400 font-medium">
                        Stock: {alert.stockQuantity} (Out of stock)
                      </p>
                    </div>
                    <svg
                      class="w-5 h-5 text-red-400/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        {#if warningAlerts.length > 0}
          <div>
            <h3
              class="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
              style="color: #fbbf24"
            >
              <span
                class="w-2 h-2 rounded-full"
                style="background: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.5)"
              ></span>
              Low Stock ({warningAlerts.length})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each warningAlerts as alert}
                <button
                  on:click={() =>
                    navigateToInventory(alert.itemId, alert.itemCode)}
                  class="group relative rounded-xl p-4 text-left w-full transition-all"
                  style="background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.12)"
                  on:mouseenter={(e) => {
                    e.currentTarget.style.background = "rgba(245,158,11,0.1)";
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)";
                  }}
                  on:mouseleave={(e) => {
                    e.currentTarget.style.background = "rgba(245,158,11,0.06)";
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.12)";
                  }}
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style="background: rgba(245,158,11,0.1)"
                    >
                      <svg
                        class="w-5 h-5 text-amber-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold" style="color: var(--ink)">
                        {alert.name}
                      </p>
                      <p class="text-xs font-mono mb-1" style="color: var(--ink-faint)">
                        {alert.itemCode}
                      </p>
                      <p class="text-xs text-amber-400 font-medium">
                        Stock: {alert.stockQuantity} (Low)
                      </p>
                    </div>
                    <svg
                      class="w-5 h-5 text-amber-400/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  /* ===== DASHBOARD — MERCHANT'S LEDGER ===== */
  .dash-stat-card {
    background: var(--paper-card);
    border: 2.5px solid var(--ink);
    border-radius: 5px 8px 6px 9px;
    padding: 1.25rem;
    box-shadow: 3px 3px 0px rgba(26, 23, 20, 0.12);
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .dash-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      var(--ink) 0px,
      var(--ink) 6px,
      transparent 6px,
      transparent 10px
    );
    opacity: 0.15;
  }
  .dash-stat-card:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0px rgba(26, 23, 20, 0.15);
  }
  .dash-stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }
  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 4px 6px 5px 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid;
  }
  .stat-icon.success {
    background: rgba(46, 125, 50, 0.08);
    color: var(--success);
    border-color: var(--success);
  }
  .stat-icon.primary {
    background: rgba(184, 28, 46, 0.06);
    color: var(--crimson);
    border-color: var(--crimson);
  }
  .stat-icon.info {
    background: rgba(25, 118, 210, 0.06);
    color: #1565C0;
    border-color: #1565C0;
  }
  .stat-icon.warning {
    background: rgba(194, 155, 48, 0.08);
    color: var(--gold-dark);
    border-color: var(--gold-dark);
  }
  .dash-stat-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .dash-stat-label {
    font-size: 0.85rem;
    color: var(--ink-faint);
    font-family: 'Mali', sans-serif;
    font-weight: 500;
  }
  .dash-stat-value {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--ink);
    font-family: 'Caveat Brush', cursive;
    letter-spacing: 0.02em;
    line-height: 1.2;
  }
</style>
