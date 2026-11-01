const bcrypt = require('bcryptjs');
const db = require('./db');

// Roller SDD'ye göre: parent, specialist, child
const DEMO_USERS = [
  { name: 'Demo Veli', email: 'parent@example.com', password: 'Parent123!', role: 'parent' },
  { name: 'Demo Uzman', email: 'specialist@example.com', password: 'Specialist123!', role: 'specialist' },
  { name: 'Demo Çocuk', email: 'child@example.com', password: 'Child123!', role: 'child' },
];

function seed() {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO USER (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  const run = db.transaction(() => {
    for (const u of DEMO_USERS) {
      insert.run(u.name, u.email, bcrypt.hashSync(u.password, 10), u.role);
    }
  });
  run();
  return DEMO_USERS.length;
}

module.exports = { seed, DEMO_USERS };

if (require.main === module) {
  seed();
  console.log(`${DEMO_USERS.length} demo kullanıcı eklendi (zaten varsa atlandı).`);
}
