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
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM students ORDER BY name');
    res.json({ success: true, data: rows.map(mapStudent) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/students/search ──────────────────────────────────────────────────
// Admin: search by name, email, or student ID
router.get('/search', authenticate, requireAdmin, async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await db.query(`
      SELECT * FROM students
      WHERE name LIKE ? OR email LIKE ? OR student_id LIKE ?
      ORDER BY name LIMIT 20
    `, [q, q, q]);
    res.json({ success: true, data: rows.map(mapStudent) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/students/:id ─────────────────────────────────────────────────────
// Admin or the student themselves
router.get('/:id', authenticate, async (req, res) => {
  if (req.user.role === 'student' && req.user.id !== req.params.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: mapStudent(row) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/students/:id/parcels ─────────────────────────────────────────────
router.get('/:id/parcels', authenticate, async (req, res) => {
  if (req.user.role === 'student' && req.user.id !== req.params.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  try {
    const [rows] = await db.query(`
      SELECT p.*, s.student_id AS student_code 
      FROM parcels p 
      LEFT JOIN students s ON p.student_id = s.id 
      WHERE p.student_id = ? 
      ORDER BY p.arrived_at DESC
    `, [req.params.id]);
    res.json({
      success: true,
      data: rows.map(r => ({
        id: r.id, trackingId: r.tracking_id, studentId: r.student_id, studentName: r.student_name,
        studentCode: r.student_code || '',
        description: r.description, deliveryService: r.delivery_service,
        lockerId: r.locker_id, lockerLabel: r.locker_label, otp: r.otp, status: r.status,
        arrivedAt: r.arrived_at, assignedAt: r.assigned_at, collectedAt: r.collected_at, expiresAt: r.expires_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── DELETE /api/students/:id ──────────────────────────────────────────────────
// Admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM students WHERE id = ?', [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Student not found' });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query('DELETE FROM notifications WHERE student_id = ?', [req.params.id]);
      await connection.query('DELETE FROM students WHERE id = ?', [req.params.id]);
      
      await connection.commit();
      res.json({ success: true, message: 'Student removed' });
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
