// Ortam değişkenleri, db.js yüklenmeden ÖNCE ayarlanmalı.
process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { seed } = require('../src/seed');

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

let parent, specialist, child, teacher, childId;

beforeAll(async () => {
  seed();
  parent = await tokenFor('parent@example.com');
  specialist = await tokenFor('specialist@example.com');
  child = await tokenFor('child@example.com');
  teacher = await tokenFor('teacher@example.com');
  childId = db.prepare('SELECT id FROM CHILD').get().id;
});

describe('GET /api/children', () => {
  test('token olmadan → 401 (FR-M1-05)', async () => {
    const res = await request(app).get('/api/children');
    expect(res.status).toBe(401);
  });

  test('veli kendi çocuğunu görür', async () => {
    const res = await request(app).get('/api/children').set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.children).toEqual([{ id: childId, name: 'Demo Çocuk' }]);
  });

  test('uzman bağlı olduğu çocukları türüyle görür (FR-M2-06)', async () => {
    const res = await request(app).get('/api/children').set(auth(specialist));
    expect(res.body.children).toEqual([
      { id: childId, name: 'Demo Çocuk', specialistType: 'psychologist' },
    ]);
  });

  test('bağlı olmayan uzman boş liste görür', async () => {
    const res = await request(app).get('/api/children').set(auth(teacher));
    expect(res.body.children).toEqual([]);
  });

  test('çocuk sadece kendini görür', async () => {
    const res = await request(app).get('/api/children').set(auth(child));
    expect(res.body.children).toEqual([{ id: childId, name: 'Demo Çocuk' }]);
  });
});

describe('GET /api/children/:childId/specialists', () => {
  test('veli bağlı uzmanları listeler (FR-M2-03)', async () => {
    const res = await request(app).get(`/api/children/${childId}/specialists`).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.specialists).toHaveLength(1);
    expect(res.body.specialists[0]).toMatchObject({
      email: 'specialist@example.com',
      specialistType: 'psychologist',
    });
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
  });

  test('çocuk hesabı → 403 (FR-M1-06)', async () => {
    const res = await request(app).get(`/api/children/${childId}/specialists`).set(auth(child));
    expect(res.status).toBe(403);
  });

  test('bağlı olmayan uzman → 403 (FR-M2-05)', async () => {
    const res = await request(app).get(`/api/children/${childId}/specialists`).set(auth(teacher));
    expect(res.status).toBe(403);
  });

  test('olmayan çocuk → 404', async () => {
    const res = await request(app).get('/api/children/9999/specialists').set(auth(parent));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/children/:childId/specialists', () => {
  test('kayıtlı olmayan e-posta → 404 (FR-M2-02)', async () => {
    const res = await request(app)
      .post(`/api/children/${childId}/specialists`)
      .set(auth(parent))
      .send({ email: 'yok@example.com', specialistType: 'teacher' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Bu e-posta ile kayıtlı bir uzman bulunamadı');
  });

  test('uzman olmayan bir hesabın e-postası → 404', async () => {
    const res = await request(app)
      .post(`/api/children/${childId}/specialists`)
      .set(auth(parent))
      .send({ email: 'child@example.com', specialistType: 'teacher' });
    expect(res.status).toBe(404);
  });

  test('geçersiz uzman türü → 400', async () => {
    const res = await request(app)
      .post(`/api/children/${childId}/specialists`)
      .set(auth(parent))
      .send({ email: 'teacher@example.com', specialistType: 'astrolog' });
    expect(res.status).toBe(400);
  });

  test('zaten bağlı uzman → 409 (FR-M2-07)', async () => {
    const res = await request(app)
      .post(`/api/children/${childId}/specialists`)
      .set(auth(parent))
      .send({ email: 'specialist@example.com', specialistType: 'psychologist' });
    expect(res.status).toBe(409);
  });

  test('uzman hesabı bağlama yapamaz → 403', async () => {
    const res = await request(app)
      .post(`/api/children/${childId}/specialists`)
      .set(auth(specialist))
      .send({ email: 'teacher@example.com', specialistType: 'teacher' });
    expect(res.status).toBe(403);
  });
});

describe('Flow 1: veli uzmanı bağlar ve bağı kaldırır', () => {
  test('bağlıyken erişir, bağ kaldırılınca 403 alır', async () => {
    // Öğretmen henüz bağlı değil
    let res = await request(app).get(`/api/children/${childId}/specialists`).set(auth(teacher));
    expect(res.status).toBe(403);

    // Veli öğretmeni bağlar (e-posta büyük harfle de olsa bulunur)
    res = await request(app)
      .post(`/api/children/${childId}/specialists`)
      .set(auth(parent))
      .send({ email: 'Teacher@Example.com', specialistType: 'teacher' });
    expect(res.status).toBe(201);
    const teacherId = res.body.specialist.id;
    expect(res.body.specialist).toMatchObject({ email: 'teacher@example.com', specialistType: 'teacher' });

    // Bağlıyken öğretmen çocuğun verisine erişir
    res = await request(app).get(`/api/children/${childId}/specialists`).set(auth(teacher));
    expect(res.status).toBe(200);
    expect(res.body.specialists).toHaveLength(2);

    // Veli bağı kaldırır
    res = await request(app)
      .delete(`/api/children/${childId}/specialists/${teacherId}`)
      .set(auth(parent));
    expect(res.status).toBe(204);

    // Bağ kaldırıldıktan sonra 403
    res = await request(app).get(`/api/children/${childId}/specialists`).set(auth(teacher));
    expect(res.status).toBe(403);

    // Aynı bağı tekrar kaldırmak → 404
    res = await request(app)
      .delete(`/api/children/${childId}/specialists/${teacherId}`)
      .set(auth(parent));
    expect(res.status).toBe(404);
  });
});
