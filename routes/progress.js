const express = require('express');
const { requireAuth } = require('../middleware/auth');
const LEVELS = require('../data/levels');
const router = express.Router();

const EXERCISE_NAMES = {};
for (const level of LEVELS) {
  for (const ex of level.exercises) {
    EXERCISE_NAMES[ex.key] = ex.name;
  }
}

module.exports = function (pool) {
  // Serve level definitions to the frontend
  router.get('/levels', (req, res) => res.json(LEVELS));

  // Dashboard data
  router.get('/dashboard', requireAuth, async (req, res) => {
    try {
      const userResult = await pool.query(
        'SELECT id, email, display_name, current_level, created_at FROM users WHERE id=$1',
        [req.session.userId]
      );
      const user = userResult.rows[0];
      if (!user) {
        return res.status(401).json({ error: 'Session invalid or user no longer exists.' });
      }
      const graduations = (await pool.query(
        'SELECT level, graduated_at FROM graduations WHERE user_id=$1 ORDER BY level',
        [req.session.userId]
      )).rows;
      const recentLogs = (await pool.query(
        `SELECT id, level, exercise_key, sets_completed, reps_or_duration, hold_time_seconds, notes, session_date
         FROM progress_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
        [req.session.userId]
      )).rows;
      const totalSessions = (await pool.query(
        'SELECT COUNT(DISTINCT session_date) as cnt FROM progress_logs WHERE user_id=$1',
        [req.session.userId]
      )).rows[0].cnt;
      const streak = await getStreak(pool, req.session.userId);
      res.json({ user, graduations, recentLogs, totalSessions: parseInt(totalSessions), streak });
    } catch (err) {
      console.error('Dashboard error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Rich stats for the progress dashboard
  router.get('/dashboard/stats', requireAuth, async (req, res) => {
    const uid = req.session.userId;
    try {
      const [
        heatmapResult,
        weeklyResult,
        pbResult,
        timelineResult,
        breakdownResult,
        totalsResult,
        longestStreakResult,
        userResult,
      ] = await Promise.all([
        // 1. Heatmap — daily log counts for last 365 days
        pool.query(
          `SELECT session_date::text AS date, COUNT(*)::int AS count
           FROM progress_logs
           WHERE user_id = $1 AND session_date >= CURRENT_DATE - INTERVAL '365 days'
           GROUP BY session_date ORDER BY session_date`,
          [uid]
        ),
        // 2. Weekly volume — last 12 weeks
        pool.query(
          `SELECT to_char(session_date, 'IYYY-"W"IW') AS week,
                  COUNT(DISTINCT session_date)::int AS sessions,
                  COALESCE(SUM(sets_completed), 0)::int AS sets,
                  date_trunc('week', MIN(session_date))::date::text AS week_start
           FROM progress_logs
           WHERE user_id = $1 AND session_date >= CURRENT_DATE - INTERVAL '12 weeks'
           GROUP BY week ORDER BY week`,
          [uid]
        ),
        // 3. Personal bests — best hold time per exercise
        pool.query(
          `WITH maxes AS (
             SELECT exercise_key,
                    MAX(hold_time_seconds)::int AS best_hold_seconds,
                    MAX(sets_completed)::int AS best_sets
             FROM progress_logs WHERE user_id = $1 GROUP BY exercise_key
           )
           SELECT m.exercise_key, m.best_hold_seconds, m.best_sets,
             (SELECT session_date::text FROM progress_logs
              WHERE user_id = $1 AND exercise_key = m.exercise_key
              ORDER BY hold_time_seconds DESC NULLS LAST, sets_completed DESC, session_date DESC
              LIMIT 1) AS achieved_at
           FROM maxes m
           ORDER BY m.best_hold_seconds DESC NULLS LAST`,
          [uid]
        ),
        // 4. Level timeline — first log date per level + graduation date
        pool.query(
          `SELECT p.level,
                  MIN(p.session_date)::text AS started_at,
                  g.graduated_at
           FROM progress_logs p
           LEFT JOIN graduations g ON g.user_id = p.user_id AND g.level = p.level
           WHERE p.user_id = $1
           GROUP BY p.level, g.graduated_at
           ORDER BY p.level`,
          [uid]
        ),
        // 5. Exercise breakdown — most practiced exercises
        pool.query(
          `SELECT exercise_key, COUNT(*)::int AS total_logs
           FROM progress_logs WHERE user_id = $1
           GROUP BY exercise_key ORDER BY total_logs DESC LIMIT 10`,
          [uid]
        ),
        // 6. Totals
        pool.query(
          `SELECT COUNT(DISTINCT session_date)::int AS total_sessions,
                  COALESCE(SUM(sets_completed), 0)::int AS total_sets,
                  COUNT(*)::int AS total_logs
           FROM progress_logs WHERE user_id = $1`,
          [uid]
        ),
        // 7. Longest streak (consecutive-day islands)
        pool.query(
          `WITH dates AS (
             SELECT DISTINCT session_date FROM progress_logs
             WHERE user_id = $1 ORDER BY session_date
           ),
           grouped AS (
             SELECT session_date,
                    session_date - (ROW_NUMBER() OVER (ORDER BY session_date))::int AS grp
             FROM dates
           )
           SELECT COALESCE(MAX(cnt), 0)::int AS longest
           FROM (SELECT COUNT(*)::int AS cnt FROM grouped GROUP BY grp) sub`,
          [uid]
        ),
        // User created_at for memberSinceDays
        pool.query(
          'SELECT created_at FROM users WHERE id = $1',
          [uid]
        ),
      ]);

      const totalsRow = totalsResult.rows[0] || { total_sessions: 0, total_sets: 0, total_logs: 0 };
      const memberSinceDays = userResult.rows[0]
        ? Math.floor((Date.now() - new Date(userResult.rows[0].created_at).getTime()) / 86400000)
        : 0;

      const currentStreak = await getStreak(pool, uid);

      res.json({
        heatmap: heatmapResult.rows,
        weeklyVolume: weeklyResult.rows,
        personalBests: pbResult.rows,
        levelTimeline: timelineResult.rows,
        exerciseBreakdown: breakdownResult.rows.map(r => ({
          ...r,
          name: EXERCISE_NAMES[r.exercise_key] || r.exercise_key,
        })),
        totals: {
          totalSessions: totalsRow.total_sessions,
          totalSets: totalsRow.total_sets,
          totalLogs: totalsRow.total_logs,
          memberSinceDays,
        },
        streak: {
          current: currentStreak,
          longest: longestStreakResult.rows[0]?.longest || 0,
        },
      });
    } catch (err) {
      console.error('Dashboard stats error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Level history
  router.get('/levels/:num/logs', requireAuth, async (req, res) => {
    const level = parseInt(req.params.num, 10);
    if (Number.isNaN(level) || level < 1 || level > 6) return res.status(400).json({ error: 'Invalid level' });
    try {
      const logs = (await pool.query(
        `SELECT * FROM progress_logs WHERE user_id=$1 AND level=$2 ORDER BY session_date DESC, created_at DESC LIMIT 50`,
        [req.session.userId, level]
      )).rows;
      const graduated = (await pool.query(
        'SELECT level, graduated_at FROM graduations WHERE user_id=$1 AND level=$2',
        [req.session.userId, level]
      )).rows[0] || null;
      res.json({ logs, graduated });
    } catch (err) {
      console.error('Level logs error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Log progress
  router.post('/log', requireAuth, async (req, res) => {
    const { level, exercise_key, sets_completed, reps_or_duration, hold_time_seconds, notes } = req.body;
    if (!level || !exercise_key) return res.status(400).json({ error: 'level and exercise_key required' });
    const levelNum = parseInt(level, 10);
    if (Number.isNaN(levelNum) || levelNum < 1 || levelNum > 6) return res.status(400).json({ error: 'level must be 1–6' });
    try {
      const result = await pool.query(
        `INSERT INTO progress_logs (user_id, level, exercise_key, sets_completed, reps_or_duration, hold_time_seconds, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.session.userId, levelNum, exercise_key, sets_completed || 0, reps_or_duration || '', hold_time_seconds || null, notes || '']
      );
      res.status(201).json({ log: result.rows[0] });
    } catch (err) {
      console.error('Log error:', err);
      res.status(500).json({ error: 'Failed to save' });
    }
  });

  // Graduate level
  router.post('/graduate', requireAuth, async (req, res) => {
    const lvl = parseInt(req.body.level, 10);
    if (Number.isNaN(lvl) || lvl < 1 || lvl > 6) return res.status(400).json({ error: 'Invalid level' });
    try {
      await pool.query(
        'INSERT INTO graduations (user_id, level) VALUES ($1,$2) ON CONFLICT (user_id, level) DO NOTHING',
        [req.session.userId, lvl]
      );
      const nextLevel = Math.min(lvl + 1, 6);
      await pool.query('UPDATE users SET current_level=$1, updated_at=NOW() WHERE id=$2', [nextLevel, req.session.userId]);
      res.json({ ok: true, nextLevel });
    } catch (err) {
      console.error('Graduate error:', err);
      res.status(500).json({ error: 'Failed to save' });
    }
  });

  // Delete log
  router.delete('/log/:id', requireAuth, async (req, res) => {
    try {
      const result = await pool.query('DELETE FROM progress_logs WHERE id=$1 AND user_id=$2', [req.params.id, req.session.userId]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Log not found' });
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  return router;
};

// Streak: uses UTC for "today" so behaviour is consistent regardless of server timezone.
// session_date from Postgres (DATE) is compared as calendar days in UTC. For per-user
// timezones, the client can pass a timezone (future) or convert for display.
async function getStreak(pool, userId) {
  const result = await pool.query(
    'SELECT DISTINCT session_date FROM progress_logs WHERE user_id=$1 ORDER BY session_date DESC LIMIT 60',
    [userId]
  );
  if (!result.rows.length) return 0;
  const now = new Date();
  let expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  let streak = 0;
  for (const row of result.rows) {
    const sessionDate = row.session_date;
    const d = typeof sessionDate === 'string'
      ? new Date(sessionDate + 'T00:00:00Z')
      : new Date(Date.UTC(sessionDate.getUTCFullYear(), sessionDate.getUTCMonth(), sessionDate.getUTCDate(), 0, 0, 0, 0));
    if (Math.round((expected - d) / 86400000) <= 1) {
      streak++;
      expected = d;
    } else break;
  }
  return streak;
}
