'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const db = require('../db/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'parcelvault_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  // Check admins first
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (admin && bcrypt.compareSync(password, admin.password)) {
    const token = jwt.sign(
      { id: admin.id, role: 'admin', email: admin.email, name: admin.name },
      JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }
    );
    return res.json({ success: true, role: 'admin', token, user: { id: admin.id, name: admin.name, email: admin.email } });
  }

  // Check students
  const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
  if (student && bcrypt.compareSync(password, student.password)) {
    const token = jwt.sign(
      { id: student.id, role: 'student', email: student.email, name: student.name },
      JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }
    );
    return res.json({ success: true, role: 'student', token, user: { id: student.id, name: student.name, email: student.email, studentId: student.student_id, phone: student.phone } });
  }

  return res.status(401).json({ success: false, error: 'Invalid email or password' });
});

// ─── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', (req, res) => {
  const { name, email, phone, studentId, password, role = 'student' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email and password are required' });
  }

  // Strictly validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
  }

  // Strictly validate password complexity
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return res.status(400).json({ success: false, error: 'Password must contain both letters and numbers' });
  }

  const hashed = bcrypt.hashSync(password, 10);

  if (role === 'admin') {
    const exists = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ success: false, error: 'Email already registered as admin' });

    const id = randomUUID();
    db.prepare('INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)')
      .run(id, name, email, hashed);

    const token = jwt.sign({ id, role: 'admin', email, name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.status(201).json({ success: true, role: 'admin', token, user: { id, name, email } });
  }

  // Student registration
  if (!phone || !studentId) {
    return res.status(400).json({ success: false, error: 'Phone and student ID are required for student registration' });
  }

  // Strictly validate phone format (min 10 digits)
  const phoneRegex = /^\+?[0-9\s\-]{10,20}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid phone number (min 10 digits)' });
  }

  const emailExists = db.prepare('SELECT id FROM students WHERE email = ?').get(email);
  if (emailExists) return res.status(409).json({ success: false, error: 'Email already registered' });

  const sidExists = db.prepare('SELECT id FROM students WHERE student_id = ?').get(studentId);
  if (sidExists) return res.status(409).json({ success: false, error: 'Student ID already registered' });

  const id = randomUUID();
  db.prepare('INSERT INTO students (id, name, email, phone, student_id, password) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, email, phone, studentId, hashed);

  const token = jwt.sign({ id, role: 'student', email, name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return res.status(201).json({ success: true, role: 'student', token, user: { id, name, email, studentId, phone } });
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return res.json({ success: true, user: decoded });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

module.exports = router;
