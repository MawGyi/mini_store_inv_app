<script lang="ts">
  export let title: string = 'Chart';
  export let data: any[] = [];
  export let type: 'line' | 'bar' | 'pie' = 'line';
  export let height: number = 300;
  
  let chartContainer: HTMLDivElement;
  
  // Placeholder chart data
  const sampleData = [
    { label: 'Jan', value: 4000 },
    { label: 'Feb', value: 3000 },
    { label: 'Mar', value: 5000 },
    { label: 'Apr', value: 4500 },
    { label: 'May', value: 6000 },
    { label: 'Jun', value: 5500 },
    { label: 'Jul', value: 7000 }
  ];
  
  const chartData = data.length > 0 ? data : sampleData;
  const maxValue = Math.max(...chartData.map(d => d.value));
</script>

<div class="chart-container" bind:this={chartContainer}>
  <div class="chart-header">
    <h3 class="chart-title">{title}</h3>
    <div class="chart-controls">
      <button class="chart-btn {type === 'line' ? 'active' : ''}" on:click={() => type = 'line'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="chart-btn {type === 'bar' ? 'active' : ''}" on:click={() => type = 'bar'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
          <rect x="7" y="7" width="3" height="10" fill="currentColor"/>
          <rect x="14" y="7" width="3" height="10" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </div>
  
  <div class="chart-content" style="height: {height}px;">
    {#if type === 'bar'}
      <div class="bar-chart">
        <div class="chart-bars">
          {#each chartData as item, index}
            <div class="bar-item">
              <div 
                class="bar" 
                style="height: {(item.value / maxValue) * 100}%; animation-delay: {index * 0.1}s;"
              ></div>
              <span class="bar-label">{item.label}</span>
              <span class="bar-value">{item.value.toLocaleString()}</span>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="line-chart">
        <svg class="chart-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
          <!-- Grid lines -->
          {#each Array(5) as _, i}
            <line 
              x1="0" 
              y1={40 * i} 
              x2="400" 
              y2={40 * i} 
              class="grid-line"
              stroke-width="1"
            />
          {/each}
          
          <!-- Chart line -->
          <polyline
            points={chartData.map((d, i) => `${(i * 400) / (chartData.length - 1)},${200 - (d.value / maxValue) * 160}`).join(' ')}
            fill="none"
            stroke="var(--primary-500)"
            stroke-width="3"
            class="chart-line"
          />
          
          <!-- Data points -->
          {#each chartData as item, index}
            <circle
              cx={(index * 400) / (chartData.length - 1)}
              cy={200 - (item.value / maxValue) * 160}
              r="4"
              fill="var(--primary-500)"
              class="chart-point"
              style="animation-delay: {index * 0.1}s;"
            />
          {/each}
        </svg>
        
        <!-- Labels -->
        <div class="chart-labels">
          {#each chartData as item}
            <span class="chart-label">{item.label}</span>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .chart-container {
    background: white;
    border-radius: var(--radius-xl);
    border: 1px solid var(--gray-200);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .dark .chart-container {
    background: var(--gray-800);
    border-color: var(--gray-700);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--gray-200);
    background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
  }

  .dark .chart-header {
    border-bottom-color: var(--gray-700);
    background: linear-gradient(135deg, var(--gray-800) 0%, var(--gray-700) 100%);
  }

  .chart-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--gray-900);
    margin: 0;
  }

  .dark .chart-title {
    color: var(--gray-100);
  }

  .chart-controls {
    display: flex;
    gap: var(--spacing-2);
  }

  .chart-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--gray-300);
    background: white;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-normal);
    color: var(--gray-500);
  }

  .dark .chart-btn {
    border-color: var(--gray-600);
    background: var(--gray-700);
    color: var(--gray-300);
  }

  .chart-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-400);
  }

  .dark .chart-btn:hover {
    background: var(--gray-600);
    border-color: var(--gray-500);
    color: var(--gray-200);
  }

  .chart-btn.active {
    background: var(--primary-500);
    border-color: var(--primary-500);
    color: white;
  }

  .dark .chart-btn.active {
    background: var(--primary-600);
    border-color: var(--primary-600);
  }

  .chart-content {
    padding: var(--spacing-6);
    position: relative;
  }

  .bar-chart {
    height: 100%;
    display: flex;
    align-items: flex-end;
  }

  .chart-bars {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-4);
    width: 100%;
    height: 100%;
  }

  .bar-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .bar {
    width: 100%;
    max-width: 40px;
    background: linear-gradient(to top, var(--primary-500), var(--primary-400));
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    transition: all var(--transition-normal);
    animation: barGrow 0.8s ease-out forwards;
    transform-origin: bottom;
    opacity: 0;
    transform: scaleY(0);
  }

  .bar-label {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-xs);
    color: var(--gray-600);
    font-weight: 500;
  }

  .dark .bar-label {
    color: var(--gray-300);
  }

  .bar-value {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: var(--gray-500);
  }

  .dark .bar-value {
    color: var(--gray-400);
  }

  .line-chart {
    height: 100%;
    position: relative;
  }

  .chart-svg {
    width: 100%;
    height: calc(100% - 30px);
  }

  .chart-line {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawLine 2s ease-out forwards;
  }

  .chart-point {
    opacity: 0;
    animation: fadeInPoint 0.5s ease-out forwards;
  }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    margin-top: var(--spacing-2);
  }

  .chart-label {
    font-size: var(--font-size-xs);
    color: var(--gray-600);
    font-weight: 500;
  }

  .dark .chart-label {
    color: var(--gray-300);
  }

  .grid-line {
    stroke: var(--gray-200);
  }

  .dark .grid-line {
    stroke: var(--gray-700);
  }

  @keyframes barGrow {
    to {
      opacity: 1;
      transform: scaleY(1);
    }
  }

  @keyframes drawLine {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes fadeInPoint {
    to {
      opacity: 1;
    }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .chart-header {
      padding: var(--spacing-4);
    }

    .chart-content {
      padding: var(--spacing-4);
    }

    .chart-title {
      font-size: var(--font-size-base);
    }

    .bar-label,
    .bar-value,
    .chart-label {
      font-size: 10px;
    }
  }
</style>
