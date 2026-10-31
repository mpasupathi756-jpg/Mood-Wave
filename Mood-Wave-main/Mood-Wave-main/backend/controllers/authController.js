'use strict';
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../config/db');
const { signToken } = require('../middleware/auth');

const AVATAR_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#5060f8','#a855f7','#ec4899'];
const randColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

/* POST /api/auth/register */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ ok: false, msg: 'username, email, and password are required' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ ok: false, msg: 'Username must be 3–50 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, msg: 'Password must be at least 6 characters' });
    }

    const exists = await queryOne(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email.toLowerCase(), username.trim()]
    );
    if (exists) return res.status(409).json({ ok: false, msg: 'Email or username already taken' });

    const hash   = await bcrypt.hash(password, 12);
    const color  = randColor();
    const result = await query(
      'INSERT INTO users (username, email, password_hash, avatar_color) VALUES (?, ?, ?, ?) RETURNING id',
      [username.trim(), email.toLowerCase(), hash, color]
    );
    const id    = result[0]?.id || result.insertId;
    const token = signToken(id, 'user');

    return res.status(201).json({
      ok: true,
      token,
      user: { id, username: username.trim(), email: email.toLowerCase(), role: 'user', avatar_color: color },
    });
  } catch (err) {
    if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, msg: 'Email or username already taken' });
    }
    console.error('Registration error details:', err.message, err.code);
    if (err.code === '42P01') {
      return res.status(500).json({
        ok: false,
        msg: 'Database tables not initialized. Please run backend/config/schema.sql in Supabase SQL Editor.'
      });
    }
    return res.status(500).json({ ok: false, msg: 'Registration failed: ' + (process.env.NODE_ENV === 'production' ? 'Database service unavailable' : err.message) });
  }
};

/* POST /api/auth/login */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, msg: 'email and password are required' });
    }

    const user = await queryOne(
      'SELECT id, username, email, password_hash, role, avatar_color, avatar_url, bio, is_active FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase()]
    );
    if (!user) return res.status(401).json({ ok: false, msg: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ ok: false, msg: 'Account deactivated. Contact admin.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ ok: false, msg: 'Invalid credentials' });

    // Update last seen
    await query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);

    const token = signToken(user.id, user.role);
    const { password_hash, ...safeUser } = user;

    return res.json({ ok: true, token, user: safeUser });
  } catch (err) {
    console.error('Login error details:', err.message, err.code);
    if (err.code === '42P01') {
      return res.status(500).json({
        ok: false,
        msg: 'Database tables not initialized. Please run backend/config/schema.sql in Supabase SQL Editor.'
      });
    }
    return res.status(500).json({ ok: false, msg: 'Login failed: ' + (process.env.NODE_ENV === 'production' ? 'Database service unavailable' : err.message) });
  }
};

/* GET /api/auth/me */
exports.me = async (req, res) => {
  try {
    // Return counts alongside user
    const [follows] = await Promise.all([
      queryOne(
        'SELECT COUNT(*) AS followers FROM user_follows WHERE following_id = ?',
        [req.user.id]
      ),
    ]);
    return res.json({ ok: true, user: { ...req.user, followers: follows?.followers || 0 } });
  } catch (err) {
    return res.json({ ok: true, user: req.user });
  }
};

/* PUT /api/auth/profile */
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, avatar_color } = req.body;
    const updates = [];
    const params  = [];
    if (username)     { updates.push('username = ?');     params.push(username.trim()); }
    if (bio !== undefined){ updates.push('bio = ?');      params.push(bio || null); }
    if (avatar_color) { updates.push('avatar_color = ?'); params.push(avatar_color); }

    if (!updates.length) return res.status(400).json({ ok: false, msg: 'Nothing to update' });

    params.push(req.user.id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    return res.json({ ok: true, msg: 'Profile updated' });
  } catch (err) {
    if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, msg: 'Username already taken' });
    return res.status(500).json({ ok: false, msg: 'Update failed' });
  }
};

/* PUT /api/auth/password */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, msg: 'Both fields required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, msg: 'New password must be ≥ 6 chars' });
    }

    const row = await queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const ok  = await bcrypt.compare(currentPassword, row.password_hash);
    if (!ok) return res.status(401).json({ ok: false, msg: 'Current password is wrong' });

    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    return res.json({ ok: true, msg: 'Password updated' });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: 'Password change failed' });
  }
};
