/* WebGL depth-parallax for the Courses CTA "Your Rank" banner.
   Desktop uses yourrank.webp + yourrank-depth.png.
   Mobile uses yourrankmobile.webp + yourrankmobile.png.
   Same fragment-shader UV-offset technique as csnp-hero-depth.js. */

(function () {
  "use strict";

  var BREAKPOINT = 768;
  var container = document.getElementById("cta-hero-webgl");
  if (!container) {
    console.error("cta-hero-webgl container not found.");
    return;
  }

  var state = null; /* { renderer, mat, rafId } */
  var lastMode = currentMode();

  function currentMode() {
    return window.innerWidth >= BREAKPOINT ? "desktop" : "mobile";
  }

  function texturesFor(mode) {
    if (mode === "mobile") {
      return {
        color:    "assets/images/yourrankmobile.webp",
        depth:    "assets/images/yourrankmobile.png",
        fallback: "assets/images/yourrankmobile.webp"
      };
    }
    return {
      color:    "assets/images/yourrank.webp",
      depth:    "assets/images/yourrank-depth.png",
      fallback: "assets/images/yourrank.webp"
    };
  }

  function getSize() {
    var w = container.clientWidth || window.innerWidth;
    var h = container.clientHeight;
    if (!h || h < 10) {
      var section = container.closest(".cta-banner");
      h = section ? section.clientHeight : Math.round(w * 0.65);
    }
    return { w: w, h: h };
  }

  function fallback() {
    var t = texturesFor(currentMode()).fallback;
    container.style.backgroundImage = "url('" + t + "')";
    container.style.backgroundSize = "cover";
    container.style.backgroundPosition = "center";
  }

  function stop() {
    if (!state) return;
    cancelAnimationFrame(state.rafId);
    if (state.renderer) {
      state.renderer.dispose();
      if (state.renderer.domElement && state.renderer.domElement.parentNode === container) {
        container.removeChild(state.renderer.domElement);
      }
    }
    state = null;
  }

  function start() {
    if (state) return;

    if (typeof THREE === "undefined") { fallback(); return; }

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { fallback(); return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    var sz = getSize();
    renderer.setSize(sz.w, sz.h);
    container.appendChild(renderer.domElement);

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
          uStrength:     { value: 0.032 },
          uImageAspect:  { value: imageAspect },
          uScreenAspect: { value: sz.w / sz.h }
        },
        vertexShader: [
          "varying vec2 vUv;",
          "void main() {",
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
          "  vec2 uv = vUv;",
          "  float ratio = uScreenAspect / uImageAspect;",
          "  if (ratio > 1.0) {",
          "    uv.y = uv.y / ratio + (1.0 - 1.0 / ratio) * 0.5;",
          "  } else {",
          "    uv.x = uv.x * ratio + (1.0 - ratio) * 0.55;",
          "  }",

          "  float d0 = texture2D(uDepth, uv).r;",
          "  float d1 = texture2D(uDepth, uv + vec2(0.003,  0.0)).r;",
          "  float d2 = texture2D(uDepth, uv - vec2(0.003,  0.0)).r;",
          "  float d3 = texture2D(uDepth, uv + vec2(0.0,  0.003)).r;",
          "  float d4 = texture2D(uDepth, uv - vec2(0.0,  0.003)).r;",
          "  float depth = (d0 + d1 + d2 + d3 + d4) / 5.0;",

          "  vec2 offset    = uMouse * depth * uStrength;",
          "  vec2 displaced = clamp(uv + offset, 0.001, 0.999);",
          "  gl_FragColor   = texture2D(uColor, displaced);",
          "}"
        ].join("\n")
      });

      var mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      state.mat = material;

      var target  = { x: 0, y: 0 };
      var current = { x: 0, y: 0 };

      var reducedMotion = window.matchMedia &&
                          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      var t0 = performance.now();
      var visible = true;
      if (typeof IntersectionObserver === "function") {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
        }, { threshold: 0.01 }).observe(container);
      }

      var LIMIT = 0.28;
      var driftSpeed = 1;

      (function animate() {
        state.rafId = requestAnimationFrame(animate);
        if (!visible) return;

        if (!reducedMotion) {
          var t    = (performance.now() - t0) / 1000;
          var ramp = Math.min(1, t / 2.0);
          target.x = LIMIT * Math.sin(t * driftSpeed) * ramp;
          target.y = LIMIT * Math.sin(t * driftSpeed + Math.PI / 2) * ramp;
        }

        var distNorm = Math.min(1, Math.sqrt(current.x * current.x + current.y * current.y) / LIMIT);
        var dynamicLerp = 0.012 + (1 - distNorm) * 0.03;

        current.x += (target.x - current.x) * dynamicLerp;
        current.y += (target.y - current.y) * dynamicLerp;

        material.uniforms.uMouse.value.set(current.x, current.y);
        renderer.render(scene, camera);
      })();
    }

    var tex = texturesFor(currentMode());

    loader.load(
      tex.color,
      function (t) { colorTex = t; tryBuild(); },
      undefined,
      function (e) { console.error("CTA color texture failed:", e); fallback(); }
    );

    loader.load(
      tex.depth,
      function (t) { depthTex = t; tryBuild(); },
      undefined,
      function (e) { console.error("CTA depth texture failed:", e); }
    );

    state = { renderer: renderer, mat: null, rafId: 0 };
  }

  window.addEventListener("resize", function () {
    var m = currentMode();
    if (m !== lastMode) {
      lastMode = m;
      stop();
    }
    if (state) {
      var s = getSize();
      state.renderer.setSize(s.w, s.h);
      if (state.mat) state.mat.uniforms.uScreenAspect.value = s.w / s.h;
    } else {
      start();
    }
  }, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    requestAnimationFrame(start);
  }
})();