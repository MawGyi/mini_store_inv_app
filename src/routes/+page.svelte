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

<div class="min-h-screen bg-gray-50 flex items-center justify-center">
  <div class="text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
    <p class="mt-4 text-gray-600">Loading...</p>
  </div>
</div>
