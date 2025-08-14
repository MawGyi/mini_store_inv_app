<script lang="ts">
  export let type: 'text' | 'avatar' | 'card' | 'table-row' = 'text';
  export let lines: number = 1;
  export let width: string = '100%';
  export let height: string = '1rem';
  
  const shimmer = `
    background: linear-gradient(90deg, 
      var(--gray-200) 25%, 
      var(--gray-100) 50%, 
      var(--gray-200) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  `;
</script>

{#if type === 'text'}
  <div class="skeleton-text" style="width: {width}; height: {height}; {shimmer}"></div>
{:else if type === 'avatar'}
  <div class="skeleton-avatar" style="width: {width}; height: {height}; {shimmer}"></div>
{:else if type === 'card'}
  <div class="skeleton-card" style="{shimmer}">
    <div class="skeleton-card-header"></div>
    <div class="skeleton-card-body">
      {#each Array(lines) as _, i}
        <div class="skeleton-line" style="width: {i === lines - 1 ? '60%' : '100%'}"></div>
      {/each}
    </div>
  </div>
{:else if type === 'table-row'}
  <div class="skeleton-table-row" style="{shimmer}">
    {#each Array(6) as _, i}
      <div class="skeleton-cell" style="width: {i === 0 ? '15%' : i === 1 ? '25%' : i === 2 ? '15%' : i === 3 ? '20%' : i === 4 ? '15%' : '10%'}"></div>
    {/each}
  </div>
{/if}

<style>
  .skeleton-text,
  .skeleton-avatar {
    border-radius: var(--radius-md);
  }
  
  .skeleton-avatar {
    border-radius: var(--radius-full);
  }
  
  .skeleton-card {
    background: white;
    border-radius: var(--radius-lg);
    padding: var(--spacing-4);
    border: 1px solid var(--gray-200);
  }
  
  .skeleton-card-header {
    height: 1.5rem;
    background: var(--gray-200);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-4);
  }
  
  .skeleton-card-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }
  
  .skeleton-line {
    height: 1rem;
    background: var(--gray-200);
    border-radius: var(--radius-md);
  }
  
  .skeleton-table-row {
    display: flex;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    align-items: center;
  }
  
  .skeleton-cell {
    height: 1rem;
    background: var(--gray-200);
    border-radius: var(--radius-md);
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
</style>
