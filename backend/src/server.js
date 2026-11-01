require('dotenv').config({ quiet: true });
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT} adresinde çalışıyor`);
});
