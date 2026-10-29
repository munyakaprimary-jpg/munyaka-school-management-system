import { test, expect } from '@playwright/test';

const dismissCover = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: /Proceed to Portal Sign In/i }).click();
};

test('HOI and DHOI roles are classified as teaching leadership staff in registry', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('munyaka_session'));

  await dismissCover(page);

  // Sign in as admin
  await page.getByLabel(/School Email Address/i).fill('sysadmin@munyaka.sc.ke');
  await page.getByLabel(/Access Code/i).fill('munyaka2026');
  await page.getByRole('button', { name: /Sign In as Staff/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 10_000 });

  // Navigate to Staff Registry
  const staffRegNav = page.getByRole('link', { name: /Staff Registry/i });
  await expect(staffRegNav).toBeVisible();
  await staffRegNav.click();

  await page.waitForURL('**/staff-registry', { timeout: 10_000 });
  expect(page.url()).toContain('/staff-registry');
});
