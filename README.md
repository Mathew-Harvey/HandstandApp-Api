# Handstand Tracker — API

REST API for the Handstand Training Progress Tracker.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/me` | No | Check auth status |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Log in |
| POST | `/api/auth/logout` | Yes | Log out |
| GET | `/api/verify-session` | No | Check if session is valid (e.g. for ebook) |
| GET | `/api/ebook-token` | Yes | Get session_id for ebook/iframe verification |
| GET | `/api/levels` | No | Get all level definitions |
| GET | `/api/dashboard` | Yes | Dashboard data (user, stats, logs) |
| GET | `/api/levels/:num/logs` | Yes | Logs for a specific level |
| POST | `/api/log` | Yes | Log exercise progress |
| POST | `/api/graduate` | Yes | Graduate a level |
| DELETE | `/api/log/:id` | Yes | Delete a log entry |

## Auth and routing (SPA vs API)

- This service is the **API only**. It does not serve the SPA. The app root (e.g. `https://yourapp.com/`) is served by your frontend host; ensure it serves the SPA `index.html` and does **not** redirect `/` to `/set-password` for anonymous users.
- `GET /api/auth/me` returns `authenticated: true` only when the user has a valid session and has completed setting their password (not only validated a set-password link). See `docs/BACKEND-TESTER-FEEDBACK.md` for details.

## Deploy to Render

1. Push to GitHub
2. Render → New → Blueprint → connect this repo
3. `render.yaml` provisions PostgreSQL + web service
4. Set `ALLOWED_ORIGINS` to your web frontend URL

## Local

```bash
cp .env.example .env
npm install
npm run dev
```
