require('dotenv').config({ quiet: true });
const Database = require('better-sqlite3');

const DB_FILE = process.env.DB_FILE || './data.sqlite';
const db = new Database(DB_FILE);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS USER (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL
  );

  -- parent_id: çocuğun velisi, user_id: çocuğun kendi giriş hesabı (SDD veri modeli)
  CREATE TABLE IF NOT EXISTS CHILD (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    parent_id INTEGER NOT NULL REFERENCES USER(id),
    user_id   INTEGER UNIQUE REFERENCES USER(id)
  );

  CREATE TABLE IF NOT EXISTS SPECIALIST_LINK (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id        INTEGER NOT NULL REFERENCES CHILD(id) ON DELETE CASCADE,
    specialist_id   INTEGER NOT NULL REFERENCES USER(id),
    specialist_type TEXT NOT NULL,
    UNIQUE (child_id, specialist_id)
  );

  -- M3: starts_at yerel saat, 'YYYY-MM-DDTHH:MM' biçiminde
  CREATE TABLE IF NOT EXISTS EVENT (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id   INTEGER NOT NULL REFERENCES CHILD(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    starts_at  TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES USER(id)
  );

  -- M4: due_date 'YYYY-MM-DD'; görev due_date'in düştüğü haftaya sayılır (FR-M7-01)
  CREATE TABLE IF NOT EXISTS TASK (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id    INTEGER NOT NULL REFERENCES CHILD(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    area        TEXT NOT NULL,
    due_date    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
    assigned_by INTEGER NOT NULL REFERENCES USER(id)
  );
`);

module.exports = db;
