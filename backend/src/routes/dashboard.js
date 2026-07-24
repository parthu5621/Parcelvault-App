'use strict';

const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
// Admin dashboard overview
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [totalRes] = await db.query("SELECT COUNT(*) as c FROM parcels");
    const [pendingRes] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE status = 'pending'");
    const [readyRes] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE status = 'ready'");
    const [collectedRes] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE status = 'collected'");
    const [expiredRes] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE status = 'expired'");

    const totalParcels = Number(totalRes[0]?.c || 0);
    const pendingParcels = Number(pendingRes[0]?.c || 0);
    const readyParcels = Number(readyRes[0]?.c || 0);
    const collectedToday = Number(collectedRes[0]?.c || 0);
    const expiredParcels = Number(expiredRes[0]?.c || 0);

    const [totalLockersRes] = await db.query("SELECT COUNT(*) as c FROM lockers");
    const [occupiedLockersRes] = await db.query("SELECT COUNT(*) as c FROM lockers WHERE is_occupied = 1");
    const [totalStudentsRes] = await db.query("SELECT COUNT(*) as c FROM students");

    const totalLockers = Number(totalLockersRes[0]?.c || 0);
    const occupiedLockers = Number(occupiedLockersRes[0]?.c || 0);
    const totalStudents = Number(totalStudentsRes[0]?.c || 0);

    const [recentActivity] = await db.query(`
      SELECT status as date, COUNT(*) as count
      FROM parcels
      GROUP BY status
    `);

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
          available: Math.max(0, totalLockers - occupiedLockers),
          occupancyRate: totalLockers > 0 ? Math.round((occupiedLockers / totalLockers) * 100) : 0,
        },
        students: { total: totalStudents },
        recentActivity: recentActivity || [],
        statusBreakdown: statusBreakdown || [],
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
    const [totalRes] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE student_id = ?", [sid]);
    const [pendingRes] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE student_id = ? AND status = 'pending'", [sid]);
    const [readyRes] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE student_id = ? AND status = 'ready'", [sid]);
    const [collectedRes] = await db.query("SELECT COUNT(*) as c FROM parcels WHERE student_id = ? AND status = 'collected'", [sid]);
    const [unreadRes] = await db.query("SELECT COUNT(*) as c FROM notifications WHERE student_id = ? AND is_read = 0", [sid]);

    const total = Number(totalRes[0]?.c || 0);
    const pending = Number(pendingRes[0]?.c || 0);
    const ready = Number(readyRes[0]?.c || 0);
    const collected = Number(collectedRes[0]?.c || 0);
    const unreadNotifications = Number(unreadRes[0]?.c || 0);

    const [parcels] = await db.query(`
      SELECT id, tracking_id, description, status, arrived_at, locker_label
      FROM parcels WHERE student_id = ? ORDER BY arrived_at DESC LIMIT 5
    `, [sid]);

    const recentParcels = (parcels || []).map(r => ({
      id: r.id, trackingId: r.tracking_id, description: r.description,
      status: r.status, arrivedAt: r.arrived_at, lockerLabel: r.locker_label,
    }));

    res.json({
      success: true,
      data: { total, pending, ready, collected, unreadNotifications, recentParcels },
    });
  } catch (err) {
    console.error('Student stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
