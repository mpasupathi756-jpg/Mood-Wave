'use strict';
const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/db');

const SECRET = () => process.env.JWT_SECRET || 'fallback_secret_change_me';

/** Verify JWT, attach req.user */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, msg: 'No token provided' });
    }
    const token   = header.slice(7);
    const decoded = jwt.verify(token, SECRET());

    const user = await queryOne(
      'SELECT id, username, email, role, avatar_color, avatar_url, bio, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );
    if (!user)            return res.status(401).json({ ok: false, msg: 'User not found' });
    if (!user.is_active)  return res.status(403).json({ ok: false, msg: 'Account deactivated' });

    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ ok: false, msg });
  }
};

/** Optional auth — attaches user if token present, continues regardless */
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.slice(7), SECRET());
      const user    = await queryOne(
        'SELECT id, username, email, role, avatar_color, avatar_url, is_active FROM users WHERE id = ? LIMIT 1',
        [decoded.id]
      );
      if (user && user.is_active) req.user = user;
    }
  } catch { /* ignore */ }
  next();
};

/** Admin guard — must come AFTER authenticate */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ ok: false, msg: 'Admin access required' });
  }
  next();
};

/** Generate access token */
const signToken = (id, role) =>
  jwt.sign({ id, role }, SECRET(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

module.exports = { authenticate, optionalAuth, adminOnly, signToken };
