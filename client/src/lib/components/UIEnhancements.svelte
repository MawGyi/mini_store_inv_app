<script lang="ts">
  import { onMount } from 'svelte';
  
  let mounted = false;
  let particleContainer: HTMLElement;
  
  onMount(() => {
    mounted = true;
    createParticles();
    
    // Create floating particles periodically
    const interval = setInterval(createParticles, 3000);
    
    return () => {
      clearInterval(interval);
    };
  });
  
  function createParticles() {
    if (!particleContainer) return;
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        
        // Random position and properties
        const size = Math.random() * 8 + 4;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        
        particle.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, var(--primary-400), var(--purple-400));
          border-radius: 50%;
          left: ${Math.random() * 100}%;
          bottom: -10px;
          opacity: 0;
          animation: floatUp ${duration}s ease-out ${delay}s forwards;
          pointer-events: none;
          box-shadow: 0 0 ${size * 2}px rgba(59, 130, 246, 0.3);
        `;
        
        particleContainer.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, (duration + delay) * 1000);
      }, i * 500);
    }
  }
</script>

<div class="ui-enhancements" class:mounted>
  <!-- Floating Particles Container -->
  <div class="particles-container" bind:this={particleContainer}></div>
  
  <!-- Background Effects -->
  <div class="background-effects">
    <div class="gradient-orb orb-1"></div>
    <div class="gradient-orb orb-2"></div>
    <div class="gradient-orb orb-3"></div>
  </div>
  
  <!-- Ambient Light Effects -->
  <div class="ambient-lights">
    <div class="light-beam beam-1"></div>
    <div class="light-beam beam-2"></div>
  </div>
</div>

<style>
  .ui-enhancements {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: -1;
    opacity: 0;
    transition: opacity 1s ease-out;
  }
  
  .ui-enhancements.mounted {
    opacity: 1;
  }
  
  .particles-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }
  
  .background-effects {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }
  
  .gradient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.1;
    animation: float 6s ease-in-out infinite;
  }
  
  .orb-1 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, var(--primary-400), var(--purple-400));
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }
  
  .orb-2 {
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg, var(--purple-400), var(--primary-500));
    top: 60%;
    right: 15%;
    animation-delay: 2s;
  }
  
  .orb-3 {
    width: 150px;
    height: 150px;
    background: linear-gradient(135deg, var(--primary-300), var(--purple-300));
    bottom: 20%;
    left: 60%;
    animation-delay: 4s;
  }
  
  .ambient-lights {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }
  
  .light-beam {
    position: absolute;
    width: 1px;
    height: 100vh;
    background: linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    opacity: 0;
    animation: lightBeam 8s ease-in-out infinite;
  }
  
  .beam-1 {
    left: 20%;
    animation-delay: 0s;
  }
  
  .beam-2 {
    right: 25%;
    animation-delay: 4s;
  }
  
  /* Dark mode adjustments */
  .dark .gradient-orb {
    opacity: 0.15;
  }
  
  .dark .light-beam {
    background: linear-gradient(180deg, transparent, rgba(96, 165, 250, 0.15), transparent);
  }
  
  /* Animations */
  @keyframes floatUp {
    0% {
      opacity: 0;
      transform: translateY(0) scale(0.8);
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-100vh) scale(1.2);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-20px) scale(1.05);
    }
  }
  
  @keyframes lightBeam {
    0%, 100% {
      opacity: 0;
      transform: scaleY(0);
    }
    50% {
      opacity: 1;
      transform: scaleY(1);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .gradient-orb,
    .light-beam,
    .floating-particle {
      animation: none;
    }
    
    .ui-enhancements {
      display: none;
    }
  }
</style>
