/* assets/js/popup.js
 * One-time popup banners shown on page load, with separate desktop/mobile
 * variants tracked independently.
 *
 * Desktop shows every banner that has not been seen yet as one carousel
 * (popup-banner0.webp … popup-banner9.webp): the left/right arrows slide
 * between them. Mobile uses the same carousel with its own indexed set
 * (popup-banner-mobile0.webp … popup-banner-mobile9.webp).
 *
 * Rules:
 *  - Pick the set by viewport width: <= 768 → mobile, else desktop.
 *  - HEAD request every image on load and read its Last-Modified.
 *  - localStorage (per image): if the stored value is missing or differs
 *    from the header, that image joins the carousel and the value is saved.
 *    If it matches, it is left out.
 *  - Images keep their index order, so on later visits only the banners
 *    that actually changed are shown.
 *  - Closing (× button or click outside) dismisses the whole carousel.
 *  - If a request fails (missing file, offline, etc.) it is silently skipped.
 *
 * Replacing only one popup-bannerN.webp replays just that one banner on
 * desktop; replacing only popup-banner-mobileN.webp replays on mobile.
 */
(function () {
  'use strict';

  var BANNER_COUNT = 10;
  var MOBILE_KEY = 'popupLastSeen_mobile_';
  var FADE_MS = 300;

  /* ── Image list for the current viewport ── */
  function getQueue() {
    var mobile = window.innerWidth <= 768;
    var prefix = mobile
      ? 'assets/images/popup/popup-banner-mobile'
      : 'assets/images/popup/popup-banner';
    var keyPrefix = mobile ? MOBILE_KEY : 'popupLastSeen_desktop_';

    var queue = [];
    for (var i = 0; i < BANNER_COUNT; i++) {
      queue.push({
        key: keyPrefix + i,
        url: prefix + i + '.webp'
      });
    }
    return queue;
  }

  /* ── Inline styles, injected once into <head> ── */
  function injectStyles() {
    if (document.getElementById('popupStyles')) return;
    var style = document.createElement('style');
    style.id = 'popupStyles';
    style.textContent =
      '#popupOverlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.65);' +
      'display:flex;align-items:center;justify-content:center;opacity:0;' +
      'transition:opacity 0.3s ease;}' +
      '#popupOverlay .popup-stage{position:relative;line-height:0;max-width:90vw;max-height:80vh;}' +
      '#popupOverlay img{display:block;max-width:90vw;max-height:80vh;width:auto;' +
      'height:auto;object-fit:contain;border-radius:12px;}' +
      '#popupOverlay .popup-close{position:absolute;top:10px;right:10px;' +
      'font-size:28px;line-height:1;color:#fff;cursor:pointer;background:none;' +
      'border:none;padding:6px;z-index:3;text-shadow:0 0 8px rgba(0,0,0,0.6);' +
      '-webkit-tap-highlight-color:transparent;}' +
      '#popupOverlay .popup-nav{position:absolute;width:42px;height:42px;' +
      'border-radius:50%;display:flex;align-items:center;' +
      'justify-content:center;color:#fff;font-size:22px;line-height:1;cursor:pointer;' +
      'background:rgba(0,0,0,0.45);border:none;z-index:2;padding:0;' +
      '-webkit-tap-highlight-color:transparent;}' +
      '#popupOverlay .popup-nav:hover{background:rgba(0,0,0,0.7);}' +
      '@media (min-width:769px){#popupOverlay .popup-nav{width:64px;height:64px;font-size:44px;}}' +
      '#popupOverlay .popup-count{position:absolute;color:#fff;font-size:14px;line-height:1;' +
      'z-index:2;transform:translateX(-50%);text-shadow:0 0 6px rgba(0,0,0,0.8);' +
      'pointer-events:none;}';
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
    overlay.style.transition = 'opacity ' + (FADE_MS / 1000) + 's ease';
    overlay.style.opacity = '0';
    window.setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, FADE_MS);
  }

  /* ── Warm neighbours so sliding is instant ── */
  function preload(url) {
    if (!url) return;
    try { var p = new Image(); p.src = url; }
    catch (e) { /* ignore */ }
  }

  /* ── One overlay holding every unseen banner ── */
  function openPopup(items) {
    injectStyles();

    var overlay = document.createElement('div');
    overlay.id = 'popupOverlay';

    var stage = document.createElement('div');
    stage.className = 'popup-stage';

    var img = document.createElement('img');
    img.alt = 'Popup banner';

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'popup-nav popup-prev';
    prev.setAttribute('aria-label', 'Previous banner');
    prev.textContent = '\u2039'; /* ‹ */

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'popup-nav popup-next';
    next.setAttribute('aria-label', 'Next banner');
    next.textContent = '\u203A'; /* › */

    var count = document.createElement('div');
    count.className = 'popup-count';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'popup-close';
    close.setAttribute('aria-label', 'Close popup');
    close.textContent = '\u00D7'; /* × */

    var multiple = items.length > 1;
    var index = 0;
    var dismissed = false;

    /* Arrows sit outside the banner: pinned just left/right of the image
       box, falling back to the viewport edges on narrow screens. */
    function layoutNav() {
      if (!multiple) return;
      var box = stage.getBoundingClientRect();
      var size = prev.offsetWidth || 42;
      var gap = 8;
      var top = box.top + (box.height / 2) - (size / 2);

      var left = box.left - size - gap;
      if (left < gap) left = gap;
      var right = box.right + gap;
      if (right + size > window.innerWidth - gap) right = window.innerWidth - gap - size;

      prev.style.top = top + 'px';
      next.style.top = top + 'px';
      prev.style.left = left + 'px';
      next.style.left = right + 'px';

      /* Counter sits under the banner, or above it when space is tight */
      var height = count.offsetHeight || 14;
      var below = box.bottom + gap;
      var countTop = (below + height <= window.innerHeight - gap)
        ? below
        : Math.max(gap, box.top - height - gap);
      count.style.top = countTop + 'px';
      count.style.left = (box.left + (box.width / 2)) + 'px';
    }

    function show(nextIndex) {
      index = (nextIndex + items.length) % items.length;
      img.src = items[index].src;
      count.textContent = (index + 1) + ' \u2022 ' + items.length;
      preload(items[(index + 1) % items.length].src);
      if (multiple) preload(items[(index - 1 + items.length) % items.length].src);
      layoutNav();
    }

    function step(delta) {
      if (dismissed || !multiple) return;
      show(index + delta);
    }

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', layoutNav);
      closePopup(overlay);
    }

    function onKey(e) {
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Escape') dismiss();
    }

    prev.addEventListener('click', function (e) {
      e.stopPropagation();
      step(-1);
    });
    next.addEventListener('click', function (e) {
      e.stopPropagation();
      step(1);
    });
    close.addEventListener('click', function (e) {
      e.stopPropagation();
      dismiss();
    });
    /* Clicking anywhere outside the banner closes the whole popup */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === stage) dismiss();
    });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', layoutNav);
    /* Re-place the arrows once the real image size is known */
    img.addEventListener('load', layoutNav);

    stage.appendChild(img);
    if (multiple) {
      overlay.appendChild(prev);
      overlay.appendChild(next);
      overlay.appendChild(count);
    }
    overlay.appendChild(stage);
    overlay.appendChild(close);
    document.body.appendChild(overlay);

    /* The popup is shown, so every banner it holds has now been seen */
    items.forEach(function (item) { store(item.key, item.lastModified); });

    show(0);

    /* Fade in on the next frame */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.style.opacity = '1';
      });
    });
  }

  /* ── Keep items in index order, drop the ones already seen ── */
  function collectPending(queue) {
    var pending = [];
    var remaining = queue.length;

    if (!remaining) return;

    queue.forEach(function (item) {
      getLastModified(item.url, function (lastModified) {
        if (lastModified && getStored(item.key) !== lastModified) {
          item.lastModified = lastModified;
          /* Bust the cache so a replaced file is not served from the
             service worker cache under its old URL. */
          item.src = item.url + '?v=' + encodeURIComponent(lastModified);
          pending.push(item);
        }
        remaining--;
        if (remaining === 0) play();
      });
    });

    /* Only start once every HEAD request has reported back, so the banners
       always keep their natural order. */
    function play() {
      if (!pending.length) return;   /* nothing new — stay silent */
      pending.sort(function (a, b) { return a.order - b.order; });
      openPopup(pending);
    }
  }

  function init() {
    var queue = getQueue();
    queue.forEach(function (item, i) { item.order = i; });
    collectPending(queue);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();