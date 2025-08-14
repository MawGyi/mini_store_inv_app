<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slide, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  export let id: string;
  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let title: string = '';
  export let message: string;
  export let duration: number = 5000;
  export let dismissible: boolean = true;
  export let actions: Array<{label: string, action: () => void}> = [];
  
  const dispatch = createEventDispatcher();
  
  let visible = true;
  let progressWidth = 100;
  let timeoutId: number;
  
  $: if (visible && duration > 0) {
    // Start progress animation
    setTimeout(() => {
      progressWidth = 0;
    }, 50);
    
    // Auto dismiss after duration
    timeoutId = setTimeout(() => {
      handleDismiss();
    }, duration);
  }
  
  function handleDismiss() {
    if (timeoutId) clearTimeout(timeoutId);
    visible = false;
    
    setTimeout(() => {
      dispatch('dismiss', { id });
    }, 300);
  }
  
  function handleAction(action: () => void) {
    action();
    handleDismiss();
  }
  
  $: iconName = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }[type];
</script>

{#if visible}
  <div 
    class="enhanced-notification {type}"
    in:fly="{{ x: 300, duration: 400, easing: quintOut }}"
    out:fly="{{ x: 300, duration: 300, easing: quintOut }}"
    role="alert"
    aria-live="polite"
  >
    <!-- Icon -->
    <div class="notification-icon">
      <div class="icon-background">
        <span class="icon-symbol">{iconName}</span>
      </div>
      <div class="icon-glow"></div>
    </div>
    
    <!-- Content -->
    <div class="notification-content">
      {#if title}
        <div class="notification-title">{title}</div>
      {/if}
      <div class="notification-message">{message}</div>
      
      {#if actions.length > 0}
        <div class="notification-actions">
          {#each actions as action}
            <button 
              class="action-btn"
              on:click={() => handleAction(action.action)}
            >
              {action.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Close Button -->
    {#if dismissible}
      <button 
        class="close-btn"
        on:click={handleDismiss}
        aria-label="Close notification"
      >
        <span class="close-icon">✕</span>
      </button>
    {/if}
    
    <!-- Progress Bar -->
    {#if duration > 0}
      <div class="progress-container">
        <div 
          class="progress-bar"
          style="width: {progressWidth}%; transition-duration: {duration}ms;"
        ></div>
      </div>
    {/if}
    
    <!-- Animated Background -->
    <div class="animated-bg">
      <div class="bg-wave wave-1"></div>
      <div class="bg-wave wave-2"></div>
    </div>
  </div>
{/if}

<style>
  .enhanced-notification {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-4) var(--spacing-5);
    margin-bottom: var(--spacing-3);
    border-radius: var(--radius-xl);
    box-shadow: 
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    max-width: 420px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .enhanced-notification:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  /* Type-specific styles */
  .enhanced-notification.success {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
    border-color: rgba(34, 197, 94, 0.2);
  }
  
  .enhanced-notification.error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
    border-color: rgba(239, 68, 68, 0.2);
  }
  
  .enhanced-notification.warning {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05));
    border-color: rgba(245, 158, 11, 0.2);
  }
  
  .enhanced-notification.info {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
    border-color: rgba(59, 130, 246, 0.2);
  }
  
  /* Icon */
  .notification-icon {
    position: relative;
    flex-shrink: 0;
    margin-top: var(--spacing-1);
  }
  
  .icon-background {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    font-weight: 700;
    position: relative;
    z-index: 2;
  }
  
  .success .icon-background {
    background: linear-gradient(135deg, var(--success-500), var(--success-600));
    color: white;
  }
  
  .error .icon-background {
    background: linear-gradient(135deg, var(--danger-500), var(--danger-600));
    color: white;
  }
  
  .warning .icon-background {
    background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
    color: white;
  }
  
  .info .icon-background {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
  }
  
  .icon-glow {
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    opacity: 0.3;
    filter: blur(4px);
    z-index: 1;
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .success .icon-glow {
    background: var(--success-500);
  }
  
  .error .icon-glow {
    background: var(--danger-500);
  }
  
  .warning .icon-glow {
    background: var(--warning-500);
  }
  
  .info .icon-glow {
    background: var(--primary-500);
  }
  
  /* Content */
  .notification-content {
    flex: 1;
    min-width: 0;
  }
  
  .notification-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--gray-900);
    margin-bottom: var(--spacing-1);
    line-height: 1.4;
  }
  
  .notification-message {
    font-size: var(--font-size-sm);
    color: var(--gray-700);
    line-height: 1.5;
    word-wrap: break-word;
  }
  
  .dark .notification-title {
    color: var(--gray-100);
  }
  
  .dark .notification-message {
    color: var(--gray-300);
  }
  
  /* Actions */
  .notification-actions {
    display: flex;
    gap: var(--spacing-2);
    margin-top: var(--spacing-3);
  }
  
  .action-btn {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-xs);
    font-weight: 500;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.8);
    color: var(--gray-700);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  /* Close Button */
  .close-btn {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    width: 24px;
    height: 24px;
    border: none;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  
  .close-btn:hover {
    background: rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
  }
  
  .close-icon {
    font-size: 10px;
    color: var(--gray-600);
    font-weight: 700;
  }
  
  /* Progress Bar */
  .progress-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .progress-bar {
    height: 100%;
    transition-property: width;
    transition-timing-function: linear;
  }
  
  .success .progress-bar {
    background: linear-gradient(90deg, var(--success-500), var(--success-400));
  }
  
  .error .progress-bar {
    background: linear-gradient(90deg, var(--danger-500), var(--danger-400));
  }
  
  .warning .progress-bar {
    background: linear-gradient(90deg, var(--warning-500), var(--warning-400));
  }
  
  .info .progress-bar {
    background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
  }
  
  /* Animated Background */
  .animated-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    z-index: -1;
  }
  
  .bg-wave {
    position: absolute;
    width: 200%;
    height: 200%;
    opacity: 0.1;
    animation: wave-motion 6s ease-in-out infinite;
  }
  
  .wave-1 {
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    top: -50%;
    left: -50%;
    animation-delay: 0s;
  }
  
  .wave-2 {
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
    bottom: -50%;
    right: -50%;
    animation-delay: 3s;
  }
  
  /* Dark mode adjustments */
  .dark .enhanced-notification.success {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.08));
  }
  
  .dark .enhanced-notification.error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08));
  }
  
  .dark .enhanced-notification.warning {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08));
  }
  
  .dark .enhanced-notification.info {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.08));
  }
  
  .dark .action-btn {
    background: rgba(55, 65, 81, 0.8);
    color: var(--gray-300);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .dark .action-btn:hover {
    background: rgba(55, 65, 81, 1);
  }
  
  .dark .close-btn {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .dark .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .dark .close-icon {
    color: var(--gray-300);
  }
  
  /* Animations */
  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }
  
  @keyframes wave-motion {
    0%, 100% {
      transform: translate(0, 0) rotate(0deg);
    }
    33% {
      transform: translate(10px, -10px) rotate(120deg);
    }
    66% {
      transform: translate(-5px, 5px) rotate(240deg);
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .enhanced-notification {
      transition: none;
    }
    
    .icon-glow,
    .bg-wave {
      animation: none;
    }
  }
</style>
