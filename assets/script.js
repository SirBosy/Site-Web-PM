/* Script minimal pour gestion du formulaire (Formspree) et petites interactions */
(function () {
  const YEAR_SPAN_ID = "year";
  const FORM_ID = "quote-form";
  const MESSAGE_ID = "form-message";

  const FORM_ENDPOINT = "https://formspree.io/f/xjkdyyzk";

  function setCurrentYear() {
    const el = document.getElementById(YEAR_SPAN_ID);
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function setMessage(message, type) {
    const msg = document.getElementById(MESSAGE_ID);
    if (!msg) return;
    msg.className = `form-message ${type || ""}`.trim();
    msg.textContent = message;
  }

  async function submitForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const action = form.getAttribute("action") || FORM_ENDPOINT;
    const formData = new FormData(form);

    setMessage("Envoi en cours…", "");

    try {
      const response = await fetch(action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        setMessage("Merci! Votre demande a été envoyée.", "success");
        form.reset();
        return;
      }

      let details = "";
      try {
        const data = await response.json();
        if (data?.errors?.length) {
          details = data.errors.map((e) => e.message || "").join(" ");
        }
      } catch (_) {
        // ignore parse errors
      }
      setMessage(
        details || "Une erreur est survenue. Veuillez réessayer.",
        "error"
      );
    } catch (err) {
      setMessage("Impossible de soumettre pour le moment.", "error");
    }
  }

  function revokePreview(wrapper) {
    const url = wrapper.dataset.previewUrl;
    if (url) {
      URL.revokeObjectURL(url);
      delete wrapper.dataset.previewUrl;
    }
  }

  async function fileToPreviewURL(file) {
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (isHeic && typeof window.heic2any === "function") {
      try {
        const converted = await window.heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });
        const blob = converted instanceof Blob ? converted : converted[0];
        return URL.createObjectURL(blob);
      } catch (e) {
        // fallback to default preview
      }
    }

    return URL.createObjectURL(file);
  }

  async function setPhotoPreview(input) {
    const wrapper = input.closest(".photo-placeholder");
    if (!wrapper) return;

    const existing = wrapper.querySelector(".photo-preview");
    if (!input.files || input.files.length === 0) {
      if (existing) existing.remove();
      revokePreview(wrapper);
      wrapper.classList.remove("has-preview");
      return;
    }

    const file = input.files[0];
    revokePreview(wrapper);
    const url = await fileToPreviewURL(file);

    const img = existing || document.createElement("img");
    img.className = "photo-preview";
    img.onload = () => URL.revokeObjectURL(url);
    img.src = url;

    if (!existing) wrapper.appendChild(img);
    wrapper.dataset.previewUrl = url;
    wrapper.classList.add("has-preview");
  }

  function clearPhoto(wrapper) {
    const input = wrapper.querySelector("input[type='file']");
    const preview = wrapper.querySelector(".photo-preview");
    if (preview) preview.remove();
    revokePreview(wrapper);
    if (input) input.value = "";
    wrapper.classList.remove("has-preview");
  }

  function initPhotoPreviews() {
    const inputs = document.querySelectorAll(
      ".photo-placeholder input[type='file']"
    );
    inputs.forEach((input) => {
      input.addEventListener("change", () => setPhotoPreview(input));
    });

    const removeButtons = document.querySelectorAll(".photo-remove");
    removeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = btn.closest(".photo-placeholder");
        if (wrapper) clearPhoto(wrapper);
      });
    });
  }

  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        const targetId = href.replace("#", "").trim();
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();

        const prefersReduced =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const behavior = prefersReduced ? "auto" : "smooth";
        target.scrollIntoView({ behavior, block: "start" });

        try {
          const baseUrl = `${window.location.pathname}${window.location.search}`;
          window.history.replaceState(null, "", baseUrl);
        } catch (_) {
          // ignore history errors
        }
      });
    });
  }

  function initForm() {
    const form = document.getElementById(FORM_ID);
    if (!form) return;
    form.addEventListener("submit", submitForm);
  }

  /* --- Améliorations visuelles (décoratives : une erreur ici n'affecte jamais le formulaire) --- */

  function prefersReducedMotion() {
    return (
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  // Légendes numérotées des réalisations, tirées du texte alt existant
  function initWorkCaptions() {
    const figures = document.querySelectorAll(
      ".works-grid .work-item:not(.work-item-wide)"
    );
    figures.forEach((fig, index) => {
      if (fig.querySelector(".work-caption")) return;
      const img = fig.querySelector("img");
      const text = img ? (img.getAttribute("alt") || "").trim() : "";
      if (!text) return;

      const caption = document.createElement("span");
      caption.className = "work-caption";
      caption.setAttribute("aria-hidden", "true"); // le alt est déjà annoncé
      const num = document.createElement("span");
      num.className = "work-num";
      num.textContent = String(index + 1).padStart(2, "0");
      const label = document.createElement("span");
      label.className = "work-label";
      label.textContent = text;
      caption.append(num, label);
      fig.appendChild(caption);
    });
  }

  // Curseur avant/après construit sur l'image composite (moitié gauche = avant)
  function initCompare() {
    // Sans aspect-ratio, la scène s'effondrerait : on garde l'image composite
    if (!(window.CSS && CSS.supports && CSS.supports("aspect-ratio", "1 / 1"))) return;
    const fig = document.querySelector(".works-grid .work-item-wide");
    if (!fig || fig.classList.contains("is-compare")) return;
    const img = fig.querySelector("img");
    if (!img) return;

    const stage = document.createElement("div");
    stage.className = "ba-stage";

    const beforeWrap = document.createElement("div");
    beforeWrap.className = "ba-before";
    beforeWrap.setAttribute("aria-hidden", "true");
    // Même URL : un seul téléchargement. loading doit précéder src, sinon le clone se charge tout de suite
    const beforeImg = document.createElement("img");
    beforeImg.alt = "";
    beforeImg.loading = "lazy";
    beforeImg.decoding = "async";
    beforeImg.src = img.getAttribute("src");
    beforeWrap.appendChild(beforeImg);

    const range = document.createElement("input");
    range.type = "range";
    range.className = "ba-range";
    range.min = "0";
    range.max = "100";
    range.step = "1";
    range.value = "50";
    range.setAttribute(
      "aria-label",
      "Comparer l’avant et l’après du rembourrage"
    );

    const handle = document.createElement("div");
    handle.className = "ba-handle";
    handle.setAttribute("aria-hidden", "true");
    const knob = document.createElement("span");
    knob.className = "ba-knob";
    handle.appendChild(knob);

    function word(modifier, text) {
      const span = document.createElement("span");
      span.className = `ba-word ${modifier}`;
      span.setAttribute("aria-hidden", "true");
      span.textContent = text;
      return span;
    }

    stage.append(img, beforeWrap, range, handle); // l'image d'origine garde son alt
    fig.append(
      word("ba-word--avant", "Avant"),
      stage,
      word("ba-word--apres", "Après")
    );

    let touched = false;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let pointerType = "";

    function setPosition(value, animate) {
      const pos = Math.max(0, Math.min(100, Math.round(value * 10) / 10));
      fig.classList.toggle("is-tweening", !!animate);
      fig.style.setProperty("--pos", String(pos));
      const rounded = Math.round(pos);
      range.value = String(rounded);
      range.setAttribute(
        "aria-valuetext",
        `Avant ${rounded} %, après ${100 - rounded} %`
      );
    }

    // Interrompre l'invitation fige la couture là où elle est (pas de saut vers 50)
    function stopHint() {
      touched = true;
      if (!fig.classList.contains("ba-hint")) return;
      const live = parseFloat(getComputedStyle(fig).getPropertyValue("--pos"));
      fig.classList.remove("ba-hint");
      if (!Number.isNaN(live)) {
        setPosition(live, false);
        void fig.offsetWidth; // valide la position avant une éventuelle transition
      }
    }

    function pointerPercent(e) {
      const box = stage.getBoundingClientRect();
      return ((e.clientX - box.left) / box.width) * 100;
    }

    stage.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      stopHint();
      dragging = true;
      moved = false;
      startX = e.clientX;
      pointerType = e.pointerType;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch (_) {
        // ignore capture errors
      }
      // Au toucher, on attend un geste horizontal (un geste vertical fait défiler la page)
      if (pointerType !== "touch") setPosition(pointerPercent(e), true);
    });

    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      if (!moved && Math.abs(e.clientX - startX) < 4) return;
      moved = true;
      fig.classList.add("is-dragging");
      setPosition(pointerPercent(e), false);
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      fig.classList.remove("is-dragging");
      if (e.type === "pointerup" && pointerType === "touch" && !moved) {
        setPosition(pointerPercent(e), true); // un simple toucher déplace la couture
      }
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    range.addEventListener("input", () => {
      stopHint();
      setPosition(Number(range.value), true);
    });
    range.addEventListener("focus", stopHint);

    setPosition(50, false);
    fig.classList.add("is-compare");

    // Petit mouvement d'invitation, une seule fois, si personne n'y a touché
    if (
      !prefersReducedMotion() &&
      window.CSS &&
      typeof CSS.registerProperty === "function" &&
      "IntersectionObserver" in window
    ) {
      fig.addEventListener("animationend", (e) => {
        if (e.animationName === "ba-hint") fig.classList.remove("ba-hint");
      });
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            if (!touched) fig.classList.add("ba-hint");
          });
        },
        { threshold: 0.5 }
      );
      observer.observe(stage);
    }
  }

  // Apparitions au défilement : rien n'est caché sans JS ni avec mouvement réduit
  function initRevealSystem() {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;

    const groups = [
      [".section-title", "reveal-title", null],
      [".services-grid .service-card", "reveal-card", "index"],
      [".works-grid .work-item:not(.work-item-wide)", "reveal-plate", "pair"],
      [".works-grid .work-item-wide", "reveal", null],
      [".about-media", "reveal-restore", null],
      [".about-content p", "reveal", null],
      [".quote-form", "reveal-nudge", null],
      [".site-footer", "reveal-trim", null],
    ];

    const targets = [];
    groups.forEach(([selector, className, stagger]) => {
      document.querySelectorAll(selector).forEach((el, i) => {
        el.classList.add(className);
        if (stagger === "index") el.style.setProperty("--i", String(Math.min(i, 5)));
        if (stagger === "pair") el.style.setProperty("--i", String(i % 2));
        targets.push(el);
      });
    });

    const footer = document.querySelector(".site-footer");
    if (footer) {
      // Un clou (18 px) posé à chaque pas de l'animation
      const steps = Math.max(12, Math.round(footer.clientWidth / 18));
      footer.style.setProperty("--nail-steps", String(steps));
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0 }
    );

    // Ce qui est déjà visible (ou au-dessus) ne disparaît jamais
    const limit = window.innerHeight * 0.9;
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < limit) el.classList.add("is-in");
      else observer.observe(el);
    });

    // Safari restaure le défilement après DOMContentLoaded : ce qui est au-dessus s'affiche d'office
    let ticking = false;
    function sweepAbove() {
      ticking = false;
      let pending = 0;
      targets.forEach((el) => {
        if (el.classList.contains("is-in")) return;
        if (el.getBoundingClientRect().bottom <= 0) {
          el.classList.add("is-in");
          observer.unobserve(el);
        } else pending++;
      });
      if (!pending) window.removeEventListener("scroll", onScroll);
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(sweepAbove);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    document.documentElement.classList.add("reveal-ready");
  }

  document.addEventListener("DOMContentLoaded", function () {
    setCurrentYear();
    initForm();
    initPhotoPreviews();
    initSmoothScroll();
    // L'ordre compte : légendes et curseur doivent exister avant les apparitions
    [initWorkCaptions, initCompare, initRevealSystem].forEach((init) => {
      try {
        init();
      } catch (_) {
        // amélioration seulement
      }
    });
  });
})();
