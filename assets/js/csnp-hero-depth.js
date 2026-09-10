/* WebGL depth-parallax for the CSNP section.
   Uses fragment-shader UV-offset (same technique as contact-hero-depth.js),
   NOT vertex displacement — gives a natural 2D parallax feel.
   Loaded with defer after three.js r128. */

(function () {
  "use strict";

  function init() {
    var container = document.getElementById("csnp-hero-webgl");
    if (!container) {
      console.error("csnp-hero-webgl container not found.");
      return;
    }

    /* ── Fallback: plain image if WebGL unavailable ── */
    function fallback() {
      container.style.backgroundImage = "url('assets/images/aboutcivil.webp')";
      container.style.backgroundSize = "cover";
      container.style.backgroundPosition = "center";
    }

    if (typeof THREE === "undefined") { fallback(); return; }

    /* ── Scene ── */
    var scene = new THREE.Scene();

    /* ── Orthographic camera — same as reference ── */
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    /* ── Renderer ── */
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { fallback(); return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    /* Size to container — container is position:absolute inset:0,
       so it inherits the section height once the DOM has laid out. */
    function getSize() {
      var w = container.clientWidth  || window.innerWidth;
      var h = container.clientHeight || 240; /* fallback for mobile relative height */
      /* If the section hasn't got a height yet, use a sensible fallback */
      if (h < 10) {
        var section = container.closest(".about-csnp-section");
        h = section ? section.clientHeight : Math.round(w * 0.65);
      }
      return { w: w, h: h };
    }

    var sz = getSize();
    renderer.setSize(sz.w, sz.h);
    container.appendChild(renderer.domElement);

    /* ── Textures ── */
    var loader      = new THREE.TextureLoader();
    var colorTex    = null;
    var depthTex    = null;
    var material    = null;
    var imageAspect = 1;

    function tryBuild() {
      if (!colorTex || !depthTex) return;

      colorTex.minFilter = THREE.LinearFilter;
      depthTex.minFilter = THREE.LinearFilter;
      imageAspect = colorTex.image.width / colorTex.image.height;

      var geometry = new THREE.PlaneGeometry(2, 2);

      material = new THREE.ShaderMaterial({
        uniforms: {
          uColor:        { value: colorTex },
          uDepth:        { value: depthTex },
          uMouse:        { value: new THREE.Vector2(0, 0) },
          uStrength:     { value: 0.032 },          /* parallax intensity — tune this */
          uImageAspect:  { value: imageAspect },
          uScreenAspect: { value: sz.w / sz.h }
        },
        vertexShader: [
          "varying vec2 vUv;",
          "void main() {",
          /* slight overscale so we never expose edges during parallax */
          "  vUv = uv;",
          "  gl_Position = vec4(position * 1.08, 1.0);",
          "}"
        ].join("\n"),
        fragmentShader: [
          "uniform sampler2D uColor;",
          "uniform sampler2D uDepth;",
          "uniform vec2      uMouse;",
          "uniform float     uStrength;",
          "uniform float     uImageAspect;",
          "uniform float     uScreenAspect;",
          "varying vec2      vUv;",

          "void main() {",
          /* ── Cover-mode UV (same logic as reference) ── */
          "  vec2 uv = vUv;",
          "  float ratio = uScreenAspect / uImageAspect;",
          "  if (ratio > 1.0) {",
          /* screen wider than image — clip top/bottom */
          "    uv.y = uv.y / ratio + (1.0 - 1.0 / ratio) * 0.5;",
          "  } else {",
          /* screen taller than image (mobile) — clip sides, bias slightly right */
          "    uv.x = uv.x * ratio + (1.0 - ratio) * 0.55;",
          "  }",

          /* ── Soft depth sample (5-tap average) ── */
          "  float d0 = texture2D(uDepth, uv).r;",
          "  float d1 = texture2D(uDepth, uv + vec2(0.003,  0.0)).r;",
          "  float d2 = texture2D(uDepth, uv - vec2(0.003,  0.0)).r;",
          "  float d3 = texture2D(uDepth, uv + vec2(0.0,  0.003)).r;",
          "  float d4 = texture2D(uDepth, uv - vec2(0.0,  0.003)).r;",
          "  float depth = (d0 + d1 + d2 + d3 + d4) / 5.0;",

          /* ── Offset UV by mouse × depth × strength ── */
          "  vec2 offset    = uMouse * depth * uStrength;",
          "  vec2 displaced = clamp(uv + offset, 0.001, 0.999);",
          "  gl_FragColor   = texture2D(uColor, displaced);",
          "}"
        ].join("\n")
      });

      var mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      /* ── Auto-drift — no mouse input at all ── */
      var target  = { x: 0, y: 0 };
      var current = { x: 0, y: 0 };

      var reducedMotion = window.matchMedia &&
                          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      var t0 = performance.now();

      /* ── Intersection Observer — pause when off-screen ── */
      var visible = true;
      if (typeof IntersectionObserver === "function") {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
        }, { threshold: 0.01 }).observe(container);
      }

      /* ── Render loop ── */
      (function animate() {
        requestAnimationFrame(animate);
        if (!visible) return;

        if (!reducedMotion) {
          /* Layered sines on different periods — gives a natural, never-repeating
             drift that stays well within ±0.55 so the image never distorts.
             Slow ramp-in over 2 s so it doesn't jump on load. */
          var t     = (performance.now() - t0) / 1000;
          var ramp  = Math.min(1, t / 2.0);
          var LIMIT = 0.28;   /* hard cap — stays inside distortion-free zone */
          var driftSpeed = 1; /* tune this single value for overall uniform speed */
          target.x = LIMIT * Math.sin(t * driftSpeed) * ramp;
          target.y = LIMIT * Math.sin(t * driftSpeed + Math.PI / 2) * ramp;
        }

        /* Slower lerp than the mouse version — 0.012 gives a heavy, cinematic lag.
           Speed up through the center, keep current speed near the outer range.
           distNorm: 0 at dead-center, 1 at the LIMIT boundary. LIMIT and the
           clamp stay untouched — only the approach speed changes. */
        var distNorm = Math.min(1, Math.sqrt(current.x * current.x + current.y * current.y) / LIMIT);
        var dynamicLerp = 0.012 + (1 - distNorm) * 0.03; /* 0.03 = extra center boost, tune this */

        current.x += (target.x - current.x) * dynamicLerp;
        current.y += (target.y - current.y) * dynamicLerp;

        material.uniforms.uMouse.value.set(current.x, current.y);
        renderer.render(scene, camera);
      })();
    }

    loader.load(
      "assets/images/aboutcivil.webp",
      function (t) { colorTex = t; tryBuild(); },
      undefined,
      function (e) { console.error("CSNP color texture failed:", e); fallback(); }
    );

    loader.load(
      "assets/images/aboutcivil-depth.png",
      function (t) { depthTex = t; tryBuild(); },
      undefined,
      function (e) { console.error("CSNP depth texture failed:", e); }
    );

    /* ── Resize handler ── */
    window.addEventListener("resize", function () {
      var s = getSize();
      renderer.setSize(s.w, s.h);
      if (material) {
        material.uniforms.uScreenAspect.value = s.w / s.h;
      }
    }, { passive: true });
  }

  /* Wait for DOM + defer scripts to settle */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    /* Already parsed — but THREE may still be executing (defer order).
       A single rAF gives it one tick to finish. */
    requestAnimationFrame(init);
  }

})();