// assets/main.js
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
  }

  function escapeHtml(str) {
    return (str ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // -------- Load homepage content (optional) ----------
  async function loadHomepageContent() {
    const heroTitle = $("#heroTitle");
    const heroSub = $("#heroSub");
    const ctaBtn = $("#ctaBtn");

    // If these elements don't exist on the page, skip silently
    if (!heroTitle && !heroSub && !ctaBtn) return;

    try {
      const data = await fetchJSON("/data/homepage.json");
      if (heroTitle && data.hero_title) heroTitle.textContent = data.hero_title;
      if (heroSub && data.hero_sub) heroSub.textContent = data.hero_sub;
      if (ctaBtn && data.cta_text) ctaBtn.textContent = data.cta_text;
    } catch (e) {
      console.warn("homepage.json not applied (ok if you don't use CMS yet).");
    }
  }

  // -------- Services: load from index.json ----------
  async function loadServices() {
    const data = await fetchJSON("/data/services/index.json");
    const services = Array.isArray(data.services) ? data.services : [];
    return services
      .map((s) => ({
        slug: (s.slug ?? "").toString().trim(),
        title: (s.title ?? "").toString().trim(),
        desc: (s.desc ?? "").toString().trim()
      }))
      .filter((s) => s.slug && s.title);
  }

  // -------- Dropdown on Home page ----------
  async function populateServiceDropdown(services) {
    // IMPORTANT: your homepage select must use id="serviceSelect"
    const sel = document.getElementById("serviceSelect");
    if (!sel) return;

    // reset options
    sel.innerHTML = "";

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Select a service";
    sel.appendChild(opt0);

    for (const s of services) {
      const opt = document.createElement("option");
      opt.value = s.title;          // what user sees/what gets submitted
      opt.textContent = s.title;
      sel.appendChild(opt);
    }
  }

  // -------- Services page cards ----------
  function renderServicesPage(services) {
    const list = document.getElementById("servicesList");
    if (!list) return;

    if (!services.length) {
      list.innerHTML = `<div class="card serviceCard"><div class="serviceCard__body">
        <h3>No services found</h3>
        <p class="muted">Please check <code>/data/services/index.json</code>.</p>
      </div></div>`;
      return;
    }

    list.innerHTML = services.map((s) => `
      <div class="card serviceCard" id="${escapeHtml(s.slug)}">
        <div class="serviceCard__body">
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.desc || "Tell us what you need and we’ll confirm scope.")}</p>
          <a class="link" href="/#quote">Request a quote →</a>
        </div>
      </div>
    `).join("");
  }

  // -------- Boot ----------
  async function boot() {
    await loadHomepageContent();

    let services = [];
    try {
      services = await loadServices();
    } catch (e) {
      console.error("Failed loading services index:", e);
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
