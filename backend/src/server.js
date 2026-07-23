'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

// ─── Routes ────────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const parcelRoutesModule = require('./routes/parcels');
const lockerRoutes       = require('./routes/lockers');
const studentRoutes      = require('./routes/students');
const notifRoutes        = require('./routes/notifications');
const dashboardRoutes    = require('./routes/dashboard');
const feedbackRoutes     = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for authentication & API activity
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/auth')) {
      console.log(`[AUTH SERVER LOG] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/parcels',       parcelRoutesModule.router);
app.use('/api/lockers',       lockerRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/feedback',      feedbackRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ParcelVault API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const db = require('./db/database');

async function startServer() {
  await db.initDB();

  // Run initial check and set up periodic auto-expiry engine (every 60 seconds)
  parcelRoutesModule.checkExpiredParcels();
  setInterval(() => {
    parcelRoutesModule.checkExpiredParcels();
  }, 60000);

  app.listen(PORT, () => {
    console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║     📦  ParcelVault API Server       ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log(`  ║  🚀  Running on http://localhost:${PORT}  ║`);
  console.log(`  ║  🌍  Mode: ${process.env.NODE_ENV || 'development'}              ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log('  API Endpoints:');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/register');
  console.log('  GET    /api/parcels');
  console.log('  POST   /api/parcels');
  console.log('  PATCH  /api/parcels/:id/assign-locker');
  console.log('  PATCH  /api/parcels/:id/collect');
  console.log('  GET    /api/lockers');
  console.log('  GET    /api/lockers/available');
  console.log('  GET    /api/students');
  console.log('  GET    /api/notifications');
  console.log('  GET    /api/dashboard/stats');
  console.log('');
  });
}

startServer();

module.exports = app;
