/* ============================================================
   Kneuralabs — Premium motion system
   Smooth scroll · choreographed reveals · parallax · micro-interactions.
   Dependency-free, progressive-enhancement, reduced-motion aware.
   ============================================================ */
(function () {
  'use strict';

  var reduce      = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp       = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var docEl       = document.documentElement;
  docEl.classList.add('js');
  window.addEventListener('load', function () { docEl.classList.add('is-ready'); });
  setTimeout(function () { docEl.classList.add('is-ready'); }, 1400);

  /* ── Scroll progress bar ───────────────────────────────── */
  var progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(progressBar);

  /* ── Header shadow ─────────────────────────────────────────
     Header is injected async by components.js. We listen for
     its 'kn:nav-ready' event instead of polling with setTimeout.
  ─────────────────────────────────────────────────────────── */
  var header = null;

  function bindHeader(el) { header = el; frameUpdate(); }

  document.addEventListener('kn:nav-ready', function () {
    var el = document.querySelector('header.top');
    if (el) bindHeader(el);
  }, { once: true });

  // Instant bind if components.js already finished (cached / fast connection)
  (function () { var el = document.querySelector('header.top'); if (el) bindHeader(el); })();

  /* ── Shared scroll-frame work ───────────────────────────── */
  function frameUpdate() {
    var y     = window.scrollY;
    var total = docEl.scrollHeight - window.innerHeight;
    progressBar.style.transform = 'scaleX(' + (total > 0 ? clamp(y / total, 0, 1) : 0) + ')';
    if (header) header.classList.toggle('scrolled', y > 12);
  }

  /* ── Smooth scroll engine ───────────────────────────────── */
  var smooth  = !reduce && finePointer && !('ontouchstart' in window);
  var target  = window.scrollY, current = target, ticking = false, raf = 0;
  var EASE    = 0.115;

  function maxScroll() { return Math.max(0, docEl.scrollHeight - window.innerHeight); }

  function loop() {
    var diff = target - current;
    if (Math.abs(diff) < 0.15) {
      current = target;
      window.scrollTo(0, Math.round(current));
      frameUpdate(); parallax();
      ticking = false; raf = 0; return;
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
      if (document.body.style.overflow === 'hidden') return;
      if (e.ctrlKey) return;
      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 16; else if (e.deltaMode === 2) d *= window.innerHeight;
      e.preventDefault();
      target = clamp(target + d, 0, maxScroll());
      start();
    }, { passive: false });
    window.addEventListener('scroll', function () {
      if (!ticking) { target = current = window.scrollY; frameUpdate(); parallax(); }
    }, { passive: true });
    window.addEventListener('resize', function () {
      target = current = window.scrollY;
      cacheParallaxOffsets();
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); ticking = false; raf = 0; }
    });
  } else {
    window.addEventListener('scroll', function () { frameUpdate(); parallax(); }, { passive: true });
    window.addEventListener('resize', function () { cacheParallaxOffsets(); }, { passive: true });
  }
  frameUpdate();

  /* ── Smooth in-page anchors with accessible focus ──────── */
  function navOffset() { return (header ? header.getBoundingClientRect().height : 72) + 14; }

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

  /* ── Scroll-linked parallax ─────────────────────────────────
     Offsets are cached at collect-time and refreshed on resize.
     parallax() only reads pre-cached values — zero getBoundingClientRect
     calls inside the scroll loop, eliminating forced layout reflows.
  ─────────────────────────────────────────────────────────── */
  var pxEls = [];

  function cacheParallaxOffsets() {
    if (!pxEls.length) return;
    // Strip transforms so natural position is measured
    pxEls.forEach(function (p) { p.el.style.transform = ''; });
    var sy = window.scrollY;
    pxEls.forEach(function (p) {
      var r    = p.el.getBoundingClientRect();
      p.docTop = r.top + sy;
      p.docH   = r.height;
    });
  }

  function collectParallax() {
    if (reduce || !finePointer) return;
    var map = [
      ['.hero-side', 0.05], ['.marks', 0.07],
      ['.cta-strip h2', -0.05], ['.svc-row .id-big', 0.08]
    ];
    map.forEach(function (pair) {
      document.querySelectorAll(pair[0]).forEach(function (el) {
        el.style.willChange = 'transform';
        pxEls.push({ el: el, k: pair[1], docTop: 0, docH: 0 });
      });
    });
    cacheParallaxOffsets();
  }

  function parallax() {
    if (!pxEls.length) return;
    var vh = window.innerHeight, sy = window.scrollY;
    for (var i = 0; i < pxEls.length; i++) {
      var p = pxEls[i], elTop = p.docTop - sy;
      if (elTop + p.docH < -200 || elTop > vh + 200) continue;
      var mid = elTop + p.docH / 2 - vh / 2;
      p.el.style.transform = 'translate3d(0,' + (mid * p.k).toFixed(2) + 'px,0)';
    }
  }

  /* ── Hero headline: human typing effect ──────────────────
     Types each hero <h1> from a blank canvas with occasional
     fumbles that get corrected, landing on the final markup.
     Preserves <em> emphasis and <br> line breaks. The whole
     IIFE runs synchronously (deferred), so the canvas is
     blanked before first paint — no text appears early.
  ─────────────────────────────────────────────────────────── */
  function typeHeroes() {
    var heroes = document.querySelectorAll('.hero h1, .svc-hero h1, .contact-grid h1');
    if (!heroes.length) return;

    var letters = 'abcdefghijklmnopqrstuvwxyz';
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function esc(c) { return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c; }
    function wrongChar(base) {
      var c = letters.charAt(Math.floor(Math.random() * 26));
      return /[A-Z]/.test(base) ? c.toUpperCase() : c;
    }

    heroes.forEach(function (h, idx) {
      if (h.dataset.typed) return;
      h.dataset.typed = '1';

      // Flatten the headline into atoms, preserving <em> and <br>.
      var atoms = []; // {ch:'a', em:false} | {br:true}
      (function walk(node, em) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var t = n.textContent.replace(/\s+/g, ' ');
            for (var i = 0; i < t.length; i++) atoms.push({ ch: t.charAt(i), em: em });
          } else if (n.nodeType === 1) {
            if (n.tagName === 'BR') atoms.push({ br: true });
            else walk(n, em || n.tagName === 'EM');
          }
        });
      })(h, false);
      while (atoms.length && atoms[0].ch === ' ') atoms.shift();
      while (atoms.length && atoms[atoms.length - 1].ch === ' ') atoms.pop();
      if (!atoms.length) return;

      // Reduced motion: leave the original, fully-formed markup untouched.
      if (reduce) return;

      function render(list, done) {
        var html = '', openEm = false;
        for (var i = 0; i < list.length; i++) {
          var a = list[i];
          if (a.br) { if (openEm) { html += '</em>'; openEm = false; } html += '<br>'; continue; }
          if (a.em && !openEm) { html += '<em>'; openEm = true; }
          else if (!a.em && openEm) { html += '</em>'; openEm = false; }
          html += esc(a.ch);
        }
        if (openEm) html += '</em>';
        html += '<span class="kn-caret' + (done ? ' kn-caret-done' : '') + '" aria-hidden="true"></span>';
        h.innerHTML = html;
      }

      // Reserve the final height to prevent layout shift while typing.
      h.style.minHeight = h.getBoundingClientRect().height + 'px';

      var disp = [];
      render(disp, false); // blank canvas + caret, before first paint

      // Indices of typeable letters, used to guarantee at least one
      // visible fumble-and-correction on headlines long enough to show it.
      var letterIdx = [];
      atoms.forEach(function (a, i) { if (!a.br && a.ch !== ' ') letterIdx.push(i); });
      var forced = letterIdx.length > 6
        ? letterIdx[Math.floor(letterIdx.length * rnd(0.3, 0.55))]
        : -1;

      // Build the operation queue: real atoms, with occasional fumble
      // bursts (wrong letters → pause → backspaces) before a letter.
      var ops = [], sinceTypo = 0;
      atoms.forEach(function (a, i) {
        var canFumble = !a.br && a.ch !== ' ' && sinceTypo > 2 &&
          (i === forced || Math.random() < 0.12);
        if (canFumble) {
          var n = Math.random() < 0.65 ? 1 : 2;
          for (var k = 0; k < n; k++) ops.push({ t: 'wrong', ch: wrongChar(a.ch), em: a.em });
          ops.push({ t: 'pause', d: rnd(180, 360) });
          for (var k2 = 0; k2 < n; k2++) ops.push({ t: 'back' });
          sinceTypo = 0;
        }
        ops.push({ t: a.br ? 'break' : 'real', a: a });
        sinceTypo++;
      });

      function delayFor(op) {
        if (op.t === 'pause') return op.d;
        if (op.t === 'back') return rnd(55, 110);
        if (op.t === 'break') return rnd(220, 360);
        var ch = op.t === 'wrong' ? op.ch : op.a.ch;
        if (ch === ' ') return rnd(70, 150);
        if (/[.,!?;:]/.test(ch)) return rnd(220, 420);
        return rnd(45, 130);
      }

      var qi = 0;
      function step() {
        if (qi >= ops.length) { render(disp, true); return; }
        var op = ops[qi++];
        if (op.t === 'wrong') disp.push({ ch: op.ch, em: op.em });
        else if (op.t === 'back') disp.pop();
        else if (op.t === 'real') disp.push({ ch: op.a.ch, em: op.a.em });
        else if (op.t === 'break') disp.push({ br: true });
        if (op.t !== 'pause') render(disp, false);
        setTimeout(step, delayFor(op));
      }

      setTimeout(step, 360 + idx * 220);
    });
  }
  typeHeroes();

  /* ── Load choreography ─────────────────────────────────── */
  requestAnimationFrame(function () { requestAnimationFrame(function () { docEl.classList.add('is-ready'); }); });

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
        var mx = (e.clientX - r.left - r.width  / 2) / r.width;
        var my = (e.clientY - r.top  - r.height / 2) / r.height;
        btn.style.transform = 'translate(' + (mx * 7).toFixed(2) + 'px,' + (my * 7).toFixed(2) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* ── Stat counter ──────────────────────────────────────── */
  function animateCounter(el) {
    var raw  = el.dataset.count;
    var goal = parseInt(raw, 10);
    if (isNaN(goal)) return;
    var suffix = el.dataset.suffix || '';
    // Only zero-pad when the author wrote a leading zero (e.g. "04"). A plain
    // "10" with a "+" suffix must read "10+", not "10" or "010".
    var pad = raw.charAt(0) === '0' ? raw.length : 0;
    var fmt = function (v) { return String(v).padStart(pad, '0') + suffix; };
    if (reduce) { el.textContent = el.dataset.countLabel || fmt(goal); return; }
    var dur = 1100, t0 = performance.now();
    (function tick(now) {
      var p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(e * goal));
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
