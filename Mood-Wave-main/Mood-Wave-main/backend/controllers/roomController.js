'use strict';
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../config/db');

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function uniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = genCode();
    const ex   = await queryOne('SELECT id FROM rooms WHERE code=?', [code]);
    if (!ex) return code;
  }
  throw new Error('Could not generate unique room code');
}

/* POST /api/rooms */
exports.create = async (req, res) => {
  try {
    const { name, is_private, password, max_members = 4 } = req.body;
    if (!name?.trim()) return res.status(400).json({ ok: false, msg: 'Room name required' });

    const code    = await uniqueCode();
    const pwHash  = (is_private && password) ? await bcrypt.hash(password, 10) : null;
    const members = Math.min(Math.max(+max_members||4, 2), 8);

    const result = await query(
      `INSERT INTO rooms (code, name, host_id, max_members, is_private, password_hash)
       VALUES (?,?,?,?,?,?) RETURNING id`,
      [code, name.trim(), req.user.id, members, is_private?1:0, pwHash]
    );
    const roomId = result[0]?.id || result.insertId;
    await query(
      'INSERT INTO room_members (room_id, user_id) VALUES (?,?) ON CONFLICT (room_id, user_id) DO NOTHING',
      [roomId, req.user.id]
    );

    return res.status(201).json({ ok: true, room: { id: roomId, code, name: name.trim(), is_private: !!is_private } });
  } catch (err) {
    console.error('room.create:', err);
    return res.status(500).json({ ok: false, msg: 'Failed to create room' });
  }
};

/* POST /api/rooms/join */
exports.join = async (req, res) => {
  try {
    const { code, password } = req.body;
    if (!code) return res.status(400).json({ ok: false, msg: 'Room code required' });

    const room = await queryOne(
      `SELECT r.*, (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id=r.id) AS member_count
       FROM rooms r WHERE r.code=? AND r.is_active=1 LIMIT 1`,
      [code.toUpperCase()]
    );
    if (!room) return res.status(404).json({ ok: false, msg: 'Room not found or closed' });

    if (room.member_count >= room.max_members) {
      // Check if already member
      const already = await queryOne('SELECT 1 FROM room_members WHERE room_id=? AND user_id=?', [room.id, req.user.id]);
      if (!already) return res.status(400).json({ ok: false, msg: `Room is full (${room.max_members} max)` });
    }

    if (room.is_private && room.password_hash) {
      if (!password) return res.status(401).json({ ok: false, msg: 'Password required' });
      const ok = await bcrypt.compare(password, room.password_hash);
      if (!ok) return res.status(401).json({ ok: false, msg: 'Wrong room password' });
    }

    await query(
      'INSERT INTO room_members (room_id, user_id) VALUES (?,?) ON CONFLICT (room_id, user_id) DO NOTHING',
      [room.id, req.user.id]
    );
    return res.json({ ok: true, room: { ...room, password_hash: undefined } });
  } catch (err) {
    console.error('room.join:', err);
    return res.status(500).json({ ok: false, msg: 'Join failed' });
  }
};

/* GET /api/rooms/:code */
exports.get = async (req, res) => {
  try {
    const room = await queryOne(
      `SELECT r.*, u.username AS host_name, u.avatar_color AS host_color
       FROM rooms r JOIN users u ON r.host_id=u.id WHERE r.code=? LIMIT 1`,
      [req.params.code.toUpperCase()]
    );
    if (!room) return res.status(404).json({ ok: false, msg: 'Room not found' });

    const [members, messages] = await Promise.all([
      query(
        `SELECT u.id, u.username, u.avatar_color, u.avatar_url, rm.joined_at
         FROM room_members rm JOIN users u ON rm.user_id=u.id WHERE rm.room_id=?`,
        [room.id]
      ),
      query(
        `SELECT rc.*, u.username, u.avatar_color FROM room_chat rc
         JOIN users u ON rc.user_id=u.id WHERE rc.room_id=? ORDER BY rc.created_at ASC LIMIT 100`,
        [room.id]
      ),
    ]);

    const { password_hash, ...safeRoom } = room;
    return res.json({ ok: true, room: safeRoom, members, messages });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* GET /api/rooms  (admin — all rooms) */
exports.listAll = async (req, res) => {
  try {
    const rooms = await query(
      `SELECT r.*, u.username AS host_name,
              (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id=r.id) AS member_count
       FROM rooms r JOIN users u ON r.host_id=u.id
       ORDER BY r.is_active DESC, r.created_at DESC LIMIT 100`
    );
    return res.json({ ok: true, rooms });
  } catch {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* DELETE /api/rooms/:code */
exports.close = async (req, res) => {
  try {
    const room = await queryOne('SELECT * FROM rooms WHERE code=?', [req.params.code.toUpperCase()]);
    if (!room) return res.status(404).json({ ok: false, msg: 'Room not found' });
    if (room.host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, msg: 'Only the host can close this room' });
    }
    await query('UPDATE rooms SET is_active=0 WHERE id=?', [room.id]);
    return res.json({ ok: true, msg: 'Room closed' });
  } catch {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};
