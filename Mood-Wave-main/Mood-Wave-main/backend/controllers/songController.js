'use strict';
const { query, queryOne, pool } = require('../config/db');
const jamendo = require('../utils/jamendo');

/* GET /api/songs */
exports.list = async (req, res) => {
  try {
    const { genre, mood, search, featured, page = 1, limit = 24 } = req.query;
    const offset = (Math.max(1, +page) - 1) * Math.min(+limit, 50);
    const where  = ['1=1'];
    const params = [];

    if (genre)    { where.push('s.genre = ?');      params.push(genre); }
    if (mood)     { where.push('s.mood = ?');        params.push(mood); }
    if (featured) { where.push('s.is_featured = 1'); }
    if (search)   {
      where.push('(s.title LIKE ? OR s.artist LIKE ? OR s.album LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const countRow = await queryOne(
      `SELECT COUNT(*) AS n FROM songs s WHERE ${where.join(' AND ')}`, params
    );
    const safeLimit = Math.min(+limit, 50);
    const safeOffset = offset;
    const songs = await query(
      `SELECT s.* FROM songs s
       WHERE ${where.join(' AND ')}
       ORDER BY s.is_featured DESC, s.play_count DESC, s.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    // Attach liked status if authed
    if (req.user && songs.length) {
      const ids  = songs.map(s => s.id);
      const liked = await query(
        `SELECT song_id FROM song_likes WHERE user_id = ? AND song_id IN (${ids.map(() => '?').join(',')})`,
        [req.user.id, ...ids]
      );
      const likedSet = new Set(liked.map(r => r.song_id));
      songs.forEach(s => { s.liked = likedSet.has(s.id); });
    }

    return res.json({ ok: true, songs, total: countRow.n, page: +page });
  } catch (err) {
    console.error('songs.list:', err);
    return res.status(500).json({ ok: false, msg: 'Failed to fetch songs' });
  }
};

/* GET /api/songs/:id */
exports.get = async (req, res) => {
  try {
    const song = await queryOne(
      'SELECT s.*, u.username AS added_by_name FROM songs s LEFT JOIN users u ON s.added_by = u.id WHERE s.id = ?',
      [req.params.id]
    );
    if (!song) return res.status(404).json({ ok: false, msg: 'Song not found' });
    if (req.user) {
      const lk = await queryOne('SELECT 1 FROM song_likes WHERE user_id=? AND song_id=?', [req.user.id, song.id]);
      song.liked = !!lk;
    }
    return res.json({ ok: true, song });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* POST /api/songs  (admin) */
exports.add = async (req, res) => {
  try {
    const { jamendo_id, title, artist, album, genre, mood, duration, cover_url, audio_url, tags, bpm, is_featured } = req.body;
    if (!title?.trim() || !artist?.trim()) {
      return res.status(400).json({ ok: false, msg: 'title and artist are required' });
    }
    if (!audio_url?.trim()) {
      return res.status(400).json({ ok: false, msg: 'audio_url is required' });
    }

    const result = await query(
      `INSERT INTO songs (jamendo_id,title,artist,album,genre,mood,duration,cover_url,audio_url,tags,bpm,is_featured,added_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`,
      [jamendo_id||null, title.trim(), artist.trim(), album||null, genre||null, mood||null,
       +duration||0, cover_url||'', audio_url.trim(), tags||null, bpm||null, is_featured?1:0, req.user.id]
    );
    const newSongId = result[0]?.id || result.insertId;
    // Audit
    await query('INSERT INTO audit_log (admin_id,action,target,detail) VALUES (?,?,?,?)',
      [req.user.id, 'song_add', title, `id=${newSongId}`]);

    return res.status(201).json({ ok: true, id: newSongId, msg: 'Song added' });
  } catch (err) {
    if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, msg: 'Jamendo ID already imported' });
    console.error('songs.add:', err);
    return res.status(500).json({ ok: false, msg: 'Failed to add song' });
  }
};

/* PUT /api/songs/:id  (admin) */
exports.update = async (req, res) => {
  try {
    const { title, artist, album, genre, mood, duration, cover_url, audio_url, tags, bpm, is_featured } = req.body;
    await query(
      `UPDATE songs SET title=?,artist=?,album=?,genre=?,mood=?,duration=?,cover_url=?,audio_url=?,tags=?,bpm=?,is_featured=? WHERE id=?`,
      [title, artist, album||null, genre||null, mood||null, +duration||0, cover_url||'', audio_url||'', tags||null, bpm||null, is_featured?1:0, req.params.id]
    );
    await query('INSERT INTO audit_log (admin_id,action,target) VALUES (?,?,?)',
      [req.user.id, 'song_update', `id=${req.params.id}`]);
    return res.json({ ok: true, msg: 'Song updated' });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: 'Update failed' });
  }
};

/* DELETE /api/songs/:id  (admin) */
exports.remove = async (req, res) => {
  try {
    const song = await queryOne('SELECT title FROM songs WHERE id=?', [req.params.id]);
    if (!song) return res.status(404).json({ ok: false, msg: 'Not found' });
    await query('DELETE FROM songs WHERE id=?', [req.params.id]);
    await query('INSERT INTO audit_log (admin_id,action,target) VALUES (?,?,?)',
      [req.user.id, 'song_delete', song.title]);
    return res.json({ ok: true, msg: 'Song deleted' });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: 'Delete failed' });
  }
};

/* POST /api/songs/:id/like */
exports.like = async (req, res) => {
  try {
    let songId = +req.params.id;
    const userId = req.user.id;
    const songData = req.body?.song;

    // Handle Jamendo track or non-numeric ID
    if (isNaN(songId) || songId <= 0 || songData) {
      const jId = songData?.jamendo_id || String(req.params.id).replace(/^j_/, '');
      if (jId && jId !== 'undefined') {
        let existing = await queryOne('SELECT id FROM songs WHERE jamendo_id = ?', [jId]);
        if (!existing && songData) {
          const ins = await query(
            `INSERT INTO songs (jamendo_id, title, artist, album, duration, cover_url, audio_url, genre, mood)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (jamendo_id) DO UPDATE SET title = EXCLUDED.title
             RETURNING id`,
            [
              jId,
              songData.title || 'Unknown',
              songData.artist || 'Unknown Artist',
              songData.album || null,
              +songData.duration || 0,
              songData.cover_url || '',
              songData.audio_url || '',
              songData.genre || null,
              songData.mood || null
            ]
          );
          songId = ins[0]?.id || ins.insertId;
        } else if (existing) {
          songId = existing.id;
        }
      }
    }

    if (!songId || isNaN(songId)) {
      return res.status(400).json({ ok: false, msg: 'Invalid song ID or details' });
    }

    const exists = await queryOne('SELECT 1 FROM song_likes WHERE user_id=? AND song_id=?', [userId, songId]);
    if (exists) {
      await query('DELETE FROM song_likes WHERE user_id=? AND song_id=?', [userId, songId]);
      await query('UPDATE songs SET like_count = GREATEST(0, like_count-1) WHERE id=?', [songId]);
      return res.json({ ok: true, liked: false, song_id: songId });
    } else {
      await query(
        'INSERT INTO song_likes (user_id, song_id) VALUES (?,?) ON CONFLICT (user_id, song_id) DO NOTHING',
        [userId, songId]
      );
      await query('UPDATE songs SET like_count = like_count+1 WHERE id=?', [songId]);
      return res.json({ ok: true, liked: true, song_id: songId });
    }
  } catch (err) {
    console.error('Like error:', err);
    return res.status(500).json({ ok: false, msg: 'Like failed' });
  }
};

/* GET /api/songs/liked  (user's liked songs) */
exports.liked = async (req, res) => {
  try {
    const songs = await query(
      `SELECT s.* FROM songs s
       JOIN song_likes sl ON s.id = sl.song_id
       WHERE sl.user_id = ?
       ORDER BY sl.created_at DESC`,
      [req.user.id]
    );
    songs.forEach(s => { s.liked = true; });
    return res.json({ ok: true, songs });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* POST /api/songs/play  — record play */
exports.recordPlay = async (req, res) => {
  try {
    const { song_id, jamendo_id, song_title, song_artist, song_cover, duration_played, completed } = req.body;
    await query(
      `INSERT INTO listen_history (user_id, song_id, jamendo_id, song_title, song_artist, song_cover, duration_played, completed)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.id, song_id||null, jamendo_id||null, song_title||null, song_artist||null, song_cover||null, +duration_played||0, completed?1:0]
    );
    if (song_id) await query('UPDATE songs SET play_count = play_count+1 WHERE id=?', [song_id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* GET /api/songs/history */
exports.history = async (req, res) => {
  try {
    const rows = await query(
      `SELECT * FROM listen_history WHERE user_id=? ORDER BY played_at DESC LIMIT 50`,
      [req.user.id]
    );
    return res.json({ ok: true, history: rows });
  } catch {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* GET /api/songs/mood/:mood — Jamendo or DB */
exports.byMood = async (req, res) => {
  try {
    const { mood } = req.params;
    const limit = Math.min(+(req.query.limit)||20, 40);

    // Try DB first
    const dbSongs = await query(
      `SELECT * FROM songs WHERE mood LIKE ? OR tags LIKE ? ORDER BY play_count DESC LIMIT ?`,
      [`%${mood}%`, `%${mood}%`, limit]
    );

    // Always supplement with Jamendo live results for freshness
    let jamendoSongs = [];
    try { jamendoSongs = await jamendo.fetchByMood(mood, limit); } catch {}

    // Deduplicate by jamendo_id
    const dbJIds  = new Set(dbSongs.map(s => s.jamendo_id).filter(Boolean));
    const merged  = [...dbSongs, ...jamendoSongs.filter(s => !dbJIds.has(s.jamendo_id))];

    return res.json({ ok: true, songs: merged.slice(0, limit) });
  } catch (err) {
    console.error('byMood:', err);
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* GET /api/songs/jamendo/search  (admin) */
exports.jamendoSearch = async (req, res) => {
  try {
    const { q, limit = 16, offset = 0 } = req.query;
    if (!q?.trim()) return res.status(400).json({ ok: false, msg: 'q is required' });
    const result = await jamendo.searchTracks(q.trim(), +limit, +offset);
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('jamendoSearch:', err.message);
    return res.status(502).json({ ok: false, msg: 'Jamendo search failed' });
  }
};

/* POST /api/songs/jamendo/import  (admin) */
exports.jamendoImport = async (req, res) => {
  try {
    const { jamendo_id, title, artist, album, genre, mood, duration, cover_url, audio_url, tags } = req.body;
    if (!jamendo_id || !audio_url) return res.status(400).json({ ok: false, msg: 'jamendo_id and audio_url required' });

    const result = await query(
      `INSERT INTO songs (jamendo_id,title,artist,album,genre,mood,duration,cover_url,audio_url,tags,added_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT (jamendo_id) DO NOTHING
       RETURNING id`,
      [String(jamendo_id), title, artist, album||null, genre||null, mood||null, +duration||0, cover_url||'', audio_url, tags||null, req.user.id]
    );
    if (!result || result.length === 0) return res.status(409).json({ ok: false, msg: 'Already imported' });
    const importedId = result[0]?.id || result.insertId;
    await query('INSERT INTO audit_log (admin_id,action,target) VALUES (?,?,?)',
      [req.user.id, 'jamendo_import', `${title} by ${artist}`]);
    return res.status(201).json({ ok: true, id: importedId, msg: 'Imported successfully' });
  } catch (err) {
    if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, msg: 'Already imported' });
    console.error('jamendoImport:', err);
    return res.status(500).json({ ok: false, msg: 'Import failed' });
  }
};
