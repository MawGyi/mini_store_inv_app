<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService } from '../services/api';

  let testResults: any[] = [];
  let testing = false;

  onMount(() => {
    runTests();
  });

  async function runTests() {
    testing = true;
    testResults = [];

    const tests = [
      { name: 'Categories', fn: () => apiService.getCategories() },
      { name: 'Items', fn: () => apiService.getItems({ limit: 3 }) },
      { name: 'Dashboard Overview', fn: () => apiService.getDashboardOverview() },
      { name: 'Dashboard Alerts', fn: () => apiService.getDashboardAlerts() },
      { name: 'Sales Trends', fn: () => apiService.getSalesTrends() }
    ];

    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}...`);
        const result = await test.fn();
        testResults = [...testResults, {
          name: test.name,
          success: result.success,
          data: result.data,
          message: result.message,
          error: null
        }];
        console.log(`✅ ${test.name}:`, result);
      } catch (error: any) {
        testResults = [...testResults, {
          name: test.name,
          success: false,
          data: null,
          message: null,
          error: error?.message || String(error)
        }];
        console.error(`❌ ${test.name}:`, error);
      }
    }

    testing = false;
  }
</script>

<div class="api-test">
  <h2>API Connection Test</h2>
  <p>Testing connection to backend APIs...</p>

  {#if testing}
    <div class="loading">
      <div class="spinner"></div>
      <p>Running tests...</p>
    </div>
  {/if}

  <div class="results">
    {#each testResults as result}
      <div class="result {result.success ? 'success' : 'error'}">
        <h3>
          {result.success ? '✅' : '❌'} {result.name}
        </h3>
        {#if result.success}
          <p><strong>Status:</strong> Success</p>
          <p><strong>Message:</strong> {result.message || 'OK'}</p>
          <details>
            <summary>Data ({typeof result.data})</summary>
            <pre>{JSON.stringify(result.data, null, 2)}</pre>
          </details>
        {:else}
          <p><strong>Error:</strong> {result.error}</p>
        {/if}
      </div>
    {/each}
  </div>

  <button on:click={runTests} disabled={testing}>
    {testing ? 'Testing...' : 'Run Tests Again'}
  </button>
</div>

<style>
  .api-test {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .results {
    margin: 2rem 0;
  }

  .result {
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid #ddd;
  }

  .result.success {
    background: #d4edda;
    border-color: #c3e6cb;
  }

  .result.error {
    background: #f8d7da;
    border-color: #f5c6cb;
  }

  .result h3 {
    margin: 0 0 0.5rem 0;
  }

  .result p {
    margin: 0.25rem 0;
  }

  details {
    margin-top: 0.5rem;
  }

  summary {
    cursor: pointer;
    font-weight: bold;
  }

  pre {
    background: #f8f9fa;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    max-height: 200px;
    overflow-y: auto;
  }

  button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
</style>
