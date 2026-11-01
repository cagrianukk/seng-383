require('dotenv').config({ quiet: true });
const Database = require('better-sqlite3');

const DB_FILE = process.env.DB_FILE || './data.sqlite';
const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS USER (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL
  )
`);

module.exports = db;
