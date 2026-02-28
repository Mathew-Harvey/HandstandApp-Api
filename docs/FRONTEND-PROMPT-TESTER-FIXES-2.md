# Frontend prompt — Tester fixes (round 2)

Hand this to the **frontend team**. The API has been updated; the items below are your changes plus how to use the new API behaviour.

---

## API changes (already done — use them)

1. **Verify-session path**
   - **Before:** The route was double-prefixed and unreachable.
   - **Now:** Session check is at **`GET /api/verify-session`** (no `/auth/` in the path).
   - **Action:** If you call verify-session, use **`/verify-session`** (relative to your API base), e.g. `GET {API_BASE}/verify-session` with `credentials: 'include'`. Response: `{ verified: true, userId }` or 401.

2. **Ebook token endpoint**
   - **Before:** `api('/ebook-token')` returned 404; the call was silently caught.
   - **Now:** **`GET /api/ebook-token`** is implemented. It requires an authenticated session (cookie). Response: `{ session_id: "<sessionId>" }`.
   - **Action:** Keep calling **`GET /api/ebook-token`** with `credentials: 'include'`. Use the returned `session_id` for the ebook/iframe if your design needs it. Remove any try/catch that hides 404; you should now get 200 when logged in and 401 when not.

3. **Port**
   - API default port is now **4000** everywhere (`.env.example`, `server.js`, Dockerfile). Use **4000** (not 4001 or 4002) when pointing the frontend at the local API.

---

## Your fixes (frontend)

### 1. Missing image — `finpushups.png` 404

- **Issue:** `EXERCISE_IMAGES` (e.g. in `public/js/app.js`) references `finpushups.png`, but the file is missing from `public/images/`.
- **Fix:** Add **`finpushups.png`** to `public/images/`. Use the same style/size as your other exercise images (e.g. `wallpushups.png`). If you don’t have an asset, use a placeholder or the same image as another “push-up” exercise until you have a final asset. Ensure the name matches exactly (e.g. `finpushups.png`, same case as in `EXERCISE_IMAGES`).

### 2. Duplicate HTML IDs — set-password vs change-password

- **Issue:** The set-password modal (e.g. in `index.html`) and the change-password modal (e.g. created in `app.js`) both use `id="newPassword"` and `id="confirmNewPassword"`. When both exist in the DOM, `$('#newPassword')` can target the wrong input.
- **Fix:** Use **unique IDs** for the two flows, for example:
  - **Set-password modal (index.html):** e.g. `id="setNewPassword"`, `id="setConfirmNewPassword"` (or `setNewPassword` / `confirmSetNewPassword`).
  - **Change-password modal (app.js):** e.g. `id="changeNewPassword"`, `id="changeConfirmNewPassword"` (or `changeNewPassword` / `confirmChangeNewPassword`).
  - Update any JS that selects these elements (e.g. `#newPassword` → `#setNewPassword` or `#changeNewPassword` depending on context) and ensure labels/`for` attributes match the new IDs.

### 3. Port number in frontend config

- **Issue:** `index.html` (or another config) hardcodes the API as `localhost:4002`; the API and other configs use 4000.
- **Fix:** Standardise on **port 4000** for the local API. Update:
  - Any hardcoded `localhost:4002` (or 4001) to **`localhost:4000`** in `index.html`, `app.js`, or env (e.g. `VITE_API_URL`, `API_URL`).
  - Ensure `.env.example` (if you have one) and docs say 4000 so new devs start with a single port.

---

## Checklist for frontend

- [ ] Verify-session: call **`GET /api/verify-session`** (not `/api/auth/verify-session` or `/api/api/...`).
- [ ] Ebook: call **`GET /api/ebook-token`** with credentials; use `session_id` if needed; don’t silently ignore errors.
- [ ] Local API URL uses port **4000** (e.g. `http://localhost:4000`).
- [ ] Add **`finpushups.png`** to `public/images/` and fix any broken image for Fin Push-ups.
- [ ] Set-password modal: unique IDs (e.g. `setNewPassword`, `setConfirmNewPassword`).
- [ ] Change-password modal: unique IDs (e.g. `changeNewPassword`, `changeConfirmNewPassword`).
- [ ] All JS selectors and `for` attributes updated to use the new IDs.
