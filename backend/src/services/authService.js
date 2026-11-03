const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Varsayılan secret yok: tanımlı değilse token üretmek/doğrulamak yerine hata ver.
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET tanımlı değil');
  return secret;
}

// password_hash asla dışarı verilmez (NFR-01)
function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

function findByEmail(email) {
  return db.prepare('SELECT * FROM USER WHERE email = ?').get(email);
}

function findById(id) {
  return db.prepare('SELECT * FROM USER WHERE id = ?').get(id);
}

// Başarılıysa { token, user }, değilse null döner.
// E-posta yoksa da şifre yanlışsa da aynı sonuç: kullanıcı varlığı sızdırılmaz.
function login(email, password) {
  const row = findByEmail(String(email).trim().toLowerCase());
  if (!row) return null;
  if (!bcrypt.compareSync(String(password), row.password_hash)) return null;

  const token = jwt.sign({ sub: row.id, role: row.role }, getSecret(), { expiresIn: '1h' });
  return { token, user: toPublicUser(row) };
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { login, verifyToken, findById, toPublicUser };
