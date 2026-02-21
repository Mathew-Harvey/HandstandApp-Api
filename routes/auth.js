const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

module.exports = function (pool) {
  // Check auth status
  router.get('/auth/me', async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.json({ authenticated: false });
    }
    try {
      const result = await pool.query(
        'SELECT id, email, display_name, current_level, created_at FROM users WHERE id=$1',
        [req.session.userId]
      );
      if (!result.rows.length) return res.json({ authenticated: false });
      res.json({ authenticated: true, user: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Register
  router.post('/auth/register', async (req, res) => {
    const { email, password, confirm_password, display_name } = req.body;
    if (!email || !password || !confirm_password || !display_name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (!display_name.trim()) {
      return res.status(400).json({ error: 'Display name cannot be empty.' });
    }
    try {
      const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
      if (exists.rows.length) {
        return res.status(409).json({ error: 'Email already registered.' });
      }
      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, display_name) VALUES ($1,$2,$3) RETURNING id, email, display_name, current_level',
        [email.toLowerCase(), hash, display_name.trim()]
      );
      const user = result.rows[0];
      req.session.userId = user.id;
      req.session.displayName = user.display_name;
      res.status(201).json({ user });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Something went wrong.' });
    }
  });

  // Login
  router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
      const result = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
      if (!result.rows.length) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      req.session.userId = user.id;
      req.session.displayName = user.display_name;
      res.json({
        user: { id: user.id, email: user.email, display_name: user.display_name, current_level: user.current_level }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Something went wrong.' });
    }
  });

  // Logout
  router.post('/auth/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  return router;
};
