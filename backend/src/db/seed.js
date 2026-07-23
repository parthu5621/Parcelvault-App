'use strict';

const db = require('./database');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

console.log('🌱 Seeding database...');

const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
const addDays = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 19).replace('T', ' ');
const subHours = (h) => new Date(Date.now() - h * 3600000).toISOString().slice(0, 19).replace('T', ' ');
const subDays = (d) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 19).replace('T', ' ');

async function seed() {
  try {
    await db.initDB();
    // ─── Clear existing data ───────────────────────────────────────────────────────
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE notifications');
    await db.query('TRUNCATE TABLE parcels');
    await db.query('TRUNCATE TABLE lockers');
    await db.query('TRUNCATE TABLE admins');
    await db.query('TRUNCATE TABLE students');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    // ─── Students ──────────────────────────────────────────────────────────────────
    const hashedPass = bcrypt.hashSync('123456', 10);
    const adminPass  = bcrypt.hashSync('admin123', 10);

    const studentQuery = `
      INSERT INTO students (id, name, email, phone, student_id, password, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const students = [
      ['s1', 'Alex Johnson',  'alex@university.edu',  '+91 98765 43210', 'STU001', hashedPass, now],
      ['s2', 'Priya Sharma',  'priya@university.edu', '+91 87654 32109', 'STU002', hashedPass, now],
      ['s3', 'Ravi Kumar',    'ravi@university.edu',  '+91 76543 21098', 'STU003', hashedPass, now],
    ];

    for (const s of students) await db.query(studentQuery, s);
    console.log(`   ✔ Students: ${students.length}`);

    // ─── Admins ────────────────────────────────────────────────────────────────────
    await db.query('INSERT INTO admins (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)', 
      ['a1', 'Admin Kumar', 'admin@university.edu', adminPass, now]);
    console.log('   ✔ Admins: 1');

    // ─── Lockers ───────────────────────────────────────────────────────────────────
    const lockerQuery = `
      INSERT INTO lockers (id, label, building, section, size, is_occupied, current_parcel_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const sizes = ['small', 'medium', 'large'];
    const lockers = [];

    for (let i = 1; i <= 8; i++) {
      lockers.push([`LA${i}`, `A-0${i}`, 'Main Campus Hub', 'A', sizes[(i-1) % 3], i <= 2 ? 1 : 0, i === 1 ? 'p1' : i === 2 ? 'p2' : null]);
    }
    for (let i = 1; i <= 8; i++) {
      lockers.push([`LB${i}`, `B-0${i}`, 'North Hostel Vault', 'B', sizes[(i-1) % 3], 0, null]);
    }
    for (let i = 1; i <= 6; i++) {
      lockers.push([`LC${i}`, `C-0${i}`, 'Library Complex', 'C', sizes[(i-1) % 3], 0, null]);
    }

    for (const l of lockers) await db.query(lockerQuery, l);
    console.log(`   ✔ Lockers: ${lockers.length}`);

    // ─── Parcels ───────────────────────────────────────────────────────────────────
    const parcelQuery = `
      INSERT INTO parcels (id, tracking_id, student_id, student_name, description, delivery_service,
        locker_id, locker_label, otp, status, arrived_at, assigned_at, collected_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const parcels = [
      ['p1', 'PKG-2026-00001', 's1', 'Alex Johnson',  'Amazon - Books & Stationery', 'Amazon Delivery',  'LA1', 'A-01', '482931', 'ready',     subHours(2),   subHours(1.5), null,          addDays(4)],
      ['p2', 'PKG-2026-00002', 's2', 'Priya Sharma',  'Flipkart - Electronics',      'Flipkart Quick',   'LA2', 'A-02', '719284', 'ready',     subHours(5),   subHours(4),   null,          addDays(3)],
      ['p3', 'PKG-2026-00003', 's1', 'Alex Johnson',  'Meesho - Clothing',           'Meesho Express',   null,  null,   null,     'pending',   subHours(0.5), null,          null,          null],
      ['p4', 'PKG-2026-00004', 's1', 'Alex Johnson',  'Myntra - Shoes',              'Myntra Logistics', null,  null,   null,     'collected', subDays(7),    subDays(6.5),  subDays(6),    subDays(1)],
    ];

    for (const p of parcels) await db.query(parcelQuery, p);
    console.log(`   ✔ Parcels: ${parcels.length}`);

    // ─── Notifications ─────────────────────────────────────────────────────────────
    const notifQuery = `
      INSERT INTO notifications (id, student_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(notifQuery, ['n1', 's1', 'Parcel Ready for Pickup', 'Your parcel PKG-2026-00001 has been assigned to Locker A-01. Use OTP 482931 to collect.', 'alert', 0, subHours(1.5)]);
    await db.query(notifQuery, ['n2', 's2', 'Parcel Ready for Pickup', 'Your parcel PKG-2026-00002 has been assigned to Locker A-02. Use OTP 719284 to collect.', 'alert', 0, subHours(4)]);
    console.log('   ✔ Notifications: 2');

    console.log('');
    console.log('✅ Seed complete! Default credentials:');
    console.log('   Admin  → admin@university.edu / admin123');
    console.log('   Student→ alex@university.edu  / 123456');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
