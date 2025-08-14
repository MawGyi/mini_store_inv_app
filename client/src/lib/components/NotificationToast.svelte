<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let message: string;
  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let duration: number = 5000;
  export let id: string;
  
  const dispatch = createEventDispatcher();
  
  let visible = false;
  let progress = 100;
  let progressInterval: ReturnType<typeof setInterval>;
  
  onMount(() => {
    // Animate in
    setTimeout(() => {
      visible = true;
    }, 100);
    
    // Start progress bar
    if (duration > 0) {
      const startTime = Date.now();
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        progress = Math.max(0, 100 - (elapsed / duration) * 100);
        
        if (progress <= 0) {
          close();
        }
      }, 10);
    }
  });
  
  function close() {
    visible = false;
    setTimeout(() => {
      dispatch('close', { id });
    }, 300);
  }
  
  function getIcon() {
    switch (type) {
      case 'success':
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      case 'error':
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
        </svg>`;
      case 'warning':
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      case 'info':
      default:
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    }
  }
  
  function getTypeStyles() {
    switch (type) {
      case 'success':
        return {
          bg: 'var(--success-50)',
          border: 'var(--success-200)',
          iconBg: 'var(--success-100)',
          iconColor: 'var(--success-600)',
          progressBg: 'var(--success-500)'
        };
      case 'error':
        return {
          bg: 'var(--danger-50)',
          border: 'var(--danger-200)',
          iconBg: 'var(--danger-100)',
          iconColor: 'var(--danger-600)',
          progressBg: 'var(--danger-500)'
        };
      case 'warning':
        return {
          bg: 'var(--warning-50)',
          border: 'var(--warning-200)',
          iconBg: 'var(--warning-100)',
          iconColor: 'var(--warning-600)',
          progressBg: 'var(--warning-500)'
        };
      case 'info':
      default:
        return {
          bg: 'var(--primary-50)',
          border: 'var(--primary-200)',
          iconBg: 'var(--primary-100)',
          iconColor: 'var(--primary-600)',
          progressBg: 'var(--primary-500)'
        };
    }
  }
</script>

<div 
  class="notification-toast {visible ? 'visible' : ''}"
  style="--bg: {getTypeStyles().bg}; --border: {getTypeStyles().border}; --icon-bg: {getTypeStyles().iconBg}; --icon-color: {getTypeStyles().iconColor}; --progress-bg: {getTypeStyles().progressBg}"
>
  <div class="notification-content">
    <div class="notification-icon" style="background: var(--icon-bg); color: var(--icon-color)">
      {@html getIcon()}
    </div>
    <div class="notification-message">
      <p>{message}</p>
    </div>
    <button class="notification-close" on:click={close}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
  
  <!-- Progress Bar -->
  {#if duration > 0}
    <div class="notification-progress">
      <div class="progress-bar" style="width: {progress}%; background: var(--progress-bg)"></div>
    </div>
  {/if}
</div>

<style>
  .notification-toast {
    --primary-50: #eff6ff;
    --primary-100: #dbeafe;
    --primary-200: #bfdbfe;
    --primary-500: #3b82f6;
    --primary-600: #2563eb;
    
    --success-50: #ecfdf5;
    --success-100: #d1fae5;
    --success-200: #a7f3d0;
    --success-500: #10b981;
    --success-600: #059669;
    
    --danger-50: #fef2f2;
    --danger-100: #fee2e2;
    --danger-200: #fecaca;
    --danger-500: #ef4444;
    --danger-600: #dc2626;
    
    --warning-50: #fffbeb;
    --warning-100: #fef3c7;
    --warning-200: #fde68a;
    --warning-500: #f59e0b;
    --warning-600: #d97706;
    
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-400: #9ca3af;
    --gray-600: #4b5563;
    --gray-700: #374151;
    
    --radius-lg: 0.75rem;
    --radius-full: 9999px;
    
    --spacing-1: 0.25rem;
    --spacing-2: 0.5rem;
    --spacing-3: 0.75rem;
    --spacing-4: 1rem;
    
    --font-size-sm: 0.875rem;
    
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    
    --transition-fast: 0.15s ease;
    --transition-normal: 0.3s ease;

    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    margin-bottom: var(--spacing-3);
    overflow: hidden;
    transform: translateX(100%);
    opacity: 0;
    transition: all var(--transition-normal);
    position: relative;
    max-width: 400px;
    backdrop-filter: blur(20px);
  }

  .notification-toast.visible {
    transform: translateX(0);
    opacity: 1;
  }

  .notification-content {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
  }

  .notification-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .notification-message {
    flex: 1;
    min-width: 0;
  }

  .notification-message p {
    margin: 0;
    color: var(--gray-700);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    font-weight: 500;
  }

  .dark .notification-message p {
    color: var(--gray-200);
  }

  .notification-close {
    background: none;
    border: none;
    color: var(--gray-400);
    cursor: pointer;
    padding: var(--spacing-1);
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dark .notification-close {
    color: var(--gray-500);
  }

  .notification-close:hover {
    background: var(--gray-100);
    color: var(--gray-600);
    transform: scale(1.1);
  }

  .dark .notification-close:hover {
    background: var(--gray-800);
    color: var(--gray-300);
  }

  .notification-progress {
    height: 3px;
    background: rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    transition: width 0.1s linear;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }

  /* Responsive Design */
  @media (max-width: 480px) {
    .notification-toast {
      max-width: calc(100vw - 2rem);
      margin: 0 var(--spacing-2) var(--spacing-2) var(--spacing-2);
    }

    .notification-content {
      padding: var(--spacing-3);
    }

    .notification-icon {
      width: 32px;
      height: 32px;
    }
  }
</style>
