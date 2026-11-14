const bcrypt = require('bcryptjs');
const db = require('./db');

// Roller SDD'ye göre: parent, specialist, child. Hepsi sentetik veri (NFR-03).
const DEMO_USERS = [
  { name: 'Demo Veli', email: 'parent@example.com', password: 'Parent123!', role: 'parent' },
  { name: 'Demo Uzman', email: 'specialist@example.com', password: 'Specialist123!', role: 'specialist' },
  { name: 'Demo Çocuk', email: 'child@example.com', password: 'Child123!', role: 'child' },
  { name: 'Demo Öğretmen', email: 'teacher@example.com', password: 'Teacher123!', role: 'specialist' },
];

// Demo Çocuk, Demo Veli'nin çocuğu. Demo Uzman psikolog olarak bağlı,
// Demo Öğretmen bağlı değil (uzman bağlama akışını denemek için).
function seed() {
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO USER (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  const idOf = (email) => db.prepare('SELECT id FROM USER WHERE email = ?').get(email).id;

  const run = db.transaction(() => {
    for (const u of DEMO_USERS) {
      insertUser.run(u.name, u.email, bcrypt.hashSync(u.password, 10), u.role);
    }

    const childUserId = idOf('child@example.com');
    let child = db.prepare('SELECT id FROM CHILD WHERE user_id = ?').get(childUserId);
    if (!child) {
      const info = db
        .prepare('INSERT INTO CHILD (name, parent_id, user_id) VALUES (?, ?, ?)')
        .run('Demo Çocuk', idOf('parent@example.com'), childUserId);
      child = { id: info.lastInsertRowid };
    }

    db.prepare(
      'INSERT OR IGNORE INTO SPECIALIST_LINK (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)'
    ).run(child.id, idOf('specialist@example.com'), 'psychologist');
  });
  run();
  return DEMO_USERS.length;
}

module.exports = { seed, DEMO_USERS };

if (require.main === module) {
  seed();
  console.log(`${DEMO_USERS.length} demo kullanıcı ve 1 demo çocuk eklendi (zaten varsa atlandı).`);
}
