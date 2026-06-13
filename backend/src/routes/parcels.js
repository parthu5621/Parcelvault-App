'use strict';

const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: map DB row to camelCase
const mapParcel = (row) => ({
  id: row.id,
  trackingId: row.tracking_id,
  studentId: row.student_id,
  studentName: row.student_name,
  description: row.description,
  deliveryService: row.delivery_service,
  lockerId: row.locker_id,
  lockerLabel: row.locker_label,
  otp: row.otp,
  status: row.status,
  arrivedAt: row.arrived_at,
  assignedAt: row.assigned_at,
  collectedAt: row.collected_at,
  expiresAt: row.expires_at,
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const nowISO = () => new Date().toISOString();
const addDays = (d) => new Date(Date.now() + d * 86400000).toISOString();

// ─── GET /api/parcels ──────────────────────────────────────────────────────────
// Admin: all parcels | Student: their own parcels
router.get('/', authenticate, (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare('SELECT * FROM parcels ORDER BY arrived_at DESC').all();
  } else {
    rows = db.prepare('SELECT * FROM parcels WHERE student_id = ? ORDER BY arrived_at DESC').all(req.user.id);
  }
  res.json({ success: true, data: rows.map(mapParcel) });
});

// ─── GET /api/parcels/:id ──────────────────────────────────────────────────────
router.get('/:id', authenticate, (req, res) => {
  const row = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Parcel not found' });

  // Students can only see their own parcels
  if (req.user.role === 'student' && row.student_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  res.json({ success: true, data: mapParcel(row) });
});

// ─── POST /api/parcels ─────────────────────────────────────────────────────────
// Admin only: log a new incoming parcel
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { studentId, description, deliveryService, trackingId } = req.body;

  if (!studentId || !description || !deliveryService) {
    return res.status(400).json({ success: false, error: 'studentId, description and deliveryService are required' });
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

  const id = randomUUID();
  const tid = trackingId || `PKG-2026-${String(Date.now()).slice(-5)}`;
  const arrivedAt = nowISO();

  db.prepare(`
    INSERT INTO parcels (id, tracking_id, student_id, student_name, description, delivery_service,
      locker_id, locker_label, otp, status, arrived_at, assigned_at, collected_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, 'pending', ?, NULL, NULL, NULL)
  `).run(id, tid, student.id, student.name, description, deliveryService, arrivedAt);

  const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(id);
  res.status(201).json({ success: true, data: mapParcel(parcel) });
});

// ─── PATCH /api/parcels/:id/assign-locker ─────────────────────────────────────
// Admin only: assign a locker and generate OTP
router.patch('/:id/assign-locker', authenticate, requireAdmin, (req, res) => {
  const { lockerId } = req.body;
  if (!lockerId) return res.status(400).json({ success: false, error: 'lockerId is required' });

  const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id);
  if (!parcel) return res.status(404).json({ success: false, error: 'Parcel not found' });
  if (parcel.status !== 'pending') return res.status(400).json({ success: false, error: `Parcel is already ${parcel.status}` });

  const locker = db.prepare('SELECT * FROM lockers WHERE id = ?').get(lockerId);
  if (!locker) return res.status(404).json({ success: false, error: 'Locker not found' });
  if (locker.is_occupied) return res.status(409).json({ success: false, error: 'Locker is already occupied' });

  const otp = generateOTP();
  const assignedAt = nowISO();
  const expiresAt = addDays(5);

  // Update parcel
  db.prepare(`
    UPDATE parcels SET locker_id = ?, locker_label = ?, otp = ?, status = 'ready',
      assigned_at = ?, expires_at = ? WHERE id = ?
  `).run(locker.id, locker.label, otp, assignedAt, expiresAt, parcel.id);

  // Occupy locker
  db.prepare('UPDATE lockers SET is_occupied = 1, current_parcel_id = ? WHERE id = ?')
    .run(parcel.id, locker.id);

  // Create notification
  const notifId = randomUUID();
  db.prepare(`
    INSERT INTO notifications (id, student_id, title, message, type, is_read, created_at)
    VALUES (?, ?, ?, ?, 'alert', 0, ?)
  `).run(
    notifId, parcel.student_id,
    'Parcel Ready for Pickup',
    `Your parcel ${parcel.tracking_id} has been assigned to Locker ${locker.label}. Use OTP ${otp} to collect it.`,
    assignedAt
  );

  const updated = db.prepare('SELECT * FROM parcels WHERE id = ?').get(parcel.id);
  res.json({ success: true, otp, data: mapParcel(updated) });
});

// ─── PATCH /api/parcels/:id/collect ───────────────────────────────────────────
// Student: collect their parcel using OTP
router.patch('/:id/collect', authenticate, (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ success: false, error: 'OTP is required' });

  const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id);
  if (!parcel) return res.status(404).json({ success: false, error: 'Parcel not found' });

  if (req.user.role === 'student' && parcel.student_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  if (parcel.status !== 'ready') {
    return res.status(400).json({ success: false, error: `Parcel is not ready for pickup (status: ${parcel.status})` });
  }
  if (parcel.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid OTP. Please try again.' });
  }

  const collectedAt = nowISO();
  db.prepare("UPDATE parcels SET status = 'collected', collected_at = ? WHERE id = ?")
    .run(collectedAt, parcel.id);

  if (parcel.locker_id) {
    db.prepare('UPDATE lockers SET is_occupied = 0, current_parcel_id = NULL WHERE id = ?')
      .run(parcel.locker_id);
  }

  const updated = db.prepare('SELECT * FROM parcels WHERE id = ?').get(parcel.id);
  res.json({ success: true, data: mapParcel(updated) });
});

// ─── PATCH /api/parcels/:id/release ───────────────────────────────────────────
// Admin: release a locker (mark parcel expired)
router.patch('/:id/release', authenticate, requireAdmin, (req, res) => {
  const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id);
  if (!parcel) return res.status(404).json({ success: false, error: 'Parcel not found' });

  db.prepare("UPDATE parcels SET status = 'expired', locker_id = NULL, locker_label = NULL, otp = NULL WHERE id = ?")
    .run(parcel.id);

  if (parcel.locker_id) {
    db.prepare('UPDATE lockers SET is_occupied = 0, current_parcel_id = NULL WHERE id = ?')
      .run(parcel.locker_id);
  }

  const updated = db.prepare('SELECT * FROM parcels WHERE id = ?').get(parcel.id);
  res.json({ success: true, data: mapParcel(updated) });
});

// ─── DELETE /api/parcels/:id ───────────────────────────────────────────────────
// Admin only
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id);
  if (!parcel) return res.status(404).json({ success: false, error: 'Parcel not found' });

  if (parcel.locker_id) {
    db.prepare('UPDATE lockers SET is_occupied = 0, current_parcel_id = NULL WHERE id = ?')
      .run(parcel.locker_id);
  }

  db.prepare('DELETE FROM parcels WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Parcel deleted' });
});

module.exports = router;
