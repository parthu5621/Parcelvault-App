'use strict';

const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const mapLocker = (row) => ({
  id: row.id,
  label: row.label,
  building: row.building || 'Main Campus Hub',
  section: row.section,
  size: row.size,
  isOccupied: row.is_occupied === 1,
  currentParcelId: row.current_parcel_id,
});

// ─── GET /api/lockers ──────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lockers ORDER BY building, section, label');
    res.json({ success: true, data: rows.map(mapLocker) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/lockers/available ───────────────────────────────────────────────
router.get('/available', authenticate, async (req, res) => {
  const { size, building } = req.query;
  let query = 'SELECT * FROM lockers WHERE is_occupied = 0';
  const params = [];
  if (size) {
    query += ' AND size = ?';
    params.push(size);
  }
  if (building) {
    query += ' AND building = ?';
    params.push(building);
  }
  query += ' ORDER BY building, section, label';
  try {
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows.map(mapLocker) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/lockers/:id ──────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lockers WHERE id = ?', [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Locker not found' });
    res.json({ success: true, data: mapLocker(row) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/lockers/stats/summary ───────────────────────────────────────────
router.get('/stats/summary', authenticate, requireAdmin, async (req, res) => {
  try {
    const [[{ count: total }]] = await db.query('SELECT COUNT(*) as count FROM lockers');
    const [[{ count: occupied }]] = await db.query('SELECT COUNT(*) as count FROM lockers WHERE is_occupied = 1');
    const [bySection] = await db.query(`
      SELECT section,
        COUNT(*) as total,
        SUM(is_occupied) as occupied,
        COUNT(*) - SUM(is_occupied) as available
      FROM lockers GROUP BY section ORDER BY section
    `);
    const [bySize] = await db.query(`
      SELECT size,
        COUNT(*) as total,
        SUM(is_occupied) as occupied
      FROM lockers GROUP BY size
    `);

    res.json({
      success: true,
      data: {
        total: Number(total),
        occupied: Number(occupied),
        available: Number(total - occupied),
        occupancyRate: total > 0 ? Math.round((Number(occupied) / Number(total)) * 100) : 0,
        bySection: bySection.map(s => ({ ...s, total: Number(s.total), occupied: Number(s.occupied), available: Number(s.available) })),
        bySize: bySize.map(s => ({ ...s, total: Number(s.total), occupied: Number(s.occupied) })),
      },
    });
  } catch (err) {
    console.error('Locker stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
