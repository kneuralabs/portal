// Scroll reveal animation
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.sr').forEach(el => revealObserver.observe(el));

// Scroll arrow
document.querySelector('.scroll-arrow')?.addEventListener('click', () => {
  document.querySelector('.hook-strip')?.scrollIntoView({ behavior: 'smooth' });
});
