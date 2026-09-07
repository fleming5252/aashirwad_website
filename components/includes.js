/*
 * components/includes.js
 * Injects the shared navbar and footer components into each page.
 *
 * Requirements:
 *   - Placeholders: <div id="site-nav"></div> and <div id="site-footer"></div>
 *   - This script must run BEFORE the other page scripts (it loads
 *     synchronously so custom.js / the template menu + scroll logic still work).
 *
 * Run via XAMPP/http server (same-origin). If the page is opened directly from
 * the filesystem, browsers may block the request and the components will not load.
 */
(function () {
  'use strict';

  var NAV_URL = 'components/navbar.html';
  var FOOTER_URL = 'components/footer.html';

  var navPlaceholder = document.getElementById('site-nav');
  var footerPlaceholder = document.getElementById('site-footer');
  var hasNav = !!navPlaceholder;
  var hasFooter = !!footerPlaceholder;

  if (!hasNav && !hasFooter) return;

  function load(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send();
      if (xhr.status >= 200 && xhr.status < 300) {
        return xhr.responseText;
      }
    } catch (e) {
      console.warn('[components] could not load ' + url, e);
    }
    return '';
  }

  function inject(placeholder, html, url) {
    if (!placeholder) return;
    if (!html) {
      console.warn('[components] empty response for ' + url);
      return;
    }
    // Replace the placeholder with the component markup itself so the navbar
    // and footer become direct page elements (e.g. <body> > <header>). This
    // keeps the template's `position: sticky` behaviour working, which the
    // old wrapper <div> would have blocked.
    placeholder.outerHTML = html;
  }

  var navHtml = hasNav ? load(NAV_URL) : '';
  var footerHtml = hasFooter ? load(FOOTER_URL) : '';

  inject(navPlaceholder, navHtml, NAV_URL);
  inject(footerPlaceholder, footerHtml, FOOTER_URL);

  /* ── Current page name ── */
  var page = (window.location.pathname.split('/').filter(Boolean).pop() || 'index.html');

  /* ── Highlight the matching nav item ── */
  var nav = navHtml ? document.querySelector('header.header-area .main-nav') : null;
  if (nav) {
    var pg = page.toLowerCase();

    if (pg === 'index.html') {
      /* Only the index page uses in-page anchor for Home */
      var home = nav.querySelector('a[data-nav-page="index"]');
      if (home) {
        home.setAttribute('href', '#top');
        home.classList.add('active');
        if (home.parentNode) home.parentNode.classList.add('scroll-to-section');
      }
    } else {
      var activeKey = null;
      if (pg === 'courses.html') activeKey = 'courses';
      else if (pg === 'app.html') activeKey = 'app';
      else if (pg === 'contact.html') activeKey = 'contact';
      else if (pg === 'about.html') activeKey = 'about';

      if (activeKey) {
        var activeLink = nav.querySelector('a[data-nav-page="' + activeKey + '"]');
        if (activeLink) activeLink.classList.add('active');
      }
    }
  }

  /* ── Footer quick links: use in-page anchors only on the index page ── */
  var footer = footerHtml ? document.querySelector('footer.footer') : null;
  if (footer && page.toLowerCase() === 'index.html') {
    var fHome = footer.querySelector('.footer-col nav a[href="index.html"]');
    if (fHome) fHome.setAttribute('href', '#top');
  }

  /* ── Footer slide-in animation: play when the footer scrolls into view ── */
  if (footer) {
    var slideItems = footer.querySelectorAll('.footer-slide-item');
    if (slideItems.length) {
      if ('IntersectionObserver' in window) {
        var footerObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            footer.classList.toggle('in-view', entry.isIntersecting);
          });
        }, { threshold: 0.15 });
        footerObserver.observe(footer);
      } else {
        footer.classList.add('in-view');
      }
    }
  }
})();