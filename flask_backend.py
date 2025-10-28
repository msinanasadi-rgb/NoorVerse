"""
flask_backend.py — Minimal Flask email API for the Contact form (Option B — with backend)

Features:
- POST /api/contact receives: name, email, message, dua (optional)
- Validates required fields and email format
- Simple sanitization to prevent header injection and strip HTML
- Sends email via SMTP (Gmail or any SMTP provider)
- Honeypot check (hp_field must be empty)
- Optional Google reCAPTCHA verification (set RECAPTCHA_SECRET)

Environment variables to set in your platform (Render/Railway/local .env):
- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=587
- SMTP_USER=your@gmail.com
- SMTP_PASSWORD=your_app_password   # use Gmail App Password (see README.md)
- TO_EMAIL=msinanasadi@gmail.com    # change if needed
- FROM_EMAIL=your@gmail.com         # often same as SMTP_USER
- RECAPTCHA_SECRET=                 # optional; leave empty to disable

Run locally:
  python3 -m venv .venv && source .venv/bin/activate
  pip install flask python-dotenv email-validator bleach
  export FLASK_APP=flask_backend.py
  flask run --port 5001

Deploy: see README.md for Render/Railway steps.
"""
from __future__ import annotations

import os
import re
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from flask import Flask, request, jsonify

try:
    # tiny optional helpers
    from email_validator import validate_email, EmailNotValidError
    import bleach
except Exception:
    validate_email = None
    EmailNotValidError = Exception
    bleach = None

app = Flask(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
TO_EMAIL = os.getenv("TO_EMAIL", "msinanasadi@gmail.com")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)
RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET", "")

SUBJECT_PREFIX = "[NoorVerse Contact] "

# Basic sanitization helpers
HEADER_INJECTION_RE = re.compile(r"[\r\n]|
||%0a|%0d", re.IGNORECASE)

def sanitize_text(value: str) -> str:
    value = (value or "").strip()
    # Prevent header injection
    value = HEADER_INJECTION_RE.sub(" ", value)
    # Strip HTML (best-effort)
    if bleach is not None:
        value = bleach.clean(value, tags=[], attributes={}, strip=True)
    return value


def verify_recaptcha(token: str) -> bool:
    if not RECAPTCHA_SECRET:
        return True  # disabled
    try:
        import requests
        resp = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": RECAPTCHA_SECRET, "response": token},
            timeout=8,
        )
        data = resp.json()
        return bool(data.get("success"))
    except Exception:
        return False


@app.post("/api/contact")
def contact():
    # Honeypot
    if (request.form.get("hp_field") or "").strip():
        return jsonify({"ok": True}), 200

    name = sanitize_text(request.form.get("name"))
    email = sanitize_text(request.form.get("email"))
    message = sanitize_text(request.form.get("message"))
    dua = sanitize_text(request.form.get("dua"))
    recaptcha_token = request.form.get("g-recaptcha-response", "")

    # Required fields
    if not name or not email or not message:
        return jsonify({"ok": False, "error": "Missing required fields"}), 400

    # Email validation
    if validate_email is not None:
        try:
            validate_email(email, check_deliverability=False)
        except EmailNotValidError:
            return jsonify({"ok": False, "error": "Invalid email"}), 400
    else:
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
            return jsonify({"ok": False, "error": "Invalid email"}), 400

    # Optional reCAPTCHA
    if not verify_recaptcha(recaptcha_token):
        return jsonify({"ok": False, "error": "reCAPTCHA failed"}), 400

    subject = SUBJECT_PREFIX + f"Message from {name}"
    body = (
        f"Name: {name}\n"
        f"Email: {email}\n\n"
        f"Message:\n{message}\n\n"
        f"Dua Request:\n{dua or '-'}\n"
    )

    try:
        msg = MIMEText(body, _charset="utf-8")
        msg["Subject"] = subject
        msg["From"] = formataddr((name, FROM_EMAIL or SMTP_USER))
        msg["To"] = TO_EMAIL

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        return jsonify({"ok": True}), 200
    except Exception as exc:
        app.logger.exception("Send failed: %s", exc)
        return jsonify({"ok": False, "error": "Send failed"}), 500


@app.get("/")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5001)))
