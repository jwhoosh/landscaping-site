// ===== Quote Form Submission (Apps Script / Google Form safe) =====
const quoteForm = document.querySelector("#quoteForm");
const formMsg = document.querySelector("#formMsg");

function setMsg(text, ok) {
  if (!formMsg) return;
  formMsg.textContent = text;
  formMsg.className = "formMsg " + (ok ? "ok" : "err");
}

async function submitQuoteForm(e) {
  e.preventDefault();

  if (!quoteForm) return;

  // Must be your Apps Script Web App "exec" URL
  // Example: https://script.google.com/macros/s/XXXXXXX/exec
  const ENDPOINT = quoteForm.getAttribute("action") || window.QUOTE_ENDPOINT;

  if (!ENDPOINT || !ENDPOINT.includes("/exec")) {
    setMsg("Submission failed. Missing /exec endpoint URL.", false);
    return;
  }

  // build FormData so we don't trigger CORS preflight
  const fd = new FormData(quoteForm);

  setMsg("Submitting…", true);

  try {
    // no-cors = browser will send request, but response is opaque (unreadable)
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: fd,
    });

    // If we reached here, the browser did not block the request.
    // Treat as success.
    setMsg("Submitted! We’ll contact you within 24 hours.", true);
    quoteForm.reset();
  } catch (err) {
    console.error(err);
    setMsg("Submission failed. Please try again.", false);
  }
}

if (quoteForm) quoteForm.addEventListener("submit", submitQuoteForm);
