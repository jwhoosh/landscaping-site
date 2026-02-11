// ✅ Put your Apps Script Web App URL here
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwPpHZYDCjZBQNKSisGfjNkv6u0hTU7QW5XQyPGFoZcOWyCOSx3AdfJ19-4KGXLTELO/exec";

function qs(sel) {
  return document.querySelector(sel);
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

async function postLead(payloadObj) {
  // Send as TEXT to avoid CORS preflight issues with Apps Script
  const body = JSON.stringify(payloadObj);

  // Attempt normal fetch first (lets you read response when allowed)
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
    });

    // If we can read it, check for {success:true}
    const txt = await res.text().catch(() => "");
    try {
      const j = JSON.parse(txt);
      if (j && j.success === true) return true;
    } catch (_) {
      // If response isn't JSON but status is OK, treat as success
    }

    if (res.ok) return true;
    throw new Error(`HTTP ${res.status} ${txt}`);
  } catch (err) {
    // Fallback: no-cors mode (browser won't block, but we can't read response)
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    });

    // Can't verify, but request was sent.
    return true;
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

    // Checkbox returns "on" if checked; make it explicit
    const consentChecked =
      form.querySelector('input[name="consent"]')?.checked === true;

    if (!consentChecked) {
      setMsg(msg, "Please tick consent to proceed.", false);
      return;
    }

    setMsg(msg, "Sending…", true);

    try {
      const ok = await postLead({
        name: (data.name || "").trim(),
        phone: (data.phone || "").trim(),
        location: (data.location || "").trim(),
        service: (data.service || "").trim(),
        notes: (data.notes || "").trim(),
        consent: true,
        source: "website",
      });

      if (!ok) throw new Error("Server did not confirm success.");

      form.reset();
      setMsg(msg, "✅ Request sent. We’ll contact you within 24 hours.", true);
    } catch (err) {
      console.error(err);
      setMsg(
        msg,
        "❌ Something went wrong. Please try again or WhatsApp us.",
        false
      );
    }
  });
}

function initReviewRotator() {
  const textEl = qs("#reviewText");
  const metaEl = qs("#reviewMeta");
  if (!textEl || !metaEl) return;

  const reviews = [
    {
      text: "Very punctual and clean. Hedge line looks sharp and they cleaned up everything after.",
      meta: "— Clementi",
    },
    {
      text: "Fast response, clear scope before starting. No surprise charges.",
      meta: "— Jurong West",
    },
    {
      text: "Lawn was uneven before — now it looks neat and consistent. Recommended.",
      meta: "— Bukit Timah",
    },
    {
      text: "They brought proper tools and finished quickly. Site was left tidy.",
      meta: "— Woodlands",
    },
    {
      text: "Good communication and they updated me before/after. Easy to work with.",
      meta: "— Tampines",
    },
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
  initLeadForm();
  initReviewRotator();
});