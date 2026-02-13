// ✅ 1) PUT YOUR WORKING APPS SCRIPT WEB APP URL HERE:
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwPpHZYDCjZBQNKSisGfjNkv6u0hTU7QW5XQyPGFoZcOWyCOSx3AdfJ19-4KGXLTELO/exec";

function qs(sel) {
  return document.querySelector(sel);
}
function qsa(sel) {
  return Array.from(document.querySelectorAll(sel));
}

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
 * ✅ CMS HYDRATION (Decap writes into /data/*.json)
 * This ONLY updates text on the page if the element IDs exist.
 * It will not break layout.
 */
async function hydrateFromCMS() {
  // Homepage fields
  try {
    const res = await fetch("/data/homepage.json", { cache: "no-store" });
    if (!res.ok) throw new Error("homepage.json not found");
    const data = await res.json();

    const heroTitle = qs("#heroTitle");
    if (heroTitle && typeof data.hero_title === "string") {
      heroTitle.textContent = data.hero_title;
    }

    const heroSub = qs("#heroSub");
    if (heroSub && typeof data.hero_sub === "string") {
      heroSub.textContent = data.hero_sub;
    }

    const ctaBtn = qs("#ctaBtn");
    if (ctaBtn && typeof data.cta_text === "string") {
      ctaBtn.textContent = data.cta_text;
    }
  } catch (e) {
    // Not fatal — page can still load with default HTML
    console.warn("[CMS] homepage.json load skipped:", e.message);
  }

  // Optional: About page fields (only if you're on about.html and IDs exist)
  try {
    const res = await fetch("/data/about.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();

    const story = qs("#aboutStory");
    if (story && typeof data.story === "string") {
      story.textContent = data.story;
    }

    const commitment = qs("#aboutCommitment");
    if (commitment && typeof data.commitment === "string") {
      commitment.textContent = data.commitment;
    }
  } catch (e) {
    // ignore
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
        // Apps Script often prefers text/plain, but JSON can work too.
        // If your Apps Script expects JSON, keep this.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name || "",
          phone: data.phone || "",
          location: data.location || "",
          service: data.service || "",
          notes: data.notes || "",
        }),
        redirect: "follow",
      });

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
      setMsg(msg, "❌ Something went wrong. Please try again or WhatsApp us.", false);
    }
  });
}

function initReviewRotator() {
  const textEl = qs("#reviewText");
  const metaEl = qs("#reviewMeta");
  if (!textEl || !metaEl) return;

  // Edit these anytime (no photos; auto-rotates)
  const reviews = [
    {
      text: "Very punctual and clean. Hedge line looks sharp and they cleaned up everything after.",
      meta: "— Clementi",
    },
    { text: "Fast response, clear scope before starting. No surprise charges.", meta: "— Jurong West" },
    { text: "Lawn was uneven before — now it looks neat and consistent. Recommended.", meta: "— Bukit Timah" },
    { text: "They brought proper tools and finished quickly. Site was left tidy.", meta: "— Woodlands" },
    { text: "Good communication and they updated me before/after. Easy to work with.", meta: "— Tampines" },
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

/**
 * Optional: if you render services dynamically from /data/services/*
 * you can add that later. Not needed for your current issue.
 */

document.addEventListener("DOMContentLoaded", async () => {
  initYear();

  // ✅ Load CMS content first (won't break if missing)
  await hydrateFromCMS();

  initLeadForm();
  initReviewRotator();
});
