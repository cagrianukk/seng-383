// Ortam değişkenleri, db.js yüklenmeden ÖNCE ayarlanmalı.
process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const db = require('../src/db');
const { seed, DEMO_TASKS } = require('../src/seed');

const PASSWORDS = {
  'parent@example.com': 'Parent123!',
  'specialist@example.com': 'Specialist123!',
  'child@example.com': 'Child123!',
  'teacher@example.com': 'Teacher123!',
  'parent2@example.com': 'Parent456!',
  'child2@example.com': 'Child456!',
};

async function tokenFor(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: PASSWORDS[email] });
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const idOf = (email) => db.prepare('SELECT id FROM USER WHERE email = ?').get(email).id;

const TASK_KEYS = ['area', 'assignedBy', 'description', 'dueDate', 'id', 'status', 'title'];
const validTask = {
  title: 'Resim yap',
  description: 'Bir hayvan resmi çiz.',
  area: 'motor',
  dueDate: '2026-11-20',
};

let parent, specialist, child, teacher, parent2, child2;
let childId, otherChildId, otherTaskId;

beforeAll(async () => {
  seed();

  // İkinci aile: izolasyonu (başka çocuğun görevi/başka çocuğun hesabı) test etmek için.
  const insertUser = db.prepare(
    'INSERT INTO USER (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  insertUser.run('İkinci Veli', 'parent2@example.com', bcrypt.hashSync(PASSWORDS['parent2@example.com'], 4), 'parent');
  insertUser.run('İkinci Çocuk', 'child2@example.com', bcrypt.hashSync(PASSWORDS['child2@example.com'], 4), 'child');

  childId = db.prepare("SELECT id FROM CHILD WHERE name = 'Demo Çocuk'").get().id;
  otherChildId = db
    .prepare('INSERT INTO CHILD (name, parent_id, user_id) VALUES (?, ?, ?)')
    .run('İkinci Çocuk', idOf('parent2@example.com'), idOf('child2@example.com')).lastInsertRowid;
  otherTaskId = db
    .prepare(
      `INSERT INTO TASK (child_id, title, area, due_date, assigned_by)
       VALUES (?, 'Başkasının görevi', 'social', '2026-11-18', ?)`
    )
    .run(otherChildId, idOf('parent2@example.com')).lastInsertRowid;

  parent = await tokenFor('parent@example.com');
  specialist = await tokenFor('specialist@example.com');
  child = await tokenFor('child@example.com');
  teacher = await tokenFor('teacher@example.com');
  parent2 = await tokenFor('parent2@example.com');
  child2 = await tokenFor('child2@example.com');
});

const taskCount = (cid = childId) =>
  db.prepare('SELECT COUNT(*) AS n FROM TASK WHERE child_id = ?').get(cid).n;

describe('GET /api/children/:childId/tasks', () => {
  test('token olmadan → 401', async () => {
    const res = await request(app).get(`/api/children/${childId}/tasks`);
    expect(res.status).toBe(401);
  });

  test('veli görevleri camelCase ve sözleşmedeki alanlarla görür', async () => {
    const res = await request(app).get(`/api/children/${childId}/tasks`).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(DEMO_TASKS.length);
    for (const t of res.body.tasks) {
      expect(Object.keys(t).sort()).toEqual(TASK_KEYS);
      expect(t.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['open', 'done']).toContain(t.status);
    }
    expect(JSON.stringify(res.body)).not.toContain('due_date');
    expect(JSON.stringify(res.body)).not.toContain('assigned_by');
  });

  test('görevler son tarihe göre sıralı gelir', async () => {
    const res = await request(app).get(`/api/children/${childId}/tasks`).set(auth(parent));
    const dates = res.body.tasks.map((t) => t.dueDate);
    expect(dates).toEqual([...dates].sort());
  });

  test('bağlı uzman görevleri görür', async () => {
    const res = await request(app).get(`/api/children/${childId}/tasks`).set(auth(specialist));
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(DEMO_TASKS.length);
  });

  test('çocuk sadece kendi görevlerini görür (FR-M4-02)', async () => {
    const res = await request(app).get(`/api/children/${childId}/tasks`).set(auth(child));
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(DEMO_TASKS.length);
    expect(res.body.tasks.map((t) => t.id)).not.toContain(Number(otherTaskId));
  });

  test('ikinci çocuk kendi görevlerini görür, demo çocuğunkini görmez', async () => {
    const res = await request(app).get(`/api/children/${otherChildId}/tasks`).set(auth(child2));
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0]).toMatchObject({ id: Number(otherTaskId), title: 'Başkasının görevi' });
  });

  test('başka bir çocuğun hesabı → 403 (FR-M2-05)', async () => {
    const res = await request(app).get(`/api/children/${childId}/tasks`).set(auth(child2));
    expect(res.status).toBe(403);
    expect(res.body.tasks).toBeUndefined();
  });

  test('başka bir ailenin velisi → 403', async () => {
    const res = await request(app).get(`/api/children/${childId}/tasks`).set(auth(parent2));
    expect(res.status).toBe(403);
  });

  test('bağlı olmayan uzman → 403', async () => {
    const res = await request(app).get(`/api/children/${childId}/tasks`).set(auth(teacher));
    expect(res.status).toBe(403);
  });

  test('olmayan çocuk → 404', async () => {
    const res = await request(app).get('/api/children/9999/tasks').set(auth(parent));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/children/:childId/tasks', () => {
  test('token olmadan → 401', async () => {
    const res = await request(app).post(`/api/children/${childId}/tasks`).send(validTask);
    expect(res.status).toBe(401);
  });

  test('veli görev atar → 201 { task }, durum open (FR-M4-01)', async () => {
    const res = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set(auth(parent))
      .send(validTask);
    expect(res.status).toBe(201);
    expect(Object.keys(res.body.task).sort()).toEqual(TASK_KEYS);
    expect(res.body.task).toMatchObject({
      title: 'Resim yap',
      description: 'Bir hayvan resmi çiz.',
      area: 'motor',
      dueDate: '2026-11-20',
      status: 'open',
      assignedBy: idOf('parent@example.com'),
    });

    const list = await request(app).get(`/api/children/${childId}/tasks`).set(auth(child));
    expect(list.body.tasks.map((t) => t.id)).toContain(res.body.task.id);
  });

  test('bağlı uzman görev atar, atayan uzman olarak kaydedilir', async () => {
    const res = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set(auth(specialist))
      .send({ ...validTask, title: 'Uzman görevi', area: 'language' });
    expect(res.status).toBe(201);
    expect(res.body.task.assignedBy).toBe(idOf('specialist@example.com'));
  });

  test('açıklama isteğe bağlıdır, boşsa "" olur; başlık kırpılır', async () => {
    const res = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set(auth(parent))
      .send({ title: '  Boşluklu başlık  ', area: 'social', dueDate: '2026-11-21' });
    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Boşluklu başlık');
    expect(res.body.task.description).toBe('');
  });

  test('çocuk görev atamaya çalışırsa → 403 ve kayıt eklenmez (FR-M4-05)', async () => {
    const before = taskCount();
    const res = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set(auth(child))
      .send(validTask);
    expect(res.status).toBe(403);
    expect(taskCount()).toBe(before);
  });

  test('bağlı olmayan uzman → 403 ve kayıt eklenmez', async () => {
    const before = taskCount();
    const res = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set(auth(teacher))
      .send(validTask);
    expect(res.status).toBe(403);
    expect(taskCount()).toBe(before);
  });

  test('başka bir ailenin velisi → 403', async () => {
    const res = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set(auth(parent2))
      .send(validTask);
    expect(res.status).toBe(403);
  });

  test('olmayan çocuk → 404', async () => {
    const res = await request(app).post('/api/children/9999/tasks').set(auth(parent)).send(validTask);
    expect(res.status).toBe(404);
  });

  test.each([
    ['başlık yok', { ...validTask, title: undefined }],
    ['başlık boş', { ...validTask, title: '   ' }],
    ['başlık metin değil', { ...validTask, title: 42 }],
    ['başlık çok uzun', { ...validTask, title: 'a'.repeat(121) }],
    ['açıklama metin değil', { ...validTask, description: 123 }],
    ['açıklama çok uzun', { ...validTask, description: 'a'.repeat(1001) }],
    ['alan yok', { ...validTask, area: undefined }],
    ['geçersiz alan', { ...validTask, area: 'astroloji' }],
    ['son tarih yok', { ...validTask, dueDate: undefined }],
    ['yanlış tarih biçimi', { ...validTask, dueDate: '20.11.2026' }],
    ['takvimde olmayan tarih', { ...validTask, dueDate: '2026-02-30' }],
    ['tarih metin değil', { ...validTask, dueDate: 20261120 }],
  ])('geçersiz girdi (%s) → 400 ve kayıt eklenmez', async (_name, body) => {
    const before = taskCount();
    const res = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set(auth(parent))
      .send(body);
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
    expect(taskCount()).toBe(before);
  });

  test('gövde hiç gönderilmezse → 400 (sunucu hatası değil)', async () => {
    const res = await request(app).post(`/api/children/${childId}/tasks`).set(auth(parent));
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/children/:childId/tasks/:taskId/done', () => {
  let openTaskId;

  beforeAll(() => {
    openTaskId = db
      .prepare("SELECT id FROM TASK WHERE child_id = ? AND status = 'open' ORDER BY id")
      .get(childId).id;
  });

  const patch = (token, cid, tid) =>
    request(app).patch(`/api/children/${cid}/tasks/${tid}/done`).set(auth(token));

  test('token olmadan → 401', async () => {
    const res = await request(app).patch(`/api/children/${childId}/tasks/${openTaskId}/done`);
    expect(res.status).toBe(401);
  });

  test('veli tamamlayamaz → 403, görev açık kalır', async () => {
    const res = await patch(parent, childId, openTaskId);
    expect(res.status).toBe(403);
    expect(db.prepare('SELECT status FROM TASK WHERE id = ?').get(openTaskId).status).toBe('open');
  });

  test('bağlı uzman tamamlayamaz → 403', async () => {
    const res = await patch(specialist, childId, openTaskId);
    expect(res.status).toBe(403);
  });

  test('başka çocuğun hesabı bu çocuğun görevini tamamlayamaz → 403', async () => {
    const res = await patch(child2, childId, openTaskId);
    expect(res.status).toBe(403);
    expect(db.prepare('SELECT status FROM TASK WHERE id = ?').get(openTaskId).status).toBe('open');
  });

  test('çocuk başka çocuğun görev id\'sini kendi yolundan tamamlayamaz → 404', async () => {
    const res = await patch(child, childId, otherTaskId);
    expect(res.status).toBe(404);
    expect(db.prepare('SELECT status FROM TASK WHERE id = ?').get(otherTaskId).status).toBe('open');
  });

  test('olmayan görev ve sayısal olmayan id → 404', async () => {
    expect((await patch(child, childId, 9999)).status).toBe(404);
    expect((await patch(child, childId, 'abc')).status).toBe(404);
  });

  test('olmayan çocuk → 404', async () => {
    const res = await patch(child, 9999, openTaskId);
    expect(res.status).toBe(404);
  });

  test('çocuk kendi görevini tamamlar → 200 { task } done (FR-M4-03)', async () => {
    const res = await patch(child, childId, openTaskId);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.task).sort()).toEqual(TASK_KEYS);
    expect(res.body.task).toMatchObject({ id: openTaskId, status: 'done' });
    expect(db.prepare('SELECT status FROM TASK WHERE id = ?').get(openTaskId).status).toBe('done');
  });

  test('zaten tamamlanmış görevi tekrar tamamlamak hata vermez (idempotent)', async () => {
    const res = await patch(child, childId, openTaskId);
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('done');
  });
});

describe('Flow 2: görev atama ve tamamlama (FR-M4-01…04)', () => {
  test('uzman atar, çocuk açık görür ve tamamlar, uzman "done" görür', async () => {
    // Uzman görev atar
    let res = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set(auth(specialist))
      .send({ title: 'Flow 2 görevi', description: 'Test', area: 'language', dueDate: '2026-11-19' });
    expect(res.status).toBe(201);
    const taskId = res.body.task.id;

    // Çocuk görevi açık olarak görür
    res = await request(app).get(`/api/children/${childId}/tasks`).set(auth(child));
    expect(res.body.tasks.find((t) => t.id === taskId)).toMatchObject({ status: 'open' });

    // Çocuk tamamlar
    res = await request(app)
      .patch(`/api/children/${childId}/tasks/${taskId}/done`)
      .set(auth(child));
    expect(res.status).toBe(200);

    // Atayan uzman durumu "done" olarak görür
    res = await request(app).get(`/api/children/${childId}/tasks`).set(auth(specialist));
    const mine = res.body.tasks.filter((t) => t.assignedBy === idOf('specialist@example.com'));
    expect(mine.find((t) => t.id === taskId)).toMatchObject({ status: 'done' });
  });
});
