require('dotenv').config({ quiet: true });
const app = require('./app');

const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET tanımlı değil. .env.example dosyasını .env olarak kopyalayıp doldurun.');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT} adresinde çalışıyor`);
});
