'use strict';

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'parcelvault',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await pool.getConnection();
    
    // ─── Schema ────────────────────────────────────────────────────────────────────
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id          VARCHAR(36) PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        phone       VARCHAR(20) NOT NULL,
        student_id  VARCHAR(50) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id          VARCHAR(36) PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS lockers (
        id                 VARCHAR(36) PRIMARY KEY,
        label              VARCHAR(50) NOT NULL UNIQUE,
        building           VARCHAR(100) NOT NULL DEFAULT 'Main Campus Hub',
        section            VARCHAR(50) NOT NULL,
        size               ENUM('small', 'medium', 'large') NOT NULL,
        is_occupied        TINYINT(1) NOT NULL DEFAULT 0,
        current_parcel_id  VARCHAR(36)
      )
    `);

    // Ensure building column exists for existing DB tables
    try {
      await connection.query("ALTER TABLE lockers ADD COLUMN building VARCHAR(100) NOT NULL DEFAULT 'Main Campus Hub'");
    } catch (e) {
      // Column already exists
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS parcels (
        id               VARCHAR(36) PRIMARY KEY,
        tracking_id      VARCHAR(100) NOT NULL UNIQUE,
        student_id       VARCHAR(36) NOT NULL,
        student_name     VARCHAR(255) NOT NULL,
        description      TEXT NOT NULL,
        delivery_service VARCHAR(100) NOT NULL,
        locker_id        VARCHAR(36),
        locker_label     VARCHAR(50),
        otp              VARCHAR(20),
        qr_code_data     TEXT,
        pickup_token     VARCHAR(100),
        status           ENUM('pending', 'ready', 'collected', 'expired') NOT NULL DEFAULT 'pending',
        arrived_at       VARCHAR(255) NOT NULL,
        assigned_at      VARCHAR(255),
        collected_at     VARCHAR(255),
        expires_at       VARCHAR(255)
      )
    `);

    // Migrations for parcels table
    try {
      await connection.query("ALTER TABLE parcels ADD COLUMN qr_code_data TEXT");
    } catch (e) {
      // Column already exists
    }
    try {
      await connection.query("ALTER TABLE parcels ADD COLUMN pickup_token VARCHAR(100)");
    } catch (e) {
      // Column already exists
    }

    // Backfill pickup_token for existing parcels
    try {
      await connection.query(`
        UPDATE parcels 
        SET pickup_token = CONCAT('PV-TOKEN-', SUBSTRING(id, 1, 8))
        WHERE pickup_token IS NULL OR pickup_token = ''
      `);
    } catch (e) {
      // Ignore
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          VARCHAR(36) PRIMARY KEY,
        student_id  VARCHAR(36) NOT NULL,
        title       VARCHAR(255) NOT NULL,
        message     TEXT NOT NULL,
        type        VARCHAR(50) NOT NULL DEFAULT 'update',
        is_read     TINYINT(1) NOT NULL DEFAULT 0,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await connection.query("ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'update'");
    } catch (e) {
      // Column modification already executed or not supported
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id            VARCHAR(36) PRIMARY KEY,
        student_id    VARCHAR(36),
        student_name  VARCHAR(255),
        email         VARCHAR(255) NOT NULL,
        subject       VARCHAR(255) NOT NULL,
        message       TEXT NOT NULL,
        rating        INT DEFAULT 0,
        status        VARCHAR(50) NOT NULL DEFAULT 'unread',
        created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: add rating column to existing feedback tables that don't have it
    try {
      await connection.query(`ALTER TABLE feedback ADD COLUMN rating INT DEFAULT 0`);
    } catch (e) {
      // Column already exists — that's fine
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id          VARCHAR(36) PRIMARY KEY,
        email       VARCHAR(255) NOT NULL,
        otp         VARCHAR(6) NOT NULL,
        expires_at  TIMESTAMP NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS login_otps (
        id          VARCHAR(36) PRIMARY KEY,
        email       VARCHAR(255) NOT NULL,
        otp         VARCHAR(6) NOT NULL,
        expires_at  TIMESTAMP NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure performance indexes exist for fast auth lookups
    try { await connection.query("CREATE INDEX idx_students_email ON students(email)"); } catch (e) {}
    try { await connection.query("CREATE INDEX idx_students_phone ON students(phone)"); } catch (e) {}
    try { await connection.query("CREATE INDEX idx_students_student_id ON students(student_id)"); } catch (e) {}
    try { await connection.query("CREATE INDEX idx_admins_email ON admins(email)"); } catch (e) {}
    try { await connection.query("CREATE INDEX idx_login_otps_email ON login_otps(email)"); } catch (e) {}
    try { await connection.query("CREATE INDEX idx_password_resets_email ON password_resets(email)"); } catch (e) {}

    connection.release();
    console.log('Database schema and indexes initialized.');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

module.exports = {
  pool,
  query: (...args) => pool.query(...args),
  getConnection: () => pool.getConnection(),
  initDB
};
