<script lang="ts">
  export let type: 'spinner' | 'dots' | 'pulse' | 'skeleton' = 'spinner';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary';
  export let text: string = '';
</script>

<div class="loading-container {size}">
  {#if type === 'spinner'}
    <div class="spinner {color} {size}">
      <div class="spinner-inner"></div>
    </div>
  {:else if type === 'dots'}
    <div class="dots {color}">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  {:else if type === 'pulse'}
    <div class="pulse {color} {size}">
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
    </div>
  {:else if type === 'skeleton'}
    <div class="skeleton-loader">
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-text"></div>
      <div class="skeleton-line skeleton-text short"></div>
    </div>
  {/if}
  
  {#if text}
    <div class="loading-text {size}">{text}</div>
  {/if}
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
  }
  
  /* Spinner Animation */
  .spinner {
    position: relative;
    border-radius: 50%;
  }
  
  .spinner.sm {
    width: 20px;
    height: 20px;
  }
  
  .spinner.md {
    width: 32px;
    height: 32px;
  }
  
  .spinner.lg {
    width: 48px;
    height: 48px;
  }
  
  .spinner-inner {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: currentColor;
    animation: spin 1s linear infinite;
  }
  
  .spinner.primary {
    color: var(--primary-500);
  }
  
  .spinner.secondary {
    color: var(--gray-500);
  }
  
  .spinner.success {
    color: var(--success-500);
  }
  
  .spinner.warning {
    color: var(--warning-500);
  }
  
  .spinner.danger {
    color: var(--danger-500);
  }
  
  /* Dots Animation */
  .dots {
    display: flex;
    gap: var(--spacing-2);
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: bounce-dots 1.4s ease-in-out infinite both;
  }
  
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  .dot:nth-child(3) { animation-delay: 0s; }
  
  .dots.primary .dot {
    background: var(--primary-500);
  }
  
  .dots.secondary .dot {
    background: var(--gray-500);
  }
  
  .dots.success .dot {
    background: var(--success-500);
  }
  
  .dots.warning .dot {
    background: var(--warning-500);
  }
  
  .dots.danger .dot {
    background: var(--danger-500);
  }
  
  /* Pulse Animation */
  .pulse {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .pulse.sm {
    width: 24px;
    height: 24px;
  }
  
  .pulse.md {
    width: 40px;
    height: 40px;
  }
  
  .pulse.lg {
    width: 56px;
    height: 56px;
  }
  
  .pulse-ring {
    position: absolute;
    border-radius: 50%;
    opacity: 1;
    animation: pulse-expand 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  }
  
  .pulse-ring:nth-child(1) {
    animation-delay: 0s;
  }
  
  .pulse-ring:nth-child(2) {
    animation-delay: 0.5s;
  }
  
  .pulse-ring:nth-child(3) {
    animation-delay: 1s;
  }
  
  .pulse.primary .pulse-ring {
    background: var(--primary-500);
  }
  
  .pulse.secondary .pulse-ring {
    background: var(--gray-500);
  }
  
  .pulse.success .pulse-ring {
    background: var(--success-500);
  }
  
  .pulse.warning .pulse-ring {
    background: var(--warning-500);
  }
  
  .pulse.danger .pulse-ring {
    background: var(--danger-500);
  }
  
  /* Skeleton Loader */
  .skeleton-loader {
    width: 100%;
    max-width: 300px;
  }
  
  .skeleton-line {
    height: 16px;
    background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-300) 50%, var(--gray-200) 75%);
    background-size: 200px 100%;
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-2);
    animation: shimmer 1.5s ease-in-out infinite;
  }
  
  .skeleton-title {
    height: 20px;
    width: 60%;
  }
  
  .skeleton-text {
    width: 100%;
  }
  
  .skeleton-text.short {
    width: 40%;
    margin-bottom: 0;
  }
  
  .dark .skeleton-line {
    background: linear-gradient(90deg, var(--gray-700) 25%, var(--gray-600) 50%, var(--gray-700) 75%);
    background-size: 200px 100%;
  }
  
  /* Loading Text */
  .loading-text {
    color: var(--gray-600);
    font-weight: 500;
    text-align: center;
  }
  
  .loading-text.sm {
    font-size: var(--font-size-xs);
  }
  
  .loading-text.md {
    font-size: var(--font-size-sm);
  }
  
  .loading-text.lg {
    font-size: var(--font-size-base);
  }
  
  .dark .loading-text {
    color: var(--gray-400);
  }
  
  /* Animations */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes bounce-dots {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
  
  @keyframes pulse-expand {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .spinner-inner,
    .dot,
    .pulse-ring,
    .skeleton-line {
      animation: none;
    }
  }
</style>
