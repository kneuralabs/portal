/* ============================================================
   Kneuralabs — Premium motion system
   Smooth scroll · choreographed reveals · parallax · micro-interactions.
   Dependency-free, progressive-enhancement, reduced-motion aware.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var docEl = document.documentElement;
  docEl.classList.add('js');
  // Backstops: content must never stay hidden if the load frame is missed.
  window.addEventListener('load', function () { docEl.classList.add('is-ready'); });
  setTimeout(function () { docEl.classList.add('is-ready'); }, 1400);

  /* ── Scroll progress bar ───────────────────────────────── */
  var progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(progressBar);

  /* ── Header shadow (header is injected async) ──────────── */
  var header = null, tries = 0;
  (function waitHeader() {
    header = document.querySelector('header.top');
    if (header) return;
    if (tries++ < 60) setTimeout(waitHeader, 50);
  })();

  /* ── Shared scroll-frame work (progress + header) ──────── */
  function frameUpdate() {
    var y = window.scrollY;
    var total = docEl.scrollHeight - window.innerHeight;
    progressBar.style.transform = 'scaleX(' + (total > 0 ? clamp(y / total, 0, 1) : 0) + ')';
    if (header) header.classList.toggle('scrolled', y > 12);
  }

  /* ── Smooth scroll engine (desktop wheel, dependency-free) ─
     Touch keeps native momentum (more accessible, better feel).
     We always drive the real scroll position, so IntersectionObserver,
     sticky, and the progress bar keep working untouched. ───────── */
  var smooth = !reduce && finePointer && !('ontouchstart' in window);
  var target = window.scrollY, current = target, ticking = false, raf = 0;
  var EASE = 0.115;

  function maxScroll() { return Math.max(0, docEl.scrollHeight - window.innerHeight); }

  function loop() {
    var diff = target - current;
    if (Math.abs(diff) < 0.15) {
      current = target;
      window.scrollTo(0, Math.round(current));
      frameUpdate(); parallax();
      ticking = false; raf = 0;
      return;
    }
    current += diff * EASE;
    window.scrollTo(0, current);
    frameUpdate(); parallax();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!ticking) { ticking = true; raf = requestAnimationFrame(loop); } }

  if (smooth) {
    docEl.style.scrollBehavior = 'auto';
    window.addEventListener('wheel', function (e) {
      // Don't hijack when the mobile menu (or any locked overlay) is open,
      // or when the pointer is over an independently scrollable region.
      if (document.body.style.overflow === 'hidden') return;
      if (e.ctrlKey) return; // pinch-zoom
      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 16; else if (e.deltaMode === 2) d *= window.innerHeight;
      e.preventDefault();
      target = clamp(target + d, 0, maxScroll());
      start();
    }, { passive: false });

    // Keep target in sync with scrolls we didn't drive (keyboard, drag, find)
    // and keep dependent UI live during those scrolls.
    window.addEventListener('scroll', function () {
      if (!ticking) {
        target = current = window.scrollY;
        frameUpdate(); parallax();
      }
    }, { passive: true });
    window.addEventListener('resize', function () {
      target = current = window.scrollY;
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); ticking = false; raf = 0; }
    });
  } else {
    window.addEventListener('scroll', function () { frameUpdate(); parallax(); }, { passive: true });
  }
  frameUpdate();

  /* ── Smooth in-page anchors with accessible focus ──────── */
  function navOffset() {
    var h = header ? header.getBoundingClientRect().height : 72;
    return h + 14;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '#' || href === '#') return;
    var dest = document.getElementById(href.slice(1));
    if (!dest) return;
    e.preventDefault();
    var y = clamp(dest.getBoundingClientRect().top + window.scrollY - navOffset(), 0, maxScroll());
    if (smooth) { target = y; start(); }
    else { window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); }
    dest.setAttribute('tabindex', '-1');
    setTimeout(function () { dest.focus({ preventScroll: true }); }, smooth ? 520 : 0);
    if (history.replaceState) history.replaceState(null, '', href);
  });

  /* ── Scroll-linked parallax (subtle, transform-only) ───── */
  var pxEls = [];
  function collectParallax() {
    if (reduce || !finePointer) return;
    var map = [
      ['.hero-side', 0.05], ['.marks', 0.07],
      ['.cta-strip h2', -0.05], ['.svc-row .id-big', 0.08]
    ];
    map.forEach(function (pair) {
      document.querySelectorAll(pair[0]).forEach(function (el) {
        el.style.willChange = 'transform';
        pxEls.push({ el: el, k: pair[1], base: 0 });
      });
    });
  }
  function parallax() {
    if (!pxEls.length) return;
    var vh = window.innerHeight;
    for (var i = 0; i < pxEls.length; i++) {
      var p = pxEls[i], r = p.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      var mid = r.top + r.height / 2 - vh / 2;
      p.el.style.transform = 'translate3d(0,' + (mid * p.k).toFixed(2) + 'px,0)';
    }
  }

  /* ── Hero headline: word-grouped character reveal ──────── */
  function splitHero() {
    var h = document.querySelector('.hero h1.display');
    if (!h || h.dataset.split) return;
    h.dataset.split = '1';
    var i = 0;
    function wrapText(node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (word) {
        if (word === '') return;
        if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span');
        w.className = 'reveal-word';
        word.split('').forEach(function (ch) {
          var sp = document.createElement('span');
          sp.className = 'reveal-char';
          sp.style.setProperty('--rd', (i * 26) + 'ms');
          sp.textContent = ch;
          w.appendChild(sp);
          i++;
        });
        frag.appendChild(w);
      });
      return frag;
    }
    (function walk(root) {
      Array.prototype.slice.call(root.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (n.textContent.trim() === '') return;
          n.replaceWith(wrapText(n));
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    })(h);
    var go = function () { h.querySelectorAll('.reveal-char').forEach(function (el) { el.classList.add('is-in'); }); };
    if (reduce) go(); else requestAnimationFrame(function () { requestAnimationFrame(go); });
  }
  splitHero();

  /* ── Load choreography ─────────────────────────────────── */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { docEl.classList.add('is-ready'); });
  });

  /* ── Staggered reveal cadence ──────────────────────────── */
  if (!reduce) {
    var groups = '.services,.gaps,.princ,.deliverables,.stats-grid,.card-grid,.foot-grid,.hero-actions,.timeline,.contact-info';
    document.querySelectorAll(groups).forEach(function (group) {
      var n = 0;
      group.querySelectorAll(':scope > .sr, :scope > * > .sr').forEach(function (el) {
        if (el.style.getPropertyValue('--rd')) return;
        el.style.setProperty('--rd', (n++ * 75) + 'ms');
      });
    });
  }

  /* ── Scroll reveals ────────────────────────────────────── */
  if (reduce) {
    document.querySelectorAll('.sr').forEach(function (el) { el.classList.add('revealed'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          requestAnimationFrame(function () { entry.target.classList.add('revealed'); });
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.sr').forEach(function (el) { revealObserver.observe(el); });
  }
  collectParallax();
  parallax();

  /* ── Magnetic buttons (desktop, subtle) ────────────────── */
  if (!reduce && finePointer) {
    document.querySelectorAll('.btn, .cta-mini').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) / r.width;
        var my = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = 'translate(' + (mx * 7).toFixed(2) + 'px,' + (my * 7).toFixed(2) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* ── Stat counter ──────────────────────────────────────── */
  function animateCounter(el) {
    var goal = parseInt(el.dataset.count, 10);
    if (isNaN(goal)) return;
    if (reduce) { el.textContent = el.dataset.countLabel || goal; return; }
    var pad = el.dataset.count.length, dur = 1100, t0 = performance.now();
    (function tick(now) {
      var p = Math.min((now - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = String(Math.round(e * goal)).padStart(pad, '0');
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }
  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { animateCounter(entry.target); counterObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { counterObserver.observe(el); });
})();
