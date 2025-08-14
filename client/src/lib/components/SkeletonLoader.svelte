<script lang="ts">
  export let type: 'text' | 'avatar' | 'card' | 'table-row' | 'stat-card' | 'chart' = 'text';
  export let lines: number = 1;
  export let width: string = '100%';
  export let height: string = '1rem';
  export let rounded: boolean = true;
  export let animated: boolean = true;
  
  // Modern shimmer effect with enhanced gradients
  const shimmer = `
    background: linear-gradient(110deg, 
      var(--gray-100) 8%, 
      var(--gray-50) 18%, 
      var(--gray-200) 33%,
      var(--gray-50) 50%,
      var(--gray-200) 67%,
      var(--gray-50) 82%,
      var(--gray-100) 92%
    );
    background-size: 400% 100%;
    animation: ${animated ? 'modernShimmer 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'};
  `;
  
  // Dark mode shimmer
  const shimmerDark = `
    background: linear-gradient(110deg, 
      var(--gray-800) 8%, 
      var(--gray-700) 18%, 
      var(--gray-600) 33%,
      var(--gray-700) 50%,
      var(--gray-600) 67%,
      var(--gray-700) 82%,
      var(--gray-800) 92%
    );
    background-size: 400% 100%;
    animation: ${animated ? 'modernShimmer 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'};
  `;
</script>

{#if type === 'text'}
  <div 
    class="skeleton-text" 
    class:rounded
    style="width: {width}; height: {height}; {shimmer}"
  ></div>
{:else if type === 'avatar'}
  <div 
    class="skeleton-avatar" 
    style="width: {width}; height: {height}; {shimmer}"
  ></div>
{:else if type === 'card'}
  <div class="skeleton-card" style="{shimmer}">
    <div class="skeleton-card-header"></div>
    <div class="skeleton-card-body">
      {#each Array(lines) as _, i}
        <div 
          class="skeleton-line" 
          style="width: {i === lines - 1 ? '60%' : i === lines - 2 ? '80%' : '100%'}; 
                 height: {i === 0 ? '1.25rem' : '1rem'}"
        ></div>
      {/each}
    </div>
    <div class="skeleton-card-footer">
      <div class="skeleton-action-buttons">
        <div class="skeleton-btn skeleton-btn-primary"></div>
        <div class="skeleton-btn skeleton-btn-secondary"></div>
      </div>
    </div>
  </div>
{:else if type === 'stat-card'}
  <div class="skeleton-stat-card" style="{shimmer}">
    <div class="skeleton-stat-header">
      <div class="skeleton-stat-icon"></div>
      <div class="skeleton-stat-value"></div>
    </div>
    <div class="skeleton-stat-info">
      <div class="skeleton-stat-label"></div>
      <div class="skeleton-stat-change"></div>
    </div>
  </div>
{:else if type === 'chart'}
  <div class="skeleton-chart" style="{shimmer}">
    <div class="skeleton-chart-header">
      <div class="skeleton-chart-title"></div>
      <div class="skeleton-chart-actions">
        <div class="skeleton-chart-btn"></div>
        <div class="skeleton-chart-btn"></div>
      </div>
    </div>
    <div class="skeleton-chart-content">
      <div class="skeleton-chart-bars">
        {#each Array(6) as _, i}
          <div 
            class="skeleton-bar" 
            style="height: {Math.random() * 60 + 20}%"
          ></div>
        {/each}
      </div>
    </div>
  </div>
{:else if type === 'table-row'}
  <div class="skeleton-table-row" style="{shimmer}">
    {#each Array(6) as _, i}
      <div 
        class="skeleton-cell" 
        style="width: {i === 0 ? '15%' : i === 1 ? '25%' : i === 2 ? '15%' : i === 3 ? '20%' : i === 4 ? '15%' : '10%'}"
      ></div>
    {/each}
  </div>
{/if}

<style>
  /* Base skeleton styles with modern design */
  .skeleton-text {
    background: var(--gray-200);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .skeleton-text.rounded {
    border-radius: var(--radius-md);
  }
  
  .skeleton-avatar {
    background: var(--gray-200);
    border-radius: var(--radius-full);
    border: 2px solid var(--gray-100);
    box-shadow: var(--shadow-sm);
  }
  
  /* Modern Card Skeleton */
  .skeleton-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: 0;
    border: 1px solid var(--gray-100);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    transition: all var(--transition-normal);
  }

  .skeleton-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
  
  .skeleton-card-header {
    height: 60px;
    background: linear-gradient(135deg, var(--gray-100) 0%, var(--gray-50) 100%);
    border-bottom: 1px solid var(--gray-100);
    position: relative;
  }

  .skeleton-card-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--primary-300), transparent);
    opacity: 0.6;
  }
  
  .skeleton-card-body {
    padding: var(--spacing-6);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    background: rgba(255, 255, 255, 0.8);
  }
  
  .skeleton-line {
    background: var(--gray-200);
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);
  }

  .skeleton-card-footer {
    padding: var(--spacing-4) var(--spacing-6);
    background: var(--gray-50);
    border-top: 1px solid var(--gray-100);
  }

  .skeleton-action-buttons {
    display: flex;
    gap: var(--spacing-3);
    justify-content: flex-end;
  }

  .skeleton-btn {
    height: 36px;
    border-radius: var(--radius-lg);
    background: var(--gray-200);
  }

  .skeleton-btn-primary {
    width: 80px;
    background: linear-gradient(135deg, var(--primary-200), var(--primary-300));
  }

  .skeleton-btn-secondary {
    width: 60px;
    background: var(--gray-200);
    border: 1px solid var(--gray-300);
  }

  /* Modern Stat Card Skeleton */
  .skeleton-stat-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    border: 1px solid var(--gray-100);
    box-shadow: var(--shadow-md);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }

  .skeleton-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-400), var(--primary-500), var(--primary-600));
    opacity: 0.7;
  }

  .skeleton-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
  }

  .skeleton-stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-4);
  }

  .skeleton-stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
    border: 2px solid var(--primary-50);
  }

  .skeleton-stat-value {
    width: 120px;
    height: 32px;
    background: var(--gray-200);
    border-radius: var(--radius-md);
  }

  .skeleton-stat-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .skeleton-stat-label {
    width: 80px;
    height: 16px;
    background: var(--gray-200);
    border-radius: var(--radius-sm);
  }

  .skeleton-stat-change {
    width: 60px;
    height: 14px;
    background: linear-gradient(135deg, var(--success-100), var(--success-200));
    border-radius: var(--radius-sm);
  }

  /* Modern Chart Skeleton */
  .skeleton-chart {
    background: white;
    border-radius: var(--radius-xl);
    border: 1px solid var(--gray-100);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    transition: all var(--transition-normal);
  }

  .skeleton-chart:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .skeleton-chart-header {
    padding: var(--spacing-6);
    background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .skeleton-chart-title {
    width: 150px;
    height: 24px;
    background: var(--gray-300);
    border-radius: var(--radius-md);
  }

  .skeleton-chart-actions {
    display: flex;
    gap: var(--spacing-2);
  }

  .skeleton-chart-btn {
    width: 32px;
    height: 32px;
    background: var(--gray-200);
    border-radius: var(--radius-md);
    border: 1px solid var(--gray-300);
  }

  .skeleton-chart-content {
    padding: var(--spacing-6);
    height: 300px;
    display: flex;
    align-items: flex-end;
  }

  .skeleton-chart-bars {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-3);
    width: 100%;
    height: 100%;
  }

  .skeleton-bar {
    flex: 1;
    background: linear-gradient(180deg, var(--primary-200), var(--primary-300));
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    min-height: 20px;
    opacity: 0.8;
  }
  
  /* Enhanced Table Row Skeleton */
  .skeleton-table-row {
    display: flex;
    gap: var(--spacing-4);
    padding: var(--spacing-4) var(--spacing-6);
    align-items: center;
    background: white;
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-100);
    margin-bottom: var(--spacing-2);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast);
  }

  .skeleton-table-row:hover {
    box-shadow: var(--shadow-md);
    background: var(--gray-50);
  }
  
  .skeleton-cell {
    height: 1rem;
    background: var(--gray-200);
    border-radius: var(--radius-md);
  }

  /* Dark Mode Support */
  .dark .skeleton-text,
  .dark .skeleton-avatar,
  .dark .skeleton-line,
  .dark .skeleton-cell {
    background: var(--gray-700);
  }

  .dark .skeleton-card,
  .dark .skeleton-stat-card,
  .dark .skeleton-chart,
  .dark .skeleton-table-row {
    background: var(--gray-800);
    border-color: var(--gray-700);
  }

  .dark .skeleton-card-header,
  .dark .skeleton-chart-header {
    background: linear-gradient(135deg, var(--gray-800) 0%, var(--gray-700) 100%);
    border-bottom-color: var(--gray-600);
  }

  .dark .skeleton-card-body {
    background: rgba(31, 41, 59, 0.8);
  }

  .dark .skeleton-card-footer {
    background: var(--gray-700);
    border-top-color: var(--gray-600);
  }

  .dark .skeleton-btn-primary {
    background: linear-gradient(135deg, var(--primary-700), var(--primary-600));
  }

  .dark .skeleton-btn-secondary {
    background: var(--gray-700);
    border-color: var(--gray-600);
  }

  .dark .skeleton-stat-icon {
    background: linear-gradient(135deg, var(--primary-800), var(--primary-700));
    border-color: var(--primary-900);
  }

  .dark .skeleton-stat-change {
    background: linear-gradient(135deg, var(--success-800), var(--success-700));
  }

  .dark .skeleton-chart-btn {
    background: var(--gray-700);
    border-color: var(--gray-600);
  }

  .dark .skeleton-bar {
    background: linear-gradient(180deg, var(--primary-700), var(--primary-600));
  }

  /* Enhanced Animations */
  @keyframes modernShimmer {
    0% {
      background-position: -400% 0;
    }
    50% {
      background-position: 200% 0;
    }
    100% {
      background-position: 600% 0;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-2px);
    }
  }

  /* Add subtle floating animation for better visual appeal */
  .skeleton-card,
  .skeleton-stat-card,
  .skeleton-chart {
    animation: float 3s ease-in-out infinite;
  }

  /* Stagger animation delays for multiple items */
  .skeleton-card:nth-child(2) { animation-delay: 0.2s; }
  .skeleton-card:nth-child(3) { animation-delay: 0.4s; }
  .skeleton-card:nth-child(4) { animation-delay: 0.6s; }

  .skeleton-stat-card:nth-child(2) { animation-delay: 0.15s; }
  .skeleton-stat-card:nth-child(3) { animation-delay: 0.3s; }
  .skeleton-stat-card:nth-child(4) { animation-delay: 0.45s; }

  /* Responsive Design */
  @media (max-width: 768px) {
    .skeleton-card-body,
    .skeleton-chart-content {
      padding: var(--spacing-4);
    }

    .skeleton-chart-content {
      height: 200px;
    }

    .skeleton-stat-card {
      padding: var(--spacing-4);
    }

    .skeleton-table-row {
      padding: var(--spacing-3) var(--spacing-4);
    }
  }
</style>
