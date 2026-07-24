'use strict';

const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

let isSqliteFallback = false;
let sqliteDb = null;

const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'parcelvault',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function initSqlite() {
  if (sqliteDb) return sqliteDb;
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = path.join(__dirname, 'parcelvault.sqlite');
  sqliteDb = new DatabaseSync(dbPath);
  
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  return sqliteDb;
}

function runSqliteQuery(sql, params = []) {
  const db = initSqlite();
  let sqliteSql = sql
    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
    .replace(/ENGINE\s*=\s*\w+/gi, '')
    .replace(/DEFAULT\s+CURRENT_TIMESTAMP\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, 'DEFAULT CURRENT_TIMESTAMP')
    .replace(/TINYINT\(1\)/gi, 'INTEGER')
    .replace(/ENUM\([^)]+\)/gi, 'TEXT')
    .replace(/CONCAT\(([^)]+)\)/gi, (_match, group) => {
      return group.split(',').map(s => s.trim()).join(' || ');
    })
    .replace(/SUBSTRING\(/gi, 'SUBSTR(');

  const sanitizedParams = (params || []).map(p => {
    if (p instanceof Date) {
      return p.toISOString();
    }
    return p;
  });

  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SET FOREIGN_KEY_CHECKS')) {
    const val = trimmed.includes('0') ? 'OFF' : 'ON';
    sqliteSql = `PRAGMA foreign_keys = ${val};`;
  } else if (trimmed.startsWith('TRUNCATE TABLE')) {
    const tableName = sql.trim().split(/\s+/)[2];
    sqliteSql = `DELETE FROM ${tableName};`;
  }

  const isSelect = /^\s*(SELECT|PRAGMA|EXPLAIN)/i.test(sqliteSql);

  try {
    const stmt = db.prepare(sqliteSql);
    if (isSelect) {
      const rows = stmt.all(...sanitizedParams);
      return [rows];
    } else {
      const result = stmt.run(...sanitizedParams);
      return [{ affectedRows: result.changes, insertId: result.lastInsertRowid }];
    }
  } catch (err) {
    if (!err.message.includes('already exists') && !err.message.includes('duplicate column name')) {
      console.error('[SQLITE EXEC ERROR]', err.message, '| SQL:', sqliteSql);
    }
    throw err;
  }
}

async function query(sql, params = []) {
  if (isSqliteFallback) {
    return runSqliteQuery(sql, params);
  }
  try {
    return await mysqlPool.query(sql, params);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      if (!isSqliteFallback) {
        console.warn('⚠️  MySQL connection failed (ECONNREFUSED). Falling back to built-in SQLite database...');
        isSqliteFallback = true;
        await initSqliteSchema();
      }
      return runSqliteQuery(sql, params);
    }
    throw err;
  }
}

async function initSqliteSchema() {
  const db = initSqlite();
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      phone       TEXT NOT NULL,
      student_id  TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lockers (
      id                 TEXT PRIMARY KEY,
      label              TEXT NOT NULL UNIQUE,
      building           TEXT NOT NULL DEFAULT 'Main Campus Hub',
      section            TEXT NOT NULL,
      size               TEXT NOT NULL,
      is_occupied        INTEGER NOT NULL DEFAULT 0,
      current_parcel_id  TEXT
    );

    CREATE TABLE IF NOT EXISTS parcels (
      id               TEXT PRIMARY KEY,
      tracking_id      TEXT NOT NULL UNIQUE,
      student_id       TEXT NOT NULL,
      student_name     TEXT NOT NULL,
      description      TEXT NOT NULL,
      delivery_service TEXT NOT NULL,
      locker_id        TEXT,
      locker_label     TEXT,
      otp              TEXT,
      qr_code_data     TEXT,
      pickup_token     TEXT,
      status           TEXT NOT NULL DEFAULT 'pending',
      arrived_at       TEXT NOT NULL,
      assigned_at      TEXT,
      collected_at     TEXT,
      expires_at       TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id          TEXT PRIMARY KEY,
      student_id  TEXT NOT NULL,
      title       TEXT NOT NULL,
      message     TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'update',
      is_read     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id            TEXT PRIMARY KEY,
      student_id    TEXT,
      student_name  TEXT,
      email         TEXT NOT NULL,
      subject       TEXT NOT NULL,
      message       TEXT NOT NULL,
      rating        INTEGER DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'unread',
      created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      otp         TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS login_otps (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      otp         TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin and student if tables are empty
  try {
    const [existingAdmins] = runSqliteQuery("SELECT count(*) as count FROM admins");
    if (!existingAdmins || existingAdmins[0].count === 0) {
      const hashedPass = bcrypt.hashSync('123456', 10);
      const adminPass  = bcrypt.hashSync('admin123', 10);
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      runSqliteQuery("INSERT INTO admins (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)", ['a1', 'Campus Admin', 'admin@university.edu', adminPass, now]);
      runSqliteQuery("INSERT INTO students (id, name, email, phone, student_id, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", ['s1', 'Alex Johnson', 'alex@university.edu', '+91 98765 43210', 'STU001', hashedPass, now]);
      
      // Default Lockers
      runSqliteQuery("INSERT INTO lockers (id, label, building, section, size, is_occupied) VALUES (?, ?, ?, ?, ?, ?)", ['l1', 'A-01', 'Main Hub', 'Section A', 'medium', 0]);
      runSqliteQuery("INSERT INTO lockers (id, label, building, section, size, is_occupied) VALUES (?, ?, ?, ?, ?, ?)", ['l2', 'A-02', 'Main Hub', 'Section A', 'large', 0]);
      runSqliteQuery("INSERT INTO lockers (id, label, building, section, size, is_occupied) VALUES (?, ?, ?, ?, ?, ?)", ['l3', 'B-01', 'Main Hub', 'Section B', 'small', 0]);
    }
  } catch (e) {
    console.error('SQLite seeding error:', e);
  }

  console.log('Database initialized (SQLite).');
}

async function initDB() {
  try {
    const connection = await mysqlPool.getConnection();
    
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

    try { await connection.query("ALTER TABLE lockers ADD COLUMN building VARCHAR(100) NOT NULL DEFAULT 'Main Campus Hub'"); } catch (e) {}

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

    try { await connection.query("ALTER TABLE parcels ADD COLUMN qr_code_data TEXT"); } catch (e) {}
    try { await connection.query("ALTER TABLE parcels ADD COLUMN pickup_token VARCHAR(100)"); } catch (e) {}

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

    connection.release();
    console.log('Database schema initialized (MySQL).');
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.warn('⚠️  MySQL connection failed (ECONNREFUSED). Falling back to built-in SQLite database...');
      isSqliteFallback = true;
      await initSqliteSchema();
    } else {
      console.error('Error initializing database:', err);
      throw err;
    }
  }
}

module.exports = {
  pool: mysqlPool,
  query,
  getConnection: async () => {
    if (isSqliteFallback) {
      return {
        query,
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {}
      };
    }
    return await mysqlPool.getConnection();
  },
  initDB
};
