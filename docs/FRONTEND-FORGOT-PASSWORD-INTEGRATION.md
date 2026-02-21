# Frontend: Forgot Password & Set-Password Integration

Instructions for the **tracker app frontend** to integrate with the API’s forgot-password and set-password flows.

---

## 1. Forgot password flow

### 1.1 “Forgot password?” link on login

- On the **login page**, add a link: **“Forgot password?”** that navigates to the forgot-password page (e.g. `#/forgot-password` or `/forgot-password`).

### 1.2 Forgot-password page

- **Route:** e.g. `/forgot-password` or `#/forgot-password` (match your app’s routing).
- **UI:** A simple form with:
  - **Email** (required) — single input
  - **Submit** button, e.g. “Send reset link”
- **Submit behaviour:**
  1. Validate email (non-empty, valid format).
  2. **POST** to the API with **credentials** (cookies if you use them):
     - **URL:** `{API_URL}/api/auth/forgot-password`
     - **Method:** `POST`
     - **Headers:** `Content-Type: application/json`
     - **Body:** `{ "email": "<user's email>" }`
     - **credentials:** `'include'` if the app uses cookies for sessions.
  3. **Response handling:**
     - **Always 200 with `{ ok: true }`** (the API does not reveal whether the email exists). Show a **success message**, e.g. “If an account exists for that email, we’ve sent you a link to set a new password. Check your inbox and spam folder.”
     - **Development only:** If the response includes **`devResetToken`**, the API could not send email (e.g. Resend not configured). Show a clear dev-only message and a clickable link so the user can still test reset:
       - Text: “Development: no email sent. Use this link to set your password:”
       - Link: `{current origin}/set-password?token={devResetToken}`
       - Example: `https://localhost:3000/set-password?token=abc123...`
     - On **4xx/5xx**, show the API `error` message or a generic “Something went wrong. Try again.”

### 1.3 Example fetch (forgot-password)

```js
const apiUrl = window.API_URL || 'https://handstand-api.onrender.com'; // your API base

async function submitForgotPassword(email) {
  const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: email.trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data; // { ok: true } or { ok: true, devResetToken: "..." } in dev
}
```

---

## 2. Set-password flow (same for “set password” and “forgot password”)

The link in the email (or the dev link) is:

`https://<your-tracker-app-origin>/set-password?token=<token>`

Your app must handle this URL and use the two API calls below.

### 2.1 Route and reading the token

- **Route:** `GET /set-password` with query `token=...` (or `set_password_token=...`).
- Ensure your router serves this path (e.g. SPA catch-all so `/set-password?token=xyz` loads the app and the set-password screen can read the query).
- Read the token from the URL: `?token=` or `?set_password_token=` (API accepts both in its validate call).

### 2.2 Step 1: Validate token and log the user in

- When the set-password screen loads (and you have a token in the URL), call:
  - **GET** `{API_URL}/api/auth/validate-set-password-token?token={token}`
  - Use **credentials: 'include'** so the session cookie is stored.
- **Success (200):** Response is `{ user }`. Store the user in your app state, then **show the set-password modal** (new password + confirm).
- **Error (4xx):** Token invalid or expired. Show a clear message, e.g. “This link is invalid or has expired,” and links to **“Back to log in”** and **“Forgot password?”**.

### 2.3 Step 2: Set new password (modal submit)

- Modal (or full-page form): **New password** and **Confirm password** (no email field).
- On submit:
  - Check passwords match and meet your rules (e.g. min 6 characters; API also enforces min 6).
  - **POST** `{API_URL}/api/auth/set-password` with **credentials: 'include'**:
    - **Body:** `{ "token": "<token from URL>", "newPassword": "<new password>" }`
  - **Success (200):** Response is `{ user }`. Close the modal, update app state with the user, redirect to the main app (e.g. dashboard) and show a message like “Password set. Welcome!”
  - **Error (4xx):** Show the API `error` message (e.g. “Invalid or expired token”, “Password must be at least 6 characters”).

### 2.4 Example calls (set-password)

```js
// 1) Validate token and establish session
const token = new URLSearchParams(window.location.search).get('token')
  || new URLSearchParams(window.location.search).get('set_password_token');

const validateRes = await fetch(
  `${apiUrl}/api/auth/validate-set-password-token?token=${encodeURIComponent(token)}`,
  { credentials: 'include' }
);
const validateData = await validateRes.json();
if (!validateRes.ok) {
  // Show error: "This link is invalid or has expired." + links to Login and Forgot password?
  return;
}
// validateData.user is the logged-in user; show set-password modal

// 2) Submit new password
const setRes = await fetch(`${apiUrl}/api/auth/set-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ token, newPassword: newPasswordValue }),
});
const setData = await setRes.json();
if (!setRes.ok) throw new Error(setData.error || 'Failed to set password');
// setData.user; redirect to dashboard
```

---

## 3. Checklist for frontend

| Item | What to do |
|------|------------|
| Login page | Add “Forgot password?” link → forgot-password page |
| Forgot-password page | Form: email + submit → POST `/api/auth/forgot-password`, show success message; in dev, if `devResetToken` is present, show the reset link |
| Set-password URL | Handle `/set-password?token=...` (and optionally `?set_password_token=...`) |
| Invalid/expired token | Show “This link is invalid or has expired” + “Back to log in” + “Forgot password?” |
| Valid token | Call GET validate-set-password-token (with credentials), then show set-password modal |
| Set-password modal | New password + Confirm password; submit → POST `/api/auth/set-password` with `token` and `newPassword`; on success, redirect to app and show success message |
| API base | Use same `API_URL` as rest of app (e.g. `https://handstand-api.onrender.com`) |
| Credentials | Use `credentials: 'include'` on all API requests so session cookies are sent and stored |

---

## 4. API summary (for reference)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/forgot-password` | Request password reset; body `{ email }`; returns `{ ok: true }` or in dev `{ ok: true, devResetToken }` |
| `GET /api/auth/validate-set-password-token?token=` | Validate token, create session; returns `{ user }` or 400 |
| `POST /api/auth/set-password` | Set new password; body `{ token, newPassword }`; returns `{ user }` or 4xx |

The same set-password flow is used for **post-purchase “set your password”** and **forgot password**. No separate “reset password” page is needed—only the one set-password screen and modal.
