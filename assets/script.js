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

  document.addEventListener("DOMContentLoaded", function () {
    setCurrentYear();
    initForm();
    initPhotoPreviews();
    initSmoothScroll();
  });
})();
