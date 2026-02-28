# Frontend prompt — Tester fixes (round 3)

Hand this to the **frontend team**. The API has been updated for items 12, 16, and 17; the items below are your changes plus one API behaviour update.

---

## API change (already done — handle it)

### Logout now requires authentication

- **Before:** `POST /api/auth/logout` could be called without a session; it would still return 200.
- **Now:** The route uses **`requireAuth`**. If the user is not authenticated, the API returns **401**.
- **Action:** Call logout only when you consider the user logged in (e.g. after a successful login or when `GET /api/auth/me` returned `authenticated: true`). If you call logout and get **401**, treat it as “already logged out” and redirect to login (or clear local state) without showing an error. Do not rely on logout as a no-op for unauthenticated requests; handle 401 in your logout handler.

---

## Your fixes (frontend)

### 1. `bindLogForms()` parameter mismatch (app.js)

- **Issue:** `bindLogForms(num)` is called with an argument (e.g. line 923), but the function is defined as `function bindLogForms()` with no parameters (e.g. line 934). The level is read from `form.dataset.level`, so the argument is unused and the signature is misleading.
- **Fix:** Either:
  - **Option A:** Remove the argument at the call site: change `bindLogForms(levelNum)` (or similar) to `bindLogForms()`, or
  - **Option B:** Add a parameter and use it: e.g. `function bindLogForms(levelNum)` and use `levelNum` when binding (e.g. to set or validate the level), and keep the call as `bindLogForms(num)`.
- Prefer the option that matches how the form actually gets its level (if it’s always from `dataset.level`, Option A is simpler).

### 2. Heatmap colours hardcoded for dark theme (progress.js)

- **Issue:** The heatmap cell colours are hardcoded to GitHub-dark-theme values (e.g. `#161b22` for empty cells). In light mode, the empty cell colour is nearly black on a light background and looks broken.
- **Fix:** Make colours theme-aware:
  - **Preferred:** Use **CSS custom properties** (e.g. `--heatmap-empty`, `--heatmap-level-1`, …) set from your theme (e.g. in `data-theme="light"` / `data-theme="dark"`), and use those variables in the heatmap (inline styles or a small CSS block). Define light and dark values for each level.
  - **Alternative:** In JS, read the current theme (e.g. `document.documentElement.getAttribute('data-theme')` or your theme state) and choose a different colour map for light vs dark when rendering heatmap cells.

### 3. `applyTheme()` inconsistency (app.js)

- **Issue:** In one place, `applyTheme('dark')` **removes** the `data-theme` attribute entirely (e.g. lines 40–46), while `renderSettings()` always **sets** `data-theme` to the current value (e.g. 632–644). That can cause a flash of wrong theme when the attribute is missing and CSS falls back differently.
- **Fix:** **Always set `data-theme` explicitly.** Do not remove the attribute for dark theme. For example:
  - Change `applyTheme('dark')` so it sets **`document.documentElement.setAttribute('data-theme', 'dark')`** (and similarly for `'light'`), and never removes the attribute.
  - Ensure any other code that switches theme also sets `data-theme="dark"` or `data-theme="light"` instead of removing it.

---

## Optional: Streak and timezones (API behaviour)

- The API **streak** logic now uses **UTC** for “today” so behaviour is consistent regardless of server timezone (see `routes/progress.js`). Session dates are compared as calendar days in UTC.
- If you need to show “today” or “yesterday” in the user’s timezone, do that **on the client** (e.g. format dates in the user’s locale/timezone). The API does not yet accept a timezone parameter; if you need per-user timezone for streak in the future, we can add it.

---

## Checklist for frontend

- [ ] **Logout:** Handle 401 from `POST /api/auth/logout` as “already logged out”; only call logout when the user is considered logged in, or handle 401 without showing an error.
- [ ] **bindLogForms:** Either remove the argument from the call and keep `function bindLogForms()`, or add a parameter and use it consistently.
- [ ] **Heatmap:** Use CSS custom properties or theme-aware colours so heatmap looks correct in both light and dark theme.
- [ ] **applyTheme:** Always set `data-theme="dark"` or `data-theme="light"`; never remove the attribute for dark theme.
