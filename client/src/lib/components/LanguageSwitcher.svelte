<script lang="ts">
  import { currentLanguage, type Language } from '../stores/language';
  import { onMount } from 'svelte';
  
  let mounted = false;
  let isAnimating = false;
  
  onMount(() => {
    mounted = true;
  });
  
  function handleToggle() {
    if (isAnimating) return;
    
    isAnimating = true;
    currentLanguage.toggle();
    
    // Reset animation state after transition
    setTimeout(() => {
      isAnimating = false;
    }, 400);
  }
</script>

<div class="language-switcher" class:mounted>
  <div class="switch-container">
    <!-- Language Labels with Enhanced Design -->
    <div class="language-labels">
      <span class="lang-label" class:active={$currentLanguage === 'my'}>
        <span class="label-text">မြန်မာ</span>
        <span class="label-indicator"></span>
      </span>
      <span class="lang-label" class:active={$currentLanguage === 'en'}>
        <span class="label-text">English</span>
        <span class="label-indicator"></span>
      </span>
    </div>
    
    <!-- Enhanced Toggle Switch -->
    <button 
      class="toggle-switch" 
      class:toggled={$currentLanguage === 'en'}
      class:animating={isAnimating}
      on:click={handleToggle}
      aria-label="Switch language"
      title={$currentLanguage === 'my' ? 'Switch to English' : 'ပြောင်းမည်'}
    >
      <!-- Background Track -->
      <div class="toggle-track">
        <div class="track-fill"></div>
      </div>
      
      <!-- Toggle Slider -->
      <div class="toggle-slider">
        <div class="toggle-thumb">
          <!-- Flag Icon with Animation -->
          <div class="flag-container">
            <div class="flag-icon myanmar" class:visible={$currentLanguage === 'my'}>
              <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
                <rect width="20" height="5" fill="#FEDD00"/>
                <rect y="5" width="20" height="5" fill="#34A147"/>
                <rect y="10" width="20" height="5" fill="#EA2839"/>
                <polygon points="10,2.5 10.6,4.2 12.5,4.2 11,5.3 11.5,7.5 10,6.4 8.5,7.5 9,5.3 7.5,4.2 9.4,4.2" fill="white"/>
              </svg>
            </div>
            
            <div class="flag-icon english" class:visible={$currentLanguage === 'en'}>
              <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
                <rect width="20" height="15" fill="#012169"/>
                <path d="M0 0L20 15M20 0L0 15" stroke="white" stroke-width="2"/>
                <path d="M0 0L20 15M20 0L0 15" stroke="#C8102E" stroke-width="1.2"/>
                <path d="M10 0V15M0 7.5H20" stroke="white" stroke-width="2.5"/>
                <path d="M10 0V15M0 7.5H20" stroke="#C8102E" stroke-width="1.5"/>
              </svg>
            </div>
          </div>
          
          <!-- Animated Glow Effect -->
          <div class="thumb-glow"></div>
        </div>
      </div>
      
      <!-- Ripple Effects -->
      <div class="ripple-container">
        <div class="ripple"></div>
        <div class="ripple ripple-2"></div>
      </div>
      
      <!-- Active State Indicator -->
      <div class="active-indicator"></div>
    </button>
  </div>
  
  <!-- Enhanced Tooltip -->
  <div class="tooltip">
    <div class="tooltip-content">
      <span class="tooltip-text">
        {$currentLanguage === 'my' ? 'Click to switch to English' : 'ဘာသာစကားပြောင်းရန် နှိပ်ပါ'}
      </span>
      <div class="tooltip-arrow"></div>
    </div>
  </div>
</div>

<style>
  .language-switcher {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    user-select: none;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .language-switcher.mounted {
    opacity: 1;
    transform: translateY(0);
  }
  
  .switch-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .language-labels {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  
  .lang-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--gray-500);
    transition: all 0.3s ease;
    text-align: center;
    min-width: 2rem;
  }
  
  .lang-label.active {
    color: var(--primary-600);
    transform: scale(1.1);
  }
  

  
  /* Toggle Switch */
  .toggle-switch {
    position: relative;
    width: 3.5rem;
    height: 1.75rem;
    background: linear-gradient(135deg, var(--gray-200), var(--gray-300));
    border: 2px solid var(--gray-300);
    border-radius: 1rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    outline: none;
    box-shadow: 
      inset 0 2px 4px rgba(0, 0, 0, 0.1),
      0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .toggle-switch:hover {
    transform: scale(1.05);
    box-shadow: 
      inset 0 2px 4px rgba(0, 0, 0, 0.1),
      0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .toggle-switch:focus {
    box-shadow: 
      inset 0 2px 4px rgba(0, 0, 0, 0.1),
      0 0 0 3px rgba(59, 130, 246, 0.3);
  }
  
  .toggle-switch.toggled {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    border-color: var(--primary-500);
  }
  

  
  /* Toggle Slider */
  .toggle-slider {
    position: relative;
    width: 100%;
    height: 100%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Toggle Thumb */
  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 1.25rem;
    height: 1.25rem;
    background: white;
    border-radius: 50%;
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.2),
      0 1px 2px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.8);
  }
  
  .toggle-switch.toggled .toggle-thumb {
    transform: translateX(1.75rem);
  }
  
  .toggle-switch:hover .toggle-thumb {
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.25),
      0 2px 4px rgba(0, 0, 0, 0.15);
  }
  
  /* Flag Icon */
  .flag-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .flag-icon svg {
    border-radius: 2px;
    transition: all 0.3s ease;
  }
  
  .toggle-switch:hover .flag-icon svg {
    transform: scale(1.1);
  }
  
  /* Language Code */
  .lang-code {
    position: absolute;
    bottom: -1px;
    right: -1px;
    font-size: 0.5rem;
    font-weight: 700;
    color: var(--primary-600);
    background: white;
    border-radius: 50%;
    width: 0.75rem;
    height: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--primary-200);
  }
  
  /* Ripple Effect */
  .ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
    pointer-events: none;
  }
  
  .toggle-switch:active .ripple {
    width: 3rem;
    height: 3rem;
  }
  
  /* Tooltip */
  .tooltip {
    position: absolute;
    top: -2.5rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--gray-900);
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 100;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: var(--gray-900);
  }
  
  .language-switcher:hover .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-2px);
  }
  

  
  /* Responsive Design */
  @media (max-width: 768px) {
    .language-switcher {
      gap: 0.5rem;
    }
    
    .language-labels {
      display: none;
    }
    
    .tooltip {
      font-size: 0.6875rem;
      padding: 0.375rem 0.5rem;
    }
  }
  
  /* Animation keyframes */
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  .toggle-switch:active {
    animation: pulse 0.2s ease-in-out;
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .language-switcher,
    .toggle-switch,
    .toggle-thumb,
    .ripple,
    .tooltip {
      transition: none;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .toggle-switch {
      border-width: 3px;
    }
    
    .toggle-thumb {
      border-width: 2px;
      border-color: var(--gray-900);
    }
  }
</style>
