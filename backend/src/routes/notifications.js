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
router.get('/', authenticate, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      [rows] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100');
    } else {
      [rows] = await db.query(
        "SELECT * FROM notifications WHERE (student_id = ? OR student_id = ? OR student_id = 'all' OR student_id = 'student_all') ORDER BY created_at DESC",
        [req.user.id, req.user.studentId || req.user.id]
      );
    }
    res.json({ success: true, data: rows.map(mapNotif) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/notifications/send (Admin Send Custom Notification) ─────────────
router.post('/send', authenticate, async (req, res) => {
  const { studentId, title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, error: 'Title and message are required' });
  }

  try {
    let targetStudentId = studentId || 'all';
    let studentName = 'All Students';

    if (targetStudentId !== 'all') {
      const [students] = await db.query(
        'SELECT * FROM students WHERE id = ? OR student_id = ? OR LOWER(email) = ? OR LOWER(name) LIKE ?',
        [targetStudentId, targetStudentId, String(targetStudentId).toLowerCase(), `%${targetStudentId}%`]
      );
      if (students[0]) {
        targetStudentId = students[0].id;
        studentName = students[0].name;
      }
    }

    const { randomUUID } = require('crypto');
    const notifId = randomUUID();
    const notifType = type || 'alert';

    await db.query(
      'INSERT INTO notifications (id, student_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)',
      [notifId, targetStudentId, title.trim(), message.trim(), notifType, 0]
    );

    res.status(201).json({
      success: true,
      message: `Notification sent to ${studentName}`,
      data: { id: notifId, studentId: targetStudentId, title, message, type: notifType }
    });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/notifications/unread-count ──────────────────────────────────────
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    let count;
    if (req.user.role === 'admin') {
      const [[result]] = await db.query('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0');
      count = result.count;
    } else {
      const [[result]] = await db.query('SELECT COUNT(*) as count FROM notifications WHERE student_id = ? AND is_read = 0', [req.user.id]);
      count = result.count;
    }
    res.json({ success: true, count: Number(count) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Notification not found' });

    if (req.user.role === 'student' && row.student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: mapNotif({ ...row, is_read: 1 }) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── PATCH /api/notifications/read-all ────────────────────────────────────────
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      await db.query('UPDATE notifications SET is_read = 1');
    } else {
      await db.query('UPDATE notifications SET is_read = 1 WHERE student_id = ?', [req.user.id]);
    }
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── DELETE /api/notifications/:id ────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Notification not found' });

    if (req.user.role === 'student' && row.student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await db.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
