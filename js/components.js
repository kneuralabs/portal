(function () {
  // Detect if we're inside a subdirectory (e.g. pages/)
  const parts   = window.location.pathname.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1] || '';
  const depth    = lastPart.includes('.') ? parts.length - 1 : parts.length;
  const inSubdir = depth >= 1 && parts.some(p => p === 'pages');
  const base     = inSubdir ? '../' : '';

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
      const html = await res.text();
      if (selector === 'header' && el.querySelector('.topbar')) {
        const temp      = document.createElement('div');
        temp.innerHTML  = html;
        const newTopbar = temp.querySelector('.topbar');
        if (newTopbar) {
          el.querySelector('.topbar').innerHTML = newTopbar.innerHTML;
          Array.from(newTopbar.attributes).forEach(attr => {
            if (attr.name !== 'class') el.querySelector('.topbar').setAttribute(attr.name, attr.value);
          });
        } else {
          el.innerHTML = html;
        }
      } else {
        el.innerHTML = html;
      }
      fixPaths(el);
    } catch (e) {
      console.warn('Component load failed:', path, e);
    }
  }

  function setActiveLink() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav.primary a[data-page], .mobile-menu a[data-page]').forEach(a => {
      const href = a.getAttribute('href') || '';
      a.classList.toggle('active', href.split('/').pop() === page);
    });
  }

  function initNav() {
    const hamburger  = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const backdrop   = document.getElementById('navBackdrop');
    const closeBtn   = document.getElementById('menuClose');
    if (!hamburger || !mobileMenu) return;

    if (mobileMenu.parentElement !== document.body) document.body.appendChild(mobileMenu);
    if (backdrop && backdrop.parentElement !== document.body) document.body.appendChild(backdrop);

    const focusable = () => Array.from(
      mobileMenu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.closest('[hidden]'));

    function openMenu() {
      mobileMenu.classList.add('open');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      if (backdrop) backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => { closeBtn?.focus(); }, 50);
    }

    function closeMenu() {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      if (backdrop) backdrop.classList.remove('open');
      document.body.style.overflow = '';
      hamburger.focus();
    }

    hamburger.addEventListener('click', () => {
      mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // Section labels (Services, About) navigate like any other link; a
    // dedicated chevron button — injected here so the markup stays a single
    // source of truth — reveals the sub-pages. Two unambiguous affordances on
    // touch: tap the word to go to the page, tap the chevron to expand.
    mobileMenu.querySelectorAll('.mobile-nav .nav-group').forEach(group => {
      const link = group.querySelector(':scope > a');
      const sub  = group.querySelector(':scope > .mobile-sub');
      if (!link || !sub) return;

      if (!sub.id) sub.id = 'msub-' + Math.random().toString(36).slice(2, 8);

      const row = document.createElement('div');
      row.className = 'mobile-row';
      link.replaceWith(row);
      row.appendChild(link);

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'sub-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', sub.id);
      toggle.setAttribute('aria-label', 'Show ' + link.textContent.trim() + ' sub-pages');
      toggle.innerHTML = '<svg viewBox="0 0 14 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1.5 7 7.5 13 1.5"/></svg>';
      row.appendChild(toggle);

      toggle.addEventListener('click', () => {
        const open = group.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    });

    // Any real navigation (page links + CTA) closes the menu first.
    mobileMenu.querySelectorAll('.mobile-nav a, .mobile-cta').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
    if (backdrop) backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) { closeMenu(); return; }
      if (e.key !== 'Tab' || !mobileMenu.classList.contains('open')) return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    });
  }

  // ── Theme: follows local sunrise/sunset, manual toggle overrides ────────────
  const THEME_KEY   = 'theme';
  let   themeTimer  = 0;
  const themeStored = () => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } };
  const applyTheme  = t => document.documentElement.setAttribute('data-theme', t);

  function sunTheme() {
    const now = new Date();
    const lng = -now.getTimezoneOffset() / 4, lat = 40;
    const rad = Math.PI / 180, deg = 180 / Math.PI;
    function sun(rise) {
      const start = Date.UTC(now.getUTCFullYear(), 0, 0);
      const day   = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const N = Math.round((day - start) / 864e5), lngHour = lng / 15;
      const t = N + ((rise ? 6 : 18) - lngHour) / 24;
      const M = 0.9856 * t - 3.289;
      let L = M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634;
      L = (L % 360 + 360) % 360;
      let RA = deg * Math.atan(0.91764 * Math.tan(L * rad));
      RA = (RA % 360 + 360) % 360;
      RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90;
      RA /= 15;
      const sinDec = 0.39782 * Math.sin(L * rad);
      const cosDec = Math.cos(Math.asin(sinDec));
      const cosH   = (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
      if (cosH > 1)  return null;
      if (cosH < -1) return rise ? 0 : 24;
      let H = (rise ? 360 - deg * Math.acos(cosH) : deg * Math.acos(cosH)) / 15;
      const T = H + RA - 0.06571 * t - 6.622;
      return ((T - lngHour) % 24 + 24) % 24;
    }
    const riseUTC = sun(true), setUTC = sun(false);
    const hrs = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
    let isDay;
    if (riseUTC == null || setUTC == null) { isDay = riseUTC != null; }
    else if (setUTC > riseUTC)             { isDay = hrs >= riseUTC && hrs < setUTC; }
    else                                   { isDay = hrs >= riseUTC || hrs < setUTC; }
    const until = h => { let d = h - hrs; if (d <= 0) d += 24; return d * 36e5; };
    const ms = isDay ? until(setUTC  == null ? 24 : setUTC)
                     : until(riseUTC == null ? 24 : riseUTC);
    return { theme: isDay ? 'light' : 'dark', ms: Math.max(6e4, Math.min(ms, 6 * 36e5)) };
  }

  function autoTheme() {
    if (themeStored()) return;
    const s = sunTheme();
    applyTheme(s.theme);
    clearTimeout(themeTimer);
    themeTimer = setTimeout(autoTheme, s.ms);
  }

  function resolveTheme() {
    const manual = themeStored();
    if (manual) applyTheme(manual);
    else autoTheme();
  }

  function wireTheme() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      if (btn.id === 'themeToggleFloat' && btn.parentElement !== document.body) {
        document.body.appendChild(btn);
        btn.classList.add('theme-fab');
      }
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        clearTimeout(themeTimer);
      });
    });
  }

  async function init() {
    resolveTheme();
    await Promise.all([
      loadComponent('header', 'components/nav.html'),
      loadComponent('footer', 'components/footer.html'),
    ]);
    setActiveLink();
    initNav();
    wireTheme();
    // Notify scroll.js (and any other scripts) that the nav is live in the DOM
    document.dispatchEvent(new CustomEvent('kn:nav-ready'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
