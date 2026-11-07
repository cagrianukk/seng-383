const { test, expect } = require('@playwright/test');

// SRS Flow 1: Veli bir uzmanı bağlar ve bağı kaldırır.
// Bağlıyken uzman çocuğu görür, bağ kaldırılınca göremez; kayıtlı olmayan e-posta hata verir.

async function login(page, email, password) {
  await page.goto('/');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Şifre').fill(password);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page.getByRole('button', { name: 'Çıkış' })).toBeVisible();
}

test('veli uzmanı bağlar, uzman çocuğu görür, bağ kaldırılınca göremez', async ({ browser }) => {
  const parentPage = await (await browser.newContext()).newPage();
  const teacherPage = await (await browser.newContext()).newPage();

  // Öğretmen başta hiçbir çocuğa bağlı değil
  await login(teacherPage, 'teacher@example.com', 'Teacher123!');
  await teacherPage.getByRole('link', { name: 'Çocuklarım' }).click();
  await expect(teacherPage.getByText('Henüz size bağlı bir çocuk yok.')).toBeVisible();

  // Veli uzmanlar sayfasına gider; kayıtlı olmayan e-posta hata verir
  await login(parentPage, 'parent@example.com', 'Parent123!');
  await parentPage.getByRole('link', { name: 'Uzmanlar' }).click();
  await expect(parentPage.getByRole('heading', { name: 'Bağlı uzmanlar' })).toBeVisible();

  await parentPage.getByLabel('Uzmanın e-postası').fill('yok@example.com');
  await parentPage.getByRole('button', { name: 'Bağla' }).click();
  await expect(parentPage.getByRole('alert')).toHaveText('Bu e-posta ile kayıtlı bir uzman bulunamadı');

  // Veli öğretmeni bağlar
  await parentPage.getByLabel('Uzmanın e-postası').fill('teacher@example.com');
  await parentPage.getByLabel('Uzman türü').selectOption('teacher');
  await parentPage.getByRole('button', { name: 'Bağla' }).click();
  const teacherRow = parentPage.getByRole('listitem').filter({ hasText: 'Demo Öğretmen' });
  await expect(teacherRow).toContainText('Öğretmen');

  // Öğretmen artık çocuğu görür
  await teacherPage.reload();
  await expect(teacherPage.getByRole('listitem').filter({ hasText: 'Demo Çocuk' })).toBeVisible();

  // Veli onay vererek bağı kaldırır
  parentPage.once('dialog', (dialog) => dialog.accept());
  await teacherRow.getByRole('button', { name: 'Bağı kaldır' }).click();
  await expect(teacherRow).toHaveCount(0);

  // Öğretmen çocuğu artık göremez
  await teacherPage.reload();
  await expect(teacherPage.getByText('Henüz size bağlı bir çocuk yok.')).toBeVisible();
});

test('çocuk hesabı uzmanlar sayfasını göremez (FR-M1-03)', async ({ page }) => {
  await login(page, 'child@example.com', 'Child123!');
  await expect(page.getByRole('link', { name: 'Uzmanlar' })).toHaveCount(0);

  await page.goto('/specialists');
  await expect(page.getByRole('heading', { name: /Hoş geldin/ })).toBeVisible();
});
