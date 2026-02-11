<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth, isAuthenticated, isLoading } from '$lib/stores/auth'
  
  onMount(async () => {
    await auth.initialize()
    
    if ($isLoading) return
    
    if ($isAuthenticated) {
      goto('/dashboard')
    } else {
      goto('/login')
    }
  })
</script>

<div class="min-h-screen flex items-center justify-center" style="background: var(--paper)">
  <div class="text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style="border-color: var(--crimson)"></div>
    <p class="mt-4" style="color: var(--ink-faint)">Loading...</p>
  </div>
</div>
