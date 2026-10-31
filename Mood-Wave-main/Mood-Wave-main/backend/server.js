'use strict';
require('dotenv').config();
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/db');
const routes    = require('./routes/index');
const roomSocket = require('./socket/roomSocket');

const app    = express();
const server = http.createServer(app);
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Socket.io ──────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ORIGIN, methods: ['GET','POST'], credentials: true },
  pingTimeout: 20000,
  pingInterval: 10000,
});
roomSocket(io);

// ── Middleware ────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, cb) => cb(null, true),  // allow all origins in dev
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limits
app.use('/api/auth/login',    rateLimit({ windowMs: 15*60*1000, max: 20, standardHeaders: true }));
app.use('/api/auth/register', rateLimit({ windowMs: 60*60*1000, max: 10, standardHeaders: true }));
app.use('/api/',              rateLimit({ windowMs: 15*60*1000, max: 500, standardHeaders: true }));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Health & Root Endpoints ─────────────────────────────────────
app.get('/', (_, res) =>
  res.json({ ok: true, msg: 'MoodWave API is running', version: '2.0.0' })
);

app.get('/health', (_, res) =>
  res.json({ ok: true, msg: 'MoodWave API is running', timestamp: new Date().toISOString() })
);

// 404
app.use((req, res) => res.status(404).json({ ok: false, msg: `${req.method} ${req.path} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled:', err);
  res.status(500).json({ ok: false, msg: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;
server.listen(PORT, async () => {
  await testConnection();
  console.log(`
╔═══════════════════════════════════════╗
║   🎵  MoodWave v2 API  Running        ║
║   Port : ${PORT}                         ║
║   Env  : ${(process.env.NODE_ENV||'dev').padEnd(10)}                   ║
╚═══════════════════════════════════════╝`);
});

module.exports = { app, server };
