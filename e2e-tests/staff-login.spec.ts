import { test, expect } from '@playwright/test';

test('Staff / Teacher can sign in via the Portal Access screen', async ({ page }) => {
  // Make sure we start clean — no persisted session
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.removeItem('munyaka_session');
  });

  // Land on the Portal Access screen
  await page.goto('/login');

  // The "Staff / Teacher" tab is the default tab on the Portal Access screen
  const staffTab = page.getByRole('tab', { name: /Staff \/ Teacher/i });
  await expect(staffTab).toBeVisible();
  await staffTab.click();

  // Search for a known pre-registered teacher
  const searchInput = page.getByPlaceholder(/Search by name, email, or National ID/i);
  await expect(searchInput).toBeVisible();
  await searchInput.fill('Jane Mwangi');

  // Pick the teacher from the dropdown
  const janeOption = page.getByRole('button', { name: /Jane Mwangi/i });
  await expect(janeOption).toBeVisible();
  await janeOption.click();

  // The access code field should now be focused/visible
  const codeInput = page.getByPlaceholder(/MUNYAKA-9020/i);
  await expect(codeInput).toBeVisible();

  // Enter the access code and sign in
  await codeInput.fill('MUNYAKA-9020');
  await page.getByRole('button', { name: /Sign In as Staff \/ Teacher/i }).click();

  // The teacher should be redirected to a non-admin page (dashboard or home)
  await page.waitForURL((url) => !url.pathname.includes('/login') && !url.pathname.includes('/system-management') && !url.pathname.includes('/payment-management'), {
    timeout: 10_000,
  });
  expect(page.url()).not.toContain('/login');
  expect(page.url()).not.toContain('/system-management');
  expect(page.url()).not.toContain('/payment-management');
});

test('Super Admin (Owner) tab still works', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.removeItem('munyaka_session');
  });

  await page.goto('/login');

  const superTab = page.getByRole('tab', { name: /Super Admin/i });
  await expect(superTab).toBeVisible();
  await superTab.click();

  const superCard = page.getByRole('button', { name: /Super Admin \(Owner\)/i });
  await expect(superCard).toBeVisible();
  await superCard.click();

  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('ownerpass2026');
  await page.getByRole('button', { name: /^Sign In$/i }).click();

  await page.waitForURL('**/payment-management', { timeout: 10_000 });
  expect(page.url()).toContain('/payment-management');
});
