/* Builds a post's table of contents from its own h2/h3 headings.
   Loaded with `defer` and placed BEFORE the KaTeX bootstrap, so a heading
   containing math gets copied into the TOC as delimiters and is then
   rendered along with the rest of the page. Without JS the <nav> stays
   hidden, which is why the markup ships empty. */
(function () {
  var nav = document.querySelector('.post-toc:not(.topic-nav)');
  var article = document.querySelector('article.post');
  if (!nav || !article) return;

  var heads = Array.prototype.filter.call(article.querySelectorAll('h2, h3'), function (h) {
    return !h.closest('.post-toc');
  });
  if (heads.length < 3) return; // too short to be worth navigating

  var list = nav.querySelector('ol');
  var counts = {};
  var items = [];

  heads.forEach(function (h) {
    if (!h.id) {
      // kramdown assigns these; this is only a fallback
      var base =
        (h.textContent || '')
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-') || 'section';
      counts[base] = (counts[base] || 0) + 1;
      h.id = counts[base] > 1 ? base + '-' + counts[base] : base;
    }

    var li = document.createElement('li');
    li.className = h.tagName === 'H3' ? 'toc-sub' : 'toc-top';
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.innerHTML = h.innerHTML; // keeps <code> and math delimiters intact
    li.appendChild(a);
    list.appendChild(li);
    items.push({ head: h, link: a });
  });

  nav.hidden = false;

  // Highlight whichever section is currently in view.
  if (!('IntersectionObserver' in window)) return;
  var active = null;
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        for (var i = 0; i < items.length; i++) {
          if (items[i].head !== entry.target) continue;
          if (active === items[i].link) return;
          if (active) active.classList.remove('is-current');
          items[i].link.classList.add('is-current');
          active = items[i].link;
          return;
        }
      });
    },
    { rootMargin: '0px 0px -70% 0px' }
  );
  items.forEach(function (item) {
    observer.observe(item.head);
  });
})();
