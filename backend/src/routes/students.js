'use strict';

const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const mapStudent = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  studentId: row.student_id,
  createdAt: row.created_at,
});

// ─── GET /api/students ─────────────────────────────────────────────────────────
// Admin: all students
router.get('/', authenticate, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM students ORDER BY name').all();
  res.json({ success: true, data: rows.map(mapStudent) });
});

// ─── GET /api/students/search ──────────────────────────────────────────────────
// Admin: search by name, email, or student ID
router.get('/search', authenticate, requireAdmin, (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const rows = db.prepare(`
    SELECT * FROM students
    WHERE name LIKE ? OR email LIKE ? OR student_id LIKE ?
    ORDER BY name LIMIT 20
  `).all(q, q, q);
  res.json({ success: true, data: rows.map(mapStudent) });
});

// ─── GET /api/students/:id ─────────────────────────────────────────────────────
// Admin or the student themselves
router.get('/:id', authenticate, (req, res) => {
  if (req.user.role === 'student' && req.user.id !== req.params.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Student not found' });
  res.json({ success: true, data: mapStudent(row) });
});

// ─── GET /api/students/:id/parcels ─────────────────────────────────────────────
router.get('/:id/parcels', authenticate, (req, res) => {
  if (req.user.role === 'student' && req.user.id !== req.params.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  const rows = db.prepare('SELECT * FROM parcels WHERE student_id = ? ORDER BY arrived_at DESC').all(req.params.id);
  res.json({
    success: true,
    data: rows.map(r => ({
      id: r.id, trackingId: r.tracking_id, studentId: r.student_id, studentName: r.student_name,
      description: r.description, deliveryService: r.delivery_service,
      lockerId: r.locker_id, lockerLabel: r.locker_label, otp: r.otp, status: r.status,
      arrivedAt: r.arrived_at, assignedAt: r.assigned_at, collectedAt: r.collected_at, expiresAt: r.expires_at,
    })),
  });
});

// ─── DELETE /api/students/:id ──────────────────────────────────────────────────
// Admin only
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const row = db.prepare('SELECT id FROM students WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Student not found' });

  db.prepare('DELETE FROM notifications WHERE student_id = ?').run(req.params.id);
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Student removed' });
});

module.exports = router;
