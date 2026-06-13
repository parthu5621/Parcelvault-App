'use strict';

const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const mapLocker = (row) => ({
  id: row.id,
  label: row.label,
  section: row.section,
  size: row.size,
  isOccupied: row.is_occupied === 1,
  currentParcelId: row.current_parcel_id,
});

// ─── GET /api/lockers ──────────────────────────────────────────────────────────
router.get('/', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM lockers ORDER BY section, label').all();
  res.json({ success: true, data: rows.map(mapLocker) });
});

// ─── GET /api/lockers/available ───────────────────────────────────────────────
router.get('/available', authenticate, (req, res) => {
  const { size } = req.query;
  let query = 'SELECT * FROM lockers WHERE is_occupied = 0';
  const params = [];
  if (size) {
    query += ' AND size = ?';
    params.push(size);
  }
  query += ' ORDER BY section, label';
  const rows = db.prepare(query).all(...params);
  res.json({ success: true, data: rows.map(mapLocker) });
});

// ─── GET /api/lockers/:id ──────────────────────────────────────────────────────
router.get('/:id', authenticate, (req, res) => {
  const row = db.prepare('SELECT * FROM lockers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Locker not found' });
  res.json({ success: true, data: mapLocker(row) });
});

// ─── GET /api/lockers/stats/summary ───────────────────────────────────────────
router.get('/stats/summary', authenticate, requireAdmin, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM lockers').get().count;
  const occupied = db.prepare('SELECT COUNT(*) as count FROM lockers WHERE is_occupied = 1').get().count;
  const bySection = db.prepare(`
    SELECT section,
      COUNT(*) as total,
      SUM(is_occupied) as occupied,
      COUNT(*) - SUM(is_occupied) as available
    FROM lockers GROUP BY section ORDER BY section
  `).all();
  const bySize = db.prepare(`
    SELECT size,
      COUNT(*) as total,
      SUM(is_occupied) as occupied
    FROM lockers GROUP BY size
  `).all();

  res.json({
    success: true,
    data: {
      total,
      occupied,
      available: total - occupied,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      bySection,
      bySize,
    },
  });
});

module.exports = router;
