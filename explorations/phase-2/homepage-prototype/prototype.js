// DESIGN PROTOTYPE SCRIPT. Disposable. Not production and not GSAP.
// 1. Switches the representative Greek copy on and off.
// 2. On desktop, when motion is allowed, reveals the hero's supporting statement once the page starts to scroll. Scrolling stays native.
(function () {
  "use strict";
  var root = document.documentElement;

  var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-el]"));
  nodes.forEach(function (n) { n.setAttribute("data-en", n.innerHTML); });
  var btn = document.getElementById("lang");
  function set(lang) {
    var el = lang === "el";
    nodes.forEach(function (n) {
      n.innerHTML = el ? n.getAttribute("data-el") : n.getAttribute("data-en");
      if (el) n.setAttribute("lang", "el"); else n.removeAttribute("lang");
    });
    btn.querySelectorAll("[data-l]").forEach(function (s) { s.setAttribute("aria-current", String(s.getAttribute("data-l") === lang)); });
    btn.setAttribute("data-lang", lang);
  }
  btn.addEventListener("click", function () { set(btn.getAttribute("data-lang") === "el" ? "en" : "el"); });
  set(/[?&]lang=el(&|$)/.test(location.search) ? "el" : "en");

  var hero = document.querySelector(".hero");
  var mq = window.matchMedia("(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)");
  function onScroll() {
    var span = hero.offsetHeight - window.innerHeight;
    root.classList.toggle("s2", span > 0 && window.scrollY / span > 0.22);
    root.classList.toggle("past", window.scrollY >= span);
    root.style.setProperty("--hero-span", span + "px");
  }
  function mode() {
    root.classList.toggle("pin", mq.matches);
    if (mq.matches) onScroll(); else root.classList.remove("s2", "past");
  }
  window.addEventListener("scroll", function () { if (mq.matches) onScroll(); }, { passive: true });
  if (mq.addEventListener) mq.addEventListener("change", mode);
  mode();
})();
