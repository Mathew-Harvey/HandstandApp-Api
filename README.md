# Handstand Tracker — API

REST API for the Handstand Training Progress Tracker.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/me` | No | Check auth status |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Log in |
| POST | `/api/auth/logout` | Yes | Log out |
| GET | `/api/levels` | No | Get all level definitions |
| GET | `/api/dashboard` | Yes | Dashboard data (user, stats, logs) |
| GET | `/api/levels/:num/logs` | Yes | Logs for a specific level |
| POST | `/api/log` | Yes | Log exercise progress |
| POST | `/api/graduate` | Yes | Graduate a level |
| DELETE | `/api/log/:id` | Yes | Delete a log entry |

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
