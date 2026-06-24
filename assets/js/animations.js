/* ═══════════════════════════════════════════════
   animations.js – Scroll reveals, particles,
   counter-up, hero effects
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ───────── SCROLL REVEAL (Intersection Observer) ───────── */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { obs.observe(el); });
  }

  /* ───────── PAGE LOADER ───────── */
  function initLoader() {
    var loader = document.getElementById('page-loader');
    if (!loader) return;
    window.addEventListener('load', function () {
      setTimeout(function () { loader.classList.add('loaded'); }, 400);
    });
  }

  /* ───────── SCROLL PROGRESS BAR ───────── */
  function initScrollProgress() {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = (window.scrollY / h) * 100;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ───────── HERO FLOATING PARTICLES ───────── */
  function initParticles() {
    var field = document.getElementById('particle-field');
    if (!field) return;

    var count = window.innerWidth < 640 ? 15 : 30;

    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (12 + Math.random() * 20) + 's';
      p.style.animationDelay = (Math.random() * 15) + 's';
      p.style.width = p.style.height = (3 + Math.random() * 5) + 'px';
      field.appendChild(p);
    }
  }

  /* ───────── COUNTER-UP ───────── */
  function initCounters() {
    var counters = document.querySelectorAll('.counter-number');
    if (!counters.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-target'), 10) || 0;
          var suffix = el.getAttribute('data-suffix') || '';
          var duration = 1500;
          var start = performance.now();

          function update(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var val = Math.round(eased * target);
            el.textContent = val + suffix;
            if (progress < 1) { requestAnimationFrame(update); }
          }

          requestAnimationFrame(update);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (c) { obs.observe(c); });
  }

  /* ───────── HERO TEXT STAGGERED ENTRANCE ───────── */
  function initHeroEntrance() {
    var hero = document.querySelector('.main-banner .caption');
    if (!hero) return;

    var children = [];
    hero.querySelectorAll('h6, h2, p, .main-button-red, .scroll-to-section').forEach(function (el) {
      children.push(el);
    });

    children.forEach(function (el, i) {
      el.style.animationDelay = (0.3 + i * 0.18) + 's';
      el.classList.add('hero-text-reveal');
    });
  }

  /* ───────── SMOOTH ANCHOR SCROLL (enhance native) ───────── */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var offset = 70;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* ───────── SECTION HEADING UNDERLINE ANIMATION ───────── */
  function initHeadingUnderline() {
    document.querySelectorAll('.section-heading h2').forEach(function (h2) {
      h2.classList.add('reveal', 'reveal-bottom');
    });
  }

  /* ───────── APPLY REVEAL CLASSES TO KEY ELEMENTS ───────── */
  function addRevealClasses() {
    /* Services section */
    document.querySelectorAll('.services .item').forEach(function (el, i) {
      el.classList.add('reveal', 'reveal-bottom');
      if (i < 4) el.classList.add('delay-' + (i + 1));
    });

    /* Section headings */
    document.querySelectorAll('.section-heading').forEach(function (el) {
      el.classList.add('reveal', 'reveal-bottom');
    });

    /* Upcoming meetings section */
    var meetings = document.querySelectorAll('.upcoming-meetings .meeting-item');
    if (meetings.length) {
      meetings.forEach(function (el, i) {
        el.classList.add('reveal', 'reveal-bottom');
        if (i < 4) el.classList.add('delay-' + (i + 1));
      });
    }

    /* Our courses section */
    document.querySelectorAll('.our-courses .item').forEach(function (el, i) {
      el.classList.add('reveal', 'reveal-bottom');
      if (i < 4) el.classList.add('delay-' + (i + 1));
    });

    /* Apply now section */
    document.querySelectorAll('.apply-now .item').forEach(function (el, i) {
      el.classList.add('reveal', i % 2 === 0 ? 'reveal-left' : 'reveal-right');
      if (i < 2) el.classList.add('delay-' + (i + 1));
    });

    /* App showcase section */
    document.querySelectorAll('.app-intro-panel .col-lg-4, .app-intro-panel .col-lg-8').forEach(function (el, i) {
      el.classList.add('reveal', i === 0 ? 'reveal-left' : 'reveal-right');
    });

    /* Contact section */
    document.querySelectorAll('.contact-us #contact form, .contact-us .right-info').forEach(function (el, i) {
      el.classList.add('reveal', 'reveal-bottom', 'delay-' + (i + 1));
    });

    /* Testimonials section */
    document.querySelectorAll('.testimonials-section').forEach(function (el) {
      el.classList.add('reveal', 'reveal-bottom');
    });

    /* App in action & Footer — no reveal to avoid white gaps */
  }

  /* ───────── INIT ───────── */
  function init() {
    addRevealClasses();
    initReveal();
    initLoader();
    initScrollProgress();
    initParticles();
    initCounters();
    initHeroEntrance();
    initSmoothAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
