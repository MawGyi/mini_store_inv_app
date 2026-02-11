<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import { notifications, removeNotification } from "$lib/stores/stores";
  import {
    auth,
    currentUser,
    isAuthenticated,
    isLoading,
  } from "$lib/stores/auth";
  import { settings } from "$lib/stores/settings";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";

  let isMobileMenuOpen = false;
  let isSidebarCollapsed = false;
  let isProfileOpen = false;
  let isNotificationsOpen = false;
  let authChecked = false;

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      href: "/sales",
      label: "Sales",
      icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      href: "/reports",
      label: "Reports",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
  ];

  $: user = $currentUser;
  $: isAuth = $isAuthenticated;
  $: loading = $isLoading;

  $: if (browser && authChecked && !loading) {
    const publicPaths = ["/login", "/register", "/forgot-password"];
    const isPublic = publicPaths.some((p) => $page.url.pathname.startsWith(p));

    if (!isAuth && !isPublic && $page.url.pathname !== "/") {
      goto("/login");
    } else if (isAuth && $page.url.pathname === "/login") {
      goto("/dashboard");
    }
  }

  function getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : "U";
  }

  function isActive(href: string) {
    return $page.url.pathname.startsWith(href);
  }

  function toggleNotifications() {
    isNotificationsOpen = !isNotificationsOpen;
    isProfileOpen = false;
  }

  function toggleProfile() {
    isProfileOpen = !isProfileOpen;
    isNotificationsOpen = false;
  }

  async function handleLogout() {
    await auth.logout();
  }

  onMount(() => {
    if (browser) {
      auth.initialize().then(() => {
        authChecked = true;
      });
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".profile-dropdown")) {
        isProfileOpen = false;
      }
      if (!target.closest(".notifications-dropdown")) {
        isNotificationsOpen = false;
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Caveat+Brush&family=Caveat:wght@400;500;600;700&family=Mali:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
</svelte:head>

{#if loading}
  <div class="loading-screen">
    <div class="loading-content">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring ring-2"></div>
      </div>
      <p class="loading-text">Loading...</p>
    </div>
  </div>
{:else if !isAuth}
  <slot />
{:else}
  <div class="app-layout">
    <!-- Desktop Sidebar -->
    <aside class="sidebar-desktop {isSidebarCollapsed ? 'collapsed' : ''}">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-icon-wrapper">
          <img
            src="/logo.png"
            alt="Mini Store"
            width="26"
            height="26"
            style="border-radius: 4px; object-fit: cover;"
          />
        </div>
        {#if !isSidebarCollapsed}
          <span class="brand-text">{$settings.storeName}</span>
        {/if}
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        {#each navItems as item}
          <a
            href={item.href}
            class="nav-item {isActive(item.href) ? 'active' : ''}"
            title={isSidebarCollapsed ? item.label : ""}
          >
            {#if isActive(item.href)}
              <div class="nav-active-indicator"></div>
            {/if}
            <svg
              class="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d={item.icon}
              />
            </svg>
            {#if !isSidebarCollapsed}
              <span>{item.label}</span>
            {/if}
          </a>
        {/each}
      </nav>

      <!-- Collapse Toggle -->
      <button
        on:click={() => (isSidebarCollapsed = !isSidebarCollapsed)}
        class="sidebar-toggle"
      >
        <svg
          class="w-4 h-4 transition-transform {isSidebarCollapsed
            ? 'rotate-180'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    </aside>

    <!-- Main Content -->
    <main class="main-content {isSidebarCollapsed ? 'sidebar-collapsed' : ''}">
      <!-- Header -->
      <header class="app-header">
        <div class="header-inner">
          <div class="flex items-center gap-4">
            <button
              on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}
              class="mobile-menu-btn lg:hidden"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-3">
            <!-- Notifications -->
            <div class="notifications-dropdown relative">
              <button
                on:click={toggleNotifications}
                class="header-icon-btn relative"
              >
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {#if $notifications.length > 0}
                  <span class="notification-badge">
                    {$notifications.length}
                  </span>
                {/if}
              </button>

              {#if isNotificationsOpen}
                <div class="dropdown-panel notifications-panel">
                  <div class="dropdown-header">
                    <h3 class="dropdown-title">Notifications</h3>
                    {#if $notifications.length > 0}
                      <button
                        on:click={() => notifications.set([])}
                        class="dropdown-action"
                      >
                        Clear all
                      </button>
                    {/if}
                  </div>

                  {#if $notifications.length > 0}
                    <div class="max-h-96 overflow-y-auto">
                      {#each $notifications as notification}
                        <div class="notification-item {notification.type}">
                          <div
                            class="notification-icon-wrapper {notification.type}"
                          >
                            {#if notification.type === "success"}
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            {:else if notification.type === "error"}
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
                            {:else}
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
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            {/if}
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="notification-text">
                              {notification.message}
                            </p>
                          </div>
                          <button
                            on:click={() => removeNotification(notification.id)}
                            class="notification-dismiss"
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
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="dropdown-empty">
                      <svg
                        class="w-12 h-12 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style="color: rgba(148,163,184,0.3)"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      <p style="color: rgba(148,163,184,0.6)">
                        No notifications
                      </p>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Profile Dropdown -->
            <div class="profile-dropdown relative">
              <button on:click={toggleProfile} class="profile-btn">
                <div class="profile-avatar">
                  {user?.name ? getInitials(user.name) : "U"}
                </div>
                <div class="hidden md:block text-left">
                  <p class="profile-name">
                    {user?.name || "User"}
                  </p>
                  <p class="profile-role">{user?.role || "Guest"}</p>
                </div>
                <svg
                  class="w-4 h-4 hidden md:block"
                  style="color: rgba(148,163,184,0.5)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {#if isProfileOpen}
                <div class="dropdown-panel profile-panel">
                  <div class="dropdown-header">
                    <div>
                      <p class="profile-dropdown-name">
                        {user?.name || "User"}
                      </p>
                      <p class="profile-dropdown-email">{user?.email || ""}</p>
                    </div>
                  </div>
                  <div class="dropdown-menu">
                    <a href="/settings" class="dropdown-menu-item">
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
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Settings
                    </a>
                    <a href="/profile" class="dropdown-menu-item">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Profile
                    </a>
                    <button
                      on:click={handleLogout}
                      class="dropdown-menu-item logout"
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
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

      <div class="page-content">
        <slot />
      </div>
    </main>

    <!-- Mobile Menu Overlay -->
    {#if isMobileMenuOpen}
      <div
        class="mobile-overlay"
        role="presentation"
        on:click={() => (isMobileMenuOpen = false)}
        on:keydown={(e) => e.key === "Escape" && (isMobileMenuOpen = false)}
      >
        <div
          class="mobile-backdrop"
          role="button"
          tabindex="-1"
          aria-label="Close menu"
          on:click={() => (isMobileMenuOpen = false)}
          on:keydown={(e) => e.key === "Escape" && (isMobileMenuOpen = false)}
        ></div>
        <div class="mobile-sidebar">
          <div class="mobile-sidebar-header">
            <div class="flex items-center gap-3">
              <div class="brand-icon-wrapper">
                <img
                  src="/logo.png"
                  alt="Mini Store"
                  width="22"
                  height="22"
                  style="border-radius: 4px; object-fit: cover;"
                />
              </div>
              <span class="brand-text">{$settings.storeName}</span>
            </div>
            <button
              on:click={() => (isMobileMenuOpen = false)}
              class="mobile-close-btn"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <nav class="sidebar-nav">
            {#each navItems as item}
              <a
                href={item.href}
                on:click={() => (isMobileMenuOpen = false)}
                class="nav-item {isActive(item.href) ? 'active' : ''}"
              >
                {#if isActive(item.href)}
                  <div class="nav-active-indicator"></div>
                {/if}
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
                    d={item.icon}
                  />
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

<svelte:window
  on:keydown={(e) => {
    if (e.key === "Escape") {
      isProfileOpen = false;
      isNotificationsOpen = false;
      isMobileMenuOpen = false;
    }
  }}
/>

<style>
  /* ===== LOADING SCREEN ===== */
  .loading-screen {
    min-height: 100vh;
    background: var(--paper);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .loading-content {
    text-align: center;
  }
  .loading-spinner {
    position: relative;
    width: 48px;
    height: 48px;
    margin: 0 auto;
  }
  .spinner-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: var(--crimson);
    animation: spin 1s linear infinite;
  }
  .ring-2 {
    border-top-color: var(--gold);
    animation-duration: 1.5s;
    animation-direction: reverse;
    inset: 4px;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .loading-text {
    margin-top: 1rem;
    color: var(--ink-faint);
    font-size: 0.875rem;
    font-family: 'Caveat Brush', cursive;
    font-size: 1.25rem;
  }

  /* ===== APP LAYOUT ===== */
  .app-layout {
    min-height: 100vh;
    background: var(--paper);
  }

  /* ===== SIDEBAR ===== */
  .sidebar-desktop {
    display: none;
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 256px;
    z-index: 40;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--paper-warm);
    border-right: 3px solid var(--ink);
    background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0L20 20M20 0L0 20' stroke='%231a1714' stroke-width='0.15' opacity='0.04'/%3E%3C/svg%3E");
  }
  .sidebar-desktop.collapsed {
    width: 80px;
  }
  @media (min-width: 1024px) {
    .sidebar-desktop {
      display: block;
    }
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    height: 64px;
    padding: 0 1rem;
    border-bottom: 2px dashed var(--border-ink);
  }
  .brand-icon-wrapper {
    width: 40px;
    height: 40px;
    background: var(--paper-card);
    border: 2px solid var(--ink);
    border-radius: 8px 10px 8px 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 2px 2px 0px var(--border-ink);
  }
  .brand-text {
    font-family: 'Caveat Brush', cursive;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.02em;
    text-shadow: 1px 1px 0 rgba(26,23,20,0.05);
  }

  /* ===== NAV ITEMS ===== */
  .sidebar-nav {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 3px 5px 4px 6px;
    color: var(--ink-light);
    font-size: 0.95rem;
    font-weight: 600;
    font-family: 'Mali', sans-serif;
    transition: all 0.2s ease;
    text-decoration: none;
    overflow: hidden;
    border: 2px solid transparent;
    letter-spacing: 0.01em;
  }
  .nav-item:hover {
    color: var(--ink);
    background: var(--paper-dark);
    border-color: var(--border-ink);
  }
  .nav-item.active {
    color: var(--crimson);
    background: rgba(184, 28, 46, 0.06);
    border-color: var(--crimson);
    font-weight: 700;
    box-shadow: 2px 2px 0 rgba(184, 28, 46, 0.1);
  }
  .nav-active-indicator {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    border-radius: 0 4px 4px 0;
    background: var(--crimson);
  }

  /* ===== SIDEBAR TOGGLE ===== */
  .sidebar-toggle {
    position: absolute;
    bottom: 1rem;
    right: 0;
    transform: translateX(50%);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--paper-card);
    border: 2.5px solid var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-faint);
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 2px 2px 0px var(--border-ink);
  }
  .sidebar-toggle:hover {
    color: var(--ink);
    background: var(--paper-dark);
  }

  /* ===== MAIN CONTENT ===== */
  .main-content {
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-left: 0;
  }
  @media (min-width: 1024px) {
    .main-content {
      margin-left: 256px;
    }
    .main-content.sidebar-collapsed {
      margin-left: 80px;
    }
  }

  /* ===== HEADER ===== */
  .app-header {
    position: sticky;
    top: 0;
    z-index: 30;
    background: var(--paper);
    border-bottom: 2.5px solid var(--ink);
    background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0L20 20M20 0L0 20' stroke='%231a1714' stroke-width='0.15' opacity='0.025'/%3E%3C/svg%3E");
  }
  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 1.5rem;
  }

  .mobile-menu-btn {
    padding: 0.5rem;
    border-radius: 6px;
    color: var(--ink-light);
    transition: all 0.2s;
    background: none;
    border: 1.5px solid transparent;
    cursor: pointer;
  }
  .mobile-menu-btn:hover {
    color: var(--ink);
    background: var(--paper-dark);
    border-color: var(--border-ink);
  }

  .header-icon-btn {
    padding: 0.5rem;
    border-radius: 6px;
    color: var(--ink-faint);
    transition: all 0.2s;
    background: none;
    border: 1.5px solid transparent;
    cursor: pointer;
  }
  .header-icon-btn:hover {
    color: var(--ink);
    background: var(--paper-dark);
    border-color: var(--border-ink);
  }

  .notification-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 18px;
    height: 18px;
    background: var(--crimson);
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--paper);
  }

  /* ===== DROPDOWN PANELS ===== */
  .dropdown-panel {
    position: absolute;
    right: 0;
    margin-top: 0.5rem;
    background: var(--paper-card);
    border: 2px solid var(--ink);
    border-radius: 8px 12px 8px 10px;
    overflow: hidden;
    box-shadow: 4px 4px 0px var(--border-ink);
    animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .notifications-panel {
    width: 320px;
  }
  .profile-panel {
    width: 224px;
  }

  @keyframes dropdownIn {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dropdown-header {
    padding: 1rem 1.25rem;
    border-bottom: 2px dashed var(--border-ink);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dropdown-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--ink);
    font-family: 'Caveat Brush', cursive;
  }
  .dropdown-action {
    font-size: 0.75rem;
    color: var(--crimson);
    font-weight: 600;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s;
    font-family: 'Mali', sans-serif;
  }
  .dropdown-action:hover {
    color: var(--crimson-dark);
  }

  .dropdown-empty {
    padding: 2rem;
    text-align: center;
    color: var(--ink-faint);
    font-style: italic;
  }

  /* ===== NOTIFICATION ITEMS ===== */
  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    border-bottom: 1px dashed var(--border-ink);
    transition: background 0.2s;
  }
  .notification-item:hover {
    background: var(--paper-dark);
  }
  .notification-icon-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1.5px solid;
  }
  .notification-icon-wrapper.success {
    background: rgba(46, 125, 50, 0.08);
    color: var(--success);
    border-color: var(--success);
  }
  .notification-icon-wrapper.error {
    background: rgba(196, 30, 58, 0.06);
    color: var(--crimson);
    border-color: var(--crimson);
  }
  .notification-icon-wrapper.info,
  .notification-icon-wrapper {
    background: rgba(25, 118, 210, 0.06);
    color: #1565C0;
    border-color: #1565C0;
  }
  .notification-text {
    font-size: 0.875rem;
    color: var(--ink);
    line-height: 1.4;
  }
  .notification-dismiss {
    color: var(--ink-faint);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    transition: color 0.2s;
  }
  .notification-dismiss:hover {
    color: var(--crimson);
  }

  /* ===== PROFILE ===== */
  .profile-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem;
    border-radius: 6px;
    background: none;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  .profile-btn:hover {
    background: var(--paper-dark);
    border-color: var(--border-ink);
  }
  .profile-avatar {
    width: 36px;
    height: 36px;
    background: var(--crimson);
    border: 2.5px solid var(--crimson-dark);
    color: #faf6ed;
    border-radius: 5px 8px 6px 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    font-family: 'Caveat Brush', cursive;
    box-shadow: 2px 2px 0 rgba(140, 21, 35, 0.3);
  }
  .profile-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--ink);
  }
  .profile-role {
    font-size: 0.75rem;
    color: var(--ink-faint);
  }

  .profile-dropdown-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--ink);
  }
  .profile-dropdown-email {
    font-size: 0.75rem;
    color: var(--ink-faint);
    margin-top: 2px;
  }

  .dropdown-menu {
    padding: 0.5rem;
  }
  .dropdown-menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    color: var(--ink);
    border-radius: 4px 6px 5px 7px;
    text-decoration: none;
    transition: all 0.2s;
    background: none;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    font-family: 'Mali', sans-serif;
  }
  .dropdown-menu-item:hover {
    background: var(--paper-dark);
    color: var(--ink);
  }
  .dropdown-menu-item.logout {
    color: var(--crimson);
  }
  .dropdown-menu-item.logout:hover {
    background: rgba(196, 30, 58, 0.06);
    color: var(--crimson-dark);
  }

  /* ===== PAGE CONTENT ===== */
  .page-content {
    padding: 1.5rem;
  }

  /* ===== MOBILE MENU ===== */
  .mobile-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
  }
  @media (min-width: 1024px) {
    .mobile-overlay {
      display: none;
    }
  }
  .mobile-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(33, 33, 33, 0.3);
    backdrop-filter: blur(2px);
  }
  .mobile-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 280px;
    background: var(--paper-warm);
    border-right: 3px solid var(--ink);
    box-shadow: 6px 0 0px var(--border-ink);
    animation: slideFromLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0L20 20M20 0L0 20' stroke='%231a1714' stroke-width='0.15' opacity='0.04'/%3E%3C/svg%3E");
  }
  @keyframes slideFromLeft {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }
  .mobile-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 1rem;
    border-bottom: 2px dashed var(--border-ink);
  }
  .mobile-close-btn {
    padding: 0.5rem;
    border-radius: 6px;
    color: var(--ink-faint);
    background: none;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  .mobile-close-btn:hover {
    color: var(--ink);
    background: var(--paper-dark);
    border-color: var(--border-ink);
  }
</style>

