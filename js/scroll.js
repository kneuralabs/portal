(function () {
  // Scroll progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(progressBar);
  function updateProgress() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = total > 0
      ? `scaleX(${Math.min(window.scrollY / total, 1)})`
      : 'scaleX(0)';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Respect reduced motion — mark all as revealed immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.sr').forEach(el => el.classList.add('revealed'));
    return;
  }

  // Reveal earlier (rootMargin bottom -5%) so animation finishes as element lands
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        requestAnimationFrame(() => entry.target.classList.add('revealed'));
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.sr').forEach(el => revealObserver.observe(el));

  // Scroll-down arrow — skip to first content section after hero
  document.querySelector('.scroll-arrow')?.addEventListener('click', () => {
    const target = document.querySelector('.hook-strip') ||
                   document.querySelector('main > section:nth-child(2)');
    target?.scrollIntoView({ behavior: 'smooth' });
  });

  // Add scrolled class to navbar for shadow/border
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
