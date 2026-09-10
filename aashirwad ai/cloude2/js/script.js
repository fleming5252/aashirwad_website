/* =========================================================
   AASHIRWAD INSTITUTE — ABOUT PAGE ANIMATIONS
   GSAP + ScrollTrigger
   ========================================================= */

(function(){

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

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(typeof gsap === 'undefined'){ return; }
  gsap.registerPlugin(ScrollTrigger);

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
    document.getElementById('heroBook').style.display = 'none';
    return; // skip elaborate motion, keep the page fully usable & static
  }

  /* =====================================================
     1. HERO — book cover opens once, then parallax bg
     ===================================================== */
  var bookTl = gsap.timeline({ delay: 0.2 });
  bookTl
    .set('.hero__book-cover--left', { transformPerspective: 1800 })
    .set('.hero__book-cover--right', { transformPerspective: 1800 })
    .to('.hero__book-cover--left', { rotateY: -110, duration: 1.1, ease: 'power3.inOut' }, 0.15)
    .to('.hero__book-cover--right', { rotateY: 110, duration: 1.1, ease: 'power3.inOut' }, 0.15)
    .to('.hero__book', { autoAlpha: 0, duration: 0.4, pointerEvents:'none' }, 1.05)
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
     2. JOURNEY — pinned, SVG path draws, stops reveal
     ===================================================== */
  var journeyTl = gsap.timeline({
    scrollTrigger:{
      trigger: '#journey',
      start: 'top top',
      end: '+=250%',
      scrub: 0.6,
      pin: '.journey__pin'
    }
  });
  journeyTl
    .to('#journeyPath', { strokeDashoffset: 0, duration: 3, ease: 'none' }, 0)
    .to('.journey__stop[data-stop="1"]', { autoAlpha: 1, y: 0, duration: 1 }, 0.2)
    .to('.journey__stop[data-stop="2"]', { autoAlpha: 1, y: 0, duration: 1 }, 1.3)
    .to('.journey__stop[data-stop="3"]', { autoAlpha: 1, y: 0, duration: 1 }, 2.3);

  /* =====================================================
     3. EXCELLENCE — orbit ring + count-up statistics
     ===================================================== */
  document.querySelectorAll('.excellence__num').forEach(function(el){
    if(el.dataset.static) return;
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var obj = { val: 0 };
    ScrollTrigger.create({
      trigger: '.excellence',
      start: 'top 70%',
      once: true,
      onEnter: function(){
        gsap.to(obj, {
          val: target, duration: 1.8, ease: 'power2.out',
          onUpdate: function(){ el.textContent = Math.round(obj.val) + suffix; }
        });
      }
    });
  });
  gsap.from('.excellence__badge', {
    scale: 0.6, autoAlpha: 0, stagger: 0.15, duration: 0.9, ease: 'back.out(1.6)',
    scrollTrigger:{ trigger: '.excellence', start: 'top 65%' }
  });
  gsap.from('.excellence__portrait', {
    scale: 0.85, autoAlpha: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger:{ trigger: '.excellence', start: 'top 65%' }
  });

  /* =====================================================
     4. ECOSYSTEM — horizontal scroll driven by vertical scroll
     ===================================================== */
  var track = document.getElementById('ecosystemTrack');
  function ecosystemScrollLength(){
    return track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(document.documentElement).fontSize) * 4;
  }
  gsap.to(track, {
    x: () => -ecosystemScrollLength(),
    ease: 'none',
    scrollTrigger:{
      trigger: '#ecosystem',
      start: 'top top',
      end: () => '+=' + (ecosystemScrollLength() + window.innerHeight * 1.2),
      scrub: 0.6,
      pin: '.ecosystem__pin',
      invalidateOnRefresh: true
    }
  });
  gsap.from('.programme-card', {
    y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'power2.out',
    scrollTrigger:{ trigger: '#ecosystem', start: 'top 70%' }
  });

  /* =====================================================
     5. CSNP — pinned, image rotates in 3D, panels swap by stage
     ===================================================== */
  gsap.set('.csnp__img', { rotateY: -14, rotateX: 3, scale: 0.92, transformPerspective: 1200 });
  var csnpTl = gsap.timeline({
    scrollTrigger:{
      trigger: '#csnp',
      start: 'top top',
      end: '+=300%',
      scrub: 0.6,
      pin: '.csnp__pin'
    }
  });
  csnpTl
    .to('.csnp__img', { rotateY: 0, rotateX: 0, scale: 1, duration: 4, ease: 'none' }, 0)
    .to('.csnp__panel[data-stage="1"]', { autoAlpha: 0, y: -30, duration: 1 }, 0.8)
    .to('.csnp__panel[data-stage="2"]', { autoAlpha: 1, y: 0, duration: 1 }, 0.8, '<')
    .to('.csnp__panel[data-stage="2"]', { autoAlpha: 0, y: -30, duration: 1 }, 1.9)
    .to('.csnp__panel[data-stage="3"]', { autoAlpha: 1, y: 0, duration: 1 }, 1.9, '<')
    .to('.csnp__panel[data-stage="3"]', { autoAlpha: 0, y: -30, duration: 1 }, 3.0)
    .to('.csnp__panel[data-stage="4"]', { autoAlpha: 1, y: 0, duration: 1 }, 3.0, '<');

  /* =====================================================
     6. INNOVATION — 3D device rotation + layered parallax floats
     ===================================================== */
  gsap.to('#innovationDevice', {
    rotateY: 4, rotateX: -2, ease: 'none',
    scrollTrigger:{ trigger: '.innovation', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  document.querySelectorAll('.innovation__float').forEach(function(el){
    var depth = parseFloat(el.dataset.depth) || 0.5;
    gsap.to(el, {
      y: -120 * depth,
      ease: 'none',
      scrollTrigger:{ trigger: '.innovation', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
  gsap.from('.innovation__device', {
    autoAlpha: 0, y: 60, duration: 1.1, ease: 'power3.out',
    scrollTrigger:{ trigger: '.innovation__scene', start: 'top 75%' }
  });

  /* =====================================================
     7. BEYOND — clip-path circle reveal to full image
     ===================================================== */
  gsap.to('#beyondClip', {
    clipPath: 'circle(75% at 50% 50%)',
    ease: 'none',
    scrollTrigger:{
      trigger: '.beyond',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6
    }
  });
  gsap.fromTo('.beyond__copy', { autoAlpha: 0, y: 30 }, {
    autoAlpha: 1, y: 0, duration: 1,
    scrollTrigger:{ trigger: '.beyond__copy', start: 'top 85%' }
  });

  /* =====================================================
     8. COMMITMENT — stacked cards separate & rotate apart
     ===================================================== */
  var cardOffsets = [ {x:-260, r:-8}, {x:0, r:0}, {x:260, r:8} ];
  gsap.set('.commitment__card', { y: 0 });
  var commitTl = gsap.timeline({
    scrollTrigger:{
      trigger: '#commitment',
      start: 'top top',
      end: '+=250%',
      scrub: 0.6,
      pin: '.commitment__pin'
    }
  });
  document.querySelectorAll('.commitment__card').forEach(function(card, i){
    var o = cardOffsets[i] || {x:0,r:0};
    commitTl.to(card, {
      x: o.x, rotate: o.r, y: i === 1 ? -30 : 20, duration: 1.4, ease: 'none'
    }, 0.2 + i * 0.15);
  });

  /* =====================================================
     9. VISION / MISSION — clip-paths widen past centre, morph-swap
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
     10. CLOSING — floating gold particles + gentle zoom
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

  ScrollTrigger.addEventListener('refreshInit', function(){});
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });

})();
