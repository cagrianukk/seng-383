const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

// Uçtan uca testler gerçek backend + frontend ile çalışır.
// Backend her çalıştırmada boş bir test veritabanıyla açılır ve seed edilir.
const DB_FILE = path.join(__dirname, '.tmp', 'e2e.sqlite');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node ../e2e/reset-db.js && npm run seed && npm start',
      cwd: path.join(__dirname, '..', 'backend'),
      url: 'http://localhost:3001/api/health',
      env: { DB_FILE, JWT_SECRET: 'e2e-secret', PORT: '3001', AI_MODE: 'mock' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --strictPort',
      cwd: path.join(__dirname, '..', 'frontend'),
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
