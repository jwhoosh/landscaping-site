// ✅ Your Apps Script Web App URL
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwPpHZYDCjZBQNKSisGfjNkv6u0hTU7QW5XQyPGFoZcOWyCOSx3AdfJ19-4KGXLTELO/exec";

function qs(sel) { return document.querySelector(sel); }

function setMsg(el, text, ok = true) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove("ok", "err");
  el.classList.add(ok ? "ok" : "err");
}

async function loadHomepageContentFromDecap() {
  try {
    // Decap writes to this file
    const res = await fetch("/data/homepage.json", { cache: "no-store" });
    if (!res.ok) throw new Error("homepage.json not found");
    const data = await res.json();

    // Your Decap fields (from config.yml): hero_title, hero_sub, cta_text
    const heroTitle = qs("#heroTitle");
    const heroSub = qs("#heroSub");
    const ctaBtn = qs("#ctaBtn");

    if (heroTitle && data.hero_title) heroTitle.textContent = data.hero_title;
    if (heroSub && data.hero_sub) heroSub.textContent = data.hero_sub;
    if (ctaBtn && data["cta_text"]) ctaBtn.textContent = data["cta_text"];
  } catch (e) {
    // If this fails, page will fall back to the hardcoded HTML text.
    console.warn("Decap homepage content not applied:", e);
  }
}

function initYear() {
  const y = qs("#year");
  if (y) y.textContent = new Date().getFullYear();
}

function initLeadForm() {
  const form = qs("#leadForm");
  const msg = qs("#formMsg");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
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
        ok = res.ok;
      }

      if (!ok) throw new Error("Server did not confirm success.");

      form.reset();
      setMsg(msg, "✅ Request sent. We’ll contact you within 24 hours.", true);
    } catch (err) {
      console.error(err);
      setMsg(msg, "❌ Something went wrong. Please try again or WhatsApp us.", false);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initYear();
  await loadHomepageContentFromDecap(); // ✅ this is the key missing piece
  initLeadForm();
});
