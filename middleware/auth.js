function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Session from set-password token validation only (user has not completed setting password)
  if (req.session.pendingPasswordSet) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

module.exports = { requireAuth };
