(function () {
  // Subnav scroll-spy: highlight the active section as the user scrolls
  const subnavLinks = document.querySelectorAll('.svc-subnav a[href^="#"]');
  if (!subnavLinks.length) return;

  const sectionIds = Array.from(subnavLinks).map(a => a.getAttribute('href').slice(1));
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  function setActive(id) {
    subnavLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  }

  const subnavEl = document.querySelector('.svc-subnav');
  const subnavH = subnavEl ? subnavEl.offsetHeight : 48;
  const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 68;

  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, {
    rootMargin: `-${navH + subnavH}px 0px -55% 0px`,
    threshold: 0,
  });

  sections.forEach(s => spy.observe(s));
  setActive(sectionIds[0]);
})();
