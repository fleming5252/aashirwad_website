/* ═══════════════════════════════════════════════════════════════
   page-transition.js
   "Dive-through-tunnel" page transition — fully self-contained.
   Progressive enhancement: degrades gracefully if JS fails.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CONFIG = {
    ringCount: 8,
    particleCount: 55,
    mobileParticleCount: 22,
    exitNavTimeout: 770,
    entryAnimDuration: 1000,
    reducedFadeMs: 200
  };

  var overlay = null;
  var locked = false;

  /* ── helpers ── */
  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ── Build overlay DOM (idempotent) ── */
  function getOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'pt-overlay';
    overlay.className = 'pt-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    /* central glow */
    var glow = document.createElement('div');
    glow.className = 'pt-glow';
    overlay.appendChild(glow);

    /* flash */
    var flash = document.createElement('div');
    flash.className = 'pt-flash';
    overlay.appendChild(flash);

    /* rings – alternating gold / maroon */
    for (var i = 0; i < CONFIG.ringCount; i++) {
      var r = document.createElement('div');
      r.className = 'pt-ring';
      r.style.borderColor = i % 2 === 0 ? '#f5a425' : '#a12c2f';
      r.style.animationDelay = (0.04 + i * 0.05).toFixed(2) + 's';
      overlay.appendChild(r);
    }

    /* particles – randomised angle, distance, size, colour */
    var isMobile = window.innerWidth < 768;
    var count = isMobile ? CONFIG.mobileParticleCount : CONFIG.particleCount;

    for (var j = 0; j < count; j++) {
      var p = document.createElement('div');
      p.className = 'pt-particle';
      var angle = Math.random() * 360;
      var distance = 250 + Math.random() * 650;
      var delay = Math.random() * 0.3;
      var size = 2 + Math.random() * 3;
      var color = Math.random() < 0.5 ? '#f5a425' : '#a12c2f';
      p.style.setProperty('--angle', angle + 'deg');
      p.style.setProperty('--distance', distance + 'px');
      p.style.animationDelay = delay.toFixed(3) + 's';
      p.style.width = size + 'px';
      p.style.height = (size * 0.7).toFixed(1) + 'px';
      p.style.borderRadius = '2px';
      p.style.background = color;
      overlay.appendChild(p);
    }

    document.body.appendChild(overlay);
    return overlay;
  }

  /* ── Exit animation ───────────────────────────────
     Called on the source page before navigating.
     Overlay fades in, rings/particles burst outward,
     then callback fires (which sets sessionStorage + navigates).
  ── */
  function playExit(callback) {
    var el = getOverlay();
    el.className = 'pt-overlay pt-active';

    setTimeout(callback, CONFIG.exitNavTimeout);
  }

  /* ── Entry animation ──────────────────────────────
     Called on the destination page when the tunnel
     flag is present.  Overlay starts fully opaque with
     rings/particles at their expanded state, then
     contracts inward as the overlay fades out.
  ── */
  function playEntry() {
    var el = getOverlay();

    /* unhide the page content now that the overlay is here */
    document.documentElement.classList.remove('pt-loading');

    /* start at fully-opaque expanded state → reverse-animate */
    el.className = 'pt-overlay pt-entry';

    setTimeout(function () {
      el.className = 'pt-overlay';
    }, CONFIG.entryAnimDuration + 150);
  }

  /* ── Reduced-motion variants ── */
  function playReducedExit(callback) {
    var el = getOverlay();
    el.className = 'pt-overlay pt-active pt-reduced';

    setTimeout(callback, CONFIG.reducedFadeMs);
  }

  function playReducedEntry() {
    document.documentElement.classList.remove('pt-loading');
  }

  /* ══════════════════════════════════════════════════
     CLICK DELEGATE
     Intercepts <a data-transition="tunnel"> clicks.
     ══════════════════════════════════════════════════ */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-transition="tunnel"]');
    if (!link) return;

    var href = link.getAttribute('href');

    /* skip for modifier keys, target="_blank", empty / hash-only hrefs */
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (link.target === '_blank') return;
    if (!href || href === '#' || href === '') return;

    e.preventDefault();
    if (locked) return;
    locked = true;

    /* store destination URL so the entry animation only plays
       on the actual target page (not on back-nav / interrupt) */
    sessionStorage.setItem('pt-entry', 'tunnel:' + link.href);

    if (prefersReduced()) {
      playReducedExit(function () {
        window.location.href = href;
      });
      return;
    }

    playExit(function () {
      window.location.href = href;
    });
  });

  /* ══════════════════════════════════════════════════
     ENTRY DETECTION — runs on every page load
     ══════════════════════════════════════════════════ */
  function checkEntry() {
    var raw = sessionStorage.getItem('pt-entry');
    if (!raw) return;

    sessionStorage.removeItem('pt-entry');

    /* format: "tunnel:https://..." */
    var sep = raw.indexOf(':');
    var prefix = raw.substring(0, sep);
    var expectedUrl = raw.substring(sep + 1);

    if (prefix !== 'tunnel') return;
    if (!expectedUrl) return;

    /* only play if the stored URL matches the current page */
    if (expectedUrl !== window.location.href) return;

    function start() {
      requestAnimationFrame(function () {
        if (prefersReduced()) {
          playReducedEntry();
        } else {
          playEntry();
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }

  /* ── bfcache guard ── */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      sessionStorage.removeItem('pt-entry');
      document.documentElement.classList.remove('pt-loading');
    }
  });

  checkEntry();
})();
