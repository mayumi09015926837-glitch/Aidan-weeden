/* Reads window.KYOSHITSU_CONFIG and fills the page. No need to edit. */
(function () {
  var cfg = window.KYOSHITSU_CONFIG || {};
  var images = cfg.images || {};

  function filled(v) {
    return typeof v === "string" && v.trim() !== "";
  }

  // Text values: <span data-cfg="phone" class="ph">【電話番号】</span>
  document.querySelectorAll("[data-cfg]").forEach(function (el) {
    var v = cfg[el.getAttribute("data-cfg")];
    if (filled(v)) {
      el.textContent = v.trim();
      el.classList.remove("ph");
    }
  });

  // Phone links: <a data-tel href="#contact">
  if (filled(cfg.phone)) {
    var digits = cfg.phone.replace(/[^\d+]/g, "");
    document.querySelectorAll("[data-tel]").forEach(function (a) {
      a.setAttribute("href", "tel:" + digits);
    });
  }

  // Image slots: <figure data-img="hero"> with an SVG fallback inside.
  // The photo is shown only once it has actually loaded.
  document.querySelectorAll("[data-img]").forEach(function (slot) {
    var src = images[slot.getAttribute("data-img")];
    if (!filled(src)) return;
    var img = new Image();
    img.alt = slot.getAttribute("data-alt") || "";
    img.decoding = "async";
    img.onload = function () {
      slot.appendChild(img);
      slot.classList.add("has-img");
    };
    img.src = src;
  });
})();
