// ✅ PUT YOUR WORKING APPS SCRIPT WEB APP URL HERE:
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwPpHZYDCjZBQNKSisGfjNkv6u0hTU7QW5XQyPGFoZcOWyCOSx3AdfJ19-4KGXLTELO/exec";

function qs(sel) { return document.querySelector(sel); }

function setMsg(el, text, ok = true) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove("ok", "err");
  el.classList.add(ok ? "ok" : "err");
}

function initYear() {
  const y = qs("#year");
  if (y) y.textContent = new Date().getFullYear();
}

/**
 * ✅ NEW: Load CMS content from /data/homepage.json and inject into homepage.
 * This is why Decap edits will show on the public site.
 */
async function initHomepageContent() {
  const titleEl = qs("#heroTitle");
  const subEl = qs("#heroSub");
  const ctaEl = qs("#ctaBtn");

  // If these elements don't exist, you're not on the homepage (or IDs missing).
  if (!titleEl && !subEl && !ctaEl) return;

  try {
    // Cache-buster so you don't get an old JSON
    const url = `/data/homepage.json?cb=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch homepage.json (${res.status})`);

    const data = await res.json();

    if (titleEl && typeof data.hero_title === "string" && data.hero_title.trim()) {
      titleEl.textContent = data.hero_title.trim();
    }

    if (subEl && typeof data.hero_sub === "string") {
      subEl.textContent = data.hero_sub.trim();
    }

    if (ctaEl && typeof data.cta_text === "string" && data.cta_text.trim()) {
      ctaEl.textContent = data.cta_text.trim();
    }
  } catch (err) {
    // Don’t break the page if JSON is missing; just log it.
    console.warn("Homepage CMS content not loaded:", err);
  }
}

function initLeadForm() {
  const form = qs("#leadForm");
  const msg = qs("#formMsg");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // checkbox returns "on" if checked; make it explicit
    data.consent = form.querySelector('input[name="consent"]')?.checked === true;

    if (!data.consent) {
      setMsg(msg, "Please tick consent to proceed.", false);
      return;
    }

    setMsg(msg, "Sending…", true);

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Apps Script + CORS can be picky; keep payload simple
        body: JSON.stringify({
          name: data.name || "",
          phone: data.phone || "",
          location: data.location || "",
          service: data.service || "",
          notes: data.notes || ""
        })
      });

      const txt = await res.text();
      let ok = false;

      try {
        const j = JSON.parse(txt);
        ok = j && j.success === true;
      } catch (_) {
        ok = res.ok; // fallback
      }

      if (!ok) throw new Error(`Server did not confirm success: ${txt}`);

      form.reset();
      setMsg(msg, "✅ Request sent. We’ll contact you within 24 hours.", true);
    } catch (err) {
      console.error(err);
      setMsg(msg, "❌ Something went wrong. Please try again or WhatsApp us.", false);
    }
  });
}

function initReviewRotator() {
  const textEl = qs("#reviewText");
  const metaEl = qs("#reviewMeta");
  if (!textEl || !metaEl) return;

  const reviews = [
    { text: "Very punctual and clean. Hedge line looks sharp and they cleaned up everything after.", meta: "— Clementi" },
    { text: "Fast response, clear scope before starting. No surprise charges.", meta: "— Jurong West" },
    { text: "Lawn was uneven before — now it looks neat and consistent. Recommended.", meta: "— Bukit Timah" },
    { text: "They brought proper tools and finished quickly. Site was left tidy.", meta: "— Woodlands" },
    { text: "Good communication and they updated me before/after. Easy to work with.", meta: "— Tampines" }
  ];

  let i = 0;
  const render = () => {
    const r = reviews[i % reviews.length];
    textEl.textContent = `“${r.text}”`;
    metaEl.textContent = r.meta;
    i += 1;
  };

  render();
  setInterval(render, 4500);
}

document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initHomepageContent();   // ✅ IMPORTANT
  initLeadForm();
  initReviewRotator();
});
