# Prompt for Web App (Tracker Frontend) Developer

Use this when working on the **Handstand Tracker web app** frontend (the app users open after setting their password from the landing page email, and where they use “Forgot password?”).

---

## Your responsibilities

1. **Set-password page**  
   Handle the link from the email:  
   `https://<your-app-origin>/set-password?token=...`  
   - Validate the token with the API and log the user in.  
   - Show a form to set a new password (and confirm).  
   - On submit, send the new password to the API; then redirect into the app.

2. **Forgot-password flow**  
   - “Forgot password?” on the login page → go to a forgot-password page.  
   - Forgot-password page: user enters email, you call the API; show a success message.  
   - **So that the user actually receives the reset email**, the **API** must be configured with Resend and `TRACKER_APP_URL` (see “Why didn’t I get the reset email?” below). Your job is to call the API and handle success/errors and, in dev, the optional `devResetToken`.

---

## API base URL

- Use the same base URL as the rest of your app (e.g. `window.API_URL` or env `VITE_API_URL`).  
  Example: `https://handstand-api.onrender.com`

---

## 1. Forgot-password page

- **Route:** e.g. `/forgot-password` or `#/forgot-password`.
- **Form:** Email (required) + Submit (e.g. “Send reset link”).
- **On submit:**
  - `POST {API_URL}/api/auth/forgot-password`
  - Body: `{ "email": "<user email>" }`
  - `credentials: 'include'` if you use cookies.
- **Response:**
  - **200 + `{ ok: true }`**  
    Show: “If an account exists for that email, we’ve sent you a link to set a new password. Check your inbox and spam folder.”
  - **200 + `{ ok: true, devResetToken: "<token>" }`** (development only)  
    The API could not send email (e.g. Resend not configured). Show a dev-only message and a clickable link:  
    `{window.location.origin}/set-password?token={devResetToken}`  
    so testers can still reset.
  - **4xx/5xx**  
    Show the API `error` message or a generic “Something went wrong.”

---

## 2. Set-password flow (link from email or dev link)

- **URL:** `/set-password?token=<token>` (or `?set_password_token=<token>`).
- **Step 1 – Validate token and log in**
  - `GET {API_URL}/api/auth/validate-set-password-token?token={token}`  
    (or use query param `set_password_token` if that’s what you have)
  - `credentials: 'include'`
  - **200 + `{ user }`:** Store user, show the “set new password” form (modal or page).
  - **4xx:** Show “This link is invalid or has expired” and links to **“Back to log in”** and **“Forgot password?”**.

- **Step 2 – Submit new password**
  - Form: New password + Confirm password (no email).
  - `POST {API_URL}/api/auth/set-password`  
    Body: `{ "token": "<token from URL>", "newPassword": "<value>" }`  
    `credentials: 'include'`
  - **200 + `{ user }`:** Close modal/page, redirect to dashboard (or home), show e.g. “Password set. Welcome!”
  - **4xx:** Show API `error` (e.g. “Invalid or expired token”, “Password must be at least 6 characters”).

---

## 3. Login page

- Add a **“Forgot password?”** link that goes to your forgot-password route (e.g. `/forgot-password`).

---

## Why didn’t I get the reset email?

The **API** (HandstandApp-Api) sends the email. It only does so if these are set in the **API’s** environment (not in the frontend):

- **`RESEND_API_KEY`** (Resend API key)
- **`RESEND_FROM`** (e.g. `Handstand Tracker <onboarding@yourdomain.com>`)
- **`TRACKER_APP_URL`** (your web app origin, e.g. `https://handstand-web.onrender.com`)

If any of these are missing on the API server, the API will still return `{ ok: true }` but **no email is sent**. In development, the API may return `devResetToken` so the frontend can show a reset link for testing.

**What you can do as frontend dev:**

- In **dev**, if the API returns `devResetToken`, show the dev-only link (see §1) so testers can reset without email.
- For **production**, ask whoever deploys the **API** to set `RESEND_API_KEY`, `RESEND_FROM`, and `TRACKER_APP_URL` so reset emails are sent. The API logs a warning at startup if these are not set.

---

## Checklist

- [ ] Login page has “Forgot password?” → forgot-password page.
- [ ] Forgot-password page: form → POST `/api/auth/forgot-password` → show success message; in dev, if `devResetToken` is present, show the reset link.
- [ ] App handles `/set-password?token=...` (and optionally `?set_password_token=...`).
- [ ] Set-password: validate token (GET validate-set-password-token) → show new password + confirm form → POST set-password → redirect and show success.
- [ ] Invalid/expired token: show error + “Back to log in” + “Forgot password?”.
- [ ] All API requests use the correct API base URL and `credentials: 'include'` where needed.
