(function () {
  // Respect reduced motion — mark all as revealed immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.sr').forEach(el => el.classList.add('revealed'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        requestAnimationFrame(() => entry.target.classList.add('revealed'));
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.sr').forEach(el => revealObserver.observe(el));

  // Scroll-down arrow
  document.querySelector('.scroll-arrow')?.addEventListener('click', () => {
    document.querySelector('.hook-strip')?.scrollIntoView({ behavior: 'smooth' });
  });
})();
