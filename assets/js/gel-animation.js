(function () {
  function isWhitespaceOnly(text) {
    return text.trim() === '';
  }

  function wrapLetters(el) {
    if (!el.dataset.originalHTML) {
      el.dataset.originalHTML = el.innerHTML;
    } else {
      el.innerHTML = el.dataset.originalHTML;
    }

    let delayIndex = 0;

    function wrapTextNode(node) {
      const frag = document.createDocumentFragment();
      [...node.nodeValue].forEach(function (char) {
        const span = document.createElement('span');
        span.className = char === ' ' ? 'gel-letter space' : 'gel-letter';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.animationDelay = (delayIndex * 0.045) + 's';
        delayIndex++;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    }

    function walk(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (!isWhitespaceOnly(child.nodeValue)) {
            wrapTextNode(child);
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    }

    walk(el);

    /* Transfer gradient-clipped backgrounds onto the letter spans so
       gradient headings (on the heading itself or a nested element such
       as a span) stay visible when letter-wrapped. */
    var gradientBearing = [];

    function collectGradientElements(node) {
      var style = getComputedStyle(node);
      if (style.backgroundClip === 'text' || style.webkitBackgroundClip === 'text') {
        gradientBearing.push(node);
        return;
      }
      Array.prototype.slice.call(node.children).forEach(function (child) {
        collectGradientElements(child);
      });
    }

    collectGradientElements(el);

    gradientBearing.forEach(function (g) {
      var bgImage = getComputedStyle(g).backgroundImage;
      if (!bgImage || bgImage === 'none') return;
      g.querySelectorAll('.gel-letter').forEach(function (span) {
        span.style.backgroundImage = bgImage;
        span.style.backgroundClip = 'text';
        span.style.webkitBackgroundClip = 'text';
        span.style.webkitTextFillColor = 'transparent';
      });
    });

    el.style.setProperty('opacity', '1', 'important');
  }

  function resetHeading(el) {
    if (el.dataset.originalHTML) {
      el.innerHTML = el.dataset.originalHTML;
    }
    el.style.setProperty('opacity', '0', 'important');
  }

  function isInTriggerZone(el) {
    const rect = el.getBoundingClientRect();
    const triggerPoint = window.innerHeight * 0.8;
    return rect.top <= triggerPoint && rect.bottom >= 0;
  }

  function hasGradientText(el) {
    var kids = el.querySelectorAll('*');
    for (var i = 0; i < kids.length; i++) {
      var cs = getComputedStyle(kids[i]);
      if (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') return true;
    }
    return false;
  }

  const candidates = document.querySelectorAll('h2:not(.no-gel), h3:not(.no-gel), h4.app-intro-subheading:not(.no-gel)');
  const headings = [];

  candidates.forEach(el => {
    // Gradient-clipped text inside a nested element is kept plain unless the
    // heading opts in via data-gel-nested (the generic wrap below transfers
    // the gradient onto the letter spans so it stays visible).
    if (hasGradientText(el) && !el.hasAttribute('data-gel-nested')) return;
    // Skip elements with reveal class — they are animated by the reveal system
    if (el.classList.contains('reveal')) return;

    el.classList.add('gel-animated');
    el.dataset.animated = 'false';
    headings.push(el);
  });

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', function () {
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY;

    headings.forEach(el => {
      const inZone = isInTriggerZone(el);

      if (scrollingDown && inZone && el.dataset.animated === 'false') {
        el.dataset.animated = 'true';
        wrapLetters(el);
      } else if (!scrollingDown && el.dataset.animated === 'true') {
        const rect = el.getBoundingClientRect();
        if (rect.top > window.innerHeight) {
          el.dataset.animated = 'false';
          resetHeading(el);
        }
      }
    });

    lastScrollY = currentScrollY;
  }, { passive: true });

  headings.forEach(el => {
    if (isInTriggerZone(el)) {
      el.dataset.animated = 'true';
      wrapLetters(el);
    }
  });
})();