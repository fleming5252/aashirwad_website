/* Dynamic experience years = current year − 2010.
   Fills any [data-exp-years] with the number, [data-current-year]
   with the calendar year, sets data-target on any
   [data-exp-years-target] stat counter, and rewrites "16+ years"
   style phrases inside meta descriptions at runtime. */
(function () {
  var now = new Date();
  var years = now.getFullYear() - 2010;
  var currentYear = now.getFullYear();

  window.__expYears = years;

  function apply() {
    document.querySelectorAll('[data-exp-years]').forEach(function (el) {
      el.textContent = years;
    });
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
      el.textContent = currentYear;
    });
    document.querySelectorAll('[data-exp-years-target]').forEach(function (el) {
      el.setAttribute('data-target', years);
    });

    /* Meta / OG / Twitter descriptions */
    document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach(function (m) {
      if (m.content) {
        m.content = m.content.replace(/\b\d+(\+)?\s*years\b/g, function (_, plus) {
          return years + (plus || '') + ' years';
        });
      }
    });

    /* JSON-LD: walk all string values and replace year phrases */
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
      try {
        var data = JSON.parse(s.textContent);
        (function walk(node) {
          if (typeof node === 'string') {
            return node.replace(/\b\d+(\+)?\s*years\b/g, function (_, plus) {
              return years + (plus || '') + ' years';
            });
          }
          if (node && typeof node === 'object') {
            Object.keys(node).forEach(function (k) { node[k] = walk(node[k]); });
          }
          return node;
        })(data);
        s.textContent = JSON.stringify(data);
      } catch (e) { /* leave invalid JSON alone */ }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
