# Backend / API — Tester Feedback (Implemented)

This doc records how the **API** addresses the backend handoff from the tester. The SPA is served separately; root-URL behaviour is for whoever serves the frontend.

---

## 1. Root URL must not show “Set your password”

- **Expected:** Visiting the app root shows **login** for unauthenticated users, not the set-password form.
- **This repo:** This is the **API only**. It does not serve the SPA or redirect any URL. The frontend app (SPA) is responsible for routing: root → login; set-password only when `?token=...` is present.
- **DevOps:** If you serve the SPA from the same host (e.g. static files or a reverse proxy), ensure the root document is the SPA `index.html` and there is **no** server-side redirect from `/` to `/set-password`.

---

## 2. Auth state and “Set your password”

- **Expected:** A user who has validated a set-password token but not yet submitted a new password should not be treated as fully authenticated (no app chrome / nav).
- **Implemented:**
  - `GET /api/auth/validate-set-password-token` sets the session and sets **`req.session.pendingPasswordSet = true`**.
  - **`GET /api/auth/me`** returns **`authenticated: false`** when `req.session.pendingPasswordSet` is true, so the frontend does not show the main app nav.
  - **`POST /api/auth/set-password`** (with valid token and new password) sets the session and **deletes `pendingPasswordSet`**, so the user is then fully authenticated.
  - **`requireAuth`** middleware rejects requests when `pendingPasswordSet` is true (401), so protected routes cannot be used until the user has completed set-password.

---

## 3. API security — password-set and auth endpoints

| Item | Status |
|------|--------|
| **Password-set endpoint** | **Done.** `POST /api/auth/set-password` requires a valid single-use token in the body. Invalid or expired token returns **400** with `{ error: "Invalid or expired token" }` or `"Token required"`. No token or wrong token cannot set a password. |
| **Token/session after set-password** | **Done.** On success, the session is set (and `pendingPasswordSet` removed). The next `GET /api/auth/me` returns `authenticated: true` and the user object. |
| **Rate limiting** | **Done.** Login: 20 req/15 min per IP. Register, forgot-password, set-password, create-user: 30 req/15 min per IP (`sensitiveLimiter`). |
| **CSRF** | **Not implemented.** The app uses cookie-based sessions with `sameSite` and CORS. If the frontend is same-origin or you need extra protection for cross-origin, consider adding CSRF tokens for state-changing auth requests (e.g. double-submit cookie). |

---

## 4. Validation and error messages

- **Set-password:** If the client sends `confirm_password` or `confirmNewPassword`, the API checks that it matches the new password and returns **400** with **`"Passwords do not match."`** if they differ. Password length &lt; 6 returns **`"Password must be at least 6 characters."`**
- **Register:** Already returns **`"Passwords do not match."`** and **`"Password must be at least 6 characters."`** for mismatch and short password.

---

## 5. Logout

- **Expected:** `POST /api/auth/logout` clears the session; next `GET /api/auth/me` returns unauthenticated.
- **Implemented:** `POST /api/auth/logout` calls `req.session.destroy()`. The session store (e.g. connect-pg-simple) removes the session, so a subsequent `GET /api/auth/me` has no session and returns `{ authenticated: false }`.

---

## 6. Navigation while unauthenticated (protected API routes)

- **Expected:** Protected API routes return **401** when the session is missing or invalid.
- **Implemented:** All protected routes use **`requireAuth`** middleware. It returns **401** with `{ error: "Not authenticated" }` when there is no session, no `userId`, or when `pendingPasswordSet` is true. Protected routes: `/api/dashboard`, `/api/dashboard/stats`, `/api/levels/:num/logs`, `/api/log`, `POST /api/log`, `POST /api/graduate`, `DELETE /api/log/:id`, and all auth routes that use `requireAuth` (logout, change-password, settings, reset-progress, unlock-all).

---

## 7. Loading / cold start

- **Optional:** A simple health endpoint lets the frontend show “Loading…” while the service is cold.
- **Implemented:** **`GET /health`** returns `{ status: "ok" }`. The frontend can poll or request it before the first auth check if desired.

---

## Quick checklist (backend)

- [x] Root URL: not handled by this API; SPA host must serve index and not redirect `/` to set-password.
- [x] `GET /api/auth/me` returns `authenticated: true` only when the user has a valid session and has **not** only validated a set-password token (no `pendingPasswordSet`).
- [x] `POST /api/auth/set-password` requires a valid single-use token; invalid/expired returns 400 with a clear error.
- [x] Rate limiting on login, register, forgot-password, set-password (and create-user).
- [x] Clear error messages for password validation (mismatch, too short).
- [x] `POST /api/auth/logout` invalidates the session; `GET /api/auth/me` then returns unauthenticated.
- [x] Protected API routes return 401 when the session is missing or invalid (including `pendingPasswordSet`).
