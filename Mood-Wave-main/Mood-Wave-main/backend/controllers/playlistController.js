'use strict';
const { query, queryOne } = require('../config/db');

/* GET /api/playlists  (mine) */
exports.list = async (req, res) => {
  try {
    const rows = await query(
      `SELECT p.*, (SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id=p.id) AS song_count
       FROM playlists p WHERE p.user_id=? ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    return res.json({ ok: true, playlists: rows });
  } catch { return res.status(500).json({ ok: false, msg: 'Failed' }); }
};

/* POST /api/playlists */
exports.create = async (req, res) => {
  try {
    const { name, description, mood_tag, is_public } = req.body;
    if (!name?.trim()) return res.status(400).json({ ok: false, msg: 'Name required' });
    const r = await query(
      'INSERT INTO playlists (user_id,name,description,mood_tag,is_public) VALUES (?,?,?,?,?) RETURNING id',
      [req.user.id, name.trim(), description||null, mood_tag||null, is_public?1:0]
    );
    const id = r[0]?.id || r.insertId;
    return res.status(201).json({ ok: true, id });
  } catch { return res.status(500).json({ ok: false, msg: 'Failed' }); }
};

/* GET /api/playlists/:id */
exports.get = async (req, res) => {
  try {
    const pl = await queryOne(
      `SELECT p.*, u.username AS owner_name FROM playlists p JOIN users u ON p.user_id=u.id WHERE p.id=?`,
      [req.params.id]
    );
    if (!pl) return res.status(404).json({ ok: false, msg: 'Not found' });
    if (!pl.is_public && pl.user_id !== req.user?.id) {
      return res.status(403).json({ ok: false, msg: 'Private playlist' });
    }
    const songs = await query(
      `SELECT s.*, ps.position FROM songs s JOIN playlist_songs ps ON s.id=ps.song_id WHERE ps.playlist_id=? ORDER BY ps.position`,
      [pl.id]
    );
    return res.json({ ok: true, playlist: pl, songs });
  } catch { return res.status(500).json({ ok: false, msg: 'Failed' }); }
};

/* POST /api/playlists/:id/songs */
exports.addSong = async (req, res) => {
  try {
    const { song_id } = req.body;
    const pl = await queryOne('SELECT id,user_id FROM playlists WHERE id=?', [req.params.id]);
    if (!pl || pl.user_id !== req.user.id) return res.status(403).json({ ok: false, msg: 'Not your playlist' });
    const maxPos = await queryOne('SELECT MAX(position) AS mx FROM playlist_songs WHERE playlist_id=?', [pl.id]);
    await query(
      'INSERT INTO playlist_songs (playlist_id,song_id,position) VALUES (?,?,?) ON CONFLICT (playlist_id, song_id) DO NOTHING',
      [pl.id, song_id, (maxPos?.mx||0)+1]
    );
    await query('UPDATE playlists SET updated_at=NOW() WHERE id=?', [pl.id]);
    return res.json({ ok: true });
  } catch { return res.status(500).json({ ok: false, msg: 'Failed' }); }
};

/* DELETE /api/playlists/:id/songs/:songId */
exports.removeSong = async (req, res) => {
  try {
    const pl = await queryOne('SELECT id,user_id FROM playlists WHERE id=?', [req.params.id]);
    if (!pl || pl.user_id !== req.user.id) return res.status(403).json({ ok: false, msg: 'Not your playlist' });
    await query('DELETE FROM playlist_songs WHERE playlist_id=? AND song_id=?', [pl.id, req.params.songId]);
    return res.json({ ok: true });
  } catch { return res.status(500).json({ ok: false, msg: 'Failed' }); }
};

/* DELETE /api/playlists/:id */
exports.remove = async (req, res) => {
  try {
    const pl = await queryOne('SELECT user_id FROM playlists WHERE id=?', [req.params.id]);
    if (!pl || pl.user_id !== req.user.id) return res.status(403).json({ ok: false, msg: 'Not your playlist' });
    await query('DELETE FROM playlists WHERE id=?', [req.params.id]);
    return res.json({ ok: true });
  } catch { return res.status(500).json({ ok: false, msg: 'Failed' }); }
};
