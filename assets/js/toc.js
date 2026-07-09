// Builds the sidebar table of contents (#toc-sidebar) from the post's headings
// and tracks the active section reliably under the fixed navbar. Replaces
// bootstrap-toc's scrollspy, which mis-registered the active heading.
document.addEventListener("DOMContentLoaded", function () {
  const toc = document.getElementById("toc-sidebar");
  const content = document.querySelector(".post-content");
  if (!toc || !content) return;

  const headings = Array.from(content.querySelectorAll("h2, h3"));
  if (headings.length === 0) {
    toc.remove();
    return;
  }

  // Offset (px) below the viewport top that counts as "current" — clears the navbar.
  const OFFSET = 90;

  const slugify = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  const list = document.createElement("ul");
  list.className = "toc-list";
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
    li.className = "toc-item toc-" + heading.tagName.toLowerCase();
    const a = document.createElement("a");
    a.href = "#" + heading.id;
    a.textContent = heading.textContent;
    a.addEventListener("click", function (e) {
      e.preventDefault();
      const top = heading.getBoundingClientRect().top + window.pageYOffset - OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", "#" + heading.id);
    });
    li.appendChild(a);
    list.appendChild(li);
    links.push(a);
  });

  toc.innerHTML = "";
  toc.appendChild(list);

  // Active section = the last heading whose top has scrolled above the offset line.
  const setActive = () => {
    let activeIdx = 0;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top - OFFSET <= 1) {
        activeIdx = i;
      } else {
        break;
      }
    }
    links.forEach((a, i) => a.classList.toggle("active", i === activeIdx));
  };

  setActive();
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setActive();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
});
