// Backend açılmadan önce e2e veritabanını siler; her test çalıştırması temiz seed verisiyle başlar.
const fs = require('fs');
const path = require('path');

const dir = path.dirname(process.env.DB_FILE);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
