// assets/main.js  (FULL WORKING VERSION)
// - Loads services options from /data/services/index.json
// - Populates dropdown (#serviceSelect)
// - Renders Services page (#servicesList)
// - Submits quote form (#quoteForm) to Google Apps Script
// - Shows status message (#formMsg)

(() => {
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwPpHZYDCjZBQNKSisGfjNkv6u0hTU7QW5XQyPGFoZcOWyCOSx3AdfJ19-4KGXLTELO/exec";

  const $ = (sel, root = document) => root.querySelector(sel);

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
  }

  function escapeHtml(str) {
    return (str ?? "")
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setMsg(el, text, ok = true) {
    if (!el) return;
    el.textContent = text;
    el.classList.remove("ok", "err");
    el.classList.add(ok ? "ok" : "err");
  }

  // ---------------- Services ----------------
  async function loadServices() {
    const data = await fetchJSON("/data/services/index.json");
    const services = Array.isArray(data.services) ? data.services : [];
    return services
      .map((s) => ({
        slug: (s.slug ?? "").toString().trim(),
        title: (s.title ?? "").toString().trim(),
        desc: (s.desc ?? "").toString().trim(),
      }))
      .filter((s) => s.slug && s.title);
  }

  async function populateServiceDropdown(services) {
    const sel = document.getElementById("serviceSelect");
    if (!sel) return;

    sel.innerHTML = "";

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Select a service";
    sel.appendChild(opt0);

    for (const s of services) {
      const opt = document.createElement("option");
      opt.value = s.title;      // what gets submitted
      opt.textContent = s.title;
      sel.appendChild(opt);
    }
  }

  function renderServicesPage(services) {
    const list = document.getElementById("servicesList");
    if (!list) return;

    if (!services.length) {
      list.innerHTML = `
        <div class="card serviceCard">
          <div class="serviceCard__body">
            <h3>No services found</h3>
            <p class="muted">Check /data/services/index.json</p>
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = services
      .map(
        (s) => `
      <div class="card serviceCard" id="${escapeHtml(s.slug)}">
        <div class="serviceCard__body">
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(
            s.desc || "Tell us what you need and we’ll confirm scope."
          )}</p>
          <a class="link" href="/#quote">Request quote →</a>
        </div>
      </div>
    `
      )
      .join("");
  }

  // ---------------- Form submit ----------------
  function initQuoteForm() {
    const form = document.getElementById("quoteForm");
    const msg = document.getElementById("formMsg");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());

      // If you have a consent checkbox, enforce it (optional)
      const consentEl = form.querySelector('input[type="checkbox"]');
      if (consentEl && consentEl.checked !== true) {
        setMsg(msg, "Please tick consent to proceed.", false);
        return;
      }

      setMsg(msg, "Sending…", true);

      try {
        const res = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name || "",
            phone: data.phone || "",
            location: data.location || "",
            service: data.service || "",
            notes: data.notes || "",
          }),
        });

        // Apps Script sometimes returns text; try parse
        const txt = await res.text();
        let ok = false;
        try {
          const j = JSON.parse(txt);
          ok = j && j.success === true;
        } catch (_) {
          ok = res.ok; // fallback
        }

        if (!ok) throw new Error("Server did not confirm success.");

        form.reset();
        setMsg(msg, "✅ Request sent. We’ll contact you within 24 hours.", true);
      } catch (err) {
        console.error(err);
        setMsg(msg, "❌ Submission failed. Please try again.", false);
      }
    });
  }

  // ---------------- Boot ----------------
  async function boot() {
    initQuoteForm();

    let services = [];
    try {
      services = await loadServices();
    } catch (e) {
      console.error("Failed loading services:", e);
    }

    populateServiceDropdown(services);
    renderServicesPage(services);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
