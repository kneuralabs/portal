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

    if (!hamburger || !mobileMenu) return;

    const focusable = () => Array.from(
      mobileMenu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.closest('[hidden]'));

    function openMenu() {
      mobileMenu.classList.add('open');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      if (backdrop) backdrop.classList.add('open');
      setTimeout(() => { focusable()[0]?.focus(); }, 50);
    }

    function closeMenu() {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      if (backdrop) backdrop.classList.remove('open');
      hamburger.focus();
    }

    hamburger.addEventListener('click', () => {
      mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    if (backdrop) backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) { closeMenu(); return; }
      if (e.key !== 'Tab' || !mobileMenu.classList.contains('open')) return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function initPageTransitions() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto') ||
          href.startsWith('http') || a.target === '_blank' ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      document.body.classList.add('fade-out');
      setTimeout(() => { window.location.href = a.href; }, 180);
    });
  }

  function initTheme() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
      });
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }

  async function init() {
    await Promise.all([
      loadComponent('header', 'components/nav.html'),
      loadComponent('footer', 'components/footer.html'),
    ]);
    setActiveLink();
    initNav();
    initTheme();
    initPageTransitions();
    document.body.classList.add('loaded');
  }

  // Restore visibility on bfcache restore (back/forward navigation)
  window.addEventListener('pageshow', e => {
    if (e.persisted) {
      document.body.classList.remove('fade-out');
      document.body.classList.add('loaded');
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
