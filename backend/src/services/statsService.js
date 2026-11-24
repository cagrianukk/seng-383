const db = require('../db');
const { weekRange } = require('./eventService');
const { AREAS } = require('./taskService');

// Tamamlanma oranı yüzde olarak, tam sayıya yuvarlanmış; görev yoksa 0 (FR-M7-03).
function rate(done, assigned) {
  return assigned === 0 ? 0 : Math.round((done / assigned) * 100);
}

// FR-M7-01, FR-M7-02: seçilen haftanın (pazartesi–pazar) görevleri; görev son tarihinin haftasına sayılır.
// weekRange geçersiz tarihte EventError (400) fırlatır.
function weeklyStats(childId, week) {
  const { from, to } = weekRange(week);
  const rows = db
    .prepare(
      `SELECT area,
              COUNT(*) AS assigned,
              SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done
         FROM TASK
        WHERE child_id = ? AND due_date >= ? AND due_date < ?
        GROUP BY area`
    )
    .all(childId, from, to);

  const byArea = AREAS.map((area) => {
    const row = rows.find((r) => r.area === area);
    const assigned = row ? row.assigned : 0;
    const done = row ? row.done : 0;
    return { area, assigned, done, rate: rate(done, assigned) };
  });

  const assigned = rows.reduce((sum, r) => sum + r.assigned, 0);
  const done = rows.reduce((sum, r) => sum + r.done, 0);

  return { week: from, total: { assigned, done, rate: rate(done, assigned) }, byArea };
}

module.exports = { weeklyStats };
