'use strict';

const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const mapNotif = (row) => ({
  id: row.id,
  studentId: row.student_id,
  title: row.title,
  message: row.message,
  type: row.type,
  isRead: row.is_read === 1,
  createdAt: row.created_at,
});

// ─── GET /api/notifications ────────────────────────────────────────────────────
// Student: their own | Admin: all
router.get('/', authenticate, (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100').all();
  } else {
    rows = db.prepare('SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC').all(req.user.id);
  }
  res.json({ success: true, data: rows.map(mapNotif) });
});

// ─── GET /api/notifications/unread-count ──────────────────────────────────────
router.get('/unread-count', authenticate, (req, res) => {
  let count;
  if (req.user.role === 'admin') {
    count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get().count;
  } else {
    count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE student_id = ? AND is_read = 0').get(req.user.id).count;
  }
  res.json({ success: true, count });
});

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch('/:id/read', authenticate, (req, res) => {
  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Notification not found' });

  if (req.user.role === 'student' && row.student_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: mapNotif({ ...row, is_read: 1 }) });
});

// ─── PATCH /api/notifications/read-all ────────────────────────────────────────
router.patch('/read-all', authenticate, (req, res) => {
  if (req.user.role === 'admin') {
    db.prepare('UPDATE notifications SET is_read = 1').run();
  } else {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE student_id = ?').run(req.user.id);
  }
  res.json({ success: true, message: 'All notifications marked as read' });
});

// ─── DELETE /api/notifications/:id ────────────────────────────────────────────
router.delete('/:id', authenticate, (req, res) => {
  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Notification not found' });

  if (req.user.role === 'student' && row.student_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = router;
