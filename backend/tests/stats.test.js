process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { seed, dayOfThisWeek, DEMO_TASKS } = require('../src/seed');

const PASSWORDS = {
  'parent@example.com': 'Parent123!',
  'specialist@example.com': 'Specialist123!',
  'child@example.com': 'Child123!',
  'teacher@example.com': 'Teacher123!',
};

async function tokenFor(email) {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORDS[email] });
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const idOf = (email) => db.prepare('SELECT id FROM USER WHERE email = ?').get(email).id;

let parent, specialist, child, teacher, childId;

beforeAll(async () => {
  seed();
  childId = db.prepare('SELECT id FROM CHILD').get().id;
  parent = await tokenFor('parent@example.com');
  specialist = await tokenFor('specialist@example.com');
  child = await tokenFor('child@example.com');
  teacher = await tokenFor('teacher@example.com');

  // 2030-01-07 (pazartesi) haftası: language 2 görev (1 done), motor 1 görev (done).
  // Sınır dışı: önceki pazar ve sonraki pazartesi.
  const insert = db.prepare(
    'INSERT INTO TASK (child_id, title, area, due_date, status, assigned_by) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const by = idOf('parent@example.com');
  insert.run(childId, 'Pazartesi okuma', 'language', '2030-01-07', 'done', by);
  insert.run(childId, 'Pazar okuma', 'language', '2030-01-13', 'open', by);
  insert.run(childId, 'Top oyunu', 'motor', '2030-01-09', 'done', by);
  insert.run(childId, 'Önceki pazar', 'social', '2030-01-06', 'done', by);
  insert.run(childId, 'Sonraki pazartesi', 'social', '2030-01-14', 'open', by);
});

const statsUrl = (week) => `/api/children/${childId}/stats${week ? `?week=${week}` : ''}`;

describe('GET /api/children/:childId/stats', () => {
  test('haftanın toplam tamamlanma oranını verir; sınır dışı görevler sayılmaz (FR-M7-01)', async () => {
    const res = await request(app).get(statsUrl('2030-01-07')).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.week).toBe('2030-01-07');
    expect(res.body.total).toEqual({ assigned: 3, done: 2, rate: 67 });
  });

  test('gelişim alanına göre oranı verir, görevsiz alan 0 (FR-M7-02)', async () => {
    const res = await request(app).get(statsUrl('2030-01-07')).set(auth(parent));
    expect(res.body.byArea).toEqual([
      { area: 'language', assigned: 2, done: 1, rate: 50 },
      { area: 'social', assigned: 0, done: 0, rate: 0 },
      { area: 'motor', assigned: 1, done: 1, rate: 100 },
    ]);
  });

  test('haftanın ortasından bir gün o haftanın pazartesisine yuvarlanır', async () => {
    const res = await request(app).get(statsUrl('2030-01-11')).set(auth(parent));
    expect(res.body.week).toBe('2030-01-07');
    expect(res.body.total.assigned).toBe(3);
  });

  test('görevsiz hafta → 200 ve 0, hata değil (FR-M7-03)', async () => {
    const res = await request(app).get(statsUrl('2031-06-02')).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.total).toEqual({ assigned: 0, done: 0, rate: 0 });
  });

  test('week verilmezse bu hafta, seed görevleriyle', async () => {
    const res = await request(app).get(statsUrl()).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.week).toBe(dayOfThisWeek(0));
    const done = DEMO_TASKS.filter((t) => t[4] === 'done').length;
    expect(res.body.total).toMatchObject({ assigned: DEMO_TASKS.length, done });
  });

  test('bağlı uzman görebilir', async () => {
    const res = await request(app).get(statsUrl('2030-01-07')).set(auth(specialist));
    expect(res.status).toBe(200);
    expect(res.body.total.assigned).toBe(3);
  });

  test('çocuk → 403', async () => {
    const res = await request(app).get(statsUrl('2030-01-07')).set(auth(child));
    expect(res.status).toBe(403);
  });

  test('bağlı olmayan uzman → 403', async () => {
    const res = await request(app).get(statsUrl('2030-01-07')).set(auth(teacher));
    expect(res.status).toBe(403);
  });

  test('token olmadan → 401', async () => {
    const res = await request(app).get(statsUrl('2030-01-07'));
    expect(res.status).toBe(401);
  });

  test('geçersiz week → 400', async () => {
    const res = await request(app).get(statsUrl('2030-13-01')).set(auth(parent));
    expect(res.status).toBe(400);
  });

  test('olmayan çocuk → 404', async () => {
    const res = await request(app).get('/api/children/9999/stats').set(auth(parent));
    expect(res.status).toBe(404);
  });
});
