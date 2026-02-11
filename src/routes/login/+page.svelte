<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { addNotification } from "$lib/stores/stores";
  import { auth } from "$lib/stores/auth";

  let email = "";
  let password = "";
  let isLoading = false;
  let rememberMe = false;
  let showPassword = false;
  let emailError = "";
  let passwordError = "";
  let generalError = "";
  let mounted = false;
  let emailFocused = false;
  let passwordFocused = false;
  let isPasswordFieldFocused = false;

  function validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  async function handleLogin() {
    emailError = "";
    passwordError = "";
    generalError = "";

    if (!email && !password) {
      emailError = "Email is required";
      passwordError = "Password is required";
      return;
    }

    if (!email) {
      emailError = "Email is required";
      return;
    }

    if (!validateEmail(email)) {
      emailError = "Please enter a valid email address";
      return;
    }

    if (!password) {
      passwordError = "Password is required";
      return;
    }

    if (!validatePassword(password)) {
      passwordError = "Password must be at least 6 characters";
      return;
    }

    isLoading = true;

    try {
      const result = await auth.login(email, password, rememberMe);

      if (result.success) {
        addNotification("Welcome back!", "success");
        goto(result.redirectTo || "/dashboard");
      } else {
        generalError = result.message || "Invalid credentials";
        addNotification(result.message || "Login failed", "error");
      }
    } catch (error) {
      generalError = "Connection error. Please try again.";
      addNotification("Connection error. Please try again.", "error");
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleLogin();
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    email = demoEmail;
    password = demoPassword;
  }

  onMount(() => {
    mounted = true;
    const pupils = document.querySelectorAll(".pupil");

    const handleMouseMove = (e: MouseEvent) => {
      if (isPasswordFieldFocused) return;
      pupils.forEach((pupil) => {
        if (!(pupil instanceof HTMLElement)) return;
        const rect = pupil.parentElement!.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;
        const angle = Math.atan2(
          e.clientY - eyeCenterY,
          e.clientX - eyeCenterX,
        );
        const distance = 4;
        pupil.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  });

  function handlePasswordFocus(focus: boolean) {
    isPasswordFieldFocused = focus;
    const pupils = document.querySelectorAll(".pupil");
    const eyelids = document.querySelectorAll(".eyelid");
    pupils.forEach((p) => {
      if (p instanceof HTMLElement) {
        p.style.transform = focus ? "translateY(3px)" : "translateY(0)";
      }
    });
    eyelids.forEach((e) => {
      if (e instanceof HTMLElement) {
        e.style.height = focus ? "100%" : "0%";
      }
    });
  }

  function updateEyesForPasswordVisibility() {
    if (!isPasswordFieldFocused) return;
    const pupils = document.querySelectorAll(".pupil");
    const eyelids = document.querySelectorAll(".eyelid");
    pupils.forEach((p) => {
      if (p instanceof HTMLElement) {
        if (showPassword) {
          p.style.opacity = "1";
          p.style.transform = "translateY(0)";
        } else {
          p.style.opacity = "0";
          p.style.transform = "translateY(3px)";
        }
      }
    });
    eyelids.forEach((e) => {
      if (e instanceof HTMLElement) {
        e.style.height = showPassword ? "0%" : "100%";
      }
    });
  }

  $: showPassword, updateEyesForPasswordVisibility();
</script>

<svelte:head>
  <title>Login - Mini Store Inventory</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Caveat+Brush&family=Mali:wght@400;500;600;700&family=Caveat:wght@400;700&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Hand-drawn SVG filter definitions (used across the page) -->
<svg width="0" height="0" style="position:absolute">
  <defs>
    <!-- Pencil / rough-edge filter -->
    <filter id="sketchy" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="4" result="noise" seed="2"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <!-- Heavier hand-drawn filter for buttons -->
    <filter id="handdrawn" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" result="noise" seed="5"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <!-- Paper grain texture -->
    <filter id="paper-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="5" stitchTiles="stitch" result="grain"/>
      <feColorMatrix type="saturate" values="0" in="grain" result="bw"/>
      <feBlend in="SourceGraphic" in2="bw" mode="multiply"/>
    </filter>
  </defs>
</svg>

<div class="login-page">
  <div class="login-container" class:mounted>
    <!-- ================================================
         LEFT PANEL — Full-bleed Puppet Store Illustration
         ================================================ -->
    <div class="left-panel">
      <!-- Full-bleed illustration background -->
      <div class="left-illustration"></div>
      <!-- Dark vignette + texture overlays -->
      <div class="left-vignette"></div>
      <div class="left-grain-overlay"></div>
      
      <div class="left-content">
        <!-- Decorative curtain top element -->
        <div class="curtain-top">
          <svg viewBox="0 0 300 30" preserveAspectRatio="none" class="curtain-svg">
            <path d="M0,0 Q25,28 50,5 Q75,28 100,5 Q125,28 150,5 Q175,28 200,5 Q225,28 250,5 Q275,28 300,5 L300,0 Z" fill="rgba(140,21,35,0.7)" stroke="rgba(26,23,20,0.4)" stroke-width="1.5"/>
            <path d="M0,0 Q25,22 50,2 Q75,22 100,2 Q125,22 150,2 Q175,22 200,2 Q225,22 250,2 Q275,22 300,2 L300,0 Z" fill="rgba(184,28,46,0.5)" stroke="none"/>
          </svg>
        </div>

        <!-- Logo framed by the illustration -->
        <div class="logo-showcase">
          <div class="logo-frame">
            <div class="logo-frame-border"></div>
            <div class="logo-circle">
              <img src="/logo.png" alt="Mini Store" class="logo-img" />
            </div>
          </div>
        </div>

        <div class="brand-text-section">
          <h1 class="brand-name">Mini Store</h1>
          <div class="brand-divider">
            <svg viewBox="0 0 120 8" class="brand-divider-svg">
              <path d="M5,4 Q15,1 30,4 Q45,7 60,4 Q75,1 90,4 Q105,7 115,4" stroke="rgba(250,246,237,0.5)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="brand-tagline">Inventory Management System</p>
        </div>

        <p class="left-footer-text">
          <span class="footer-flourish">~</span>
          Manage your inventory with ease
          <span class="footer-flourish">~</span>
        </p>
      </div>
    </div>

    <!-- ================================================
         RIGHT PANEL — The Shopkeeper's Ledger Form
         ================================================ -->
    <div class="right-panel">
      <!-- Aged paper edge decoration -->
      <div class="paper-edge-left"></div>
      <div class="paper-stain"></div>

      <div class="form-wrapper">
        <div class="form-header">
          <div class="mobile-brand">
            <div class="brand-icon-sm">
              <img src="/logo.png" alt="Mini Store" width="36" height="36" style="border-radius: 50%; object-fit: cover;" />
            </div>
          </div>

          <!-- Cute Shopkeeper Mascot with eye-tracking -->
          <div class="mascot" aria-hidden="true">
            <div class="mascot-body">
              <div class="mascot-hat">
                <svg viewBox="0 0 60 20" width="60" height="20">
                  <path d="M5,18 Q8,4 30,2 Q52,4 55,18" fill="var(--crimson)" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="round" style="filter:url(#sketchy)"/>
                  <path d="M15,18 Q16,12 30,10 Q44,12 45,18" fill="var(--crimson-dark)" stroke="none" opacity="0.3"/>
                </svg>
              </div>
              <div class="mascot-face">
                <div class="mascot-eyes">
                  <div class="eye eye-left">
                    <div class="eye-white">
                      <div class="pupil"></div>
                    </div>
                    <div class="eyelid"></div>
                  </div>
                  <div class="eye eye-right">
                    <div class="eye-white">
                      <div class="pupil"></div>
                    </div>
                    <div class="eyelid"></div>
                  </div>
                </div>
                <div class="mascot-blush mascot-blush-l"></div>
                <div class="mascot-blush mascot-blush-r"></div>
                <div class="mascot-mouth">
                  <svg viewBox="0 0 20 10" width="16" height="8">
                    <path d="M3,3 Q10,10 17,3" stroke="var(--ink)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h2 class="form-title">Welcome back!</h2>
          <p class="form-subtitle">Open the ledger and start your day</p>
        </div>

        <form on:submit|preventDefault={handleLogin} class="login-form">
          <!-- ===== Email Field — inked underline ===== -->
          <div class="field-group">
            <label class="field-label" for="email">
              <!-- hand-drawn envelope doodle -->
              <svg class="label-icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="6" width="22" height="16" rx="2" ry="2" stroke-width="1.8" style="filter:url(#sketchy)"/>
                <path d="M3 8 l11 7.5 L25 8" stroke-width="1.6"/>
                <path d="M3 22 l7-6" stroke-width="1.2" opacity="0.4"/>
                <path d="M25 22 l-7-6" stroke-width="1.2" opacity="0.4"/>
              </svg>
              Email
            </label>
            <div class="input-field-wrap" class:focused={emailFocused} class:has-error={emailError}>
              <span class="bracket bracket-l">[</span>
              <input id="email" type="email" bind:value={email} on:keydown={handleKeydown} on:focus={() => (emailFocused = true)} on:blur={() => (emailFocused = false)} class="login-input" placeholder="your@email.com" disabled={isLoading} autocomplete="email"/>
              <span class="bracket bracket-r">]</span>
              <!-- Hand-drawn underline SVG -->
              <svg class="ink-underline" viewBox="0 0 300 8" preserveAspectRatio="none">
                <path d="M8,5 Q30,2 60,5 Q100,8 150,4 Q200,1 240,5 Q270,7 292,4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
              </svg>
            </div>
            {#if emailError}
              <p class="field-error">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
                {emailError}
              </p>
            {/if}
          </div>

          <!-- ===== Password Field — inked underline ===== -->
          <div class="field-group">
            <label class="field-label" for="password">
              <!-- hand-drawn lock doodle -->
              <svg class="label-icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="13" width="18" height="12" rx="2" stroke-width="1.8" style="filter:url(#sketchy)"/>
                <path d="M9 13 V9 a5 5 0 0 1 10 0 v4" stroke-width="1.8"/>
                <circle cx="14" cy="19" r="1.5" fill="currentColor" stroke="none"/>
                <path d="M14 20.5 v2" stroke-width="1.5"/>
              </svg>
              Password
            </label>
            <div class="input-field-wrap" class:focused={passwordFocused} class:has-error={passwordError}>
              <span class="bracket bracket-l">[</span>
              {#if showPassword}
                <input id="password" type="text" bind:value={password} on:keydown={handleKeydown} on:focus={() => { passwordFocused = true; handlePasswordFocus(true); }} on:blur={() => { passwordFocused = false; handlePasswordFocus(false); }} class="login-input" placeholder="your password" disabled={isLoading} autocomplete="current-password"/>
              {:else}
                <input id="password" type="password" bind:value={password} on:keydown={handleKeydown} on:focus={() => { passwordFocused = true; handlePasswordFocus(true); }} on:blur={() => { passwordFocused = false; handlePasswordFocus(false); }} class="login-input" placeholder="your password" disabled={isLoading} autocomplete="current-password"/>
              {/if}
              <button type="button" on:click={() => (showPassword = !showPassword)} class="toggle-password" tabindex="-1" aria-label="Toggle password">
                {#if showPassword}
                  <!-- sketchy open eye — hand-drawn style -->
                  <svg viewBox="0 0 28 28" width="22" height="22" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 14 Q6 6 14 6 Q22 6 26 14 Q22 22 14 22 Q6 22 2 14Z" stroke-width="1.5" style="filter:url(#sketchy)"/>
                    <circle cx="14" cy="14" r="4" stroke-width="1.5"/>
                    <circle cx="14" cy="14" r="1.5" fill="currentColor" stroke="none"/>
                    <!-- Eyelash doodles -->
                    <path d="M7 8 L5 5" stroke-width="1" opacity="0.4"/>
                    <path d="M14 6 L14 3" stroke-width="1" opacity="0.4"/>
                    <path d="M21 8 L23 5" stroke-width="1" opacity="0.4"/>
                  </svg>
                {:else}
                  <!-- sketchy closed eye — hand-drawn X -->
                  <svg viewBox="0 0 28 28" width="22" height="22" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 14 Q6 6 14 6 Q22 6 26 14" stroke-width="1.5" style="filter:url(#sketchy)"/>
                    <path d="M2 14 Q6 20 14 20 Q22 20 26 14" stroke-width="1.5" stroke-dasharray="3,2"/>
                    <line x1="4" y1="4" x2="24" y2="24" stroke-width="1.8"/>
                    <path d="M10 17 L8 21" stroke-width="1" opacity="0.5"/>
                    <path d="M18 17 L20 21" stroke-width="1" opacity="0.5"/>
                  </svg>
                {/if}
              </button>
              <span class="bracket bracket-r">]</span>
              <!-- Hand-drawn underline SVG -->
              <svg class="ink-underline" viewBox="0 0 300 8" preserveAspectRatio="none">
                <path d="M8,4 Q40,7 80,3 Q120,1 160,5 Q200,8 240,3 Q270,1 292,5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
              </svg>
            </div>
            {#if passwordError}
              <p class="field-error">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
                {passwordError}
              </p>
            {/if}
          </div>

          <!-- ===== Remember & Forgot ===== -->
          <div class="form-options">
            <label class="remember-label">
              <input type="checkbox" bind:checked={rememberMe} class="remember-checkbox"/>
              <span class="custom-checkbox">
                {#if rememberMe}
                  <!-- Quick hand-drawn checkmark stroke -->
                  <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9.5 Q5 11 7 13 Q9 9 15 4" stroke-width="2.8" style="filter:url(#sketchy)"/>
                  </svg>
                {/if}
              </span>
              <span class="remember-text">Remember me</span>
            </label>
            <a href="/forgot-password" class="forgot-link">Forgot?</a>
          </div>

          {#if generalError}
            <div class="general-error">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10" cy="10" r="8"/><path d="M10 6v5"/><circle cx="10" cy="14" r="0.8" fill="currentColor"/></svg>
              <span>{generalError}</span>
            </div>
          {/if}

          <!-- ===== Wax Seal Sign In Button ===== -->
          <button type="submit" class="seal-btn" disabled={isLoading}>
            <!-- Irregular outer ring -->
            <span class="seal-ring"></span>
            <!-- Inner decorative ring -->
            <span class="seal-inner-ring"></span>
            <!-- Ink stamp grunge texture -->
            <span class="seal-grunge"></span>
            {#if isLoading}
              <div class="spinner"></div>
              <span class="seal-text">Wait...</span>
            {:else}
              <span class="seal-text">Sign In</span>
              <svg class="seal-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            {/if}
          </button>
        </form>

        <!-- ===== Demo Ticket Cards — Physical Paper Tickets ===== -->
        <div class="demo-section">
          <div class="divider">
            <svg class="divider-flourish" viewBox="0 0 24 12" width="20" height="10">
              <path d="M2 6 Q6 1 12 6 Q18 11 22 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
            <span>Quick Demo Access</span>
            <svg class="divider-flourish" viewBox="0 0 24 12" width="20" height="10">
              <path d="M2 6 Q6 11 12 6 Q18 1 22 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="demo-cards">
            <!-- Admin Ticket -->
            <button class="ticket ticket-admin" on:click={() => fillDemo("admin@ministore.com", "admin123")} type="button">
              <div class="ticket-notch ticket-notch-left"></div>
              <div class="ticket-notch ticket-notch-right"></div>
              <div class="ticket-tear-line"></div>
              <div class="ticket-content">
                <div class="ticket-icon admin-icon">
                  <!-- hand-sketched shield doodle -->
                  <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 3 L6 8 Q5 8.5 5.5 13 Q6 18 10 22 Q13 25 16 27 Q19 25 22 22 Q26 18 26.5 13 Q27 8.5 26 8 Z" stroke-width="1.5" style="filter:url(#sketchy)"/>
                    <path d="M12 16 l3 3 l5-6" stroke-width="2"/>
                    <!-- decorative star doodle -->
                    <path d="M16 8 l0.5 1.5 1.5 0 -1 1 0.5 1.5 -1.5-0.8 -1.5 0.8 0.5-1.5 -1-1 1.5 0z" fill="currentColor" stroke="none" opacity="0.3"/>
                  </svg>
                </div>
                <div class="ticket-info">
                  <span class="ticket-role">Admin</span>
                  <span class="ticket-desc">Full access</span>
                </div>
                <span class="ticket-go">
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 10h12M12 6l4 4-4 4"/></svg>
                </span>
              </div>
            </button>

            <!-- Manager Ticket -->
            <button class="ticket ticket-manager" on:click={() => fillDemo("manager@ministore.com", "manager123")} type="button">
              <div class="ticket-notch ticket-notch-left"></div>
              <div class="ticket-notch ticket-notch-right"></div>
              <div class="ticket-tear-line"></div>
              <div class="ticket-content">
                <div class="ticket-icon manager-icon">
                  <!-- hand-sketched person doodle -->
                  <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="16" cy="10" r="5" stroke-width="1.5" style="filter:url(#sketchy)"/>
                    <path d="M7 28 Q7 20 16 20 Q25 20 25 28" stroke-width="1.5" style="filter:url(#sketchy)"/>
                    <!-- Hair scribble -->
                    <path d="M12 6 Q14 4 16 5 Q18 4 20 6" stroke-width="1.2" opacity="0.4"/>
                    <!-- Collar doodle -->
                    <path d="M13 19 L16 22 L19 19" stroke-width="1" opacity="0.3"/>
                  </svg>
                </div>
                <div class="ticket-info">
                  <span class="ticket-role">Manager</span>
                  <span class="ticket-desc">Standard access</span>
                </div>
                <span class="ticket-go">
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 10h12M12 6l4 4-4 4"/></svg>
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* ============================================
     THE SHOPKEEPER'S LEDGER — LOGIN POLISH
     ============================================ */

  /* ===== BASE ===== */
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Mali', system-ui, -apple-system, sans-serif;
    background: var(--paper);
    position: relative;
    overflow: hidden;
  }
  /* Decorative ink splatters on background */
  .login-page::before {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    top: -60px;
    right: -60px;
    background: radial-gradient(circle, rgba(184,28,46,0.04) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  .login-page::after {
    content: '';
    position: absolute;
    width: 250px;
    height: 250px;
    bottom: -40px;
    left: -40px;
    background: radial-gradient(circle, rgba(201,149,44,0.05) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  /* ===== CONTAINER ===== */
  .login-container {
    display: flex;
    width: 100%;
    max-width: 1020px;
    min-height: 640px;
    overflow: hidden;
    background: var(--paper-card);
    border: 3px solid var(--ink);
    border-radius: 10px 14px 10px 12px;
    box-shadow: 6px 6px 0px rgba(33, 33, 33, 0.15);
    opacity: 0;
    transform: translateY(20px) scale(0.98);
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .login-container.mounted {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  .login-container.mounted .field-group:nth-child(1) {
    animation: fadeSlideUp 0.5s 0.3s both;
  }
  .login-container.mounted .field-group:nth-child(2) {
    animation: fadeSlideUp 0.5s 0.45s both;
  }
  .login-container.mounted .form-options {
    animation: fadeSlideUp 0.5s 0.55s both;
  }
  .login-container.mounted .seal-btn {
    animation: sealPop 0.6s 0.65s both;
  }
  .login-container.mounted .demo-section {
    animation: fadeSlideUp 0.5s 0.8s both;
  }
  .login-container.mounted .mascot {
    animation: mascotBounce 0.6s 0.2s both;
  }

  /* =======================================
     LEFT PANEL — Full-bleed illustration
     ======================================= */
  /* ===== LEFT ILLUSTRATION BG ===== */
  .left-illustration {
    position: absolute;
    inset: 0;
    background: url('/logo.png') center center / cover no-repeat;
    filter: saturate(0.85) contrast(1.05);
  }
  .left-grain-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  .left-panel {
    display: none;
    width: 46%;
    position: relative;
    overflow: hidden;
    background: #1a1714;
    border-right: 3px solid var(--ink);
  }
  /* Dark vignette + texture overlay */
  .left-vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      radial-gradient(ellipse at center, transparent 30%, rgba(18, 14, 10, 0.55) 100%),
      linear-gradient(to top, rgba(18, 14, 10, 0.6) 0%, transparent 35%),
      linear-gradient(to bottom, rgba(18, 14, 10, 0.3) 0%, transparent 25%);
    pointer-events: none;
  }
  /* Paper grain overlay */
  .left-vignette::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
    mix-blend-mode: overlay;
    pointer-events: none;
  }
  .left-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
    padding: 40px 28px 36px;
    gap: 16px;
  }

  /* ===== LOGO in small floating circle ===== */
  .logo-showcase {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }
  .logo-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid rgba(250, 246, 237, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(250, 246, 237, 0.15);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    transition: transform 0.4s ease;
  }
  .logo-circle:hover {
    transform: scale(1.05);
  }
  .logo-img {
    width: 62px;
    height: 62px;
    object-fit: cover;
    border-radius: 50%;
  }

  /* ===== Left panel brand text ===== */
  .brand-text-section {
    text-align: center;
  }
  .brand-name {
    font-size: 2.2rem;
    font-weight: 700;
    color: #faf6ed;
    font-family: 'Caveat Brush', cursive;
    letter-spacing: 0.04em;
    line-height: 1.1;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  }
  .brand-tagline {
    font-size: 0.85rem;
    color: rgba(250, 246, 237, 0.7);
    margin-top: 4px;
    font-style: italic;
    font-family: 'Mali', sans-serif;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
  }

  .left-footer-text {
    font-size: 0.9rem;
    color: rgba(250, 246, 237, 0.45);
    font-family: 'Caveat Brush', cursive;
    letter-spacing: 0.02em;
    margin-top: 4px;
  }
  .footer-flourish {
    opacity: 0.5;
    font-size: 1.1em;
  }

  /* ===== Curtain top decoration ===== */
  .curtain-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 3;
  }
  .curtain-svg {
    display: block;
    width: 100%;
    height: 30px;
  }

  /* ===== Logo frame ===== */
  .logo-frame {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-frame-border {
    position: absolute;
    inset: -6px;
    border: 2px dashed rgba(250, 246, 237, 0.2);
    border-radius: 50%;
    animation: spin 20s linear infinite;
  }

  /* ===== Brand divider ===== */
  .brand-divider {
    display: flex;
    justify-content: center;
    margin: 4px 0;
  }
  .brand-divider-svg {
    width: 120px;
    height: 8px;
  }

  /* =======================================
     RIGHT PANEL — Paper grain form
     ======================================= */
  /* ===== Paper edge decoration ===== */
  .paper-edge-left {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 20px;
    background: linear-gradient(to right, rgba(26,23,20,0.04) 0%, transparent 100%);
    pointer-events: none;
    z-index: 1;
  }
  .paper-stain {
    position: absolute;
    top: 15%;
    right: 10%;
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, rgba(201,149,44,0.06) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }

  .right-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 44px 28px 36px;
    background: #F9F7F2;
    /* subtle paper grain */
    background-image: url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    position: relative;
    overflow-y: auto;
  }
  .form-wrapper {
    width: 100%;
    max-width: 380px;
    margin: auto 0;
  }

  .mobile-brand {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }
  .brand-icon-sm {
    width: 48px;
    height: 48px;
    background: var(--paper-warm);
    border: 2px solid var(--ink);
    border-radius: 10px 12px 10px 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 2px 2px 0px rgba(33, 33, 33, 0.12);
  }

  .form-header {
    text-align: left;
    margin-bottom: 30px;
  }
  .form-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    font-family: 'Caveat Brush', cursive;
    line-height: 1.15;
    letter-spacing: 0.02em;
    transform: rotate(-1deg);
    display: inline-block;
    position: relative;
    margin-bottom: 2px;
  }
  /* Brush-stroke underline */
  .form-title::after {
    content: '';
    position: absolute;
    left: 2%;
    right: 2%;
    bottom: -2px;
    height: 4px;
    background: var(--crimson);
    border-radius: 3px;
    transform: rotate(0.6deg) scaleX(0.9);
    opacity: 0.55;
  }
  .form-subtitle {
    font-size: 13.5px;
    color: var(--ink-faint);
    margin-top: 8px;
    font-style: italic;
    letter-spacing: 0.01em;
  }

  /* ===================================
     FORM — Hand-drawn bracket inputs
     =================================== */
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field-label {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
    padding-left: 4px;
    font-family: 'Caveat Brush', cursive;
    letter-spacing: 0.03em;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .label-icon {
    width: 18px;
    height: 18px;
    opacity: 0.45;
    flex-shrink: 0;
  }

  /* Bracket input wrapper — .input-field-wrap used in HTML */
  .input-field-wrap {
    display: flex;
    align-items: center;
    position: relative;
    transition: all 0.25s ease;
    padding: 2px 0;
    margin-left: 2px;
    margin-right: 2px;
  }
  .bracket {
    font-family: 'Caveat Brush', cursive;
    font-size: 2.2rem;
    line-height: 1;
    color: var(--ink);
    opacity: 0.3;
    user-select: none;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    flex-shrink: 0;
  }
  .bracket-l { margin-right: 4px; }
  .bracket-r { margin-left: 4px; }

  /* Focused state — ink turns crimson + thicker */
  .input-field-wrap.focused .bracket {
    color: var(--crimson);
    opacity: 0.7;
    font-weight: 700;
    transform: scaleY(1.1);
  }
  .input-field-wrap.has-error .bracket {
    color: var(--crimson);
    opacity: 0.8;
  }

  /* Hand-drawn ink underline */
  .ink-underline {
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 8px;
    color: var(--ink);
    opacity: 0.2;
    transition: all 0.3s ease;
    pointer-events: none;
  }
  .input-field-wrap.focused .ink-underline {
    color: var(--crimson);
    opacity: 0.5;
  }
  .input-field-wrap.has-error .ink-underline {
    color: var(--crimson);
    opacity: 0.6;
  }

  .login-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 10px 6px;
    font-size: 15px;
    color: var(--ink);
    font-family: 'Mali', sans-serif;
    min-width: 0;
    letter-spacing: 0.01em;
  }
  .login-input::placeholder {
    color: var(--ink-faint);
    font-style: italic;
    opacity: 0.5;
    font-size: 14px;
    letter-spacing: 0.02em;
  }
  .login-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Toggle password — sketchy eye */
  .toggle-password {
    background: none;
    border: none;
    padding: 4px 6px;
    color: var(--ink-faint);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: color 0.2s;
    opacity: 0.6;
    flex-shrink: 0;
  }
  .toggle-password:hover {
    color: var(--ink);
    opacity: 1;
  }

  .field-error {
    color: var(--crimson);
    font-size: 12px;
    padding-left: 22px;
    font-weight: 500;
    font-style: italic;
    display: flex;
    align-items: center;
    gap: 5px;
    animation: shakeError 0.4s ease;
  }

  /* ======================================
     MASCOT — Cute Shopkeeper with Eyes
     ====================================== */
  .mascot {
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
  }
  .mascot-body {
    position: relative;
    width: 80px;
    height: 72px;
  }
  .mascot-hat {
    position: absolute;
    top: -2px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
  }
  .mascot-face {
    position: relative;
    width: 64px;
    height: 52px;
    margin: 16px auto 0;
    background: var(--paper-warm);
    border: 2.5px solid var(--ink);
    border-radius: 50% 50% 48% 52% / 55% 55% 45% 45%;
    box-shadow: 2px 3px 0px rgba(33, 33, 33, 0.1);
  }
  .mascot-eyes {
    display: flex;
    justify-content: center;
    gap: 14px;
    padding-top: 12px;
  }
  .eye {
    position: relative;
    width: 14px;
    height: 14px;
  }
  .eye-white {
    width: 14px;
    height: 14px;
    background: white;
    border: 2px solid var(--ink);
    border-radius: 50%;
    position: relative;
    overflow: hidden;
  }
  .pupil {
    width: 6px;
    height: 6px;
    background: var(--ink);
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    margin: -3px 0 0 -3px;
    transition: transform 0.1s ease-out, opacity 0.3s ease;
  }
  .eyelid {
    position: absolute;
    top: 0;
    left: -1px;
    right: -1px;
    height: 0%;
    background: var(--paper-warm);
    border-bottom: 2px solid var(--ink);
    border-radius: 50% 50% 0 0;
    transition: height 0.25s ease;
    z-index: 1;
  }
  .mascot-blush {
    width: 10px;
    height: 6px;
    background: rgba(184, 28, 46, 0.15);
    border-radius: 50%;
    position: absolute;
    top: 28px;
  }
  .mascot-blush-l { left: 6px; }
  .mascot-blush-r { right: 6px; }
  .mascot-mouth {
    display: flex;
    justify-content: center;
    margin-top: 4px;
  }

  /* ===== FORM OPTIONS ===== */
  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2px;
    padding: 0 4px;
  }
  .remember-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }
  .remember-checkbox { display: none; }

  /* Pen-drawn checkbox square */
  .custom-checkbox {
    width: 18px;
    height: 18px;
    border-radius: 2px;
    border: 2.5px solid var(--ink);
    border-top-width: 2px;
    border-left-width: 3px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
    position: relative;
    opacity: 0.5;
  }
  .remember-checkbox:checked + .custom-checkbox {
    border-color: var(--crimson);
    background: transparent;
    opacity: 1;
  }
  .remember-checkbox:checked + .custom-checkbox svg {
    color: var(--crimson);
  }

  .remember-text {
    font-size: 13px;
    color: var(--ink-faint);
  }
  .forgot-link {
    font-size: 13px;
    color: var(--crimson);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
    font-family: 'Caveat Brush', cursive;
    font-size: 0.95rem;
    border-bottom: 1.5px dashed rgba(184, 28, 46, 0.3);
    padding-bottom: 1px;
  }
  .forgot-link:hover {
    color: var(--crimson-dark);
    border-bottom-color: var(--crimson-dark);
  }

  /* ===== GENERAL ERROR ===== */
  .general-error {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(196, 30, 58, 0.06);
    border: 2px dashed rgba(196, 30, 58, 0.25);
    border-radius: 4px;
    color: var(--crimson);
    font-size: 13px;
    font-weight: 500;
  }

  /* =================================
     WAX SEAL — Sign In Button
     ================================= */
  .seal-btn {
    width: 120px;
    height: 120px;
    margin: 16px auto 4px;
    border: none;
    border-radius: 50%;
    font-size: 17px;
    font-weight: 700;
    font-family: 'Caveat Brush', cursive;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: #faf6ed;
    background:
      radial-gradient(circle at 40% 35%, rgba(255,255,255,0.12) 0%, transparent 50%),
      radial-gradient(circle at 60% 70%, rgba(0,0,0,0.15) 0%, transparent 50%),
      var(--crimson);
    box-shadow:
      3px 4px 0px var(--crimson-dark),
      inset 0 0 18px rgba(120, 16, 28, 0.35),
      0 2px 12px rgba(184, 28, 46, 0.25);
    transition: all 0.2s ease;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    position: relative;
    overflow: hidden;
    /* Organic irregularity */
    border-radius: 48% 52% 50% 50% / 50% 48% 52% 50%;
  }
  /* Grunge ink stamp texture inside */
  .seal-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image: url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.12'/%3E%3C/svg%3E");
    mix-blend-mode: overlay;
    pointer-events: none;
  }
  /* Dashed inner ring */
  .seal-ring {
    position: absolute;
    inset: 7px;
    border: 2px dashed rgba(250, 246, 237, 0.25);
    border-radius: inherit;
    pointer-events: none;
  }
  .seal-text {
    position: relative;
    z-index: 1;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  .seal-arrow {
    position: relative;
    z-index: 1;
    transition: transform 0.3s;
    opacity: 0.8;
  }
  .seal-btn:hover:not(:disabled) {
    transform: translate(-2px, -2px) rotate(-3deg) scale(1.03);
    box-shadow:
      5px 6px 0px var(--crimson-dark),
      inset 0 0 18px rgba(120, 16, 28, 0.35),
      0 4px 20px rgba(184, 28, 46, 0.3);
  }
  .seal-btn:hover:not(:disabled) .seal-arrow {
    transform: translateX(3px);
  }
  .seal-btn:active:not(:disabled) {
    transform: translate(2px, 2px) rotate(1deg) scale(0.98);
    box-shadow:
      0px 0px 0px var(--crimson-dark),
      inset 0 0 18px rgba(120, 16, 28, 0.35);
  }
  .seal-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: 2px 2px 0px var(--crimson-dark);
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    position: relative;
    z-index: 1;
  }

  /* ====================================
     DEMO SECTION — Ticket / Coupon Cards
     ==================================== */
  .demo-section { margin-top: 20px; }
  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 0;
    border-top: 1.5px dashed var(--border-ink);
    opacity: 0.4;
  }
  .divider span {
    font-size: 0.8rem;
    color: var(--ink-faint);
    font-weight: 500;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-family: 'Caveat Brush', cursive;
  }
  .divider-flourish {
    opacity: 0.4;
    color: var(--ink-faint);
    flex-shrink: 0;
  }

  .demo-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  /* Ticket card — coupon-cut style */
  .ticket {
    display: block;
    padding: 10px 16px 10px 18px;
    background: var(--paper);
    border: 2px dashed var(--border-ink);
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Mali', sans-serif;
    text-align: left;
    position: relative;
    overflow: hidden;
  }
  .ticket-content {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    position: relative;
    z-index: 1;
  }
  /* Coupon notches on both edges */
  .ticket-notch {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    background: #F9F7F2;
    border-radius: 50%;
    border: 2px dashed var(--border-ink);
    pointer-events: none;
    z-index: 2;
  }
  .ticket-notch-left {
    left: -7px;
  }
  .ticket-notch-right {
    right: -7px;
  }
  /* Vertical tear line */
  .ticket-tear-line {
    position: absolute;
    right: 35px;
    top: 4px;
    bottom: 4px;
    width: 0;
    border-right: 1.5px dashed rgba(26, 23, 20, 0.12);
    pointer-events: none;
  }
  .ticket:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0px rgba(33, 33, 33, 0.1);
    border-style: solid;
  }
  .ticket:active {
    transform: translate(1px, 1px);
    box-shadow: none;
  }
  .ticket-admin:hover { border-color: var(--crimson); }
  .ticket-manager:hover { border-color: var(--gold-dark); }

  .ticket-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .admin-icon {
    background: rgba(184, 28, 46, 0.1);
    color: var(--crimson);
  }
  .manager-icon {
    background: rgba(194, 155, 48, 0.12);
    color: var(--gold-dark);
  }
  .ticket-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
  }
  .ticket-role {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    font-family: 'Caveat Brush', cursive;
    font-size: 1rem;
    letter-spacing: 0.02em;
  }
  .ticket-desc {
    font-size: 11px;
    color: var(--ink-faint);
    font-style: italic;
  }
  .ticket-go {
    color: var(--ink-faint);
    font-family: 'Caveat Brush', cursive;
    font-size: 1.2rem;
    flex-shrink: 0;
    transition: all 0.3s;
    opacity: 0.5;
  }
  .ticket:hover .ticket-go {
    opacity: 1;
    transform: translateX(3px);
    color: var(--ink);
  }

  /* ===== SEAL extra elements ===== */
  .seal-inner-ring {
    position: absolute;
    inset: 14px;
    border: 1.5px solid rgba(250, 246, 237, 0.15);
    border-radius: inherit;
    pointer-events: none;
  }
  .seal-grunge {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='0.6' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.08'/%3E%3C/svg%3E");
    mix-blend-mode: soft-light;
    pointer-events: none;
  }

  /* ===== ANIMATIONS ===== */
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeSlideUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes sealPop {
    0% {
      opacity: 0;
      transform: scale(0.5) rotate(-10deg);
    }
    60% {
      transform: scale(1.08) rotate(2deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
  @keyframes mascotBounce {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(0.8);
    }
    50% {
      transform: translateY(4px) scale(1.05);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  @keyframes shakeError {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(2px); }
  }

  /* ===== RESPONSIVE ===== */
  @media (min-width: 900px) {
    .left-panel { display: flex; }
    .mobile-brand { display: none; }
    .mascot { display: none; }
    .form-header { text-align: left; }
    .right-panel { padding: 44px 52px 36px; }
    .form-wrapper { max-width: 370px; }
  }
  @media (max-width: 899px) {
    .form-header { text-align: center; }
    .form-title {
      transform: rotate(0deg);
    }
    .login-container {
      max-width: 460px;
      border-radius: 12px;
    }
  }
  @media (max-width: 480px) {
    .login-page { padding: 10px; }
    .login-container {
      min-height: auto;
      border-width: 2px;
      box-shadow: 4px 4px 0px rgba(33, 33, 33, 0.12);
    }
    .right-panel { padding: 24px 20px 28px; }
    .form-title {
      font-size: 2rem;
    }
    .form-subtitle {
      font-size: 12.5px;
    }
    .form-header {
      margin-bottom: 22px;
    }
    .login-form {
      gap: 16px;
    }
    .demo-cards { grid-template-columns: 1fr; }
    .seal-btn {
      width: 100px;
      height: 100px;
      font-size: 14px;
      margin: 12px auto 2px;
    }
    .seal-ring { inset: 5px; }
    .seal-inner-ring { inset: 10px; }
    .mascot-body {
      width: 70px;
      height: 64px;
    }
    .mascot-face {
      width: 56px;
      height: 46px;
    }
    .demo-section { margin-top: 16px; }
    .ticket {
      padding: 10px 14px 10px 16px;
    }
  }
</style>
