<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'
  import { addNotification } from '$lib/stores/stores'
  import { auth } from '$lib/stores/auth'
  
  // --- EXISTING AUTH LOGIC (PRESERVED) ---
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

  // --- NEW ANIMATION LOGIC ---
  
  onMount(() => {
    const pupils = document.querySelectorAll('.pupil');
    
    const handleMouseMove = (e: MouseEvent) => {
      pupils.forEach((pupil) => {
        if (!(pupil instanceof HTMLElement)) return;
        
        const rect = pupil.parentElement!.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
        const distance = 4;
        pupil.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  });

  function handlePasswordFocus(focus: boolean) {
    const pupils = document.querySelectorAll('.pupil');
    pupils.forEach(p => {
      if (p instanceof HTMLElement) {
        p.style.height = focus ? '1px' : '6px';
      }
    });
  }
</script>

<svelte:head>
  <title>Login - Mini Store Inventory</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-['Inter']">
  <div class="flex w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden min-h-[600px]">
    
    <!-- Left Panel: Animated Characters -->
    <div class="hidden lg:flex w-1/2 bg-[#F8F9FB] relative items-center justify-center border-r border-gray-100">
      <div class="relative w-80 h-80">
        <!-- Purple Character -->
        <div class="absolute bottom-10 left-10 w-32 h-52 bg-[#7C3AED] rounded-t-[30px] float shadow-md" style="animation-delay: 0.2s;">
          <div class="absolute top-10 left-10 flex gap-4">
            <div class="eye-white"><div class="pupil"></div></div>
            <div class="eye-white"><div class="pupil"></div></div>
          </div>
        </div>
        <!-- Orange Character -->
        <div class="absolute bottom-0 left-[-20px] w-44 h-32 bg-[#FB923C] rounded-t-full float shadow-md">
          <div class="absolute top-10 left-16 flex gap-4">
            <div class="eye-white"><div class="pupil"></div></div>
            <div class="eye-white"><div class="pupil"></div></div>
          </div>
        </div>
        <!-- Yellow Character -->
        <div class="absolute bottom-0 right-2 w-24 h-44 bg-[#FACC15] rounded-t-full float shadow-md" style="animation-delay: 0.5s;">
          <div class="absolute top-12 left-6 flex gap-3">
            <div class="eye-white"><div class="pupil"></div></div>
            <div class="eye-white"><div class="pupil"></div></div>
          </div>
        </div>
      </div>
      <div class="absolute bottom-10 text-gray-200 font-black text-3xl tracking-[0.2em]">ZDAK</div>
    </div>

    <!-- Right Panel: Login Form -->
    <div class="w-full lg:w-1/2 p-12 md:p-20 flex flex-col justify-center">
      <div class="mb-10 text-center lg:text-left">
        <h2 class="text-4xl font-bold text-gray-900">Welcome back!</h2>
        <p class="text-gray-500 mt-2">Please enter your details</p>
      </div>

      <form on:submit|preventDefault={handleLogin} class="space-y-5">
        <!-- Email Field -->
        <div class="relative">
          <div class="relative group">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <input 
              type="email" 
              bind:value={email}
              on:keydown={handleKeydown}
              class="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none text-gray-800 placeholder-gray-400 transition-all group-focus-within:bg-white group-focus-within:border-black group-focus-within:shadow-lg"
              placeholder="Enter your email"
              disabled={isLoading}
            >
          </div>
          {#if emailError}
            <div class="flex items-center gap-1.5 mt-1.5 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span class="text-xs">{emailError}</span>
            </div>
          {/if}
        </div>

        <!-- Password Field -->
        <div class="relative">
          <div class="relative group">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            {#if showPassword}
              <input 
                type="text"
                bind:value={password}
                on:keydown={handleKeydown}
                on:focus={() => handlePasswordFocus(true)}
                on:blur={() => handlePasswordFocus(false)}
                class="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none text-gray-800 placeholder-gray-400 transition-all group-focus-within:bg-white group-focus-within:border-black group-focus-within:shadow-lg"
                placeholder="••••••••"
                disabled={isLoading}
              >
            {:else}
              <input 
                type="password"
                bind:value={password}
                on:keydown={handleKeydown}
                on:focus={() => handlePasswordFocus(true)}
                on:blur={() => handlePasswordFocus(false)}
                class="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none text-gray-800 placeholder-gray-400 transition-all group-focus-within:bg-white group-focus-within:border-black group-focus-within:shadow-lg"
                placeholder="••••••••"
                disabled={isLoading}
              >
            {/if}
            <button 
              type="button" 
              on:click={() => showPassword = !showPassword}
              class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
            >
              {#if showPassword}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.399 8.049 7.21 5 12 5c4.789 0 8.601 3.049 9.964 6.322.053.126.053.272 0 .397m-11.964 0a3 3 0 116 0 3 3 0 01-6 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              {/if}
            </button>
          </div>
          {#if passwordError}
            <div class="flex items-center gap-1.5 mt-1.5 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span class="text-xs">{passwordError}</span>
            </div>
          {/if}
        </div>

        <!-- Remember & Forgot -->
        <div class="flex items-center justify-between">
          <label class="flex items-center cursor-pointer group">
            <input type="checkbox" bind:checked={rememberMe} class="w-4 h-4 rounded border-gray-300 accent-black cursor-pointer">
            <span class="ml-2 text-sm text-gray-600 group-hover:text-black transition-colors">Remember for 30 days</span>
          </label>
          <a href="/forgot-password" class="text-sm font-semibold text-gray-800 hover:text-black hover:underline transition-all">Forgot password?</a>
        </div>

        <!-- General Error Message -->
        {#if generalError}
          <div class="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-shrink-0 mt-0.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span class="text-sm">{generalError}</span>
          </div>
        {/if}

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-900 hover:shadow-xl hover:shadow-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center group"
          disabled={isLoading}
        >
          {#if isLoading}
            <svg class="animate-spin w-5 h-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          {:else}
            Sign in
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          {/if}
        </button>
      </form>

      <!-- Demo Access Section -->
      <div class="mt-8">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-gray-400 font-medium">Or try demo accounts</span>
          </div>
        </div>
        
        <div class="mt-5 grid grid-cols-2 gap-3">
          <button 
            on:click={() => { email = 'admin@ministore.com'; password = 'admin123'; }}
            class="group relative flex items-center gap-3 p-3 bg-gray-50 border-2 border-transparent hover:border-[#7C3AED] hover:bg-[#F8F7FF] rounded-xl transition-all duration-300"
          >
            <div class="w-10 h-10 bg-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="text-left min-w-0">
              <p class="text-sm font-bold text-gray-800 group-hover:text-[#7C3AED]">Admin</p>
              <p class="text-xs text-gray-500 truncate group-hover:text-[#7C3AED]/80">admin@ministore.com</p>
            </div>
          </button>
          
          <button 
            on:click={() => { email = 'manager@ministore.com'; password = 'manager123'; }}
            class="group relative flex items-center gap-3 p-3 bg-gray-50 border-2 border-transparent hover:border-[#FB923C] hover:bg-[#FFFBEB] rounded-xl transition-all duration-300"
          >
            <div class="w-10 h-10 bg-[#FB923C] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="text-left min-w-0">
              <p class="text-sm font-bold text-gray-800 group-hover:text-[#FB923C]">Manager</p>
              <p class="text-xs text-gray-500 truncate group-hover:text-[#FB923C]/80">manager@ministore.com</p>
            </div>
          </button>
        </div>
      </div>
      
      <p class="text-center text-sm text-gray-500 mt-6">
        Don't have an account? 
        <a href="/register" class="text-black font-bold hover:underline">Sign up</a>
      </p>
    </div>
  </div>
</div>

<style>
  /* Animation Keyframes */
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }
  
  .float {
    animation: float 4s ease-in-out infinite;
  }

  /* Eye Styles */
  .eye-white {
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .pupil {
    width: 6px;
    height: 6px;
    background: #000;
    border-radius: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -3px;
    margin-top: -3px;
    transition: transform 0.05s ease-out, height 0.2s ease;
  }
</style>
