/*
  contact.js — Handles EmailJS/Formspree submission, client-side validation, and feedback UI.
  Option A (recommended): EmailJS — paste your keys below.
  - PUBLIC KEY: replace EMAILJS_PUBLIC_KEY
  - SERVICE ID: replace EMAILJS_SERVICE_ID
  - TEMPLATE ID: replace EMAILJS_TEMPLATE_ID
  Destination email for templates should be set to: msinanasadi@gmail.com

  Option A alt: Formspree — set FORMSPREE_ENDPOINT and set USE_FORMSPREE=true

  Optional: reCAPTCHA v2 checkbox — add the widget in contact.html and set RECAPTCHA=true with SITE KEY in HTML.
*/

// ===== CONFIG =====
const USE_FORMSPREE = false; // set true to use Formspree instead of EmailJS
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID"; // change if using Formspree

const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY"; // e.g. 'Vx7xxxxx...'
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";        // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";      // e.g. 'template_xyz789'

// Subject prefix to help spam filtering
const SUBJECT_PREFIX = "[NoorVerse Contact] ";

// ===== UTILITIES =====
function byId(id) { return document.getElementById(id); }
function setStatus(msg, type = "info") {
  const el = byId("form-status");
  if (!el) return;
  el.textContent = msg;
  el.className = `form-status ${type}`;
}

function isValidEmail(email) {
  return /^(?=.{3,254}$)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function serializeForm(form) {
  const data = new FormData(form);
  // Append a subject prefix the backend/template can use
  data.append("subject", SUBJECT_PREFIX + (data.get("name") || "Message"));
  return data;
}

// ===== INIT (EmailJS) =====
(function initEmailJS(){
  if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_EMAILJS_PUBLIC_KEY") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
})();

// ===== SUBMIT HANDLER =====
window.sendMail = async function(e) {
  e.preventDefault();
  const form = byId("contactForm");
  if (!form) return;

  // Honeypot (must be empty)
  const hp = byId("website");
  if (hp && hp.value.trim() !== "") {
    // silently pass, pretend success to avoid tipping off bots
    setStatus("Thank you! If this was a mistake, please submit again.", "success");
    form.reset();
    return;
  }

  // Basic validations
  const name = byId("name").value.trim();
  const email = byId("email").value.trim();
  const message = byId("message").value.trim();
  if (!name || !email || !message) {
    setStatus("Please fill in Name, Email and Message.", "error");
    return;
  }
  if (!isValidEmail(email)) {
    setStatus("Please enter a valid email address.", "error");
    return;
  }

  // Disable button while sending
  const button = form.querySelector('button[type="submit"]');
  const prevText = button.textContent;
  button.disabled = true;
  button.textContent = "Sending...";
  setStatus("Sending your message...", "info");

  try {
    const formData = serializeForm(form);

    if (USE_FORMSPREE) {
      // Option A alt — Formspree (no backend)
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData
      });
      if (!res.ok) throw new Error(`Formspree error ${res.status}`);
      setStatus("Alhamdulillah! Your message has been sent.", "success");
      form.reset();
    } else {
      // Option A — EmailJS (no backend)
      if (typeof emailjs === "undefined") throw new Error("EmailJS not loaded");
      const result = await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, "#contactForm");
      if (result && result.status >= 200 && result.status < 300) {
        setStatus("Alhamdulillah! Your message has been sent.", "success");
        form.reset();
      } else {
        throw new Error("Unexpected response from EmailJS");
      }
    }
  } catch (err) {
    console.error(err);
    setStatus("Sorry, sending failed. Please try again or email us directly.", "error");
  } finally {
    button.disabled = false;
    button.textContent = prevText;
  }
};

// Accessibility nicety: announce validation failure on blur
["name","email","message"].forEach(id => {
  const el = byId(id);
  if (!el) return;
  el.addEventListener("blur", () => {
    if (id === "email" && el.value && !isValidEmail(el.value)) {
      setStatus("Please enter a valid email.", "error");
    }
  });
});
