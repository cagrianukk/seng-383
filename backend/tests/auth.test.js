// Ortam değişkenleri, db.js yüklenmeden ÖNCE ayarlanmalı.
process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const { seed } = require('../src/seed');

beforeAll(() => {
  seed();
});

describe('Auth API', () => {
  test('1) doğru e-posta ve şifre → 200 + token + user.role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'parent@example.com', password: 'Parent123!' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(10);
    expect(res.body.user.role).toBe('parent');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('2) yanlış şifre → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'parent@example.com', password: 'YanlisSifre1!' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('3) /api/auth/me token olmadan → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('4) /api/auth/me geçerli token ile → 200 ve password_hash yok', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'specialist@example.com', password: 'Specialist123!' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('specialist@example.com');
    expect(res.body.user.role).toBe('specialist');
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
  });
});
