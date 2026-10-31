'use strict';
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../config/db');

/* GET /api/admin/stats */
exports.stats = async (req, res) => {
  try {
    const [
      users, songs, rooms, plays, activeRooms, newToday,
      topSongs, moodDist, userGrowth, genreDist, recentActivity
    ] = await Promise.all([
      queryOne('SELECT COUNT(*) AS n FROM users'),
      queryOne('SELECT COUNT(*) AS n FROM songs'),
      queryOne('SELECT COUNT(*) AS n FROM rooms'),
      queryOne('SELECT COUNT(*) AS n FROM listen_history'),
      queryOne('SELECT COUNT(*) AS n FROM rooms WHERE is_active=TRUE'),
      queryOne('SELECT COUNT(*) AS n FROM users WHERE DATE(created_at)=CURRENT_DATE'),
      query(`SELECT s.title,s.artist,s.cover_url,s.play_count,s.like_count
             FROM songs s ORDER BY s.play_count DESC LIMIT 10`),
      query(`SELECT mood, COUNT(*) AS cnt FROM mood_history GROUP BY mood ORDER BY cnt DESC`),
      query(`SELECT DATE(created_at) AS dt, COUNT(*) AS cnt FROM users
             WHERE created_at >= NOW() - INTERVAL '14 days' GROUP BY dt ORDER BY dt`),
      query(`SELECT genre, COUNT(*) AS cnt FROM songs WHERE genre IS NOT NULL GROUP BY genre ORDER BY cnt DESC LIMIT 8`),
      query(`SELECT lh.song_title,lh.song_artist,lh.song_cover,u.username,lh.played_at
             FROM listen_history lh JOIN users u ON lh.user_id=u.id
             ORDER BY lh.played_at DESC LIMIT 20`),
    ]);

    return res.json({
      ok: true,
      stats: {
        totalUsers:   users.n,
        totalSongs:   songs.n,
        totalRooms:   rooms.n,
        totalPlays:   plays.n,
        activeRooms:  activeRooms.n,
        newUsersToday: newToday.n,
      },
      topSongs,
      moodDist,
      userGrowth,
      genreDist,
      recentActivity,
    });
  } catch (err) {
    console.error('admin.stats:', err);
    return res.status(500).json({ ok: false, msg: 'Failed to fetch stats' });
  }
};

/* GET /api/admin/users */
exports.listUsers = async (req, res) => {
  try {
    const { search = '', role, status, page = 1, limit = 25 } = req.query;
    const offset = (Math.max(1,+page)-1) * +limit;
    const where = ['1=1'];
    const params = [];
    if (search) { where.push('(username LIKE ? OR email LIKE ?)'); const l=`%${search}%`; params.push(l,l); }
    if (role)   { where.push('role=?'); params.push(role); }
    if (status === 'active')   { where.push('is_active=1'); }
    if (status === 'inactive') { where.push('is_active=0'); }

    const total = await queryOne(`SELECT COUNT(*) n FROM users WHERE ${where.join(' AND ')}`, params);
    const users = await query(
      `SELECT id,username,email,role,avatar_color,avatar_url,is_active,last_seen,created_at
       FROM users WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, +limit, offset]
    );
    return res.json({ ok: true, users, total: total.n });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* POST /api/admin/users */
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role='user' } = req.body;
    if (!username||!email||!password) return res.status(400).json({ ok: false, msg: 'All fields required' });
    const ex = await queryOne('SELECT id FROM users WHERE email=? OR username=?', [email, username]);
    if (ex) return res.status(409).json({ ok: false, msg: 'Already exists' });
    const hash   = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?) RETURNING id',
      [username,email,hash,role]
    );
    const id = result[0]?.id || result.insertId;
    await query('INSERT INTO audit_log (admin_id,action,target) VALUES (?,?,?)', [req.user.id,'user_create',email]);
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, msg: 'Already exists' });
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* PUT /api/admin/users/:id */
exports.updateUser = async (req, res) => {
  try {
    const { role, is_active, username, email } = req.body;
    if (+req.params.id === req.user.id && role === 'user') {
      return res.status(400).json({ ok: false, msg: 'Cannot remove your own admin role' });
    }
    await query(
      'UPDATE users SET role=?,is_active=?,username=?,email=? WHERE id=?',
      [role, is_active?1:0, username, email, req.params.id]
    );
    await query('INSERT INTO audit_log (admin_id,action,target) VALUES (?,?,?)',
      [req.user.id, 'user_update', `id=${req.params.id}`]);
    return res.json({ ok: true, msg: 'User updated' });
  } catch (err) {
    if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok:false, msg:'Username/email taken' });
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* DELETE /api/admin/users/:id */
exports.deleteUser = async (req, res) => {
  try {
    if (+req.params.id === req.user.id) return res.status(400).json({ ok:false, msg:'Cannot delete yourself' });
    await query('DELETE FROM users WHERE id=?', [req.params.id]);
    await query('INSERT INTO audit_log (admin_id,action,target) VALUES (?,?,?)',
      [req.user.id,'user_delete',`id=${req.params.id}`]);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* GET /api/admin/audit */
exports.auditLog = async (req, res) => {
  try {
    const rows = await query(
      `SELECT al.*, u.username FROM audit_log al JOIN users u ON al.admin_id=u.id ORDER BY al.created_at DESC LIMIT 100`
    );
    return res.json({ ok: true, log: rows });
  } catch {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};
