/* assets/js/chatbot-widget.js
 * Bottom-right chatbot frame animation, shared by every page.
 *
 * Loaded from components/includes.js, so about / app / contact / courses /
 * index pick it up automatically with no per-page markup.
 *
 * Behaviour:
 *  - The widget is injected hidden, so it never affects the page load.
 *  - Frame loading starts only after the page splash (#page-loader) is gone
 *    and window "load" has fired.
 *  - Frames are fetched in small parallel batches; once all are in memory the
 *    widget fades in and the loop starts: 1 -> 240 -> 1 -> ...
 *  - Frames are drawn to a <canvas> from the preloaded Image objects, so every
 *    frame paints instantly (no src-swap decode flicker on the first loop).
 *  - The loop is driven by requestAnimationFrame with a fixed frame interval,
 *    so it stays smooth and pauses itself while the tab is hidden.
 *  - With prefers-reduced-motion the widget is shown on a single frame.
 */
(function () {
  'use strict';

  var FRAME_COUNT = 240;
  var FRAME_DIR = 'assets/images/chatbot/frame/';
  var FPS = 24;               /* 240 frames at 24fps = 10s per loop */
  var BATCH = 8;              /* parallel frame downloads */
  var ID = 'chatbotWidget';

  /* Greeting bubble: shown while frames 153 -> 180 are playing (0-based
     152 -> 179), i.e. roughly 1.2s on every 10s loop. */
  var BUBBLE_START = 152;
  var BUBBLE_END = 179;
  var BUBBLE_TEXT = 'Hey';

  /* Second bubble ("I'm AIT" / "click me") — shown every loop from frame
     217 through frame 30 of the next loop (wraps 240 -> 1). */
  var BUBBLE2_START = 216;   /* frame_0217, 0-based */
  var BUBBLE2_END = 29;      /* frame_0030 of the next loop, 0-based */
  var BUBBLE2_TEXT = 'I\'m AIT\nclick me';

  var urls = [];
  for (var i = 0; i < FRAME_COUNT; i++) {
    urls.push(FRAME_DIR + 'frame_' + pad(i + 1) + '.webp');
  }

  function pad(n) {
    return (n < 10 ? '000' : n < 100 ? '00' : n < 1000 ? '0' : '') + n;
  }

  /* Styles, injected once */
  function injectStyles() {
    if (document.getElementById('chatbotWidgetStyles')) return;
    var style = document.createElement('style');
    style.id = 'chatbotWidgetStyles';
    style.textContent =
      '#' + ID + '{position:fixed;right:18px;bottom:28px;z-index:9997;cursor:pointer;' +
      'width:142px;max-width:calc(100vw - 36px);line-height:0;' +
      'opacity:0;visibility:hidden;pointer-events:none;' +
      'transition:opacity 0.4s ease;}' +
      '#' + ID + '.is-ready{opacity:1;visibility:visible;pointer-events:auto;}' +
      '#' + ID + ' canvas{display:block;width:100%;height:auto;border-radius:14px;' +
      'filter:drop-shadow(0 10px 24px rgba(0,0,0,0.35));}' +
      '#' + ID + ' .bubble{position:absolute;left:6px;bottom:calc(100% - 16px);z-index:3;' +
      'max-width:200px;box-sizing:border-box;padding:6px 12px;' +
      'background:#ffffff;color:#1A2E25;' +
      'font-family:"Comic Sans MS","Comic Sans","Chalkboard SE","Marker Felt","Comic Neue",cursive;' +
      'font-size:13px;font-weight:700;line-height:1.25;text-align:center;' +
      'white-space:nowrap;border-radius:14px;border:2px solid var(--color-red,#a12c2f);' +
      'box-shadow:0 4px 14px rgba(0,0,0,0.18);' +
      'opacity:0;visibility:hidden;pointer-events:none;' +
      'transform:translateY(8px) scale(0.8) rotate(-3deg);transform-origin:bottom center;' +
      'transition:opacity 0.25s ease,transform 0.25s ease,visibility 0.25s;}' +
      '#' + ID + ' .bubble::before{content:"";position:absolute;bottom:-9px;left:50%;margin-left:-10px;' +
      'border:9px solid transparent;border-top:9px solid var(--color-red,#a12c2f);border-bottom:0;}' +
      '#' + ID + ' .bubble::after{content:"";position:absolute;bottom:-6px;left:50%;margin-left:-8px;' +
      'border:8px solid transparent;border-top:8px solid #ffffff;border-bottom:0;}' +
      '#' + ID + ' .bubble.is-on{opacity:1;visibility:visible;transform:translateY(0) scale(1) rotate(-3deg);}' +
      '#' + ID + ' .bubble2{left:auto;right:-2px;bottom:-16px;transform-origin:top right;' +
      'white-space:pre-line;}' +
      '#' + ID + ' .bubble2::before{top:-9px;bottom:auto;border-top:0;border-bottom:9px solid var(--color-red,#a12c2f);}' +
      '#' + ID + ' .bubble2::after{top:-6px;bottom:auto;border-top:0;border-bottom:8px solid #ffffff;}' +
      '@media (max-width:480px){#' + ID + '{width:108px;right:12px;bottom:22px;}' +
      '#' + ID + ' .bubble{max-width:170px;font-size:12px;padding:5px 10px;}}';
    (document.head || document.documentElement).appendChild(style);
  }

  /* Widget markup (created only once) */
  function mount() {
    var existing = document.getElementById(ID);
    if (existing) return existing;

    injectStyles();

    var box = document.createElement('div');
    box.id = ID;
    box.setAttribute('aria-hidden', 'true');
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-label', 'Open chat assistant');
    box.title = 'Chat with us';

    var canvas = document.createElement('canvas');
    /* Internal resolution matches the frames' aspect ratio (704:648 scaled
       down) so drawImage never stretches them. */
    canvas.width = 192;
    canvas.height = 177;

    box.appendChild(canvas);

    var bubble = document.createElement('div');
    bubble.className = 'bubble bubble1';
    bubble.textContent = BUBBLE_TEXT;
    bubble.setAttribute('aria-hidden', 'true');
    box.appendChild(bubble);

    var bubble2 = document.createElement('div');
    bubble2.className = 'bubble bubble2';
    bubble2.textContent = BUBBLE2_TEXT;
    bubble2.setAttribute('aria-hidden', 'true');
    box.appendChild(bubble2);

    document.body.appendChild(box);

    return box;
  }

  /* Splash gate: wait for #page-loader to be removed + window load */
  function whenPageReady(cb) {
    function ready() {
      return !document.getElementById('page-loader') &&
             document.readyState === 'complete';
    }
    if (ready()) { cb(); return; }

    var waited = 0;
    var iv = window.setInterval(function () {
      waited += 150;
      if (ready() || waited >= 15000) {   /* never block the widget for good */
        window.clearInterval(iv);
        cb();
      }
    }, 150);
  }

  /* Download every frame, BATCH at a time */
  function preloadFrames(onDone) {
    var images = new Array(FRAME_COUNT);
    var next = 0;
    var failed = 0;

    function runBatch() {
      if (next >= FRAME_COUNT) { onDone(images, failed); return; }

      var start = next;
      var end = Math.min(start + BATCH, FRAME_COUNT);
      next = end;
      var settled = 0;

      for (var k = start; k < end; k++) {
        (function (index) {
          var img = new Image();
          img.onload = function () { settled++; };
          img.onerror = function () { failed++; settled++; };
          images[index] = img;
          img.src = urls[index];
        })(k);
      }

      (function waitBatch() {
        if (settled >= end - start) runBatch();
        else window.setTimeout(waitBatch, 60);
      })();
    }

    runBatch();
  }

  /* Decode all preloaded frames so the first loop paints instantly.
     img.decode() resolves once the bitmap is ready — without this the
     first pass flickers because each frame is still decoding on demand. */
  function decodeAll(images) {
    var pending = images.length;
    if (pending === 0) return Promise.resolve();

    return new Promise(function (resolve) {
      var tick = function () {
        pending--;
        if (pending <= 0) resolve();
      };
      for (var i = 0; i < images.length; i++) {
        var im = images[i];
        if (!im || !im.decode) { tick(); continue; }
        im.decode().then(tick, tick);
      }
    });
  }

  /* Play the loaded frames in a loop, drawn straight from the preloaded
     Image objects onto the canvas — no src swapping, no decode flicker. */
  function play(box, canvas, images) {
    var ctx = canvas.getContext('2d');
    var interval = 1000 / FPS;
    var index = 0;
    var last = 0;

    function makeToggler(el) {
      var on = false;
      return function (state) {
        if (!el || state === on) return;
        on = state;
        el.classList.toggle('is-on', state);
        el.setAttribute('aria-hidden', state ? 'false' : 'true');
      };
    }
    var setHey = makeToggler(box.querySelector('.bubble1'));
    var setAit = makeToggler(box.querySelector('.bubble2'));

    function draw(i) {
      var im = images[i];
      if (im && im.complete && im.naturalWidth) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
        setHey(i >= BUBBLE_START && i <= BUBBLE_END);
        setAit(i >= BUBBLE2_START || i <= BUBBLE2_END);
        return true;
      }
      return false;
    }

    /* Draw the first frame; if it somehow isn't ready, retry briefly */
    if (!draw(0)) {
      var tries = 0;
      var retry = window.setInterval(function () {
        if (draw(0) || ++tries > 50) window.clearInterval(retry);
      }, 40);
    }

    box.classList.add('is-ready');
    box.removeAttribute('aria-hidden');

    if (window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;                                /* static frame, no loop */
    }

    function frame(now) {
      if (document.hidden) {
        last = now;                           /* avoid a burst after waking */
        requestAnimationFrame(frame);
        return;
      }
      if (now - last >= interval) {
        last = now - ((now - last) % interval);
        index = (index + 1) % FRAME_COUNT;
        draw(index);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function init() {
    if (document.getElementById(ID)) return;

    var box = mount();
    var canvas = box.querySelector('canvas');

    whenPageReady(function () {
      preloadFrames(function (images, failed) {
        /* Keep the preloaded images referenced so the browser does not drop
           them from its memory cache while the loop runs. */
        box.__frames = images;
        if (failed >= FRAME_COUNT) return;    /* nothing loaded - stay hidden */

        /* Decode every frame before revealing the widget, so the first
           loop is as smooth as every loop after it. */
        decodeAll(images).then(function () {
          play(box, canvas, images);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
