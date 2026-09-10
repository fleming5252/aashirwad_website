/* Shared page-preloader runtime: word-cycle text + constellation sphere.
   Loaded via <script src="assets/js/loader.js"></script> directly after the
   #page-loader markup on every page. The constellation code was adapted from
   animate.html. */

/* Always start a (re)load at the top of the page instead of letting the
   browser restore the previous scroll position mid-page. */
(function () {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (!location.hash) {
    window.addEventListener('load', function () {
      window.scrollTo(0, 0);
    });
  }
})();

(function () {
  var words = document.querySelectorAll('.word');
  var HOLD = 600;
  var TRANS = 200;
  var current = 0;

  function show(idx) {
    var prev = current;
    current = idx;
    words[prev].classList.remove('active');
    words[prev].classList.add('exit');
    setTimeout(function () { words[prev].classList.remove('exit'); }, 600);
    words[current].classList.remove('exit');
    words[current].classList.add('active');
  }

  if (words.length) {
    words[0].classList.add('active');
    setInterval(function () { show((current + 1) % words.length); }, HOLD + TRANS);
  }
})();

/* ── Constellation sphere preloader (adapted from animate.html) ── */
(function () {
  "use strict";

  var loader      = document.getElementById('page-loader');
  var wrap        = document.getElementById('constellation-wrap');
  var canvas      = document.getElementById('sphere-canvas');
  if (!loader || !canvas) return;
  var ctx         = canvas.getContext('2d');
  var progressEl  = document.getElementById('progress-text');

  /* Pause page videos while the preloader is up so video decoding and
     compositing don't compete with the canvas render loop. */
  function pauseVideos() {
    document.querySelectorAll('video').forEach(function (v) { v.pause(); });
  }
  function resumeVideos() {
    document.querySelectorAll('video').forEach(function (v) {
      try { v.play(); } catch (e) { /* ignore */ }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pauseVideos);
  } else {
    pauseVideos();
  }

  var dpr = Math.max(1, window.devicePixelRatio || 1);
  var W = 0, H = 0, CX = 0, CY = 0;
  var sphereRadius = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    CX = W / 2;
    CY = H / 2;
    sphereRadius = Math.min(W, H) * 0.24;
  }
  resize();
  window.addEventListener('resize', resize);

  /* Sphere geometry — Fibonacci sphere distribution (unit vectors) */
  var NODE_COUNT = 148;
  var nodes = [];
  var goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (var i = 0; i < NODE_COUNT; i++) {
    var yFrac = 1 - (i / (NODE_COUNT - 1)) * 2;   // 1 -> -1
    var radiusAtY = Math.sqrt(Math.max(0, 1 - yFrac * yFrac));
    var theta = goldenAngle * i;

    nodes.push({
      ux: Math.cos(theta) * radiusAtY,
      uy: yFrac,
      uz: Math.sin(theta) * radiusAtY,
      x: 0, y: 0, z: 0,
      sx: 0, sy: 0,
      scrScale: 1,
      isPulse: Math.random() < 0.32,
      phase: Math.random() * Math.PI * 2,
      speed: 0.9 + Math.random() * 1.6,
      peak: 0.55 + Math.random() * 0.45,
      baseR: 1.3 + Math.random() * 1.4
    });
  }

  /* Precompute constellation edges once — rotation preserves relative 3D distance */
  var CONNECT_THRESHOLD = 0.40;
  var edges = [];
  for (var a = 0; a < nodes.length; a++) {
    for (var b = a + 1; b < nodes.length; b++) {
      var dx = nodes[a].ux - nodes[b].ux;
      var dy = nodes[a].uy - nodes[b].uy;
      var dz = nodes[a].uz - nodes[b].uz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < CONNECT_THRESHOLD) {
        edges.push({ a: a, b: b, dist: dist });
      }
    }
  }

  /* Rotation state — autonomous: every few seconds a new random spin
     direction/speed is picked and the rotation glides toward it. */
  var rotY = 0, rotX = 0;
  var velY = 0.006, velX = 0.002;
  var targetVelY = 0.006, targetVelX = 0.002;
  var LERP_DAMPING = 0.045;
  var MAX_SPIN = 0.016;

  function pickNewSpin() {
    var mag = 0.003 + Math.random() * MAX_SPIN;
    var ang = Math.random() * Math.PI * 2;
    targetVelY = Math.cos(ang) * mag;
    targetVelX = Math.sin(ang) * mag;
  }

  pickNewSpin();
  setInterval(pickNewSpin, 2600 + Math.random() * 2400);

  /* Progress counter */
  var progress = 0;
  var lastProgress = -1;
  var PROGRESS_DURATION = 2000; // ms
  var startTime = null;
  var finished = false;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function updateProgress(now) {
    if (startTime === null) startTime = now;
    var elapsed = now - startTime;
    var t = Math.min(1, elapsed / PROGRESS_DURATION);
    progress = Math.round(easeOutCubic(t) * 100);
    if (progress !== lastProgress) {
      lastProgress = progress;
      progressEl.textContent = 'FORMING NETWORK: ' + progress + '%';
    }
    if (t >= 1 && !finished) {
      finished = true;
      finishSequence();
    }
  }

  var running = true;

  function finishSequence() {
    setTimeout(function () {
      loader.classList.add('is-exiting');
      var cleanupDone = false;
      var cleanup = function () {
        if (cleanupDone) return;
        cleanupDone = true;
        running = false;
        resumeVideos();
        window.removeEventListener('resize', resize);
        if (loader && loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      };
      loader.addEventListener('transitionend', function onEnd(e) {
        if (e.target !== loader) return;
        loader.removeEventListener('transitionend', onEnd);
        cleanup();
      });
      setTimeout(cleanup, 950);
    }, 260);
  }

  /* Main render loop */
  var focalLength = 480;
  var cameraDist = 620;

  function rotateAndProject() {
    var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    var cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var px = n.ux * sphereRadius;
      var py = n.uy * sphereRadius;
      var pz = n.uz * sphereRadius;

      var x1 = px * cosY + pz * sinY;
      var z1 = -px * sinY + pz * cosY;
      var y1 = py;

      var y2 = y1 * cosX - z1 * sinX;
      var z2 = y1 * sinX + z1 * cosX;
      var x2 = x1;

      n.x = x2; n.y = y2; n.z = z2;

      var scale = focalLength / (z2 + cameraDist);
      n.sx = CX + x2 * scale;
      n.sy = CY + y2 * scale;
      n.scrScale = scale;
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);

    var minZ = -sphereRadius, maxZ = sphereRadius;

    /* connecting lines */
    for (var e = 0; e < edges.length; e++) {
      var edge = edges[e];
      var na = nodes[edge.a], nb = nodes[edge.b];
      var avgZ = (na.z + nb.z) / 2;
      var depthT = (avgZ - minZ) / (maxZ - minZ);
      var proximity = 1 - (edge.dist / CONNECT_THRESHOLD);
      var alpha = Math.max(0, 0.05 + proximity * 0.22) * (0.35 + depthT * 0.65);
      if (alpha <= 0.012) continue;

      ctx.strokeStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 0.4 + depthT * 0.9;
      ctx.beginPath();
      ctx.moveTo(na.sx, na.sy);
      ctx.lineTo(nb.sx, nb.sy);
      ctx.stroke();
    }

    /* nodes, back-to-front for correct depth layering */
    var order = nodes.slice().sort(function (p, q) { return p.z - q.z; });

    for (var i = 0; i < order.length; i++) {
      var n = order[i];
      var depthT = (n.z - minZ) / (maxZ - minZ);
      var baseOpacity = 0.22 + depthT * 0.55;
      var size = n.baseR * (0.55 + depthT * 0.85);

      var glow = 1;
      var isFlaring = false;
      if (n.isPulse) {
        var s = (Math.sin(time * 0.001 * n.speed + n.phase) + 1) / 2; // 0..1
        glow = 0.35 + s * n.peak;
        isFlaring = s > 0.86;
      }

      var opacity = Math.min(1, baseOpacity * glow);

      if (isFlaring) {
        var flareR = size * 9;
        var grad = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, flareR);
        grad.addColorStop(0, 'rgba(255,255,255,' + (0.5 * opacity).toFixed(3) + ')');
        grad.addColorStop(0.4, 'rgba(255,255,255,' + (0.16 * opacity).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, flareR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(255,255,255,' + opacity.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(n.sx, n.sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick(time) {
    if (!running) return;

    velY += (targetVelY - velY) * LERP_DAMPING;
    velX += (targetVelX - velX) * LERP_DAMPING;

    rotY += velY;
    rotX += velX;

    rotateAndProject();
    draw(time);
    updateProgress(time);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();