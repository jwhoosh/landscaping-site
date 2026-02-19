/* =========================================================
   UrbanLeaf Landscaping - main.js
   - Loads homepage content from /data/homepage.json
   - Loads services from /data/services/index.json
   - Loads about content from /data/about.json (optional)
   ========================================================= */

function $(sel, root = document) {
  return root.querySelector(sel);
}
function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function isPath(pathname, target) {
  // supports /services and /services/ etc.
  const p = pathname.replace(/\/+$/, "");
  const t = target.replace(/\/+$/, "");
  return p === t;
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return res.json();
}

/* ---------------------------
   Homepage loader
----------------------------*/
async function loadHomepage() {
  // Only run if the page actually has hero elements
  const heroTitle = $("#heroTitle");
  const heroSub = $("#heroSub");
  const ctaBtn = $("#ctaBtn");

  if (!heroTitle && !heroSub && !ctaBtn) return;

  try {
    const data = await fetchJSON("/data/homepage.json");

    if (heroTitle && typeof data.hero_title === "string") {
      heroTitle.textContent = data.hero_title;
    }
    if (heroSub && typeof data.hero_sub === "string") {
      heroSub.textContent = data.hero_sub;
    }
    if (ctaBtn && typeof data.cta_text === "string") {
      ctaBtn.textContent = data.cta_text;
    }
  } catch (e) {
    console.error("Homepage load error:", e);
  }
}

/* ---------------------------
   Services index loader
   Required file: /data/services/index.json

   Expected shape:
   {
     "services": [
       { "slug": "hedge-trimming", "title": "Hedge trimming" },
       ...
     ]
   }
----------------------------*/
async function loadServicesIndex() {
  const data = await fetchJSON("/data/services/index.json");
  const items = Array.isArray(data.services) ? data.services : [];
  // normalize
  return items
    .map((s) => ({
      slug: String(s.slug || "").trim(),
      title: String(s.title || "").trim(),
    }))
    .filter((s) => s.slug && s.title);
}

/* ---------------------------
   Populate dropdown on Home form
   Needs <select id="serviceSelect"> in your HTML
----------------------------*/
async function populateServiceDropdown() {
  const sel = $("#serviceSelect");
  if (!sel) return;

  try {
    const services = await loadServicesIndex();

    sel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Select a service";
    sel.appendChild(opt0);

    for (const s of services) {
      const opt = document.createElement("option");
      opt.value = s.slug;
      opt.textContent = s.title;
      sel.appendChild(opt);
    }
  } catch (e) {
    console.error("Dropdown load error:", e);
    // Keep a safe fallback option
    sel.innerHTML = `<option value="">Select a service</option>`;
  }
}

/* ---------------------------
   Render Services page list
   Needs <div id="servicesList"></div> in services page HTML
----------------------------*/
async function renderServicesPage() {
  const container = $("#servicesList");
  if (!container) return;

  try {
    const services = await loadServicesIndex();

    if (services.length === 0) {
      container.innerHTML = `<p class="muted">No services found yet.</p>`;
      return;
    }

    // Simple card grid (works with your existing CSS classes)
    container.innerHTML = `
      <div class="grid3">
        ${services
          .map(
            (s) => `
            <article class="card serviceCard">
              <div class="serviceCard__body">
                <h3>${escapeHTML(s.title)}</h3>
                <p class="muted">Tap to view details</p>
                <a class="link" href="/services.html#${encodeURIComponent(
                  s.slug
                )}">View</a>
              </div>
            </article>
          `
          )
          .join("")}
      </div>
    `;
  } catch (e) {
    console.error("Services page render error:", e);
    container.innerHTML = `<p class="muted">Could not load services.</p>`;
  }
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------------------
   Nav active state
----------------------------*/
function setActiveNav() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  $all(".nav__link").forEach((a) => a.classList.remove("is-active"));

  // match by href
  const candidates = $all(".nav__link");
  const hit =
    candidates.find((a) => isPath(path, (a.getAttribute("href") || "").trim())) ||
    candidates.find((a) => a.getAttribute("href") === "/" && path === "/");

  if (hit) hit.classList.add("is-active");
}

/* ---------------------------
   Boot
----------------------------*/
document.addEventListener("DOMContentLoaded", async () => {
  setActiveNav();

  // Always attempt homepage content if elements exist
  await loadHomepage();

  // Populate dropdown if it exists (Home page)
  await populateServiceDropdown();

  // Render services list if container exists (Services page)
  await renderServicesPage();
});
