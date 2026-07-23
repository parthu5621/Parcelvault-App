'use strict';

const express = require('express');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'parcelvault_secret';

// ─── POST /api/feedback (Submit Student Feedback) ───────────────────────────
router.post('/', async (req, res) => {
  const { subject, message, rating, email, name } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }
  // subject is optional — fall back to a short snippet of the message
  const resolvedSubject = (subject && subject.trim()) ? subject.trim() : message.trim().slice(0, 60);

  let studentId = null;
  let studentName = name || 'Anonymous Student';
  let studentEmail = email || 'student@university.edu';

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      studentId = decoded.id;
      studentEmail = decoded.email || studentEmail;
      studentName = decoded.name || studentName;
    } catch (_e) { }
  }

  // Fetch actual DB student record if studentId is present
  if (studentId) {
    try {
      const [students] = await db.query('SELECT name, email FROM students WHERE id = ? OR student_id = ?', [studentId, studentId]);
      if (students && students[0]) {
        if (students[0].name) studentName = students[0].name;
        if (students[0].email) studentEmail = students[0].email;
      }
    } catch (_dbErr) { }
  }

  try {
    const feedbackId = randomUUID();
    const safeRating = Number.isInteger(Number(rating)) && Number(rating) >= 0 && Number(rating) <= 5 ? Number(rating) : 0;
    await db.query(
      'INSERT INTO feedback (id, student_id, student_name, email, subject, message, rating, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [feedbackId, studentId, studentName, studentEmail, resolvedSubject, message.trim(), safeRating, 'unread']
    );

    // Create an Admin notification so admin receives it immediately
    const notifId = randomUUID();
    await db.query(
      'INSERT INTO notifications (id, student_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)',
      [
        notifId,
        'admin_all',
        `💬 New Student Feedback: ${resolvedSubject}`,
        `From ${studentName} (${studentEmail}): "${message.trim()}"`,
        'feedback',
        0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully to admin',
      feedbackId
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/feedback (Admin View All Feedback) ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM feedback ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get feedback error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
