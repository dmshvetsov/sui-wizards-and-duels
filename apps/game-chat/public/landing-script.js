// Parallax Effect
function initParallax() {
  const parallaxElements = document.querySelectorAll('.parallax-layer');
  
  function updateParallax() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    parallaxElements.forEach((element, index) => {
      const speed = (index + 1) * 0.3;
      element.style.transform = `translateY(${rate * speed}px)`;
    });
  }
  
  // Throttle scroll events for better performance
  let ticking = false;
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', () => {
    ticking = false;
    requestTick();
  });
}

// Mobile Navigation
function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Intersection Observer for Animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Observe feature cards
  document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });
}

// Navbar Background on Scroll
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      navbar.style.background = 'rgba(15, 15, 35, 0.98)';
    } else {
      navbar.style.background = 'rgba(15, 15, 35, 0.95)';
    }
  });
}

// Spell Orb Animation Cycle
function initSpellShowcase() {
  const spellOrbs = document.querySelectorAll('.spell-orb');
  let currentActive = 0;
  
  function cycleSpells() {
    spellOrbs.forEach(orb => orb.classList.remove('active'));
    spellOrbs[currentActive].classList.add('active');
    currentActive = (currentActive + 1) % spellOrbs.length;
  }
  
  // Start the cycle
  setInterval(cycleSpells, 2000);
}

// Button Click Effects
function initButtonEffects() {
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
      // Create ripple effect
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

// Particle System Enhancement
function initEnhancedParticles() {
  const particleContainer = document.querySelector('.parallax-mid');
  
  function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'magic-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 3 + 's';
    particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
    
    particleContainer.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 5000);
  }
  
  // Create particles periodically
  setInterval(createParticle, 2000);
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initParallax();
  initMobileNav();
  initSmoothScrolling();
  initScrollAnimations();
  initNavbarScroll();
  initSpellShowcase();
  initButtonEffects();
  initEnhancedParticles();
  
  console.log('🧙‍♂️ Wizards & Duels - Magic System Initialized!');
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
  .btn {
    position: relative;
    overflow: hidden;
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @media (max-width: 768px) {
    .nav-menu {
      position: fixed;
      left: -100%;
      top: 70px;
      flex-direction: column;
      background: rgba(15, 15, 35, 0.98);
      width: 100%;
      text-align: center;
      transition: 0.3s;
      padding: 2rem 0;
    }
    
    .nav-menu.active {
      left: 0;
    }
    
    .hamburger.active span:nth-child(2) {
      opacity: 0;
    }
    
    .hamburger.active span:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
    }
    
    .hamburger.active span:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
    }
  }
`;
document.head.appendChild(style);
