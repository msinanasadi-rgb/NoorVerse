# Contact Page — Quick README

- **Implemented option:** Option A (EmailJS, no backend) in `contact.html` + `js/contact.js`.
- **Where to paste keys:** Open `js/contact.js` and replace `EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID`, and `EMAILJS_TEMPLATE_ID`.
- **Destination email address:** Set inside your EmailJS template to `msinanasadi@gmail.com`. You can change it in the EmailJS dashboard (Template settings). For backend option, edit `TO_EMAIL` env var.

---

## Option A — EmailJS (recommended, no backend)

### 1) Create EmailJS account and keys
1. Go to https://www.emailjs.com and create a free account.
2. Add an email service (Gmail, Outlook, or SMTP). Note the **Service ID**.
3. Create a template with variables: `name`, `email`, `message`, `dua`, `subject`.
   - Set the template to send to `msinanasadi@gmail.com`.
   - Subject example: `{{subject}}`.
4. Copy your **Public Key** and **Template ID**.

### 2) Paste keys in code
- Open `js/contact.js` and set:
```js
const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
```
- No further code changes are required. The form is already in `contact.html` with `id="contactForm"`.

### 3) Optional: Use Formspree instead
- Create a Form at https://formspree.io/ (free tier allows 50 submissions/month).
- Copy your form endpoint, e.g. `https://formspree.io/f/abcdeqwe`.
- In `js/contact.js` set:
```js
const USE_FORMSPREE = true;
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
```

### 4) Add reCAPTCHA (optional but recommended)
- Go to https://www.google.com/recaptcha/admin/create and create keys for v2 Checkbox or v3.
- Copy the **Site key** and **Secret key**.
- In `contact.html`, uncomment the widget placeholder and paste your site key:
```html
<!--
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
<div class="g-recaptcha" data-sitekey="YOUR_RECAPTCHA_SITE_KEY"></div>
-->
```
- For backend protection (Option B), set `RECAPTCHA_SECRET` env var.

### 5) Deploy free (static hosting)
- You can host on GitHub Pages or Netlify free.

GitHub Pages quick steps:
1. Create a GitHub repo and push this folder.
2. In GitHub, open Settings → Pages → Build and deployment → Source: `Deploy from a branch`.
3. Set Branch to `main` and folder `/root`.
4. Wait for the green check. Your site will be at `https://<user>.github.io/<repo>/`.

Netlify quick steps:
1. Create account at https://www.netlify.com/.
2. New site from Git → connect your repo.
3. Build command: none. Publish directory: the project root.
4. Deploy. You get a free *.netlify.app URL.

### 6) Test
- Open `contact.html` on your deployed site.
- Submit the form with real email. You should see a green success banner.
- Check EmailJS dashboard → Activity to confirm send status.
- If emails go to spam: set a clearer subject, add `reply_to` to template, and consider a custom domain sender.

- Free plan notes:
  - EmailJS Free: currently ~200 emails/month. If exceeded, upgrade or temporarily switch to Formspree.
  - Formspree Free: 50 submissions/month, 1 form. Above that, upgrade or use your own backend (Option B).

---

## Option B — Flask backend (optional server)
Use `flask_backend.py` to send via SMTP (works with Gmail App Password or any SMTP provider).

### 1) Local run
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install flask python-dotenv email-validator bleach
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your@gmail.com
export SMTP_PASSWORD=your_app_password   # create an App Password in Google Account → Security → 2FA → App Passwords
export FROM_EMAIL=$SMTP_USER
export TO_EMAIL=msinanasadi@gmail.com
flask --app flask_backend.py run --port 5001
```
- Update frontend: submit the form to `/api/contact` using `fetch` (if you choose backend route). For EmailJS, no change is needed.

### 2) Render free deploy
1. Push code to GitHub.
2. Create new Web Service in https://dashboard.render.com/ → Connect repo.
3. Build command: `pip install -r requirements.txt` (create one if needed: `flask`, `email-validator`, `bleach`).
4. Start command: `gunicorn flask_backend:app` (Render auto-detects `PORT`).
5. Add Environment variables:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
   - `FROM_EMAIL`, `TO_EMAIL` (set to `msinanasadi@gmail.com`)
   - `RECAPTCHA_SECRET` (optional)
6. Deploy and test `https://yourservice.onrender.com/api/contact` with a POST.

### 3) Railway free deploy
1. Create project at https://railway.app/ → New → Deploy from Repo.
2. In Variables add the same env vars as above.
3. Add a `Procfile` with `web: gunicorn flask_backend:app` if needed.
4. Deploy and open the public URL.

### 4) Configure Gmail App Password
- In Google Account → Security → Turn on 2‑Step Verification.
- Under App Passwords, generate a new 16‑character password.
- Use it as `SMTP_PASSWORD`. Username is your Gmail address.

### 5) Spam protection on backend
- Honeypot field `hp_field` (already implemented).
- Optional reCAPTCHA: set `RECAPTCHA_SECRET`.
- Add a subject prefix and basic rate limiting at the proxy/CDN if possible.

---

## Exact commands to deploy

GitHub Pages (from a Linux terminal):
```bash
# inside project folder
git init
git add .
git commit -m "Deploy contact page"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
# Then enable Pages in GitHub Settings → Pages
```

Render (Flask backend):
```bash
# Create a minimal requirements file
printf "flask\nemail-validator\nbleach\ngunicorn\n" > requirements.txt
# Commit and push
git add requirements.txt
git commit -m "Add backend requirements"
git push
# In Render dashboard, set start command:
# gunicorn flask_backend:app
# Add Env Vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL, TO_EMAIL, RECAPTCHA_SECRET
```

---

## Files overview
- `contact.html` — Form with fields Name, Email, Message (required), Dua (optional), honeypot, status area.
- `styles.css` — Dark theme and `.form-status` styles.
- `js/contact.js` — EmailJS/Formspree logic, validation, feedback.
- `flask_backend.py` — Minimal Flask API with SMTP sending.

## Post‑deploy test checklist
- Open the live site Contact page.
- **Fill required fields** and submit.
- **See success banner** and no console errors.
- **Confirm email received** at `msinanasadi@gmail.com`.
- **Check provider logs**:
  - EmailJS: Dashboard → Email Logs/Activity.
  - Formspree: Submissions page.
  - Flask: Render/Railway logs.
- If mail lands in spam: set clearer subject, add `reply_to`, consider domain sender or SPF/DKIM via a custom domain.
