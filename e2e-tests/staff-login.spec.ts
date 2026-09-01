import { test, expect } from '@playwright/test';

test('Staff / Teacher can sign in with Staff ID and Password', async ({ page }) => {
  // Ensure clean session
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.removeItem('munyaka_session');
  });

  await page.goto('/login');

  // The Staff / Teacher tab is the default active tab on the Portal Access screen
  const staffTab = page.getByRole('tab', { name: /Staff \/ Teacher/i });
  await expect(staffTab).toBeVisible();

  // Fill in Staff ID and Password
  const staffIdInput = page.getByLabel(/Staff ID \/ Username/i);
  await expect(staffIdInput).toBeVisible();
  await staffIdInput.fill('teacher1');

  const passwordInput = page.getByLabel(/Access Code \/ Password/i);
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('munyaka5239');

  // Sign in
  await page.getByRole('button', { name: /Sign In as Staff \/ Teacher/i }).click();

  // Should redirect away from /login to a non-admin dashboard
  await page.waitForURL((url) => {
    const path = url.pathname();
    return path !== '/login' && path !== '/system-management' && path !== '/payment-management';
  }, { timeout: 10_000 });

  expect(page.url()).not.toContain('/login');
  expect(page.url()).not.toContain('/system-management');
  expect(page.url()).not.toContain('/payment-management');
});

test('Super Admin tab still works', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.removeItem('munyaka_session');
  });

  await page.goto('/login');

  const superTab = page.getByRole('tab', { name: /Super Admin/i });
  await expect(superTab).toBeVisible();
  await superTab.click();

  const superCard = page.getByRole('button', { name: /^Super Admin$/i });
  await expect(superCard).toBeVisible();
  await superCard.click();

  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('superadmin2026');
  await page.getByRole('button', { name: /^Sign In$/i }).click();

  await page.waitForURL('**/payment-management', { timeout: 10_000 });
  expect(page.url()).toContain('/payment-management');
});
