# Walking Skeleton (v0.0) – Görev Rehberi

**Son teslim:** 8 Kasım Pazar 23:59 (Week 6). O gün `main` üzerinde `v0.0` tag'i olmalı.

**Walking skeleton nedir?** Uygulamanın en ince ama uçtan uca çalışan hali: login sayfası → backend → SQLite → JWT. Başka özellik yok. Roller, uzman bağlama, takvim vs. Sprint 2'nin işi; bu hafta yapma.

## Kim, ne, ne zaman

| Görev | Kim | Ne zaman |
|---|---|---|
| TRI-15 Repo yapısı, README, CI | Çağrı | ✅ hazır, PR'ı merge edilince başla |
| TRI-17 Backend: Express + SQLite + login | **Furkan** | Çarşamba 4 Kas'a kadar PR |
| TRI-16 Frontend: React + login sayfası | **Cem** | Çarşamba 4 Kas'a kadar PR |
| TRI-18 Login sayfasını backend'e bağla | **Cem** | TRI-17 merge olunca, Cuma 6 Kas'a kadar PR |
| `v0.0` tag'i | Çağrı | Cumartesi / Pazar |

## Her görev için aynı adımlar

1. Jira'da kartını **Devam Ediyor**'a sürükle.
2. Güncel `main`'den branch aç (isim Jira numarasıyla başlamalı):
   ```bash
   git checkout main && git pull
   git checkout -b TRI-17-backend-login
   ```
3. Her commit mesajı Jira numarasıyla başlasın. **Hoca bireysel katkıyı buradan ölçüyor**, kendi hesabından commit at:
   ```bash
   git commit -m "TRI-17 Add login endpoint"
   git push -u origin TRI-17-backend-login
   ```
4. GitHub'da `main`'e PR aç, şablonu doldur, birini reviewer ekle. CI yeşil olmalı.
5. Merge olunca Jira'da kartı **Tamamlandı**'ya çek.

Küçük küçük commit at (günde birkaç tane). Tek seferde dev bir commit kötü görünüyor.

## Ortak sözleşme (ikinizin parçası bununla birbirine oturacak)

- Node 22, her klasör kendi `package.json` ve `package-lock.json`'ı ile. **Lock dosyasını commit'le**, CI `npm ci` kullanıyor.
- CI her klasörde `npm test` çalıştırıyor, frontend'de ayrıca `npm run build`. İkisi de geçmeli.
- Backend portu **3001**, frontend portu **5173**.
- **`POST /api/auth/login`**
  - İstek: `{ "email": "...", "password": "..." }`
  - Başarılı → `200 { "token": "<jwt>", "user": { "id", "name", "email", "role" } }`
  - Yanlış e-posta veya şifre → `401 { "error": "Invalid email or password" }`
- **`GET /api/auth/me`**, `Authorization: Bearer <token>` header'ı ile
  - Token geçerliyse `200 { "user": {...} }`, yoksa veya geçersizse `401`
- `role` değeri: `parent` | `specialist` | `child`. Kullanıcı rolünü seçmiyor, hesaptan geliyor.
- Demo hesaplar (sadece sahte veri):

  | E-posta | Şifre | Rol |
  |---|---|---|
  | parent@example.com | Parent123! | parent |
  | specialist@example.com | Specialist123! | specialist |
  | child@example.com | Child123! | child |

---

## Furkan – TRI-17 Backend

**Paketler:** `express`, `better-sqlite3`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`
**Dev paketleri:** `jest`, `supertest`, `nodemon`

**Klasör yapısı** (isimler SDD ile aynı):
```
backend/
├── package.json        scripts: dev, start, seed, test
├── .env.example        PORT=3001, JWT_SECRET=change-me, DB_FILE=./data.sqlite, AI_MODE=mock
├── src/
│   ├── app.js          Express app'i export eder (listen YOK, testler bunu kullanır)
│   ├── server.js       app.listen(PORT)
│   ├── db.js           SQLite bağlantısı + USER tablosunu oluşturur
│   ├── seed.js         3 demo kullanıcıyı ekler (şifreler bcrypt hash'li)
│   ├── routes/authRoutes.js
│   ├── services/authService.js
│   └── middleware/authMiddleware.js   Bearer token'ı doğrular, yoksa 401
└── tests/auth.test.js
```

**`package.json` scriptleri:**
```json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "seed": "node src/seed.js",
  "test": "jest"
}
```

**USER tablosu:** `id, name, email UNIQUE, password_hash, role` (SDD'deki ER diyagramı)

**Dikkat edilecekler**
- Şifre **asla** düz metin saklanmayacak, hiçbir cevapta `password_hash` dönmeyecek (NFR-01).
- Testlerde `DB_FILE=:memory:` kullan ki test veritabanı her seferinde temiz olsun. Test başında seed fonksiyonunu çağır.

**En az şu 4 test** (`tests/auth.test.js`, Supertest ile):
1. Doğru e-posta ve şifre → 200 + token + user.role
2. Yanlış şifre → 401
3. `/api/auth/me` token olmadan → 401
4. `/api/auth/me` geçerli token ile → 200 ve cevapta `password_hash` yok

**Kontrol:** `npm run seed && npm run dev`, sonra:
```bash
curl -X POST localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"parent@example.com","password":"Parent123!"}'
```

---

## Cem – TRI-16 Frontend ve TRI-18 Bağlantı

**TRI-16:**
```bash
npm create vite@latest frontend -- --template react
```
**Dev paketleri:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

```
frontend/
├── vite.config.js      proxy: '/api' → http://localhost:3001  +  test: { environment: 'jsdom' }
├── src/
│   ├── api.js          login(email, password) → fetch('/api/auth/login')
│   ├── pages/LoginPage.jsx
│   └── App.jsx
└── src/pages/LoginPage.test.jsx
```

- `package.json` içinde `"test": "vitest run"` olsun (CI'da beklemeden bitsin).
- `vite.config.js` içine proxy:
  ```js
  server: { proxy: { '/api': 'http://localhost:3001' } }
  ```
- **LoginPage:** e-posta, şifre ve "Giriş yap" butonu. **Rol seçimi YOK** (FR-M1-02). Hata gelirse kırmızı mesaj göster (FR-M1-04).
- **En az 1 Vitest testi:** sayfa e-posta ve şifre alanlarını ve butonu gösteriyor.
- Bu aşamada `api.js` henüz backend olmadan da derlenebilmeli.

**TRI-18** (Furkan'ın PR'ı merge edildikten sonra):
- Login başarılıysa token'ı `localStorage`'a kaydet, ekranda "Hoş geldin, {name} ({role})" ve "Çıkış" butonu göster.
- 401 gelirse "E-posta veya şifre hatalı" mesajı göster.
- Bir test daha: `fetch`'i mock'la, 401 gelince hata mesajı görünüyor mu?
- **Kontrol:** backend ve frontend açıkken http://localhost:5173 adresinden 3 demo hesapla giriş yap. Yanlış şifreyle hata mesajını gör.

---

## Bitti sayılması için (v0.0)

- [ ] README'deki adımlarla sıfırdan kurulup çalışıyor
- [ ] 3 demo hesapla login oluyor, yanlış şifre hata veriyor
- [ ] CI `main`'de yeşil (backend ve frontend testleri)
- [ ] TRI-15, 16, 17 ve 18 Jira'da Tamamlandı
- [ ] `main`'e `v0.0` tag'i atıldı

Takılırsan gruba yaz. AI asistanı (Claude, Copilot) kullanabilirsin ama final raporda belirteceğiz ve **yazdığın kodu demoda anlatabilmen lazım.**
