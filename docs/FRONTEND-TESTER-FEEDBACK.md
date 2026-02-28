# Frontend: Tester Feedback — What to Do

This doc turns the tester’s feedback into concrete tasks for the **web app frontend**. The API repo has fixed the verify-session path; everything below is for the frontend.

---

## Critical (do first)

### 1. Hide app chrome until auth is complete

- **Problem:** On the root URL, the “Set your password” screen shows the full nav (Dashboard, Progress, Training Guide, Settings, Log out). Unauthenticated users and users still on set-password shouldn’t see app chrome.
- **Task:** Gate the **entire nav bar** (and any other app chrome) on auth state. Only render nav when the user is **fully authenticated** (e.g. after login or after successfully setting password), not when:
  - Visiting `/` with no session
  - On `/set-password?token=...` before or during the set-password flow
- **Implementation:** Use `GET /api/auth/me` (with `credentials: 'include'`) to know if the user is logged in. Render nav only when `authenticated === true` and the current route is not a “public” auth route (login, set-password, forgot-password).

### 2. Don’t show “Log out” on set-password page

- **Problem:** “Log out” on the set-password page is confusing; the user hasn’t finished setting a password yet.
- **Task:** Same as above: don’t render the nav (including Log out) on set-password. If you ever show a minimal header on set-password, it should not include Log out.

### 3. Root URL should be login/landing, not set-password

- **Problem:** Visiting the root URL goes straight to “Set your password”. That’s wrong for new visitors (no account) and returning users (expect login).
- **Task:**  
  - **Default route (e.g. `/` or `#/`):** Show a **login page** (and optionally signup/landing), not the set-password form.  
  - **Set-password:** Only when the user arrives with a token in the URL, e.g. `/set-password?token=...` (or `#/set-password?token=...`).  
- **Routing:** Before rendering the main app, check: if no session and no `token` (or `set_password_token`) in the URL, show login/landing; if `token` is present, go to set-password and validate the token with the API. Don’t default the SPA to a set-password view.

---

## UX / Design

### 4. Show password requirements on the form

- **Problem:** “New password” and “Confirm password” with no visible rules; users hit validation errors blindly.
- **Task:** On **set-password**, **register**, and **change-password** forms, show the requirements the API enforces:
  - **Set-password / reset:** minimum **6 characters** (API: `POST /api/auth/set-password` returns `"Password must be at least 6 characters."` if shorter).
  - **Register:** minimum **6 characters**, and passwords must match (API returns “Password must be at least 6 characters.” and “Passwords do not match.”).
  - **Change-password (in settings):** same — min 6 characters, new and confirm must match.
- **Suggestion:** Add a short line under the field, e.g. “At least 6 characters.” Optionally add client-side validation before submit and clear error messages for mismatch.

### 5. Emoji-only nav and accessibility

- **Problem:** Nav items are emoji-only (e.g. Progress, Training Guide, Settings) with only tooltips; bad for screen readers and discoverability.
- **Task:**
  - Prefer **visible text labels** next to (or instead of) emojis, e.g. “Progress”, “Training Guide”, “Settings”.
  - If you keep emoji-only for design reasons, add **`aria-label`** to each nav item, e.g. `aria-label="View progress"`, `aria-label="Training guide"`, `aria-label="Settings"`, so screen readers get a proper label.

### 6. Hash vs history routing (optional improvement)

- **Note:** Hash routing (`#/dashboard`, `#/progress`) is not a bug but has downsides (SEO, URL clarity, back/forward). If you use React Router or Vue Router, consider **history mode** and configure the server (e.g. Render) to serve the SPA for all app routes (rewrite to `index.html`).

---

## Things to verify (frontend + product)

- **Mismatched passwords:** On submit, show the API error clearly (e.g. “Passwords do not match”).
- **Empty form:** Client-side validation before calling the API (required fields, min length, match).
- **Nav when unauthenticated:** Direct visits to `#/dashboard`, `#/progress`, etc. without auth should redirect to login (or show login) instead of app content.
- **Log out:** Clears session (e.g. `POST /api/auth/logout` with `credentials: 'include'`) and redirects to login; no app chrome after logout.
- **Mobile:** Nav and set-password form work and are readable on small screens.
- **Loading state:** Show a spinner or skeleton when the app is loading (e.g. checking `GET /api/auth/me`) and during Render cold starts.

---

## API behaviour (for reference)

- **Set-password endpoint:** `POST /api/auth/set-password` does **not** require a session; it requires the **one-time token** in the body. Without a valid token, the API returns 400 “Token required” or “Invalid or expired token”. So the endpoint is token-protected; the frontend’s job is to only show set-password when the user has a token in the URL and to hide app nav until they’re fully logged in.
- **Session check:** Use `GET /api/auth/me` with `credentials: 'include'` to know if the user is authenticated. Use that to decide whether to show nav and app routes or login/set-password.
- **Verify-session (ebook):** The API exposes `GET /api/auth/verify-session` (returns `{ verified: true, userId }` or 401). Use this if you need to gate ebook/content by session.

---

## Quick wins (summary)

1. Wrap nav in an auth check — only render when authenticated (and not on set-password).
2. Root URL = login/landing; set-password only when `?token=...` (or `?set_password_token=...`) is in the URL.
3. Show password requirements (e.g. “At least 6 characters”) on set-password, register, and change-password forms.
4. Add `aria-label` (or visible labels) to nav items for accessibility.
5. Add a loading state while checking auth / on cold start.
