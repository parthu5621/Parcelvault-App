'use strict';

const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
// Admin dashboard overview
router.get('/stats', authenticate, requireAdmin, (req, res) => {
  const totalParcels    = db.prepare("SELECT COUNT(*) as c FROM parcels").get().c;
  const pendingParcels  = db.prepare("SELECT COUNT(*) as c FROM parcels WHERE status = 'pending'").get().c;
  const readyParcels    = db.prepare("SELECT COUNT(*) as c FROM parcels WHERE status = 'ready'").get().c;
  const collectedToday  = db.prepare("SELECT COUNT(*) as c FROM parcels WHERE status = 'collected' AND DATE(collected_at) = DATE('now')").get().c;
  const expiredParcels  = db.prepare("SELECT COUNT(*) as c FROM parcels WHERE status = 'expired'").get().c;

  const totalLockers    = db.prepare("SELECT COUNT(*) as c FROM lockers").get().c;
  const occupiedLockers = db.prepare("SELECT COUNT(*) as c FROM lockers WHERE is_occupied = 1").get().c;

  const totalStudents   = db.prepare("SELECT COUNT(*) as c FROM students").get().c;

  // Parcels per day for last 7 days
  const recentActivity = db.prepare(`
    SELECT DATE(arrived_at) as date, COUNT(*) as count
    FROM parcels
    WHERE arrived_at >= DATE('now', '-7 days')
    GROUP BY DATE(arrived_at)
    ORDER BY date ASC
  `).all();

  // Status breakdown
  const statusBreakdown = db.prepare(`
    SELECT status, COUNT(*) as count FROM parcels GROUP BY status
  `).all();

  res.json({
    success: true,
    data: {
      parcels: {
        total: totalParcels,
        pending: pendingParcels,
        ready: readyParcels,
        collectedToday,
        expired: expiredParcels,
      },
      lockers: {
        total: totalLockers,
        occupied: occupiedLockers,
        available: totalLockers - occupiedLockers,
        occupancyRate: totalLockers > 0 ? Math.round((occupiedLockers / totalLockers) * 100) : 0,
      },
      students: { total: totalStudents },
      recentActivity,
      statusBreakdown,
    },
  });
});

// ─── GET /api/dashboard/student-stats ─────────────────────────────────────────
// Student: their personal summary
router.get('/student-stats', authenticate, (req, res) => {
  const sid = req.user.id;

  const total     = db.prepare("SELECT COUNT(*) as c FROM parcels WHERE student_id = ?").get(sid).c;
  const pending   = db.prepare("SELECT COUNT(*) as c FROM parcels WHERE student_id = ? AND status = 'pending'").get(sid).c;
  const ready     = db.prepare("SELECT COUNT(*) as c FROM parcels WHERE student_id = ? AND status = 'ready'").get(sid).c;
  const collected = db.prepare("SELECT COUNT(*) as c FROM parcels WHERE student_id = ? AND status = 'collected'").get(sid).c;
  const unread    = db.prepare("SELECT COUNT(*) as c FROM notifications WHERE student_id = ? AND is_read = 0").get(sid).c;

  const recentParcels = db.prepare(`
    SELECT id, tracking_id, description, status, arrived_at, locker_label
    FROM parcels WHERE student_id = ? ORDER BY arrived_at DESC LIMIT 5
  `).all(sid).map(r => ({
    id: r.id, trackingId: r.tracking_id, description: r.description,
    status: r.status, arrivedAt: r.arrived_at, lockerLabel: r.locker_label,
  }));

  res.json({
    success: true,
    data: { total, pending, ready, collected, unreadNotifications: unread, recentParcels },
  });
});

module.exports = router;
