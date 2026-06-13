'use strict';

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'parcelvault.db');

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    phone       TEXT NOT NULL,
    student_id  TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lockers (
    id                 TEXT PRIMARY KEY,
    label              TEXT NOT NULL UNIQUE,
    section            TEXT NOT NULL,
    size               TEXT NOT NULL CHECK(size IN ('small','medium','large')),
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
    status           TEXT NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending','ready','collected','expired')),
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
    type        TEXT NOT NULL CHECK(type IN ('alert','reminder','update')),
    is_read     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
