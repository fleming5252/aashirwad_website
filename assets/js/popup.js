/* assets/js/popup.js
 * One-time popup banner shown on page load, with separate desktop/mobile
 * variants tracked independently.
 *
 * Rules:
 *  - Pick the image by viewport width: <= 768 → mobile, else desktop.
 *  - HEAD request the chosen image on every load and read its Last-Modified.
 *  - localStorage (per variant): if the stored value is missing or differs
 *    from the header, show the popup once with that image and save the value.
 *    If it matches, do nothing.
 *  - If the request fails (missing file, offline, etc.) it silently skips.
 *
 * Replacing only popup-banner.webp retriggers the popup on desktop only;
 * replacing only popup-banner-mobile.webp retriggers on mobile only.
 */
(function () {
  'use strict';

  var VARIANTS = [
    {
      key: 'popupLastSeen_mobile',
      url: 'assets/images/popup/popup-banner-mobile.webp',
      test: function () { return window.innerWidth <= 768; }
    },
    {
      key: 'popupLastSeen_desktop',
      url: 'assets/images/popup/popup-banner.webp',
      test: function () { return window.innerWidth > 768; }
    }
  ];

  /* ── Inline styles, injected once into <head> ── */
  function injectStyles() {
    if (document.getElementById('popupStyles')) return;
    var style = document.createElement('style');
    style.id = 'popupStyles';
    style.textContent =
      '#popupOverlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.65);' +
      'display:flex;align-items:center;justify-content:center;opacity:0;' +
      'transition:opacity 0.3s ease;}' +
      '#popupOverlay img{display:block;max-width:90vw;max-height:80vh;width:auto;' +
      'height:auto;object-fit:contain;border-radius:12px;}' +
      '#popupOverlay .popup-close{position:absolute;top:10px;right:10px;' +
      'font-size:28px;line-height:1;color:#fff;cursor:pointer;background:none;' +
      'border:none;padding:6px;z-index:1;text-shadow:0 0 8px rgba(0,0,0,0.6);' +
      '-webkit-tap-highlight-color:transparent;}';
    (document.head || document.documentElement).appendChild(style);
  }

  /* ── HEAD request to read Last-Modified ── */
  function getLastModified(url, cb) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('HEAD', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          cb(xhr.getResponseHeader('Last-Modified'));
        } else {
          cb(null);
        }
      };
      xhr.onerror = function () { cb(null); };
      xhr.send();
    } catch (e) {
      cb(null);
    }
  }

  function getStored(key) {
    try { return localStorage.getItem(key) || null; }
    catch (e) { return null; }
  }

  function store(key, value) {
    try { localStorage.setItem(key, value); }
    catch (e) { /* ignore storage errors */ }
  }

  /* ── Fade out, then remove from the DOM ── */
  function closePopup(overlay) {
    if (!overlay) return;
    overlay.style.transition = 'opacity 0.3s ease';
    overlay.style.opacity = '0';
    window.setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
  }

  function openPopup(url) {
    injectStyles();

    var overlay = document.createElement('div');
    overlay.id = 'popupOverlay';

    var container = document.createElement('div');
    container.className = 'popup-container';

    var img = document.createElement('img');
    img.src = url;
    img.alt = 'Popup banner';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'popup-close';
    close.setAttribute('aria-label', 'Close popup');
    close.textContent = '\u00D7'; /* × */

    function dismiss() { closePopup(overlay); }

    close.addEventListener('click', function (e) {
      e.stopPropagation();
      dismiss();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) dismiss();
    });

    container.appendChild(img);
    container.appendChild(close);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    /* Fade in on the next frame */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.style.opacity = '1';
      });
    });
  }

  function init() {
    var index = 0;
    while (index < VARIANTS.length && !VARIANTS[index].test()) index++;
    if (index >= VARIANTS.length) return;

    var variant = VARIANTS[index];

    getLastModified(variant.url, function (lastModified) {
      if (!lastModified) return;                      /* HEAD failed — skip silently */
      if (getStored(variant.key) === lastModified) return; /* already seen this version */
      openPopup(variant.url);
      store(variant.key, lastModified);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();