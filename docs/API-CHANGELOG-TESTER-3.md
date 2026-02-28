# API changelog — Tester fixes (round 3)

Summary of API changes from the third tester feedback round.

---

## Behaviour

- **Logout:** `POST /api/auth/logout` now uses **`requireAuth`** middleware. Unauthenticated requests receive **401**. Frontend should call logout only when the user is logged in, or handle 401 as “already logged out”.

## Streak (timezone)

- **getStreak()** in `routes/progress.js` now uses **UTC** for “today” when computing the streak. This makes behaviour consistent regardless of server timezone. Session dates are compared as calendar days in UTC. A short comment in code documents this; per-user timezone can be added later (e.g. query param) if needed.

## Repo hygiene

- **coverage/** added to **`.gitignore`** so Jest coverage output is not committed. To remove existing coverage from the repo: `git rm -r --cached coverage/` then commit.

## Frontend impact

- Handle **401** from `POST /api/auth/logout` (treat as already logged out).
- Streak and session dates are in UTC; client can format in user’s timezone for display.
