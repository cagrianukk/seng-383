const db = require('../db');

const SPECIALIST_TYPES = ['teacher', 'psychologist', 'doctor', 'special_education_teacher', 'coach'];

function findChild(childId) {
  return db.prepare('SELECT * FROM CHILD WHERE id = ?').get(childId);
}

function isLinked(childId, specialistId) {
  return Boolean(
    db
      .prepare('SELECT 1 FROM SPECIALIST_LINK WHERE child_id = ? AND specialist_id = ?')
      .get(childId, specialistId)
  );
}

// Veli kendi çocuğuna, uzman bağlı olduğu çocuğa, çocuk sadece kendisine erişir (FR-M2-05).
function canAccessChild(user, child) {
  if (user.role === 'parent') return child.parent_id === user.id;
  if (user.role === 'specialist') return isLinked(child.id, user.id);
  if (user.role === 'child') return child.user_id === user.id;
  return false;
}

// GET /api/children: kullanıcının görebildiği çocuklar (FR-M2-06)
function listChildrenFor(user) {
  if (user.role === 'parent') {
    return db.prepare('SELECT id, name FROM CHILD WHERE parent_id = ? ORDER BY name').all(user.id);
  }
  if (user.role === 'specialist') {
    return db
      .prepare(
        `SELECT c.id, c.name, l.specialist_type AS specialistType
         FROM CHILD c JOIN SPECIALIST_LINK l ON l.child_id = c.id
         WHERE l.specialist_id = ? ORDER BY c.name`
      )
      .all(user.id);
  }
  if (user.role === 'child') {
    return db.prepare('SELECT id, name FROM CHILD WHERE user_id = ?').all(user.id);
  }
  return [];
}

function listSpecialists(childId) {
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, l.specialist_type AS specialistType
       FROM SPECIALIST_LINK l JOIN USER u ON u.id = l.specialist_id
       WHERE l.child_id = ? ORDER BY u.name`
    )
    .all(childId);
}

class LinkError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// FR-M2-01, FR-M2-02, FR-M2-07
function linkSpecialist(childId, email, specialistType) {
  if (!SPECIALIST_TYPES.includes(specialistType)) {
    throw new LinkError(400, 'Geçersiz uzman türü');
  }
  const specialist = db
    .prepare("SELECT id, name, email FROM USER WHERE email = ? AND role = 'specialist'")
    .get(String(email).trim().toLowerCase());
  if (!specialist) {
    throw new LinkError(404, 'Bu e-posta ile kayıtlı bir uzman bulunamadı');
  }
  if (isLinked(childId, specialist.id)) {
    throw new LinkError(409, 'Bu uzman zaten bu çocuğa bağlı');
  }
  db.prepare(
    'INSERT INTO SPECIALIST_LINK (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)'
  ).run(childId, specialist.id, specialistType);
  return { ...specialist, specialistType };
}

// FR-M2-04: bağ yoksa false döner
function unlinkSpecialist(childId, specialistId) {
  const info = db
    .prepare('DELETE FROM SPECIALIST_LINK WHERE child_id = ? AND specialist_id = ?')
    .run(childId, specialistId);
  return info.changes > 0;
}

module.exports = {
  SPECIALIST_TYPES,
  LinkError,
  findChild,
  canAccessChild,
  listChildrenFor,
  listSpecialists,
  linkSpecialist,
  unlinkSpecialist,
};
