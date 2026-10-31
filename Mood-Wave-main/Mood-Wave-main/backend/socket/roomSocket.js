'use strict';
const jwt    = require('jsonwebtoken');
const { query, queryOne } = require('../config/db');

// Per-room in-memory state
const roomState = new Map();
// socketId → {userId, roomCode}
const socketMeta = new Map();

function getOrInitRoom(code) {
  if (!roomState.has(code)) {
    roomState.set(code, {
      currentSong: null,
      isPlaying  : false,
      position   : 0,
      posAt      : Date.now(),
      hostId     : null,
      members    : new Map(), // userId → {username, avatar_color, socketId}
    });
  }
  return roomState.get(code);
}

function roomMembersArray(state) {
  return [...state.members.values()].map(({ socketId, ...rest }) => rest);
}

module.exports = (io) => {
  // Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_me');
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const uid = socket.userId;
    let user;
    try {
      user = await queryOne('SELECT id,username,avatar_color,avatar_url FROM users WHERE id=?', [uid]);
    } catch { return socket.disconnect(); }
    if (!user) return socket.disconnect();

    // ── JOIN ROOM ──────────────────────────────────────────────────
    socket.on('room:join', async ({ code }) => {
      if (!code) return;
      code = code.toUpperCase();

      // Verify membership in DB
      const room = await queryOne(
        'SELECT r.id, r.host_id FROM rooms r JOIN room_members rm ON r.id=rm.room_id WHERE r.code=? AND rm.user_id=? AND r.is_active=1',
        [code, uid]
      ).catch(() => null);
      if (!room) return socket.emit('error', { msg: 'Not a member of this room' });

      socket.join(code);
      socketMeta.set(socket.id, { userId: uid, roomCode: code });

      const state = getOrInitRoom(code);
      if (!state.hostId) state.hostId = room.host_id;
      state.members.set(uid, { userId: uid, username: user.username, avatar_color: user.avatar_color, avatar_url: user.avatar_url, socketId: socket.id });

      // Send current playback state to joiner
      const currentPos = state.isPlaying
        ? state.position + (Date.now() - state.posAt) / 1000
        : state.position;
      socket.emit('room:state', {
        currentSong: state.currentSong,
        isPlaying  : state.isPlaying,
        position   : currentPos,
        members    : roomMembersArray(state),
        hostId     : state.hostId,
      });

      // Notify others
      socket.to(code).emit('room:member-update', { members: roomMembersArray(state) });
      socket.to(code).emit('room:notification', { msg: `${user.username} joined` });
    });

    // ── PLAY ──────────────────────────────────────────────────────
    socket.on('room:play', async ({ code, song, position = 0 }) => {
      code = code?.toUpperCase();
      const state = roomState.get(code);
      if (!state || !state.members.has(uid)) return;
      if (!state.hostId) {
        const room = await queryOne('SELECT host_id FROM rooms WHERE code=?', [code]).catch(() => null);
        state.hostId = room?.host_id || null;
      }
      if (state.hostId !== uid) return socket.emit('room:error', { msg: 'Only the host can control playback' });
      if (song) state.currentSong = song;
      state.isPlaying = true;
      state.position  = position;
      state.posAt     = Date.now();
      socket.to(code).emit('room:play', { song: state.currentSong, position });
    });

    // ── PAUSE ─────────────────────────────────────────────────────
    socket.on('room:pause', async ({ code, position }) => {
      code = code?.toUpperCase();
      const state = roomState.get(code);
      if (!state || !state.members.has(uid)) return;
      if (!state.hostId) {
        const room = await queryOne('SELECT host_id FROM rooms WHERE code=?', [code]).catch(() => null);
        state.hostId = room?.host_id || null;
      }
      if (state.hostId !== uid) return socket.emit('room:error', { msg: 'Only the host can control playback' });
      state.isPlaying = false;
      state.position  = position ?? state.position;
      socket.to(code).emit('room:pause', { position: state.position });
    });

    // ── SEEK ──────────────────────────────────────────────────────
    socket.on('room:seek', async ({ code, position }) => {
      code = code?.toUpperCase();
      const state = roomState.get(code);
      if (!state || !state.members.has(uid)) return;
      if (!state.hostId) {
        const room = await queryOne('SELECT host_id FROM rooms WHERE code=?', [code]).catch(() => null);
        state.hostId = room?.host_id || null;
      }
      if (state.hostId !== uid) return socket.emit('room:error', { msg: 'Only the host can control playback' });
      state.position = position;
      state.posAt    = Date.now();
      socket.to(code).emit('room:seek', { position });
    });

    // ── CHANGE SONG ───────────────────────────────────────────────
    socket.on('room:song', async ({ code, song }) => {
      code = code?.toUpperCase();
      const state = roomState.get(code);
      if (!state || !state.members.has(uid)) return;
      if (!state.hostId) {
        const room = await queryOne('SELECT host_id FROM rooms WHERE code=?', [code]).catch(() => null);
        state.hostId = room?.host_id || null;
      }
      if (state.hostId !== uid) return socket.emit('room:error', { msg: 'Only the host can control playback' });
      state.currentSong = song;
      state.isPlaying   = true;
      state.position    = 0;
      state.posAt       = Date.now();
      io.to(code).emit('room:song', { song, changedBy: user.username });
    });

    // ── CHAT ─────────────────────────────────────────────────────
    socket.on('room:chat', async ({ code, content, msg_type = 'text', song_data }) => {
      if (!content?.trim() && msg_type === 'text') return;
      code = code?.toUpperCase();
      const state = roomState.get(code);
      if (!state || !state.members.has(uid)) return;

      try {
        const room = await queryOne('SELECT id FROM rooms WHERE code=?', [code]);
        if (!room) return;
        const result = await query(
          'INSERT INTO room_chat (room_id,user_id,msg_type,content,song_data) VALUES (?,?,?,?,?) RETURNING id',
          [room.id, uid, msg_type, content.trim(), song_data ? JSON.stringify(song_data) : null]
        );
        const chatId = result[0]?.id || result.insertId;
        io.to(code).emit('room:chat', {
          id        : chatId,
          user_id   : uid,
          username  : user.username,
          avatar_color: user.avatar_color,
          msg_type,
          content   : content.trim(),
          song_data,
          created_at: new Date().toISOString(),
        });
      } catch (err) { console.error('chat save:', err); }
    });

    // ── TYPING ────────────────────────────────────────────────────
    socket.on('room:typing', ({ code, isTyping }) => {
      socket.to(code?.toUpperCase()).emit('room:typing', { userId: uid, username: user.username, isTyping });
    });

    // ── REACT (emoji reaction) ────────────────────────────────────
    socket.on('room:react', ({ code, emoji }) => {
      io.to(code?.toUpperCase()).emit('room:react', { userId: uid, username: user.username, emoji });
    });

    // ── LEAVE ────────────────────────────────────────────────────
    socket.on('room:leave', ({ code }) => {
      code = code?.toUpperCase();
      socket.leave(code);
      const state = roomState.get(code);
      if (state) {
        state.members.delete(uid);
        io.to(code).emit('room:member-update', { members: roomMembersArray(state) });
        io.to(code).emit('room:notification', { msg: `${user.username} left` });
        if (state.members.size === 0) roomState.delete(code);
      }
      socketMeta.delete(socket.id);
    });

    // ── DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', () => {
      const meta = socketMeta.get(socket.id);
      if (meta) {
        const { roomCode } = meta;
        const state = roomState.get(roomCode);
        if (state) {
          state.members.delete(uid);
          io.to(roomCode).emit('room:member-update', { members: roomMembersArray(state) });
          io.to(roomCode).emit('room:notification', { msg: `${user.username} disconnected` });
          if (state.members.size === 0) roomState.delete(roomCode);
        }
        socketMeta.delete(socket.id);
      }
    });
  });
};
