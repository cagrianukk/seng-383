const db = require('../db');

const TITLE_MAX = 120;

class EventError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function toEvent(row) {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    createdBy: row.created_by,
  };
}

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function today() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function weekRange(week) {
  const day = week === undefined ? today() : parseDate(week);
  if (!day) {
    throw new EventError(400, 'Hafta YYYY-AA-GG biçiminde geçerli bir tarih olmalıdır');
  }
  const monday = new Date(day);
  monday.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);
  return { from: formatDate(monday), to: formatDate(nextMonday) };
}

function isValidStartsAt(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match || !parseDate(match[1])) return false;
  return Number(match[2]) <= 23 && Number(match[3]) <= 59;
}

function listEvents(childId, week) {
  const { from, to } = weekRange(week);
  const events = db
    .prepare(
      'SELECT * FROM EVENT WHERE child_id = ? AND starts_at >= ? AND starts_at < ? ORDER BY starts_at, id'
    )
    .all(childId, from, to)
    .map(toEvent);
  return { week: from, events };
}

function createEvent(childId, createdBy, input) {
  const { title, startsAt } = input || {};

  if (typeof title !== 'string' || !title.trim()) {
    throw new EventError(400, 'Başlık zorunludur');
  }
  if (title.trim().length > TITLE_MAX) {
    throw new EventError(400, `Başlık en fazla ${TITLE_MAX} karakter olabilir`);
  }
  if (!isValidStartsAt(startsAt)) {
    throw new EventError(400, 'Başlangıç YYYY-AA-GGTSS:DD biçiminde geçerli bir tarih ve saat olmalıdır');
  }

  const info = db
    .prepare('INSERT INTO EVENT (child_id, title, starts_at, created_by) VALUES (?, ?, ?, ?)')
    .run(childId, title.trim(), startsAt, createdBy);

  return toEvent(db.prepare('SELECT * FROM EVENT WHERE id = ?').get(info.lastInsertRowid));
}

module.exports = { EventError, listEvents, createEvent, weekRange };
