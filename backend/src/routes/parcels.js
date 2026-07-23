'use strict';

const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: generate structured QR payload
const generateQRPayload = (parcelId, trackingId, studentId, studentCode, lockerLabel, pickupToken) => {
  return JSON.stringify({
    system: 'ParcelVault',
    parcelId,
    bookingId: trackingId,
    customerId: studentCode || studentId,
    lockerNumber: lockerLabel || 'Unassigned',
    verificationToken: pickupToken,
    createdAt: new Date().toISOString()
  });
};

// Helper: map DB row to camelCase
const mapParcel = (row) => {
  const pickupToken = row.pickup_token || `PV-TOKEN-${(row.id || '0000').slice(0, 8)}`;
  const qrCodeData = row.qr_code_data || generateQRPayload(
    row.id,
    row.tracking_id,
    row.student_id,
    row.student_code || row.student_id,
    row.locker_label,
    pickupToken
  );

  return {
    id: row.id,
    trackingId: row.tracking_id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentCode: row.student_code || '',
    description: row.description,
    deliveryService: row.delivery_service,
    lockerId: row.locker_id,
    lockerLabel: row.locker_label,
    otp: row.otp,
    qrCodeData,
    pickupToken,
    status: row.status,
    arrivedAt: row.arrived_at,
    assignedAt: row.assigned_at,
    collectedAt: row.collected_at,
    expiresAt: row.expires_at,
  };
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const nowISO = () => new Date().toISOString();
const addDays = (d) => new Date(Date.now() + d * 86400000).toISOString();

// ─── GET /api/parcels ──────────────────────────────────────────────────────────
// Admin: all parcels | Student: their own parcels
router.get('/', authenticate, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      [rows] = await db.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id ORDER BY p.arrived_at DESC');
    } else {
      [rows] = await db.query(
        'SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE (p.student_id = ? OR s.id = ? OR s.student_id = ?) ORDER BY p.arrived_at DESC',
        [req.user.id, req.user.id, req.user.studentId || req.user.id]
      );
    }
    res.json({ success: true, data: rows.map(mapParcel) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/parcels/verify-qr (QR Scanning Verification) ─────────────────
router.post('/verify-qr', authenticate, async (req, res) => {
  const { qrData, token, parcelId, autoConfirm } = req.body;

  if (!qrData && !token && !parcelId) {
    return res.status(400).json({ success: false, error: 'QR data, token, or parcelId is required' });
  }

  try {
    let parsedQR = null;
    let rawStr = typeof qrData === 'string' ? qrData.trim() : (token || parcelId || '');

    if (rawStr.startsWith('{') && rawStr.endsWith('}')) {
      try {
        parsedQR = JSON.parse(rawStr);
      } catch (_e) { }
    } else if (typeof qrData === 'object' && qrData !== null) {
      parsedQR = qrData;
    }

    if (parsedQR && parsedQR.system && parsedQR.system !== 'ParcelVault') {
      return res.status(400).json({ success: false, error: 'Invalid QR code. Not a ParcelVault QR code.' });
    }

    const searchTokens = new Set();
    if (parcelId) searchTokens.add(String(parcelId).trim());
    if (token) searchTokens.add(String(token).trim());
    if (rawStr) searchTokens.add(rawStr);

    if (parsedQR) {
      if (parsedQR.parcelId) searchTokens.add(String(parsedQR.parcelId).trim());
      if (parsedQR.bookingId) searchTokens.add(String(parsedQR.bookingId).trim());
      if (parsedQR.verificationToken) searchTokens.add(String(parsedQR.verificationToken).trim());
      if (parsedQR.otp) searchTokens.add(String(parsedQR.otp).trim());
    }

    const searchList = Array.from(searchTokens).filter(Boolean);
    if (searchList.length === 0) {
      return res.status(400).json({ success: false, error: 'Empty QR code token string' });
    }

    const [rows] = await db.query(`
      SELECT p.*, s.student_id AS student_code 
      FROM parcels p 
      LEFT JOIN students s ON p.student_id = s.id 
      WHERE (
        p.id IN (?) OR 
        p.tracking_id IN (?) OR 
        p.pickup_token IN (?) OR 
        p.otp IN (?) OR
        p.qr_code_data IN (?)
      )
    `, [searchList, searchList, searchList, searchList, searchList]);

    let parcel = rows[0];

    // Fallback search if exact match in IN clause missed due to substring or token prefix
    if (!parcel) {
      const cleanToken = rawStr.replace('PV-TOKEN-', '').trim();
      const [fallbackRows] = await db.query(`
        SELECT p.*, s.student_id AS student_code 
        FROM parcels p 
        LEFT JOIN students s ON p.student_id = s.id 
        WHERE (
          p.pickup_token LIKE ? OR 
          p.otp = ? OR 
          p.tracking_id = ? OR
          p.id = ?
        )
      `, [`%${cleanToken}%`, cleanToken, cleanToken, cleanToken]);
      parcel = fallbackRows[0];
    }

    if (!parcel) {
      return res.status(404).json({ success: false, error: 'Invalid QR code. No matching parcel found in database.' });
    }

    if (parcel.status === 'collected') {
      return res.status(400).json({
        success: false,
        error: 'Duplicate pickup error: This parcel has ALREADY been collected.',
        parcel: mapParcel(parcel)
      });
    }

    if (parcel.status === 'expired') {
      return res.status(400).json({
        success: false,
        error: 'Expired QR code: This parcel reservation has expired.',
        parcel: mapParcel(parcel)
      });
    }

    if (parcel.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: `Parcel is not ready for pickup (current status: ${parcel.status}).`,
        parcel: mapParcel(parcel)
      });
    }

    // Always release parcel and free locker upon valid QR verification
    const collectedAt = nowISO();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query("UPDATE parcels SET status = 'collected', collected_at = ? WHERE id = ?", [collectedAt, parcel.id]);
      if (parcel.locker_id) {
        await connection.query('UPDATE lockers SET is_occupied = 0, current_parcel_id = NULL WHERE id = ?', [parcel.locker_id]);
      }
      
      const notifId = randomUUID();
      await connection.query(`
        INSERT INTO notifications (id, student_id, title, message, type, is_read, created_at)
        VALUES (?, ?, 'Parcel Picked Up', ?, 'update', 0, CURRENT_TIMESTAMP)
      `, [notifId, parcel.student_id, `Your parcel ${parcel.tracking_id} has been successfully collected via QR verification.`]);

      await connection.commit();

      const [updatedRows] = await connection.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE p.id = ?', [parcel.id]);
      return res.json({
        success: true,
        message: 'Student Identity Verified! Parcel released & locker freed successfully.',
        data: mapParcel(updatedRows[0])
      });
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Verify QR error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during QR verification' });
  }
});

// ─── POST /api/parcels/confirm-qr-pickup ─────────────────────────────────────
router.post('/confirm-qr-pickup', authenticate, async (req, res) => {
  const { parcelId, token } = req.body;
  if (!parcelId) return res.status(400).json({ success: false, error: 'parcelId is required' });

  try {
    const [rows] = await db.query('SELECT * FROM parcels WHERE id = ?', [parcelId]);
    const parcel = rows[0];
    if (!parcel) return res.status(404).json({ success: false, error: 'Parcel not found' });

    if (parcel.status === 'collected') {
      return res.status(400).json({ success: false, error: 'Duplicate pickup error: Parcel is already collected' });
    }

    if (parcel.status !== 'ready') {
      return res.status(400).json({ success: false, error: `Parcel cannot be picked up (status: ${parcel.status})` });
    }

    if (token && parcel.pickup_token && parcel.pickup_token !== token && parcel.otp !== token) {
      return res.status(400).json({ success: false, error: 'Invalid verification token' });
    }

    const collectedAt = nowISO();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query("UPDATE parcels SET status = 'collected', collected_at = ? WHERE id = ?", [collectedAt, parcel.id]);

      if (parcel.locker_id) {
        await connection.query('UPDATE lockers SET is_occupied = 0, current_parcel_id = NULL WHERE id = ?', [parcel.locker_id]);
      }

      const notifId = randomUUID();
      await connection.query(`
        INSERT INTO notifications (id, student_id, title, message, type, is_read, created_at)
        VALUES (?, ?, 'Parcel Picked Up', ?, 'update', 0, CURRENT_TIMESTAMP)
      `, [notifId, parcel.student_id, `Your parcel ${parcel.tracking_id} has been successfully collected.`]);

      await connection.commit();

      const [updatedRows] = await connection.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE p.id = ?', [parcel.id]);
      res.json({ success: true, message: 'Parcel status updated to Picked Up', data: mapParcel(updatedRows[0]) });
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Confirm QR pickup error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/parcels/:id ──────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE p.id = ?', [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Parcel not found' });

    if (req.user.role === 'student' && row.student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: mapParcel(row) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/parcels ─────────────────────────────────────────────────────────
// Admin only: log a new incoming parcel
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { studentId, description, deliveryService, trackingId } = req.body;

  if (!studentId || !description || !deliveryService) {
    return res.status(400).json({ success: false, error: 'studentId, description and deliveryService are required' });
  }

  try {
    const [students] = await db.query('SELECT * FROM students WHERE id = ? OR student_id = ?', [studentId, studentId]);
    const student = students[0];
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const id = randomUUID();
    const tid = trackingId || `PKG-2026-${String(Date.now()).slice(-5)}`;
    const arrivedAt = nowISO();
    const pickupToken = `PV-TOKEN-${randomUUID().slice(0, 8).toUpperCase()}`;
    const qrCodeData = generateQRPayload(id, tid, student.id, student.student_id, null, pickupToken);

    await db.query(`
      INSERT INTO parcels (id, tracking_id, student_id, student_name, description, delivery_service,
        locker_id, locker_label, otp, qr_code_data, pickup_token, status, arrived_at, assigned_at, collected_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, 'pending', ?, NULL, NULL, NULL)
    `, [id, tid, student.id, student.name, description, deliveryService, qrCodeData, pickupToken, arrivedAt]);

    const [parcels] = await db.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE p.id = ?', [id]);
    res.status(201).json({ success: true, data: mapParcel(parcels[0]) });
  } catch (err) {
    console.error('Create parcel error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── PATCH /api/parcels/:id/assign-locker ─────────────────────────────────────
// Admin only: assign a locker and generate OTP & QR payload
router.patch('/:id/assign-locker', authenticate, requireAdmin, async (req, res) => {
  const { lockerId } = req.body;
  if (!lockerId) return res.status(400).json({ success: false, error: 'lockerId is required' });

  try {
    const [parcels] = await db.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE p.id = ?', [req.params.id]);
    const parcel = parcels[0];
    if (!parcel) return res.status(404).json({ success: false, error: 'Parcel not found' });
    if (parcel.status !== 'pending') return res.status(400).json({ success: false, error: `Parcel is already ${parcel.status}` });

    const [lockers] = await db.query('SELECT * FROM lockers WHERE id = ?', [lockerId]);
    const locker = lockers[0];
    if (!locker) return res.status(404).json({ success: false, error: 'Locker not found' });
    if (locker.is_occupied) return res.status(409).json({ success: false, error: 'Locker is already occupied' });

    const otp = generateOTP();
    const assignedAt = nowISO();
    const expiresAt = addDays(5);
    const pickupToken = parcel.pickup_token || `PV-TOKEN-${randomUUID().slice(0, 8).toUpperCase()}`;
    const qrCodeData = generateQRPayload(parcel.id, parcel.tracking_id, parcel.student_id, parcel.student_code, locker.label, pickupToken);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update parcel
      await connection.query(`
        UPDATE parcels SET locker_id = ?, locker_label = ?, otp = ?, qr_code_data = ?, pickup_token = ?, status = 'ready',
          assigned_at = ?, expires_at = ? WHERE id = ?
      `, [locker.id, locker.label, otp, qrCodeData, pickupToken, assignedAt, expiresAt, parcel.id]);

      // Occupy locker
      await connection.query('UPDATE lockers SET is_occupied = 1, current_parcel_id = ? WHERE id = ?', [parcel.id, locker.id]);

      // Create notification
      const notifId = randomUUID();
      await connection.query(`
        INSERT INTO notifications (id, student_id, title, message, type, is_read, created_at)
        VALUES (?, ?, ?, ?, 'alert', 0, CURRENT_TIMESTAMP)
      `, [notifId, parcel.student_id, 'Parcel Ready for Pickup', `Your parcel ${parcel.tracking_id} has been assigned to Locker ${locker.label}. Scan QR or use OTP ${otp} to collect it.`]);

      await connection.commit();

      const [updatedParcels] = await connection.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE p.id = ?', [parcel.id]);
      res.json({ success: true, otp, data: mapParcel(updatedParcels[0]) });
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Assign locker error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── PATCH /api/parcels/:id/collect ───────────────────────────────────────────
// Student: collect their parcel using OTP
router.patch('/:id/collect', authenticate, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ success: false, error: 'OTP is required' });

  try {
    const [parcels] = await db.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE p.id = ?', [req.params.id]);
    const parcel = parcels[0];
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
    
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query("UPDATE parcels SET status = 'collected', collected_at = ? WHERE id = ?", [collectedAt, parcel.id]);

      if (parcel.locker_id) {
        await connection.query('UPDATE lockers SET is_occupied = 0, current_parcel_id = NULL WHERE id = ?', [parcel.locker_id]);
      }

      await connection.commit();

      const [updatedParcels] = await connection.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE p.id = ?', [parcel.id]);
      res.json({ success: true, data: mapParcel(updatedParcels[0]) });
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

// ─── PATCH /api/parcels/:id/release ───────────────────────────────────────────
// Admin: release a locker (mark parcel expired)
router.patch('/:id/release', authenticate, requireAdmin, async (req, res) => {
  try {
    const [parcels] = await db.query('SELECT p.*, s.student_id AS student_code FROM parcels p LEFT JOIN students s ON p.student_id = s.id WHERE p.id = ?', [req.params.id]);
    const parcel = parcels[0];
    if (!parcel) return res.status(404).json({ success: false, error: 'Parcel not found' });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query("UPDATE parcels SET status = 'expired', locker_id = NULL, locker_label = NULL, otp = NULL WHERE id = ?", [parcel.id]);

      if (parcel.locker_id) {
        await connection.query('UPDATE lockers SET is_occupied = 0, current_parcel_id = NULL WHERE id = ?', [parcel.locker_id]);
      }

      await connection.commit();

      const [updatedParcels] = await connection.query('SELECT * FROM parcels WHERE id = ?', [parcel.id]);
      res.json({ success: true, data: mapParcel(updatedParcels[0]) });
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

// ─── DELETE /api/parcels/:id ───────────────────────────────────────────────────
// Admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [parcels] = await db.query('SELECT * FROM parcels WHERE id = ?', [req.params.id]);
    const parcel = parcels[0];
    if (!parcel) return res.status(404).json({ success: false, error: 'Parcel not found' });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      if (parcel.locker_id) {
        await connection.query('UPDATE lockers SET is_occupied = 0, current_parcel_id = NULL WHERE id = ?', [parcel.locker_id]);
      }

      await connection.query('DELETE FROM parcels WHERE id = ?', [req.params.id]);

      await connection.commit();
      res.json({ success: true, message: 'Parcel deleted' });
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

// Automated background worker function to process expired parcels
async function checkExpiredParcels() {
  try {
    const nowISO = new Date().toISOString();
    const [expiredParcels] = await db.query(
      "SELECT * FROM parcels WHERE status = 'ready' AND expires_at IS NOT NULL AND expires_at < ?",
      [nowISO]
    );

    for (const parcel of expiredParcels) {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          "UPDATE parcels SET status = 'expired', locker_id = NULL, locker_label = NULL, otp = NULL WHERE id = ?",
          [parcel.id]
        );

        if (parcel.locker_id) {
          await connection.query(
            'UPDATE lockers SET is_occupied = 0, current_parcel_id = NULL WHERE id = ?',
            [parcel.locker_id]
          );
        }

        const notifId = randomUUID();
        await connection.query(
          `INSERT INTO notifications (id, student_id, title, message, type, is_read, created_at)
           VALUES (?, ?, ?, ?, 'alert', 0, CURRENT_TIMESTAMP)`,
          [
            notifId,
            parcel.student_id,
            'Parcel Expired',
            `Your parcel ${parcel.tracking_id} expired and locker ${parcel.locker_label || ''} has been released.`
          ]
        );

        await connection.commit();
        console.log(`[Auto-Expiry Engine] Parcel ${parcel.tracking_id} marked as expired and locker released.`);
      } catch (err) {
        await connection.rollback();
        console.error(`[Auto-Expiry Engine] Error expiring parcel ${parcel.id}:`, err);
      } finally {
        connection.release();
      }
    }
  } catch (err) {
    console.error('[Auto-Expiry Engine] Task execution error:', err);
  }
}

module.exports = {
  router,
  checkExpiredParcels
};
