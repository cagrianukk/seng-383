const { test, expect } = require('@playwright/test');

// SRS Flow 2: Bağlı uzman görev atar, çocuk tamamlar.
// Uzman durumu "Tamamlandı" görür ve haftalık tamamlanma oranı bu görevi içerir (FR-M7-01).

async function login(page, email, password) {
  await page.goto('/');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Şifre').fill(password);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page.getByRole('button', { name: 'Çıkış' })).toBeVisible();
}

// Bugün, yerel saatle 'YYYY-MM-DD' (görev bu haftaya düşsün diye son tarih bugün).
function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// İstatistik sayfasındaki "(done / assigned görev)" metnini okur.
async function weeklyCounts(page) {
  await page.getByRole('link', { name: 'İstatistik' }).click();
  const text = await page.getByText(/\(\d+ \/ \d+ görev\)/).textContent();
  const [, done, assigned] = text.match(/\((\d+) \/ (\d+) görev\)/);
  return { done: Number(done), assigned: Number(assigned) };
}

test('uzman görev atar, çocuk tamamlar, uzman durumu ve haftalık oranı görür', async ({ browser }) => {
  const specialistPage = await (await browser.newContext()).newPage();
  const childPage = await (await browser.newContext()).newPage();
  const title = 'E2E: Hayvan resmi çiz';

  await login(specialistPage, 'specialist@example.com', 'Specialist123!');
  const before = await weeklyCounts(specialistPage);

  // Uzman görevi atar; yeni görev "Açık" başlar
  await specialistPage.getByRole('link', { name: 'Görevler' }).click();
  await specialistPage.getByLabel('Başlık').fill(title);
  await specialistPage.getByLabel('Açıklama').fill('Sevdiğin bir hayvanı çiz.');
  await specialistPage.getByLabel('Gelişim alanı').selectOption('motor');
  await specialistPage.getByLabel('Son tarih').fill(todayIso());
  await specialistPage.getByRole('button', { name: 'Görevi ata' }).click();
  await expect(specialistPage.getByRole('status')).toHaveText('Görev atandı.');

  const assignedRow = specialistPage.getByRole('listitem').filter({ hasText: title });
  await expect(assignedRow).toContainText('Açık');

  // Çocuk görevi kendi listesinde görür ve tamamlar
  await login(childPage, 'child@example.com', 'Child123!');
  await childPage.getByRole('link', { name: 'Görevlerim' }).click();
  const childRow = childPage.getByRole('listitem').filter({ hasText: title });
  await childRow.getByRole('button', { name: 'Tamamladım' }).click();
  await expect(childRow).toContainText('Tamamlandı');
  await expect(childRow.getByRole('button')).toHaveCount(0);

  // Uzman durumu "Tamamlandı" görür
  await specialistPage.reload();
  await expect(specialistPage.getByRole('listitem').filter({ hasText: title })).toContainText(
    'Tamamlandı'
  );

  // Haftalık oran yeni görevi içerir: atanan ve tamamlanan birer artar
  const after = await weeklyCounts(specialistPage);
  expect(after).toEqual({ done: before.done + 1, assigned: before.assigned + 1 });
});

test('çocuk görev atama ve istatistik sayfalarını göremez', async ({ page }) => {
  await login(page, 'child@example.com', 'Child123!');
  await expect(page.getByRole('link', { name: 'Görevler', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'İstatistik' })).toHaveCount(0);

  await page.goto('/stats');
  await expect(page.getByRole('heading', { name: /Hoş geldin/ })).toBeVisible();
});
