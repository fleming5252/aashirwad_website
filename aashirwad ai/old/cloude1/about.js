(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     ICON LIBRARY — inline SVG, no external font dependency
  --------------------------------------------------------- */
  var ICONS = {
    'scale':       '<path d="M12 3v18M5 7h14M5 7L3 12a2.5 2.5 0 0 0 5 0L5 7zm14 0l-2 5a2.5 2.5 0 0 0 5 0l-3-5zM8 21h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    'check-badge': '<path d="M12 2l2.4 1.6 2.8-.3 1.1 2.6 2.6 1.1-.3 2.8L22 12l-1.6 2.4.3 2.8-2.6 1.1-1.1 2.6-2.8-.3L12 22l-2.4-1.6-2.8.3-1.1-2.6-2.6-1.1.3-2.8L2 12l1.6-2.4-.3-2.8 2.6-1.1L7 3.3l2.8.3L12 2z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 12.5l2.3 2.3 4.7-4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    'compass':     '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 9l-2 6-6 2 2-6 6-2z" fill="currentColor"/>',
    'flag':        '<path d="M5 21V4m0 1l4-1 4 1 4-1v9l-4 1-4-1-4 1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    'layers':      '<path d="M12 3l9 5-9 5-9-5 9-5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    'book-open':   '<path d="M12 6c-1.8-1.4-4.3-2-7-2v13c2.7 0 5.2.6 7 2 1.8-1.4 4.3-2 7-2V4c-2.7 0-5.2.6-7 2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 6v13" stroke="currentColor" stroke-width="1.6"/>',
    'keyboard':    '<rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    'chat':        '<path d="M4 5h16v11H8l-4 4V5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 9h8M8 12h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    'globe':       '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 12h18M12 3c2.8 2.6 2.8 15.4 0 18M12 3c-2.8 2.6-2.8 15.4 0 18" fill="none" stroke="currentColor" stroke-width="1.4"/>',
    'plane':       '<path d="M3 12l18-8-6 18-3-7-7-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    'signal':      '<path d="M4 20V13M10 20V9M16 20V5M22 20H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    'bulb':        '<path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-1.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    'badge':       '<circle cx="12" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 12.5L7 21l5-3 5 3-2-8.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    'target':      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
    'puzzle':      '<path d="M9 4h4v2.2a2 2 0 1 0 0 3.6V12h3.2a2 2 0 1 1 0 4H13v3.8a2 2 0 1 1-4 0V16H5v-4h2.2a2 2 0 1 0 0-3.6V6h1.8V4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    'infinity':    '<path d="M6.5 8.5a3.5 3.5 0 1 0 0 7c2.2 0 3.7-2 5.5-3.5s3.3-3.5 5.5-3.5a3.5 3.5 0 1 1 0 7c-2.2 0-3.7-2-5.5-3.5S9.2 8.5 6.5 8.5z" fill="none" stroke="currentColor" stroke-width="1.6"/>'
  };

  document.querySelectorAll('[data-icon]').forEach(function (el) {
    var key = el.getAttribute('data-icon');
    if (ICONS[key]) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.classList.add('icon-svg');
      svg.innerHTML = ICONS[key];
      el.appendChild(svg);
    }
  });

  /* ---------------------------------------------------------
     PRELOADER
  --------------------------------------------------------- */
  window.addEventListener('load', function () {
    var pre = document.getElementById('preloader');
    setTimeout(function () {
      if (pre) pre.classList.add('is-done');
    }, 500);
  });
  // Safety fallback in case load event is delayed
  setTimeout(function () {
    var pre = document.getElementById('preloader');
    if (pre) pre.classList.add('is-done');
  }, 2500);

  /* ---------------------------------------------------------
     NAV: scroll state + mobile toggle
  --------------------------------------------------------- */
  var nav = document.getElementById('siteNav');
  var onScrollNav = function () {
    if (window.scrollY > 30) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  var navToggle = document.getElementById('navToggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------------------------------------------------------
     SCROLL REVEALS
  --------------------------------------------------------- */
  var revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------
     WORD-BY-WORD STORY REVEAL
  --------------------------------------------------------- */
  var words = document.querySelectorAll('.reveal-word');
  if (words.length) {
    var wordIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          wordIO.unobserve(entry.target);
          var all = Array.prototype.slice.call(words);
          var idx = all.indexOf(entry.target);
          all.slice(idx).forEach(function (w, i) {
            setTimeout(function () { w.classList.add('is-visible'); }, i * 28);
          });
        }
      });
    }, { threshold: 0.6 });
    wordIO.observe(words[0]);
  }

  /* ---------------------------------------------------------
     ANIMATED COUNTERS
  --------------------------------------------------------- */
  var counters = document.querySelectorAll('[data-count]');
  var animateCounter = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var prefix = el.getAttribute('data-count-prefix') || '';
    var duration = 1600;
    var startTime = null;
    var startVal = target > 100 ? target - 40 : 0;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(startVal + (target - startVal) * eased);
      el.textContent = prefix + current;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target;
    }
    requestAnimationFrame(step);
  };
  if (counters.length) {
    var counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { counterIO.observe(c); });
  }

  /* ---------------------------------------------------------
     ECOSYSTEM SHELF — drag to scroll + progress bar
  --------------------------------------------------------- */
  var shelf = document.getElementById('shelfTrack');
  var shelfBar = document.getElementById('shelfProgressBar');
  if (shelf) {
    var isDown = false, startX, scrollLeft;

    shelf.addEventListener('pointerdown', function (e) {
      isDown = true;
      startX = e.pageX;
      scrollLeft = shelf.scrollLeft;
      shelf.setPointerCapture(e.pointerId);
    });
    shelf.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.pageX - startX;
      shelf.scrollLeft = scrollLeft - dx;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
      shelf.addEventListener(evt, function () { isDown = false; });
    });

    var updateShelfProgress = function () {
      var max = shelf.scrollWidth - shelf.clientWidth;
      var pct = max > 0 ? (shelf.scrollLeft / max) * 100 : 0;
      if (shelfBar) shelfBar.style.width = Math.max(8, pct) + '%';
    };
    shelf.addEventListener('scroll', updateShelfProgress, { passive: true });
    updateShelfProgress();
  }

  /* ---------------------------------------------------------
     CSNP TIMELINE — draw path when in view
  --------------------------------------------------------- */
  var csnpWrap = document.querySelector('.csnp-path-wrap');
  if (csnpWrap) {
    var csnpIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          csnpWrap.classList.add('is-active');
          csnpIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    csnpIO.observe(csnpWrap);
  }

  /* ---------------------------------------------------------
     VISION / MISSION — page flip open on first view
  --------------------------------------------------------- */
  var vmStage = document.getElementById('vmStage');
  if (vmStage) {
    var vmIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          vmStage.classList.add('is-flipping');
          vmIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    vmIO.observe(vmStage);
  }

  /* ---------------------------------------------------------
     SHELF CARD 3D TILT (desktop, fine pointer only)
  --------------------------------------------------------- */
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.shelf-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'translateY(-10px) rotateX(' + (y * -8) + 'deg) rotateY(' + (x * 8) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------
     FOOTER YEAR
  --------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
