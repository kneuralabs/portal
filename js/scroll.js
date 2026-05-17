(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Scroll progress bar ──
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

  // ── Header shadow on scroll ──
  function bindHeaderScroll() {
    const header = document.querySelector('header.top');
    if (!header) return;
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  // header is injected by components.js; retry briefly until present
  let tries = 0;
  (function waitHeader() {
    if (document.querySelector('header.top')) { bindHeaderScroll(); return; }
    if (tries++ < 40) setTimeout(waitHeader, 50);
  })();

  // ── Hero headline character reveal ──
  function splitHero() {
    const h = document.querySelector('.hero h1.display');
    if (!h || h.dataset.split) return;
    h.dataset.split = '1';
    let i = 0;
    const wrapText = (node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split('').forEach((ch) => {
        const sp = document.createElement('span');
        sp.className = ch === ' ' ? 'reveal-char space' : 'reveal-char';
        sp.style.setProperty('--rd', (i * 18) + 'ms');
        if (ch === ' ') sp.innerHTML = '&nbsp;'; else sp.textContent = ch;
        frag.appendChild(sp);
        i++;
      });
      return frag;
    };
    const walk = (root) => {
      Array.from(root.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          if (n.textContent.trim() === '' && n.textContent.indexOf(' ') === -1) return;
          n.replaceWith(wrapText(n));
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(h);
    if (reduce) {
      h.querySelectorAll('.reveal-char').forEach(el => el.classList.add('is-in'));
    } else {
      requestAnimationFrame(() =>
        h.querySelectorAll('.reveal-char').forEach(el => el.classList.add('is-in'))
      );
    }
  }
  splitHero();

  // ── Scroll reveals ──
  if (reduce) {
    document.querySelectorAll('.sr').forEach(el => el.classList.add('revealed'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => entry.target.classList.add('revealed'));
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('.sr').forEach(el => revealObserver.observe(el));
  }

  // ── Stat counter (numeric stats only) ──
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    if (reduce) { el.textContent = el.dataset.countLabel || target; return; }
    const pad = el.dataset.count.length;
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(ease * target)).padStart(pad, '0');
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

  // ── Scroll-down arrow (optional) ──
  document.querySelector('.scroll-arrow')?.addEventListener('click', () => {
    const target = document.querySelector('main > section:nth-of-type(2), main .section');
    target?.scrollIntoView({ behavior: 'smooth' });
  });
})();
