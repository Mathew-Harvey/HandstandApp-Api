# API changelog — Tester fixes (round 2)

Summary of API changes from the second tester feedback round.

---

## Routes

- **Verify-session:** Path corrected from double-prefix to **`GET /api/verify-session`** (router path `/verify-session`). Response unchanged: `{ verified: true, userId }` or 401. Also returns unauthenticated when `pendingPasswordSet` is true.
- **Ebook token:** New **`GET /api/ebook-token`** (requires auth). Returns `{ session_id: "<sessionID>" }` for ebook/iframe session verification.

## Security

- **Session fixation:** `req.session.regenerate()` is called on **login** and **register** before setting `userId` / `displayName`.
- **Login query:** Replaced `SELECT *` with explicit columns: `id, email, password_hash, display_name, current_level, theme`.
- **API secret:** `TRACKER_API_SECRET` is compared with `crypto.timingSafeEqual()` (with length check) to avoid timing attacks.

## Config and docs

- **Port:** Default port is **4000** in `server.js`; `.env.example` and Dockerfile already used 4000.
- **SSL:** Comment in `server.js` explains `rejectUnauthorized: false` in production and recommends CA cert when possible.
- **CSRF:** Comment added that with `sameSite: 'none'` and cross-origin, CSRF protection (e.g. double-submit cookie) should be considered.
- **Rate limiter:** Comment in `routes/auth.js` that the default store is in-memory and per process; suggest Redis (or similar) when scaling to multiple instances.

## Frontend impact

- Use **`/api/verify-session`** (not `/api/auth/verify-session`).
- Use **`GET /api/ebook-token`** with credentials for ebook session_id.
- Use port **4000** for local API.
