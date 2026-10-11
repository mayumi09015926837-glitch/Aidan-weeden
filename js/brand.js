/* Scroll scenes for the brand page. No need to edit.
   Everything is driven by scroll position (no timers), so it can be scrubbed back and forth. */
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };

  /* ---------- Story: copy each step's screen into the pinned phone ---------- */
  var holder = document.getElementById("story-screens");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".story-step"));
  var dots = document.querySelectorAll(".story-dots li");
  var pinnedScreens = [];
  if (holder) {
    steps.forEach(function (step) {
      var s = step.querySelector(".screen").cloneNode(true);
      holder.appendChild(s);
      pinnedScreens.push(s);
    });
  }
  function setActive(i) {
    steps.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
    pinnedScreens.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
    Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle("is-active", k === i); });
  }
  setActive(0);

  /* ---------- Scroll-linked values ---------- */
  var heroDevice = document.querySelector(".hero-stage");
  var lines = document.querySelectorAll("#lit-lines li");
  var statement = document.getElementById("statement");
  var ticking = false;

  function frame() {
    ticking = false;
    var vh = window.innerHeight;

    // Read everything first...
    var heroTop = heroDevice ? heroDevice.getBoundingClientRect().top : 0;
    var lineTops = Array.prototype.map.call(lines, function (l) { return l.getBoundingClientRect().top; });
    var st = statement ? statement.getBoundingClientRect() : null;
    var stepMids = steps.map(function (s) { var r = s.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - vh / 2); });

    // ...then write.
    if (heroDevice) heroDevice.style.setProperty("--p", reduceMotion ? 1 : clamp((vh - heroTop) / (vh * 0.6)).toFixed(3));
    Array.prototype.forEach.call(lines, function (l, i) {
      // A line lights up as it passes 60% of the screen height
      l.style.setProperty("--lit", reduceMotion ? 1 : clamp((vh * 0.75 - lineTops[i]) / (vh * 0.2)).toFixed(3));
    });
    if (st) statement.style.setProperty("--p", reduceMotion ? 1 : clamp((vh - st.top) / (vh * 0.7)).toFixed(3));
    if (steps.length) setActive(stepMids.indexOf(Math.min.apply(null, stepMids)));
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  frame();

  /* ---------- Nav turns dark while it sits over a dark scene ---------- */
  var nav = document.querySelector(".nav");
  var darks = document.querySelectorAll(".night");
  if (nav && "IntersectionObserver" in window) {
    var over = new Set();
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) over.add(e.target); else over.delete(e.target); });
      nav.classList.toggle("is-dark", over.size > 0);
    }, { rootMargin: "0px 0px -92% 0px" }); // only the strip under the nav counts
    Array.prototype.forEach.call(darks, function (d) { navIo.observe(d); });
  }

  /* ---------- Phone-number window grows out of the button that opened it ---------- */
  var dialog = document.getElementById("tel-dialog");
  if (dialog) {
    document.querySelectorAll("[data-tel]").forEach(function (a) {
      a.addEventListener("click", function () {
        var r = a.getBoundingClientRect();
        var w = Math.min(window.innerWidth * 0.92, 540), h = 300;
        var left = (window.innerWidth - w) / 2, top = (window.innerHeight - h) / 2;
        dialog.style.setProperty("--ox", (r.left + r.width / 2 - left) + "px");
        dialog.style.setProperty("--oy", (r.top + r.height / 2 - top) + "px");
      }, true); // capture: runs before the window opens
    });
  }
})();
