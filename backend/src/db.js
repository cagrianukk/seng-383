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
`);

module.exports = db;
