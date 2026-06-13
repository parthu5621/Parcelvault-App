'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

// ─── Routes ────────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const parcelRoutes       = require('./routes/parcels');
const lockerRoutes       = require('./routes/lockers');
const studentRoutes      = require('./routes/students');
const notifRoutes        = require('./routes/notifications');
const dashboardRoutes    = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/parcels',       parcelRoutes);
app.use('/api/lockers',       lockerRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/dashboard',     dashboardRoutes);

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

module.exports = app;
