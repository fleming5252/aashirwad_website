/* =========================================================
   AASHIRWAD INSTITUTE — ABOUT PAGE ANIMATIONS (combined)
   cloude sections: hero, journey, ecosystem, commitment, vision/mission, closing
   gemini sections: excellence (scatter), csnp (mask), innovation (book), beyond (tunnel)
   GSAP + ScrollTrigger + Lenis
   ========================================================= */

(function(){

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- image fallback: never show a broken image ---------- */
  var seedCounter = 0;
  document.querySelectorAll('img').forEach(function(img){
    seedCounter++;
    var seed = img.dataset.seed || ('img' + seedCounter);
    img.addEventListener('error', function(){
      if(img.dataset.fallenBack) return;
      img.dataset.fallenBack = '1';
      var w = img.naturalWidth || 900;
      img.src = 'https://picsum.photos/seed/' + encodeURIComponent(seed) + '/1000/1200';
    }, { once:true });
  });

  if(typeof gsap === 'undefined'){ return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scrolling ---------- */
  if(window.Lenis && !reduceMotion){
    var lenis = new Lenis({
      duration: 1.2,
      easing: function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0, 0);
  }

  /* ---------- custom cursor (fine pointers only) ---------- */
  if(window.matchMedia('(pointer: fine)').matches && !reduceMotion){
    var cursorEl = document.querySelector('.cursor');
    var follower  = document.querySelector('.cursor-follower');
    if(cursorEl && follower){
      document.addEventListener('mousemove', function(e){
        gsap.to(cursorEl, { x: e.clientX, y: e.clientY, duration: 0 });
        gsap.to(follower,  { x: e.clientX, y: e.clientY, duration: 0.3 });
      });
      document.querySelectorAll('a, button, .scatter-card').forEach(function(el){
        el.addEventListener('mouseenter', function(){
          gsap.to(cursorEl, { scale: 2, backgroundColor: 'transparent', border: '1px solid var(--teal)' });
          gsap.to(follower,  { scale: 1.5, borderColor: 'var(--teal)' });
        });
        el.addEventListener('mouseleave', function(){
          gsap.to(cursorEl, { scale: 1, backgroundColor: 'var(--teal)', border: 'none' });
          gsap.to(follower,  { scale: 1, borderColor: 'rgba(16,25,43,0.3)' });
        });
      });
    }
  }

  /* ---------- top progress bar ---------- */
  gsap.set('#progressFill', { scaleX: 0 });
  gsap.to('#progressFill', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger:{
      trigger: document.documentElement,
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      scrub: 0.2
    }
  });

  if(reduceMotion){
    var bookEl = document.getElementById('heroBook');
    if(bookEl) bookEl.style.display = 'none';
    var pre = document.querySelector('.preloader');
    if(pre) pre.style.display = 'none';
    return; // skip elaborate motion, keep the page fully usable & static
  }

  /* =====================================================
     INTRO — preloader (gemini) then book opening (cloude)
     ===================================================== */
  var tlPreload = gsap.timeline();
  tlPreload.fromTo(".preloader-text", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" })
           .to(".preloader-text", { y: -50, opacity: 0, duration: 0.6, ease: "power3.in", delay: 0.4 })
           .to(".preloader", { y: "-100%", duration: 0.7, ease: "power4.inOut" }, "-=0.15");

  /* 1. HERO — book cover opens, then parallax bg (cloude) */
  var bookTl = gsap.timeline({ delay: 2.0 });
  bookTl
    .set('.hero__book-cover--left', { transformPerspective: 1800 })
    .set('.hero__book-cover--right', { transformPerspective: 1800 })
    .to('.hero__book-cover--left', { rotateY: -110, duration: 1.1, ease: 'power3.inOut' }, 0.15)
    .to('.hero__book-cover--right', { rotateY: 110, duration: 1.1, ease: 'power3.inOut' }, 0.15)
    .to('.hero__book', { autoAlpha: 0, duration: 0.4, pointerEvents: 'none' }, 1.05)
    .from('.hero__eyebrow, .hero__title, .hero__tagline, .hero__lede, .hero__scroll-cue', {
      y: 26, autoAlpha: 0, stagger: 0.12, duration: 0.9, ease: 'power2.out'
    }, 0.9);

  gsap.to('.hero__bg-img', {
    yPercent: -12,
    ease: 'none',
    scrollTrigger:{ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__float--1', {
    y: -80, rotate: 6, ease: 'none',
    scrollTrigger:{ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__float--2', {
    y: -40, rotate: -4, ease: 'none',
    scrollTrigger:{ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* =====================================================
     2. JOURNEY — auto-play on enter (cloude)
     ===================================================== */
  var journeyTl = gsap.timeline({
    scrollTrigger:{
      trigger: '#journey',
      start: 'top 60%',
      toggleActions: 'play none none reverse'
    }
  });
  journeyTl
    .to('#journeyPath', { strokeDashoffset: 0, duration: 1.5, ease: 'none' }, 0)
    .to('.journey__stop[data-stop="1"]', { autoAlpha: 1, y: 0, duration: 0.6 }, 0.1)
    .to('.journey__stop[data-stop="2"]', { autoAlpha: 1, y: 0, duration: 0.6 }, 0.6)
    .to('.journey__stop[data-stop="3"]', { autoAlpha: 1, y: 0, duration: 0.6 }, 1.1);

  /* =====================================================
     GEMINI SECTIONS — desktop-only heavy scroll animation
     ===================================================== */
  var mm = gsap.matchMedia();

  mm.add('(min-width: 1025px)', () => {

    /* 3. EXCELLENCE — 3D card scatter (gemini) */
    gsap.set('.scatter-card', { rotation: 0, x: 0, y: 0, zIndex: 1 });

    var excelEl = document.querySelector('.excellence');
    let scatterTl = gsap.timeline({
      scrollTrigger:{
        trigger: excelEl,
        start: 'top top',
        end: () => '+=' + Math.min(excelEl.offsetHeight, window.innerHeight * 0.5),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        id: 'excellenceST'
      }
    });

    scatterTl.to('.card-1', { x: -250, y: -100, rotation: -15, scale: 1.1, zIndex: 3 }, 0)
             .to('.card-2', { x: 250, y: -50, rotation: 10, scale: 1.05, zIndex: 2 }, 0)
             .to('.card-3', { x: -100, y: 200, rotation: -5, scale: 1.15, zIndex: 4 }, 0)
             .to('.card-text', { x: 150, y: 150, rotation: 5, scale: 1, zIndex: 5 }, 0)
             .to({}, { duration: 0.25 });

    /* 4. CSNP — image mask reveal (gemini) */
    gsap.to('.csnp-mask-layer', {
      clipPath: 'circle(150% at 50% 50%)',
      ease: 'power2.inOut',
      scrollTrigger:{
        trigger: '.csnp',
        start: 'top top',
        end: '+=150%',
        pin: true,
        scrub: 1
      }
    });

    /* 7. BEYOND — Z-axis tunnel (gemini) */
    gsap.set('.t-img', { z: -3000, opacity: 0 });

    let tunnelTl = gsap.timeline({
      scrollTrigger:{
        trigger: '.beyond',
        start: 'top top',
        end: '+=200%',
        pin: true,
        scrub: 1
      }
    });

    tunnelTl.to('.t-img-1', { z: 500, opacity: 1, duration: 2 }, 0)
            .to('.t-img-1', { opacity: 0, duration: 0.5 }, 1.5)
            .to('.t-img-2', { z: 500, opacity: 1, duration: 2 }, 0.5)
            .to('.t-img-2', { opacity: 0, duration: 0.5 }, 2.0)
            .to('.t-img-3', { z: 500, opacity: 1, duration: 2 }, 1.0)
            .to('.t-img-3', { opacity: 0, duration: 0.5 }, 2.5)
            .to('.t-img-4', { z: 500, opacity: 1, duration: 2 }, 1.5)
            .to('.t-img-4', { opacity: 0, duration: 0.5 }, 3.0);

  });

  /* =====================================================
     8. COMMITMENT — auto-play on enter (cloude)
     ===================================================== */
  var cardOffsets = [ {x:-300, r:-8}, {x:0, r:0}, {x:300, r:8} ];
  gsap.set('.commitment__card', { y: 0 });
  var commitTl = gsap.timeline({
    scrollTrigger:{
      trigger: '#commitment',
      start: 'top 60%',
      toggleActions: 'play none none reverse'
    }
  });
  document.querySelectorAll('.commitment__card').forEach(function(card, i){
    var o = cardOffsets[i] || {x:0,r:0};
    commitTl.to(card, {
      x: o.x, rotate: o.r, y: i === 1 ? -30 : 20, duration: 0.8, ease: 'power2.out'
    }, 0.1 + i * 0.1);
  });

  /* =====================================================
     9. VISION / MISSION — clip-paths widen past centre, morph-swap (cloude)
     ===================================================== */
  var vmTl = gsap.timeline({
    scrollTrigger:{
      trigger: '#vm',
      start: 'top top',
      end: '+=200%',
      scrub: 0.6,
      pin: '.vm__pin'
    }
  });
  vmTl
    .to('#vmVision', { clipPath: 'inset(0 65% 0 0)', duration: 1 }, 0)
    .to('#vmMission', { clipPath: 'inset(0 0 0 65%)', duration: 1 }, 0)
    .to('#vmDivider', { left: '35%', duration: 1 }, 0)
    .to('#vmVision', { clipPath: 'inset(0 35% 0 0)', duration: 1 }, 1)
    .to('#vmMission', { clipPath: 'inset(0 0 0 35%)', duration: 1 }, 1)
    .to('#vmDivider', { left: '65%', duration: 1 }, 1)
    .to('#vmVision', { clipPath: 'inset(0 50% 0 0)', duration: 1 }, 2)
    .to('#vmMission', { clipPath: 'inset(0 0 0 50%)', duration: 1 }, 2)
    .to('#vmDivider', { left: '50%', duration: 1 }, 2);

  /* =====================================================
     10. CLOSING — floating gold particles + gentle zoom (cloude)
     ===================================================== */
  var particleField = document.getElementById('closingParticles');
  for(var i=0;i<28;i++){
    var p = document.createElement('span');
    p.className = 'closing__particle';
    p.style.left = Math.random()*100 + '%';
    p.style.top = Math.random()*100 + '%';
    particleField.appendChild(p);
    gsap.to(p, {
      y: -(30 + Math.random()*60),
      x: (Math.random()*40 - 20),
      opacity: Math.random()*0.5 + 0.2,
      duration: 3 + Math.random()*3,
      repeat: -1, yoyo: true, ease: 'sine.inOut', delay: Math.random()*2
    });
  }
  gsap.from('.closing__content', {
    scale: 0.92, autoAlpha: 0, duration: 1.2, ease: 'power2.out',
    scrollTrigger:{ trigger: '.closing', start: 'top 70%' }
  });

  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });

})();