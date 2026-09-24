/*
 * assets/js/theme-picker.js
 * Navbar theme color picker.
 *
 * Reworks the two primary brand variables (--color-red, --color-red-dark)
 * from a single hue. A saved color (localStorage key "themeColor") is
 * restored synchronously at the top of this file to avoid a flash of the
 * default brand red.
 */
(function () {
  'use strict';

  var THEME_KEY = 'themeColor';
  var STYLE_ID = 'themePickerStyles';

  /* ── Theme math ── */

  function hexToHue(hex) {
    var m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex).trim());
    if (!m) return null;
    var r = parseInt(m[1].substring(0, 2), 16) / 255,
        g = parseInt(m[1].substring(2, 4), 16) / 255,
        b = parseInt(m[1].substring(4, 6), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h;
    if (d === 0) h = 0;
    else if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    return h;
  }

  function hslToHex(hue) {
    var s = 0.70, l = 0.38;
    var f = function (n) {
      var k = (n + hue / 30) % 12;
      var a = s * Math.min(l, 1 - l);
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))));
    };
    var toHex = function (v) {
      var hx = v.toString(16);
      return hx.length === 1 ? '0' + hx : hx;
    };
    return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
  }

  /* "r, g, b" triplet string for halo(var) / rgba(var(--color-red-rgb), ...) usage */
  function hslToRgbTriplet(hue, s, l) {
    var f = function (n) {
      var k = (n + hue / 30) % 12;
      var a = s * Math.min(l, 1 - l);
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))));
    };
    return f(0) + ', ' + f(8) + ', ' + f(4);
  }

  /* Theme backgrounds — one per preset, matched by the preset hue.
     Values resolve relative to assets/css/templatemo-edu-meeting.css. */
  var THEME_BACKGROUNDS = [
    { hue: 35,   url: "../images/meetings-page-bg-Amber.webp" },
    { hue: 144,  url: "../images/meetings-page-bg-Forest Green.webp" },
    { hue: 193,  url: "../images/meetings-page-bg-Teal.webp" },
    { hue: 216,  url: "../images/meetings-page-bg-navyblue.png" },
    { hue: 313,  url: "../images/meetings-page-bg-Purple.webp" },
    { hue: 358,  url: "../images/meetings-page-bg-red.webp" }
  ];

  function themeBackgroundForHue(hue) {
    hue = ((hue % 360) + 360) % 360;
    var best = THEME_BACKGROUNDS[0], bestD = 361;
    THEME_BACKGROUNDS.forEach(function (t) {
      var d = Math.abs(((t.hue - hue + 540) % 360) - 180);
      if (d < bestD) { bestD = d; best = t; }
    });
    return best.url;
  }

  function applyTheme(hue) {
    var root = document.documentElement;
    root.style.setProperty('--color-red', 'hsl(' + hue + ', 70%, 38%)');
    root.style.setProperty('--color-red-dark', 'hsl(' + hue + ', 72%, 24%)');
    root.style.setProperty('--color-red-deep', 'hsl(' + hue + ', 68%, 32%)');
    root.style.setProperty('--color-red-rgb', hslToRgbTriplet(hue, 0.70, 0.38));
    root.style.setProperty('--color-red-dark-rgb', hslToRgbTriplet(hue, 0.72, 0.24));
    var cssUrl = themeBackgroundForHue(hue);
    var docUrl = cssUrl.replace('../images/', 'assets/images/');
    root.style.setProperty('--theme-bg-image', 'url(\'' + cssUrl + '\')');

    /* Check if hue is close to any preset (within 15°) */
    var nh = ((hue % 360) + 360) % 360;
    var isPreset = false;
    THEME_BACKGROUNDS.forEach(function (t) {
      var d = Math.abs(((t.hue - nh + 540) % 360) - 180);
      if (d < 15) isPreset = true;
    });

    var tint = 'hsl(' + hue + ', 60%, 30%)';
    var selectors = 'section.our-courses, section.learning-process, .pf-slide[data-bg="red"], .about-commitment-section';
    document.querySelectorAll(selectors).forEach(function (el) {
      el.style.backgroundImage = 'url(\'' + docUrl + '\')';
      var overlay = el.querySelector('.theme-tint-overlay');
      if (!isPreset) {
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'theme-tint-overlay';
          overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;mix-blend-mode:multiply;';
          el.style.position = el.style.position || 'relative';
          el.appendChild(overlay);
        }
        overlay.style.backgroundColor = tint;
      } else if (overlay) {
        overlay.remove();
      }
    });

    var wave = document.querySelector('.toppers-wave-divider');
    if (wave) {
      wave.style.setProperty('--theme-bg-image', 'url(\'' + cssUrl + '\')');
      var waveOverlay = wave.querySelector('.theme-tint-overlay');
      if (!isPreset) {
        if (!waveOverlay) {
          waveOverlay = document.createElement('div');
          waveOverlay.className = 'theme-tint-overlay';
          waveOverlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2;mix-blend-mode:multiply;';
          wave.appendChild(waveOverlay);
        }
        waveOverlay.style.backgroundColor = tint;
      } else if (waveOverlay) {
        waveOverlay.remove();
      }
    }
  }

  /* ── Restore the saved theme as early as possible (pre-paint) ── */

  var restoredHue = null;
  try {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      restoredHue = hexToHue(saved);
      if (restoredHue !== null) applyTheme(restoredHue);
    }
  } catch (e) {
    restoredHue = null;
  }

  var currentHue = restoredHue;

  /* ── Injected panel styles (no separate stylesheet file) ── */

  var PANEL_CSS =
    '.theme-picker-wrap{position:relative;padding-left:15px;padding-right:15px;list-style:none;}' +
    '.theme-picker-btn{display:block;height:40px;line-height:40px;padding:0;background:none;border:none;' +
    'color:var(--color-near-black,#1e1e1e);font-size:16px;cursor:pointer;transition:color .3s ease;font-family:Poppins,sans-serif;}' +
    '.theme-picker-wrap:hover .theme-picker-btn{color:var(--color-gold,#f5a425);}' +
    '.theme-panel{position:absolute;top:100%;right:0;z-index:9999;box-sizing:border-box;width:240px;padding:18px;' +
    'background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.18);}' +
    '.theme-panel[hidden]{display:none;}' +
    '.theme-label{display:block;font-family:Poppins,sans-serif;font-size:12px;font-weight:600;' +
    'letter-spacing:2px;text-transform:uppercase;color:#888;}' +
    '.theme-circles{display:flex;gap:10px;margin:12px 0;}' +
    '.theme-circles ~ .theme-label{display:block;margin-top:14px;}' +
    '.theme-dot{width:32px;height:32px;border-radius:50%;cursor:pointer;border:none;padding:0;' +
    'background-color:transparent;transition:transform .2s;}' +
    '.theme-dot:hover{transform:scale(1.12);}' +
    '.theme-dot.active{box-shadow:0 0 0 3px #fff,0 0 0 5px var(--dot);}' +
    '.theme-hue-slider{-webkit-appearance:none;-moz-appearance:none;appearance:none;display:block;width:100%;height:8px;' +
    'margin:8px 0 14px;border-radius:4px;outline:none;cursor:pointer;' +
    'background:linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%);}' +
    '.theme-hue-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;' +
    'background:#fff;border:2px solid #333;cursor:pointer;}' +
    '.theme-hue-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;' +
    'background:#fff;border:2px solid #333;cursor:pointer;}' +
    '.theme-hue-slider::-moz-range-track{height:8px;border-radius:4px;' +
    'background:linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%);}' +
    '.theme-apply{display:block;width:100%;padding:9px;border-radius:8px;border:none;cursor:pointer;' +
    'background:var(--color-red,#a12c2f);color:#fff;font-weight:700;' +
    'font-family:Poppins,sans-serif;font-size:14px;letter-spacing:1px;text-transform:uppercase;}' +
    '.theme-apply:hover{filter:brightness(1.1);}' +
    '@media(max-width:991px){' +
    '.theme-picker-wrap{padding-left:0!important;padding-right:0!important;width:100%;}' +
    '.theme-picker-btn{width:100%;display:flex!important;justify-content:center;align-items:center;height:50px;line-height:50px;padding:0 15px!important;background:var(--color-grey-soft)!important;border-bottom:1px solid var(--color-grey-extra-light)!important;color:var(--color-near-black-2)!important;}' +
    '.theme-panel{position:static!important;width:100%!important;border-radius:0!important;box-shadow:none!important;background:var(--color-white)!important;margin:0!important;padding:18px 15px!important;border-bottom:1px solid var(--color-grey-extra-light)!important;z-index:auto!important;}' +
    '.theme-panel .theme-circles{justify-content:center;}' +
    '.theme-panel .theme-label{display:block!important;text-align:center;}' +
    '}';

  function injectStyles() {
    var s = document.getElementById(STYLE_ID);
    if (!s) {
      s = document.createElement('style');
      s.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(s);
    }
    if (s.textContent !== PANEL_CSS) s.textContent = PANEL_CSS;
  }

  /* ── UI wiring ── */

  function init() {
    injectStyles();

    var wrap = document.querySelector('.theme-picker-wrap');
    var btn = document.querySelector('.theme-picker-btn');
    var panel = document.querySelector('.theme-panel');
    var dots = document.querySelectorAll('.theme-dot');
    var slider = document.querySelector('.theme-hue-slider');
    var applyBtn = document.querySelector('.theme-apply');
    if (!wrap || !btn || !panel) return;

    function setActiveDot(dot) {
      dots.forEach(function (d) {
        var active = d === dot;
        d.classList.toggle('active', active);
        if (d.hasAttribute('aria-pressed')) d.setAttribute('aria-pressed', String(active));
      });
    }

    function clearActive() {
      dots.forEach(function (d) {
        d.classList.remove('active');
        if (d.hasAttribute('aria-pressed')) d.setAttribute('aria-pressed', 'false');
      });
    }

    function setOpen(open) {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    }

    /* Restore the active preset / slider position to match the saved theme */
    if (restoredHue !== null && slider) slider.value = restoredHue;
    if (restoredHue !== null) {
      var match = null;
      dots.forEach(function (d) {
        if (hexToHue(d.getAttribute('data-color')) === restoredHue) match = d;
      });
      if (match) setActiveDot(match);
      else clearActive();
    } else if (dots.length) {
      setActiveDot(dots[0]);
    }

    /* Toggle */
    btn.addEventListener('click', function () {
      setOpen(panel.hidden);
    });

    /* Outside click closes */
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !wrap.contains(e.target)) setOpen(false);
    });

    /* Preset circles */
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var hue = hexToHue(dot.getAttribute('data-color'));
        if (hue === null) return;
        applyTheme(hue);
        currentHue = hue;
        setActiveDot(dot);
        if (slider) slider.value = hue;
      });
    });

    /* Hue slider: live preview, deselects the active circle */
    if (slider) {
      slider.addEventListener('input', function () {
        var hue = parseInt(slider.value, 10);
        if (isNaN(hue)) return;
        applyTheme(hue);
        currentHue = hue;
        clearActive();
      });
    }

    /* Apply: persist + close */
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        if (currentHue !== null) {
          try {
            localStorage.setItem(THEME_KEY, hslToHex(currentHue));
          } catch (e) { /* storage unavailable */ }
        }
        setOpen(false);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();