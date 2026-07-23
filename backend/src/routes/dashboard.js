'use strict';

const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
// Admin dashboard overview
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [[{ c: totalParcels }]] = await db.query("SELECT COUNT(*) as c FROM parcels");
    const [[{ c: pendingParcels }]] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE status = 'pending'");
    const [[{ c: readyParcels }]] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE status = 'ready'");
    const [[{ c: collectedToday }]] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE status = 'collected' AND DATE(collected_at) = CURDATE()");
    const [[{ c: expiredParcels }]] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE status = 'expired'");

    const [[{ c: totalLockers }]] = await db.query("SELECT COUNT(*) as c FROM lockers");
    const [[{ c: occupiedLockers }]] = await db.query("SELECT COUNT(*) as c FROM lockers WHERE is_occupied = 1");

    const [[{ c: totalStudents }]] = await db.query("SELECT COUNT(*) as c FROM students");

    // Parcels per day for last 7 days
    const [recentActivity] = await db.query(`
      SELECT DATE(arrived_at) as date, COUNT(*) as count
      FROM parcels
      WHERE STR_TO_DATE(arrived_at, '%Y-%m-%dT%H:%i:%s.%fZ') >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(arrived_at)
      ORDER BY date ASC
    `);

    // Status breakdown
    const [statusBreakdown] = await db.query(`
      SELECT status, COUNT(*) as count FROM parcels GROUP BY status
    `);

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
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── GET /api/dashboard/student-stats ─────────────────────────────────────────
// Student: their personal summary
router.get('/student-stats', authenticate, async (req, res) => {
  const sid = req.user.id;

  try {
    const [[{ c: total }]] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE student_id = ?", [sid]);
    const [[{ c: pending }]] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE student_id = ? AND status = 'pending'", [sid]);
    const [[{ c: ready }]] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE student_id = ? AND status = 'ready'", [sid]);
    const [[{ c: collected }]] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE student_id = ? AND status = 'collected'", [sid]);
    const [[{ c: unread }]] = await db.query("SELECT COUNT(*) as c FROM notifications WHERE student_id = ? AND is_read = 0", [sid]);

    const [parcels] = await db.query(`
      SELECT id, tracking_id, description, status, arrived_at, locker_label
      FROM parcels WHERE student_id = ? ORDER BY arrived_at DESC LIMIT 5
    `, [sid]);

    const recentParcels = parcels.map(r => ({
      id: r.id, trackingId: r.tracking_id, description: r.description,
      status: r.status, arrivedAt: r.arrived_at, lockerLabel: r.locker_label,
    }));

    res.json({
      success: true,
      data: { total, pending, ready, collected, unreadNotifications: unread, recentParcels },
    });
  } catch (err) {
    console.error('Student stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
