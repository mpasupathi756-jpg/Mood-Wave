// routes/index.js
'use strict';
const express  = require('express');
const router   = express.Router();
const { authenticate, adminOnly, optionalAuth } = require('../middleware/auth');

const auth     = require('../controllers/authController');
const songs    = require('../controllers/songController');
const mood     = require('../controllers/moodController');
const rooms    = require('../controllers/roomController');
const playlists= require('../controllers/playlistController');
const admin    = require('../controllers/adminController');

// ── Health ───────────────────────────────────────────────────────────
router.get('/health', (_, res) =>
  res.json({ ok: true, msg: 'MoodWave API is running', timestamp: new Date().toISOString() })
);

// ── Auth ────────────────────────────────────────────────────────────
router.post('/auth/register',        auth.register);
router.post('/auth/login',           auth.login);
router.get ('/auth/me',              authenticate, auth.me);
router.put ('/auth/profile',         authenticate, auth.updateProfile);
router.put ('/auth/password',        authenticate, auth.changePassword);

// ── Songs ────────────────────────────────────────────────────────────
router.get ('/songs',                optionalAuth, songs.list);
router.get ('/songs/liked',          authenticate, songs.liked);
router.get ('/songs/history',        authenticate, songs.history);
router.get ('/songs/mood/:mood',     optionalAuth, songs.byMood);
router.get ('/songs/jamendo/search', authenticate, adminOnly, songs.jamendoSearch);
router.get ('/songs/:id',            optionalAuth, songs.get);
router.post('/songs',                authenticate, adminOnly, songs.add);
router.post('/songs/play',           authenticate, songs.recordPlay);
router.post('/songs/:id/like',       authenticate, songs.like);
router.post('/songs/jamendo/import', authenticate, adminOnly, songs.jamendoImport);
router.put ('/songs/:id',            authenticate, adminOnly, songs.update);
router.delete('/songs/:id',          authenticate, adminOnly, songs.remove);

// ── Mood ─────────────────────────────────────────────────────────────
router.post('/mood/detect',          optionalAuth, mood.detect);
router.get ('/mood/history',         authenticate, mood.history);
router.get ('/mood/stats',           authenticate, mood.stats);

// ── Rooms ────────────────────────────────────────────────────────────
router.post('/rooms',                authenticate, rooms.create);
router.post('/rooms/join',           authenticate, rooms.join);
router.get ('/rooms/all',            authenticate, adminOnly, rooms.listAll);
router.get ('/rooms/:code',          authenticate, rooms.get);
router.delete('/rooms/:code',        authenticate, rooms.close);

// ── Playlists ─────────────────────────────────────────────────────────
router.get ('/playlists',            authenticate, playlists.list);
router.post('/playlists',            authenticate, playlists.create);
router.get ('/playlists/:id',        optionalAuth, playlists.get);
router.post('/playlists/:id/songs',  authenticate, playlists.addSong);
router.delete('/playlists/:id/songs/:songId', authenticate, playlists.removeSong);
router.delete('/playlists/:id',      authenticate, playlists.remove);

// ── Admin ─────────────────────────────────────────────────────────────
router.get ('/admin/stats',          authenticate, adminOnly, admin.stats);
router.get ('/admin/users',          authenticate, adminOnly, admin.listUsers);
router.post('/admin/users',          authenticate, adminOnly, admin.createUser);
router.put ('/admin/users/:id',      authenticate, adminOnly, admin.updateUser);
router.delete('/admin/users/:id',    authenticate, adminOnly, admin.deleteUser);
router.get ('/admin/audit',          authenticate, adminOnly, admin.auditLog);

module.exports = router;
