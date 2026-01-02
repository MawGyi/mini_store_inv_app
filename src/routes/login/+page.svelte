<script lang="ts">
  import { goto } from '$app/navigation'
  import { addNotification } from '$lib/stores/stores'
  import { auth } from '$lib/stores/auth'
  
  let email = ''
  let password = ''
  let isLoading = false
  let rememberMe = false
  let showPassword = false
  let emailError = ''
  let passwordError = ''
  let generalError = ''
  
  function validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }
  
  function validatePassword(password: string): boolean {
    return password.length >= 6
  }
  
  async function handleLogin() {
    emailError = ''
    passwordError = ''
    generalError = ''
    
    if (!email && !password) {
      emailError = 'Email is required'
      passwordError = 'Password is required'
      return
    }
    
    if (!email) {
      emailError = 'Email is required'
      return
    }
    
    if (!validateEmail(email)) {
      emailError = 'Please enter a valid email address'
      return
    }
    
    if (!password) {
      passwordError = 'Password is required'
      return
    }
    
    if (!validatePassword(password)) {
      passwordError = 'Password must be at least 6 characters'
      return
    }
    
    isLoading = true
    
    try {
      const result = await auth.login(email, password, rememberMe)
      
      if (result.success) {
        addNotification('Welcome back!', 'success')
        goto(result.redirectTo || '/dashboard')
      } else {
        generalError = result.message || 'Invalid credentials'
        addNotification(result.message || 'Login failed', 'error')
      }
    } catch (error) {
      generalError = 'Connection error. Please try again.'
      addNotification('Connection error. Please try again.', 'error')
    } finally {
      isLoading = false
    }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }
  
  async function getCsrfToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' })
      const data = await response.json()
      return data.token
    } catch {
      return null
    }
  }
</script>

<svelte:head>
  <title>Login - Mini Store Inventory</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Mini Store</h1>
      <p class="text-gray-500 mt-1">Sign in to your account</p>
    </div>
    
    <!-- Login Form -->
    <div class="card">
      <form on:submit|preventDefault={handleLogin} class="space-y-5">
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input 
            type="email" 
            id="email"
            bind:value={email}
            on:keydown={handleKeydown}
            class="input {emailError ? 'border-red-500 focus:ring-red-500' : ''}" 
            placeholder="Enter your email"
            disabled={isLoading}
            autocomplete="email"
            aria-invalid={emailError ? 'true' : undefined}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {#if emailError}
            <p id="email-error" class="mt-1 text-sm text-red-600 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {emailError}
            </p>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="relative">
            {#if showPassword}
              <input 
                type="text"
                id="password"
                bind:value={password}
                on:keydown={handleKeydown}
                class="input pr-10 {passwordError ? 'border-red-500 focus:ring-red-500' : ''}" 
                placeholder="Enter your password"
                disabled={isLoading}
                autocomplete="current-password"
                aria-invalid={passwordError ? 'true' : undefined}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
            {:else}
              <input 
                type="password"
                id="password"
                bind:value={password}
                on:keydown={handleKeydown}
                class="input pr-10 {passwordError ? 'border-red-500 focus:ring-red-500' : ''}" 
                placeholder="Enter your password"
                disabled={isLoading}
                autocomplete="current-password"
                aria-invalid={passwordError ? 'true' : undefined}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
            {/if}
            <button 
              type="button"
              on:click={() => showPassword = !showPassword}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabindex="-1"
            >
              {#if showPassword}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              {:else}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              {/if}
            </button>
          </div>
          {#if passwordError}
            <p id="password-error" class="mt-1 text-sm text-red-600 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {passwordError}
            </p>
          {/if}
        </div>
        
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              bind:checked={rememberMe}
              class="w-4 h-4 text-primary-600 rounded"
            />
            <span class="text-sm text-gray-600">Remember me</span>
          </label>
          <a href="/forgot-password" class="text-sm text-primary-600 hover:text-primary-700">
            Forgot password?
          </a>
        </div>
        
        {#if generalError}
          <div class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm">{generalError}</span>
          </div>
        {/if}
        
        <button 
          type="submit" 
          class="w-full btn btn-primary py-3"
          disabled={isLoading}
        >
          {#if isLoading}
            <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          {:else}
            Sign in
          {/if}
        </button>
      </form>
      
      <!-- Demo Credentials -->
      <div class="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm font-semibold text-primary-800">Demo Credentials</p>
        </div>
        <div class="space-y-2">
          <button 
            on:click={() => { email = 'admin@ministore.com'; password = 'admin123'; }}
            class="w-full text-left p-2 bg-white rounded-lg hover:bg-primary-100 transition-colors group"
          >
            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Admin Account</p>
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-700 font-mono">admin@ministore.com</p>
              <span class="text-xs text-gray-400 group-hover:text-primary-600">Click to fill</span>
            </div>
          </button>
          <button 
            on:click={() => { email = 'manager@ministore.com'; password = 'manager123'; }}
            class="w-full text-left p-2 bg-white rounded-lg hover:bg-primary-100 transition-colors group"
          >
            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Manager Account</p>
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-700 font-mono">manager@ministore.com</p>
              <span class="text-xs text-gray-400 group-hover:text-primary-600">Click to fill</span>
            </div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <p class="text-center text-sm text-gray-500 mt-6">
      Don't have an account? 
      <a href="/register" class="text-primary-600 hover:text-primary-700 font-medium">
        Sign up
      </a>
    </p>
  </div>
</div>
