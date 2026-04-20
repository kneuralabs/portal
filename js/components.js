(function () {
  // Detect if we're inside a subdirectory (e.g. pages/)
  const parts = window.location.pathname.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1] || '';
  const depth = lastPart.includes('.') ? parts.length - 1 : parts.length;
  // pages/ is one level deep; root pages are at depth 0
  const inSubdir = depth >= 1 && parts.some(p => p === 'pages');
  const base = inSubdir ? '../' : '';

  // Fix all relative href/src attributes in an element after injection
  function fixPaths(root) {
    if (!inSubdir) return;
    root.querySelectorAll('[href]').forEach(el => {
      const href = el.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') ||
          href.startsWith('mailto') || href.startsWith('../') || href.startsWith('/')) return;
      el.setAttribute('href', '../' + href);
    });
    root.querySelectorAll('[src]').forEach(el => {
      const src = el.getAttribute('src');
      if (!src || src.startsWith('http') || src.startsWith('../') || src.startsWith('/')) return;
      el.setAttribute('src', '../' + src);
    });
  }

  async function loadComponent(selector, path) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
      const res = await fetch(base + path);
      if (!res.ok) return;
      el.innerHTML = await res.text();
      fixPaths(el);
    } catch (e) {
      console.warn('Component load failed:', path, e);
    }
  }

  function setActiveLink() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a[data-page], .mobile-menu a[data-page]').forEach(a => {
      const href = a.getAttribute('href') || '';
      a.classList.toggle('active', href.split('/').pop() === page);
    });
  }

  function initNav() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const backdrop = document.getElementById('navBackdrop');
    const navbar = document.querySelector('.navbar');

    if (!hamburger || !mobileMenu) return;

    function closeMenu() {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      if (backdrop) backdrop.classList.remove('open');
    }

    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      if (backdrop) backdrop.classList.toggle('open', open);
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    if (backdrop) backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
    });

    window.addEventListener('scroll', () => {
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });
  }

  async function init() {
    await Promise.all([
      loadComponent('header', 'components/nav.html'),
      loadComponent('footer', 'components/footer.html'),
    ]);
    setActiveLink();
    initNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
