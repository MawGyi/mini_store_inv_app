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
</div>

<style>
  .language-switcher {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    user-select: none;
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  }
  
  .language-switcher.mounted {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  
  .switch-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  /* Enhanced Language Labels */
  .language-labels {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .lang-label {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .label-text {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--gray-500);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: center;
    min-width: 3.5rem;
    letter-spacing: 0.025em;
  }
  
  .label-indicator {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--gray-300);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: scale(0);
  }
  
  .lang-label.active .label-text {
    color: var(--primary-600);
    transform: scale(1.05);
    font-weight: 800;
  }
  
  .lang-label.active .label-indicator {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
  }
  
  /* Enhanced Toggle Switch */
  .toggle-switch {
    position: relative;
    width: 4.5rem;
    height: 2.25rem;
    border: none;
    border-radius: 1.5rem;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    outline: none;
    background: transparent;
    transform-style: preserve-3d;
  }
  
  .toggle-track {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--gray-200), var(--gray-300));
    border-radius: inherit;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      inset 0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .track-fill {
    position: absolute;
    inset: 2px;
    background: linear-gradient(135deg, var(--primary-400), var(--primary-600), var(--purple-500));
    border-radius: inherit;
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .toggle-switch.toggled .track-fill {
    opacity: 1;
    transform: scale(1);
  }
  
  .toggle-switch:hover {
    transform: scale(1.05) translateY(-1px);
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
  }
  
  .toggle-switch:focus {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }
  
  .toggle-switch.animating {
    transform: scale(1.1);
  }
  
  /* Toggle Slider */
  .toggle-slider {
    position: relative;
    width: 100%;
    height: 100%;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Enhanced Toggle Thumb */
  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 2rem;
    height: 2rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 50%;
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.8);
    position: relative;
  }
  
  .toggle-switch.toggled .toggle-thumb {
    transform: translateX(2.25rem);
    box-shadow: 
      0 6px 16px rgba(59, 130, 246, 0.2),
      0 2px 6px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  .toggle-switch:hover .toggle-thumb {
    box-shadow: 
      0 6px 20px rgba(0, 0, 0, 0.2),
      0 3px 8px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  .thumb-glow {
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, var(--primary-400), var(--purple-400));
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: -1;
    filter: blur(4px);
  }
  
  .toggle-switch.toggled .thumb-glow {
    opacity: 0.3;
  }
  
  /* Enhanced Flag Container */
  .flag-container {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
  }
  
  .flag-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: scale(0.8) rotate(180deg);
  }
  
  .flag-icon.visible {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  
  .flag-icon svg {
    border-radius: 3px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
  
  .toggle-switch:hover .flag-icon svg {
    transform: scale(1.1) rotate(5deg);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  }
  
  /* Enhanced Ripple Effects */
  .ripple-container {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
  }
  
  .ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
  }
  
  .ripple-2 {
    background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
    transition-delay: 0.1s;
  }
  
  .toggle-switch:active .ripple {
    width: 5rem;
    height: 5rem;
    opacity: 1;
  }
  
  .toggle-switch:active .ripple-2 {
    width: 6rem;
    height: 6rem;
    opacity: 0.7;
  }
  
  /* Active State Indicator */
  .active-indicator {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: inherit;
    background: linear-gradient(135deg, var(--primary-400), var(--purple-400));
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: -1;
    filter: blur(1px);
  }
  
  .toggle-switch.toggled .active-indicator {
    opacity: 0.2;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .language-switcher {
      gap: 0.5rem;
    }
    
    .language-labels {
      display: none;
    }
    
    .toggle-switch {
      width: 4rem;
      height: 2rem;
    }
    
    .toggle-thumb {
      width: 1.75rem;
      height: 1.75rem;
    }
    
    .toggle-switch.toggled .toggle-thumb {
      transform: translateX(2rem);
    }
  }
  
  /* Enhanced Animation keyframes */
  @keyframes pulse-glow {
    0%, 100% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.6;
    }
  }
  
  .toggle-switch:active .thumb-glow {
    animation: pulse-glow 0.4s ease-in-out;
  }
  
  @keyframes flag-flip {
    0% {
      transform: scale(1) rotateY(0deg);
    }
    50% {
      transform: scale(0.8) rotateY(90deg);
    }
    100% {
      transform: scale(1) rotateY(0deg);
    }
  }
  
  .toggle-switch.animating .flag-icon {
    animation: flag-flip 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .language-switcher,
    .toggle-switch,
    .toggle-thumb,
    .flag-icon,
    .ripple {
      transition: none;
      animation: none;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .toggle-track {
      border: 3px solid var(--gray-900);
    }
    
    .toggle-thumb {
      border: 3px solid var(--gray-900);
    }
  }
  
  /* Dark mode enhancements */
  .dark .label-text {
    color: var(--gray-400);
  }
  
  .dark .lang-label.active .label-text {
    color: var(--primary-400);
  }
  
  .dark .toggle-track {
    background: linear-gradient(135deg, var(--gray-700), var(--gray-600));
  }
</style>
