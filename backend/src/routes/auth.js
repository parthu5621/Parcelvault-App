'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const db = require('../db/database');
const nodemailer = require('nodemailer');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'parcelvault_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Restores session for logged-in user from valid Bearer JWT
router.get('/me', authenticate, async (req, res) => {
  const { id, role } = req.user;
  console.log(`[AUTH LOG] GET /me -> User ID: ${id}, Role: ${role}`);

  try {
    if (role === 'admin') {
      const [admins] = await db.query('SELECT id, name, email FROM admins WHERE id = ?', [id]);
      if (!admins || admins.length === 0) {
        console.warn(`[AUTH LOG] GET /me -> Admin ID ${id} not found in DB`);
        return res.status(401).json({ success: false, error: 'User account no longer exists' });
      }
      const admin = admins[0];
      return res.json({
        success: true,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: 'admin'
        }
      });
    } else {
      const [students] = await db.query('SELECT id, name, email, phone, student_id FROM students WHERE id = ?', [id]);
      if (!students || students.length === 0) {
        console.warn(`[AUTH LOG] GET /me -> Student ID ${id} not found in DB`);
        return res.status(401).json({ success: false, error: 'User account no longer exists' });
      }
      const student = students[0];
      return res.json({
        success: true,
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          studentId: student.student_id,
          role: 'student'
        }
      });
    }
  } catch (err) {
    console.error('[AUTH LOG] GET /me error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  let { email, password, role } = req.body;
  if (!email || !password) {
    console.warn('[AUTH LOG] Login attempt missing credentials');
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  email = String(email).trim().toLowerCase();
  console.log(`[AUTH LOG] Login attempt for: ${email} (Requested role: ${role || 'any'})`);

  try {
    // 1. Search primary target table (admin or student based on role parameter)
    if (role === 'admin') {
      const [admins] = await db.query('SELECT * FROM admins WHERE LOWER(email) = ?', [email]);
      const admin = admins[0];
      if (admin && bcrypt.compareSync(password, admin.password)) {
        console.log(`[AUTH LOG] Admin login successful: ${email}`);
        const token = jwt.sign(
          { id: admin.id, role: 'admin', email: admin.email, name: admin.name },
          JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }
        );
        return res.json({
          success: true,
          role: 'admin',
          token,
          user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' }
        });
      }
    } else {
      const [students] = await db.query('SELECT * FROM students WHERE LOWER(email) = ?', [email]);
      const student = students[0];
      if (student && bcrypt.compareSync(password, student.password)) {
        console.log(`[AUTH LOG] Student login successful: ${email}`);
        const token = jwt.sign(
          { id: student.id, role: 'student', email: student.email, name: student.name },
          JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }
        );
        return res.json({
          success: true,
          role: 'student',
          token,
          user: { id: student.id, name: student.name, email: student.email, studentId: student.student_id, phone: student.phone, role: 'student' }
        });
      }
    }

    // 2. Fallback: check opposite table if first table did not produce a valid login
    if (role === 'admin') {
      const [students] = await db.query('SELECT * FROM students WHERE LOWER(email) = ?', [email]);
      const student = students[0];
      if (student && bcrypt.compareSync(password, student.password)) {
        console.log(`[AUTH LOG] Student login successful via fallback: ${email}`);
        const token = jwt.sign(
          { id: student.id, role: 'student', email: student.email, name: student.name },
          JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }
        );
        return res.json({
          success: true,
          role: 'student',
          token,
          user: { id: student.id, name: student.name, email: student.email, studentId: student.student_id, phone: student.phone, role: 'student' }
        });
      }
    } else {
      const [admins] = await db.query('SELECT * FROM admins WHERE LOWER(email) = ?', [email]);
      const admin = admins[0];
      if (admin && bcrypt.compareSync(password, admin.password)) {
        console.log(`[AUTH LOG] Admin login successful via fallback: ${email}`);
        const token = jwt.sign(
          { id: admin.id, role: 'admin', email: admin.email, name: admin.name },
          JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }
        );
        return res.json({
          success: true,
          role: 'admin',
          token,
          user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' }
        });
      }
    }

    console.warn(`[AUTH LOG] Invalid login credentials for: ${email}`);
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  } catch (err) {
    console.error('[AUTH LOG] Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  let { name, email, phone, studentId, password, role = 'student' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email and password are required' });
  }

  name = String(name).trim();
  email = String(email).trim().toLowerCase();

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

  try {
    if (role === 'admin') {
      const [admins] = await db.query('SELECT id FROM admins WHERE LOWER(email) = ?', [email]);
      if (admins.length > 0) return res.status(409).json({ success: false, error: 'Email already registered as admin' });

      const id = randomUUID();
      await db.query('INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)', [id, name, email, hashed]);
      console.log(`[AUTH LOG] New Admin registered: ${email}`);

      const token = jwt.sign({ id, role: 'admin', email, name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      return res.status(201).json({ success: true, role: 'admin', token, user: { id, name, email, role: 'admin' } });
    }

    // Student registration
    if (!phone || !studentId) {
      return res.status(400).json({ success: false, error: 'Phone and student ID are required for student registration' });
    }

    phone = String(phone).trim();
    studentId = String(studentId).trim();

    // Strictly validate phone format (min 10 digits)
    const phoneRegex = /^\+?[0-9\s\-]{10,20}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid phone number (min 10 digits)' });
    }

    const [existingEmails] = await db.query('SELECT id FROM students WHERE LOWER(email) = ?', [email]);
    if (existingEmails.length > 0) return res.status(409).json({ success: false, error: 'Email already registered' });

    const [existingSids] = await db.query('SELECT id FROM students WHERE UPPER(student_id) = ?', [studentId.toUpperCase()]);
    if (existingSids.length > 0) return res.status(409).json({ success: false, error: 'Student ID already registered' });

    const id = randomUUID();
    await db.query('INSERT INTO students (id, name, email, phone, student_id, password) VALUES (?, ?, ?, ?, ?, ?)', 
      [id, name, email, phone, studentId, hashed]);
    console.log(`[AUTH LOG] New Student registered: ${email} (${studentId})`);

    const token = jwt.sign({ id, role: 'student', email, name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.status(201).json({ success: true, role: 'student', token, user: { id, name, email, studentId, phone, role: 'student' } });
  } catch (err) {
    console.error('[AUTH LOG] Registration error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── PATCH /api/auth/update-profile ───────────────────────────────────────────
router.patch('/update-profile', authenticate, async (req, res) => {
  const { name, phone, studentId } = req.body;
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Name must be at least 2 characters' });
  }

  const { id, role } = req.user;

  try {
    if (role === 'admin') {
      await db.query('UPDATE admins SET name = ? WHERE id = ?', [String(name).trim(), id]);
      const [admins] = await db.query('SELECT id, name, email FROM admins WHERE id = ?', [id]);
      return res.json({ success: true, user: { id: admins[0].id, name: admins[0].name, email: admins[0].email, role: 'admin' } });
    } else {
      let updateSql = 'UPDATE students SET name = ?';
      const params = [String(name).trim()];

      if (phone && String(phone).trim()) {
        updateSql += ', phone = ?';
        params.push(String(phone).trim());
      }
      if (studentId && String(studentId).trim()) {
        updateSql += ', student_id = ?';
        params.push(String(studentId).trim());
      }
      updateSql += ' WHERE id = ?';
      params.push(id);

      await db.query(updateSql, params);
      const [students] = await db.query('SELECT id, name, email, phone, student_id FROM students WHERE id = ?', [id]);
      const student = students[0];
      return res.json({
        success: true,
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          studentId: student.student_id,
          role: 'student'
        }
      });
    }
  } catch (err) {
    console.error('[AUTH LOG] Update profile error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── PATCH /api/auth/change-password ──────────────────────────────────────────
router.patch('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Both current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
  }
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasLetter || !hasNumber) {
    return res.status(400).json({ success: false, error: 'New password must contain both letters and numbers' });
  }

  const { id, role } = req.user;

  try {
    const table = role === 'admin' ? 'admins' : 'students';
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    await db.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashed, id]);
    console.log(`[AUTH LOG] Password changed successfully for User ID: ${id}`);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[AUTH LOG] Change password error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  let { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  email = String(email).trim().toLowerCase();

  try {
    let user = null;

    const [admins] = await db.query('SELECT * FROM admins WHERE LOWER(email) = ?', [email]);
    if (admins.length > 0) {
      user = admins[0];
    } else {
      const [students] = await db.query('SELECT * FROM students WHERE LOWER(email) = ?', [email]);
      if (students.length > 0) {
        user = students[0];
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User with this email not found' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const id = randomUUID();

    await db.query('INSERT INTO password_resets (id, email, otp, expires_at) VALUES (?, ?, ?, ?)', [id, email, otp, expiresAt]);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'no-reply@parcelvault.com',
      to: email,
      subject: 'ParcelVault Password Reset OTP',
      text: `Your ParcelVault password reset OTP is: ${otp}\n\nThis OTP is valid for 15 minutes.`
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`[AUTH LOG] Password reset email sent to ${email}`);
    } else {
      console.log(`[AUTH LOG DEV MODE] Password reset OTP for ${email} is: ${otp}`);
    }

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    console.error('[AUTH LOG] Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  let { email, otp, newPassword } = req.body;
  
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' });
  }

  email = String(email).trim().toLowerCase();
  otp = String(otp).trim();

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
  }
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasLetter || !hasNumber) {
    return res.status(400).json({ success: false, error: 'New password must contain both letters and numbers' });
  }

  try {
    const [resets] = await db.query('SELECT * FROM password_resets WHERE LOWER(email) = ? AND otp = ? ORDER BY created_at DESC LIMIT 1', [email, otp]);
    const resetRecord = resets[0];

    if (!resetRecord) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }

    let table = null;
    const [admins] = await db.query('SELECT id FROM admins WHERE LOWER(email) = ?', [email]);
    if (admins.length > 0) table = 'admins';
    else {
      const [students] = await db.query('SELECT id FROM students WHERE LOWER(email) = ?', [email]);
      if (students.length > 0) table = 'students';
    }

    if (!table) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    await db.query(`UPDATE ${table} SET password = ? WHERE LOWER(email) = ?`, [hashed, email]);
    
    await db.query('DELETE FROM password_resets WHERE LOWER(email) = ?', [email]);
    console.log(`[AUTH LOG] Password reset successful for: ${email}`);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('[AUTH LOG] Reset password error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/auth/login-otp/send ───────────────────────────────────────────
router.post('/login-otp/send', async (req, res) => {
  let { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  email = String(email).trim().toLowerCase();

  try {
    let user = null;
    let role = null;

    const [admins] = await db.query('SELECT * FROM admins WHERE LOWER(email) = ?', [email]);
    if (admins.length > 0) {
      user = admins[0];
      role = 'admin';
    } else {
      const [students] = await db.query('SELECT * FROM students WHERE LOWER(email) = ?', [email]);
      if (students.length > 0) {
        user = students[0];
        role = 'student';
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const id = randomUUID();

    await db.query('DELETE FROM login_otps WHERE LOWER(email) = ?', [email]);
    await db.query('INSERT INTO login_otps (id, email, otp, expires_at) VALUES (?, ?, ?, ?)', [id, email, otp, expiresAt]);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'no-reply@parcelvault.com',
      to: email,
      subject: 'ParcelVault Login OTP',
      text: `Your ParcelVault login OTP is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share it with anyone.`
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`[AUTH LOG] Login OTP email sent to ${email}`);
    } else {
      console.log(`[AUTH LOG DEV MODE] Login OTP for ${email} is: ${otp}`);
    }

    res.json({ success: true, message: 'OTP sent to email', role });
  } catch (err) {
    console.error('[AUTH LOG] Send login OTP error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/auth/login-otp/verify ─────────────────────────────────────────
router.post('/login-otp/verify', async (req, res) => {
  let { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required' });
  }
  email = String(email).trim().toLowerCase();
  otp = String(otp).trim();

  try {
    const [otps] = await db.query('SELECT * FROM login_otps WHERE LOWER(email) = ? AND otp = ? ORDER BY created_at DESC LIMIT 1', [email, otp]);
    const otpRecord = otps[0];

    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }

    let user = null;
    let role = null;

    const [admins] = await db.query('SELECT * FROM admins WHERE LOWER(email) = ?', [email]);
    if (admins.length > 0) {
      user = admins[0];
      role = 'admin';
    } else {
      const [students] = await db.query('SELECT * FROM students WHERE LOWER(email) = ?', [email]);
      if (students.length > 0) {
        user = students[0];
        role = 'student';
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await db.query('DELETE FROM login_otps WHERE LOWER(email) = ?', [email]);

    const token = jwt.sign(
      { id: user.id, role, email: user.email, name: user.name },
      JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }
    );

    const userData = { id: user.id, name: user.name, email: user.email, role };
    if (role === 'student') {
      userData.studentId = user.student_id;
      userData.phone = user.phone;
    }

    console.log(`[AUTH LOG] Login via OTP verified successfully for: ${email}`);
    res.json({ success: true, role, token, user: userData });
  } catch (err) {
    console.error('[AUTH LOG] Verify login OTP error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;

