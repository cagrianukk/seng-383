const db = require('../db');

// Gelişim alanları: seed'deki demo alanlarla aynı. Yeni alan eklenecekse buraya eklenir (FR-M4-01, FR-M7-02).
const AREAS = ['language', 'social', 'motor'];

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 1000;

class TaskError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Dışarı verilen biçim: camelCase, sadece sözleşmedeki alanlar.
function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    area: row.area,
    dueDate: row.due_date,
    status: row.status,
    assignedBy: row.assigned_by,
  };
}

// 'YYYY-MM-DD' biçiminde ve takvimde gerçekten var olan bir gün mü? (örn. 2026-02-30 geçersiz)
function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// FR-M4-02: çocuk sadece kendi görevlerini görür. Çocuk hesabı requireChildAccess ile
// zaten sadece kendi kaydına girebildiği için burada child_id'ye göre listelemek yeterli.
function listTasks(childId) {
  return db
    .prepare('SELECT * FROM TASK WHERE child_id = ? ORDER BY due_date, id')
    .all(childId)
    .map(toTask);
}

// FR-M4-01: başlık, açıklama, gelişim alanı ve son tarih ile görev atar; durum her zaman 'open' başlar.
function createTask(childId, assignedBy, input) {
  const { title, description, area, dueDate } = input || {};

  if (typeof title !== 'string' || !title.trim()) {
    throw new TaskError(400, 'Başlık zorunludur');
  }
  if (title.trim().length > TITLE_MAX) {
    throw new TaskError(400, `Başlık en fazla ${TITLE_MAX} karakter olabilir`);
  }
  if (description !== undefined && typeof description !== 'string') {
    throw new TaskError(400, 'Açıklama metin olmalıdır');
  }
  if (typeof description === 'string' && description.length > DESCRIPTION_MAX) {
    throw new TaskError(400, `Açıklama en fazla ${DESCRIPTION_MAX} karakter olabilir`);
  }
  if (!AREAS.includes(area)) {
    throw new TaskError(400, 'Geçersiz gelişim alanı');
  }
  if (!isValidDate(dueDate)) {
    throw new TaskError(400, 'Son tarih YYYY-AA-GG biçiminde geçerli bir tarih olmalıdır');
  }

  const info = db
    .prepare(
      `INSERT INTO TASK (child_id, title, description, area, due_date, status, assigned_by)
       VALUES (?, ?, ?, ?, ?, 'open', ?)`
    )
    .run(childId, title.trim(), (description || '').trim(), area, dueDate, assignedBy);

  return toTask(db.prepare('SELECT * FROM TASK WHERE id = ?').get(info.lastInsertRowid));
}

// FR-M4-03: görev bu çocuğa ait değilse (veya yoksa) null döner; zaten 'done' ise aynen döner (idempotent).
function markDone(childId, taskId) {
  const row = db.prepare('SELECT * FROM TASK WHERE id = ? AND child_id = ?').get(taskId, childId);
  if (!row) return null;

  if (row.status !== 'done') {
    db.prepare("UPDATE TASK SET status = 'done' WHERE id = ?").run(row.id);
  }
  return toTask(db.prepare('SELECT * FROM TASK WHERE id = ?').get(row.id));
}

module.exports = { AREAS, TaskError, listTasks, createTask, markDone };
