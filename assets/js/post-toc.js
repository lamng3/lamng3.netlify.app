// Builds a right-side table of contents for blog posts from the h2/h3 headings
// in .post-content, with scroll-spy highlighting. No-ops unless #post-toc exists.
document.addEventListener("DOMContentLoaded", function () {
  const toc = document.getElementById("post-toc");
  const content = document.querySelector(".post-content");
  if (!toc || !content) return;

  const headings = Array.from(content.querySelectorAll("h2, h3"));
  if (headings.length === 0) {
    toc.remove();
    return;
  }

  const slugify = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  const list = document.createElement("ul");
  const links = [];

  headings.forEach((heading) => {
    if (!heading.id) {
      let base = slugify(heading.textContent) || "section";
      let id = base;
      let i = 2;
      while (document.getElementById(id)) id = base + "-" + i++;
      heading.id = id;
    }

    const li = document.createElement("li");
    li.className = "toc-" + heading.tagName.toLowerCase();
    const a = document.createElement("a");
    a.href = "#" + heading.id;
    a.textContent = heading.textContent;
    li.appendChild(a);
    list.appendChild(li);
    links.push({ a, heading });
  });

  toc.appendChild(list);

  // Scroll-spy: highlight the link for the section nearest the top of the viewport.
  const setActive = () => {
    let current = links[0];
    for (const link of links) {
      if (link.heading.getBoundingClientRect().top <= 120) {
        current = link;
      } else {
        break;
      }
    }
    links.forEach((l) => l.a.classList.toggle("active", l === current));
  };

  setActive();
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        setActive();
        ticking = false;
      });
      ticking = true;
    }
  });
});
