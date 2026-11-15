process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const db = require('../src/db');
const { seed, dayOfThisWeek, DEMO_EVENTS, DEMO_TASKS } = require('../src/seed');

describe('dayOfThisWeek', () => {
  test('haftayı pazartesiden başlatır (FR-M7-01)', () => {
    // 2026-11-14 cumartesi → o haftanın pazartesisi 2026-11-09
    const saturday = new Date(2026, 10, 14, 12);
    expect(dayOfThisWeek(0, saturday)).toBe('2026-11-09');
    expect(dayOfThisWeek(6, saturday)).toBe('2026-11-15');
  });

  test('pazar günü bir önceki pazartesiyi verir', () => {
    const sunday = new Date(2026, 10, 15, 12);
    expect(dayOfThisWeek(0, sunday)).toBe('2026-11-09');
  });
});

describe('seed (TRI-34)', () => {
  beforeAll(() => {
    seed();
  });

  test('demo çocuğa bu haftanın etkinliklerini ekler', () => {
    const events = db.prepare('SELECT title, starts_at FROM EVENT ORDER BY starts_at').all();
    expect(events).toHaveLength(DEMO_EVENTS.length);
    for (const e of events) {
      const day = e.starts_at.slice(0, 10);
      expect(day >= dayOfThisWeek(0) && day <= dayOfThisWeek(6)).toBe(true);
    }
  });

  test('açık ve tamamlanmış görevleri farklı gelişim alanlarında ekler', () => {
    const tasks = db.prepare('SELECT area, status FROM TASK').all();
    expect(tasks).toHaveLength(DEMO_TASKS.length);
    expect(new Set(tasks.map((t) => t.status))).toEqual(new Set(['open', 'done']));
    expect(new Set(tasks.map((t) => t.area)).size).toBeGreaterThan(1);
  });

  test('tekrar çalışınca kayıtları çoğaltmaz', () => {
    seed();
    expect(db.prepare('SELECT COUNT(*) AS n FROM EVENT').get().n).toBe(DEMO_EVENTS.length);
    expect(db.prepare('SELECT COUNT(*) AS n FROM TASK').get().n).toBe(DEMO_TASKS.length);
  });

  test('TASK.status sadece open veya done olabilir', () => {
    const childId = db.prepare('SELECT id FROM CHILD').get().id;
    const userId = db.prepare('SELECT id FROM USER').get().id;
    expect(() =>
      db
        .prepare(
          "INSERT INTO TASK (child_id, title, area, due_date, status, assigned_by) VALUES (?, 'x', 'motor', '2026-11-10', 'late', ?)"
        )
        .run(childId, userId)
    ).toThrow();
  });
});
