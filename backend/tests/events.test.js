process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { seed, dayOfThisWeek, DEMO_EVENTS } = require('../src/seed');

const PASSWORDS = {
  'parent@example.com': 'Parent123!',
  'specialist@example.com': 'Specialist123!',
  'child@example.com': 'Child123!',
  'teacher@example.com': 'Teacher123!',
};

async function tokenFor(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: PASSWORDS[email] });
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const idOf = (email) => db.prepare('SELECT id FROM USER WHERE email = ?').get(email).id;

let parent, specialist, child, teacher, childId;

beforeAll(async () => {
  seed();
  childId = db.prepare("SELECT id FROM CHILD WHERE name = 'Demo Çocuk'").get().id;
  parent = await tokenFor('parent@example.com');
  specialist = await tokenFor('specialist@example.com');
  child = await tokenFor('child@example.com');
  teacher = await tokenFor('teacher@example.com');
});

const eventsUrl = () => `/api/children/${childId}/events`;
const eventCount = () =>
  db.prepare('SELECT COUNT(*) AS n FROM EVENT WHERE child_id = ?').get(childId).n;

describe('POST /api/children/:childId/events', () => {
  const validEvent = { title: 'Doktor kontrolü', startsAt: '2030-01-08T09:30' };

  test('veli etkinlik ekler → 201', async () => {
    const res = await request(app).post(eventsUrl()).set(auth(parent)).send(validEvent);
    expect(res.status).toBe(201);
    expect(res.body.event).toMatchObject({
      title: 'Doktor kontrolü',
      startsAt: '2030-01-08T09:30',
      createdBy: idOf('parent@example.com'),
    });
    expect(Object.keys(res.body.event).sort()).toEqual(['createdBy', 'id', 'startsAt', 'title']);
  });

  test('bağlı uzman etkinlik ekler → 201', async () => {
    const res = await request(app).post(eventsUrl()).set(auth(specialist)).send(validEvent);
    expect(res.status).toBe(201);
    expect(res.body.event.createdBy).toBe(idOf('specialist@example.com'));
  });

  test('çocuk etkinlik ekleyemez → 403', async () => {
    const before = eventCount();
    const res = await request(app).post(eventsUrl()).set(auth(child)).send(validEvent);
    expect(res.status).toBe(403);
    expect(eventCount()).toBe(before);
  });

  test('bağlı olmayan uzman etkinlik ekleyemez → 403', async () => {
    const before = eventCount();
    const res = await request(app).post(eventsUrl()).set(auth(teacher)).send(validEvent);
    expect(res.status).toBe(403);
    expect(eventCount()).toBe(before);
  });

  test('token olmadan → 401', async () => {
    const res = await request(app).post(eventsUrl()).send(validEvent);
    expect(res.status).toBe(401);
  });

  test('olmayan çocuk → 404', async () => {
    const res = await request(app).post('/api/children/9999/events').set(auth(parent)).send(validEvent);
    expect(res.status).toBe(404);
  });

  test.each([
    ['başlık yok', { startsAt: '2030-01-08T09:30' }],
    ['başlık sadece boşluk', { title: '   ', startsAt: '2030-01-08T09:30' }],
    ['başlık çok uzun', { title: 'a'.repeat(121), startsAt: '2030-01-08T09:30' }],
    ['tarih yok', { title: 'Doktor' }],
    ['saat yok', { title: 'Doktor', startsAt: '2030-01-08' }],
    ['olmayan gün', { title: 'Doktor', startsAt: '2030-02-30T09:30' }],
    ['geçersiz saat', { title: 'Doktor', startsAt: '2030-01-08T24:00' }],
    ['yanlış biçim', { title: 'Doktor', startsAt: '08.01.2030 09:30' }],
  ])('%s → 400', async (_name, body) => {
    const before = eventCount();
    const res = await request(app).post(eventsUrl()).set(auth(parent)).send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
    expect(eventCount()).toBe(before);
  });
});

describe('GET /api/children/:childId/events', () => {
  beforeAll(() => {
    const insert = db.prepare(
      'INSERT INTO EVENT (child_id, title, starts_at, created_by) VALUES (?, ?, ?, ?)'
    );
    const by = idOf('parent@example.com');
    insert.run(childId, 'Önceki pazar', '2030-01-06T23:59', by);
    insert.run(childId, 'Pazar akşamı', '2030-01-13T23:59', by);
    insert.run(childId, 'Pazartesi sabahı', '2030-01-07T00:00', by);
    insert.run(childId, 'Sonraki pazartesi', '2030-01-14T00:00', by);
  });

  test('hafta filtresi pazartesi–pazar aralığını saate göre sıralı döner', async () => {
    const res = await request(app).get(`${eventsUrl()}?week=2030-01-07`).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.week).toBe('2030-01-07');
    expect(res.body.events.map((e) => e.title)).toEqual([
      'Pazartesi sabahı',
      'Doktor kontrolü',
      'Doktor kontrolü',
      'Pazar akşamı',
    ]);
  });

  test('haftanın ortasındaki bir gün verilirse o haftanın pazartesisi kullanılır', async () => {
    const res = await request(app).get(`${eventsUrl()}?week=2030-01-10`).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.week).toBe('2030-01-07');
    expect(res.body.events).toHaveLength(4);
  });

  test('week verilmezse bu hafta döner', async () => {
    const res = await request(app).get(eventsUrl()).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.week).toBe(dayOfThisWeek(0));
    expect(res.body.events.map((e) => e.title)).toEqual(DEMO_EVENTS.map((e) => e[2]));
  });

  test('boş hafta → 200 ve boş liste', async () => {
    const res = await request(app).get(`${eventsUrl()}?week=2031-06-02`).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([]);
  });

  test('geçersiz week → 400', async () => {
    const res = await request(app).get(`${eventsUrl()}?week=2030-13-01`).set(auth(parent));
    expect(res.status).toBe(400);
  });

  test('bağlı uzman görebilir', async () => {
    const res = await request(app).get(`${eventsUrl()}?week=2030-01-07`).set(auth(specialist));
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(4);
  });

  test('çocuk kendi etkinliklerini görebilir', async () => {
    const res = await request(app).get(`${eventsUrl()}?week=2030-01-07`).set(auth(child));
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(4);
  });

  test('bağlı olmayan uzman göremez → 403', async () => {
    const res = await request(app).get(eventsUrl()).set(auth(teacher));
    expect(res.status).toBe(403);
  });

  test('token olmadan → 401', async () => {
    const res = await request(app).get(eventsUrl());
    expect(res.status).toBe(401);
  });
});
