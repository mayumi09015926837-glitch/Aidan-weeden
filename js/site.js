/* Buttons, scroll animations and the hero demo. No need to edit. */
(function () {
  var cfg = window.KYOSHITSU_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isPhone = window.matchMedia("(pointer: coarse)").matches;
  var hasPhone = filled(cfg.phone);

  function filled(v) {
    return typeof v === "string" && v.trim() !== "";
  }

  /* ---------- Toast (short message at the bottom) ---------- */
  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-shown"); }, 4000);
  }

  function goToContact() {
    document.getElementById("contact").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- Phone buttons ----------
     Phones: tel: link dials directly (set by apply-config.js).
     Computers: show the number large, with a copy button. */
  var dialog = document.getElementById("tel-dialog");
  document.querySelectorAll("[data-tel]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!hasPhone) {
        e.preventDefault();
        goToContact();
        showToast("電話番号は準備中です");
        return;
      }
      if (!isPhone && dialog && dialog.showModal) {
        e.preventDefault();
        dialog.showModal();
      }
    });
  });
  if (dialog) {
    document.getElementById("close-tel").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    document.getElementById("copy-tel").addEventListener("click", function () {
      copyText(cfg.phone.trim(), "電話番号をコピーしました");
    });
  }

  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { showToast(done); }, function () { showToast(text); });
    } else {
      var t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); showToast(done); } catch (err) { showToast(text); }
      t.remove();
    }
  }

  /* ---------- LINE buttons ---------- */
  document.querySelectorAll("[data-line]").forEach(function (a) {
    if (filled(cfg.lineUrl)) {
      a.href = cfg.lineUrl.trim();
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        goToContact();
        showToast("LINEの受付は準備中です");
      });
    }
  });

  /* ---------- Map button ---------- */
  var map = document.getElementById("map-link");
  if (map) {
    var place = [cfg.venueName, cfg.venueAddress].filter(filled).join(" ");
    if (filled(cfg.mapUrl)) {
      map.href = cfg.mapUrl.trim();
    } else if (filled(cfg.venueAddress)) {
      map.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place);
    } else {
      map.removeAttribute("target");
      map.addEventListener("click", function (e) {
        e.preventDefault();
        showToast("会場は準備中です");
      });
    }
  }

  /* ---------- Share with family ---------- */
  document.querySelectorAll("[data-share]").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = location.href.split("#")[0];
      var data = { title: "はじめてのAI教室", text: "スマホから始めるAI講座。少人数・対面でゆっくり学べます。", url: url };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else {
        copyText(url, "ページのアドレスをコピーしました。LINEやメールに貼り付けて送れます");
      }
    });
  });

  /* ---------- Phone bottom bar: show after the hero ---------- */
  var bar = document.getElementById("action-bar");
  // Show the bar once the top call button has scrolled out of view
  var hero = document.querySelector(".hero-actions") || document.querySelector(".hero");
  var contact = document.getElementById("contact");
  if (bar && "IntersectionObserver" in window) {
    var heroVisible = true, contactVisible = false;
    var update = function () { bar.classList.toggle("is-shown", !heroVisible && !contactVisible); };
    new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(function (es) { contactVisible = es[0].isIntersecting; update(); }).observe(contact);
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    document.querySelectorAll(".reveal-group").forEach(function (g) {
      g.querySelectorAll(".reveal").forEach(function (el, i) { el.style.setProperty("--d", i * 90 + "ms"); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Timeline line fills as you scroll ---------- */
  var tl = document.getElementById("timeline");
  if (tl) {
    var ticking = false;
    var fill = function () {
      // Read all positions first, then write, to avoid layout thrashing
      var mid = window.innerHeight * 0.6;
      var r = tl.getBoundingClientRect();
      var items = tl.querySelectorAll("li");
      var tops = Array.prototype.map.call(items, function (li) { return li.getBoundingClientRect().top; });
      var p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      tl.style.setProperty("--progress", reduceMotion ? 1 : p.toFixed(3));
      items.forEach(function (li, i) { li.classList.toggle("is-done", reduceMotion || tops[i] + 28 < mid); });
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(fill); }
    }, { passive: true });
    window.addEventListener("resize", fill);
    fill();
  }

  /* ---------- Hero demo: plays once, replay on request ---------- */
  var demo = document.getElementById("demo");
  var replay = document.getElementById("demo-replay");
  var timers = [];
  var steps = demo ? demo.querySelectorAll(".step") : [];
  function setAt(n) {
    steps.forEach(function (st) {
      var k = Number(st.getAttribute("data-step"));
      st.classList.toggle("is-on", k <= n && !(k === 3 && n >= 4)); // typing dots give way to the reply
    });
  }
  function playDemo() {
    timers.forEach(clearTimeout);
    timers = [];
    if (reduceMotion) { setAt(5); return; }
    setAt(0);
    [500, 1600, 3200, 4500, 5300].forEach(function (t, i) {
      timers.push(setTimeout(function () { setAt(i + 1); }, t));
    });
  }
  if (demo) {
    playDemo();
    replay.addEventListener("click", playDemo);
  }
})();
