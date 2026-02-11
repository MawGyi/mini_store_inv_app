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
          bg: 'rgba(58, 107, 62, 0.06)',
          border: 'rgba(58, 107, 62, 0.15)',
          iconBg: 'rgba(58, 107, 62, 0.1)',
          iconColor: 'var(--success)',
          progressBg: 'var(--success)'
        };
      case 'error':
        return {
          bg: 'rgba(184, 28, 46, 0.06)',
          border: 'rgba(184, 28, 46, 0.15)',
          iconBg: 'var(--crimson-ghost)',
          iconColor: 'var(--crimson)',
          progressBg: 'var(--crimson)'
        };
      case 'warning':
        return {
          bg: 'rgba(184, 98, 27, 0.06)',
          border: 'rgba(184, 98, 27, 0.15)',
          iconBg: 'rgba(184, 98, 27, 0.1)',
          iconColor: 'var(--warning)',
          progressBg: 'var(--warning)'
        };
      case 'info':
      default:
        return {
          bg: 'var(--gold-ghost)',
          border: 'rgba(201, 149, 44, 0.2)',
          iconBg: 'rgba(201, 149, 44, 0.12)',
          iconColor: 'var(--gold-dark)',
          progressBg: 'var(--gold)'
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
    background: var(--bg);
    border: 2px solid var(--border, var(--border-ink));
    border-radius: var(--radius-sketchy-lg);
    box-shadow: 3px 3px 0px var(--border-ink);
    margin-bottom: var(--spacing-3);
    overflow: hidden;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.2s ease;
    position: relative;
    max-width: 400px;
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
    border-radius: var(--radius-sketchy);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1.5px solid var(--border-ink);
  }

  .notification-message {
    flex: 1;
    min-width: 0;
  }

  .notification-message p {
    margin: 0;
    color: var(--ink);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    font-family: 'Mali', sans-serif;
  }

  .notification-close {
    background: none;
    border: none;
    color: var(--ink-faint);
    cursor: pointer;
    padding: var(--spacing-1);
    border-radius: var(--radius-sketchy);
    transition: all 0.15s ease;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .notification-close:hover {
    background: var(--ink-ghost);
    color: var(--ink);
  }

  .notification-progress {
    height: 3px;
    background: var(--paper-aged);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    transition: width 0.1s linear;
    border-radius: 0 0 var(--radius-sketchy-lg) var(--radius-sketchy-lg);
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
