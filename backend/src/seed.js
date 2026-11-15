const bcrypt = require('bcryptjs');
const db = require('./db');

// Roller SDD'ye göre: parent, specialist, child. Hepsi sentetik veri (NFR-03).
const DEMO_USERS = [
  { name: 'Demo Veli', email: 'parent@example.com', password: 'Parent123!', role: 'parent' },
  { name: 'Demo Uzman', email: 'specialist@example.com', password: 'Specialist123!', role: 'specialist' },
  { name: 'Demo Çocuk', email: 'child@example.com', password: 'Child123!', role: 'child' },
  { name: 'Demo Öğretmen', email: 'teacher@example.com', password: 'Teacher123!', role: 'specialist' },
];

// Bu haftanın pazartesisinden itibaren `offset` gün sonrası, 'YYYY-MM-DD' (yerel saat).
function dayOfThisWeek(offset, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - sinceMonday + offset);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Bu haftaya ait demo etkinlikleri ve görevleri (M3, M4 demosu ve haftalık görünümler için).
// [gün (0 = pazartesi), saat, başlık, ekleyen]
const DEMO_EVENTS = [
  [0, '10:00', 'Psikolog seansı', 'specialist@example.com'],
  [2, '15:30', 'Yüzme dersi', 'parent@example.com'],
  [4, '11:00', 'Okul veli toplantısı', 'parent@example.com'],
];
// [gün, başlık, açıklama, gelişim alanı, durum, atayan]
const DEMO_TASKS = [
  [1, '10 dakika kitap oku', 'Sevdiğin bir kitaptan 10 dakika oku.', 'language', 'done', 'parent@example.com'],
  [3, 'Duygu kartlarıyla oyna', 'Kartlardaki 5 duyguyu adlandır.', 'social', 'open', 'specialist@example.com'],
  [5, 'Lego ile kule yap', 'En az 10 parçalı bir kule yap.', 'motor', 'open', 'parent@example.com'],
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

    // Etkinlik ve görevler sadece çocuğun hiç kaydı yoksa eklenir; seed tekrar çalışınca çoğalmaz.
    const hasEvents = db.prepare('SELECT 1 FROM EVENT WHERE child_id = ?').get(child.id);
    if (!hasEvents) {
      const insertEvent = db.prepare(
        'INSERT INTO EVENT (child_id, title, starts_at, created_by) VALUES (?, ?, ?, ?)'
      );
      for (const [day, time, title, by] of DEMO_EVENTS) {
        insertEvent.run(child.id, title, `${dayOfThisWeek(day)}T${time}`, idOf(by));
      }
    }

    const hasTasks = db.prepare('SELECT 1 FROM TASK WHERE child_id = ?').get(child.id);
    if (!hasTasks) {
      const insertTask = db.prepare(
        `INSERT INTO TASK (child_id, title, description, area, due_date, status, assigned_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      for (const [day, title, description, area, status, by] of DEMO_TASKS) {
        insertTask.run(child.id, title, description, area, dayOfThisWeek(day), status, idOf(by));
      }
    }
  });
  run();
  return DEMO_USERS.length;
}

module.exports = { seed, dayOfThisWeek, DEMO_USERS, DEMO_EVENTS, DEMO_TASKS };

if (require.main === module) {
  seed();
  console.log(
    `${DEMO_USERS.length} demo kullanıcı, 1 demo çocuk, ${DEMO_EVENTS.length} etkinlik ve ${DEMO_TASKS.length} görev eklendi (zaten varsa atlandı).`
  );
}
