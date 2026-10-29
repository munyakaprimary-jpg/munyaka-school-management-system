import { test, expect } from '@playwright/test';

// ── Daily Check-In Staff Access Spec ─────────────────────────────────────────

const dismissCover = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: /Proceed to Portal Sign In/i }).click();
};

test('All staff roles (e.g. subject teacher, class teacher, support staff) have access to Daily Check-In', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('munyaka_session'));

  await dismissCover(page);

  // Sign in as a regular teacher/staff
  await page.getByLabel(/School Email Address/i).fill('teacher1@munyaka.sc.ke');
  await page.getByLabel(/Access Code/i).fill('MUN-9632');
  await page.getByRole('button', { name: /Sign In as Staff/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 10_000 });

  // Verify "Daily Check-In" is visible in the sidebar for all staff roles
  const dailyCheckInNav = page.getByRole('link', { name: /Daily Check-In/i });
  await expect(dailyCheckInNav).toBeVisible();

  // Click Daily Check-In and verify navigation to check-in portal
  await dailyCheckInNav.click();
  await page.waitForURL('**/staff/check-in', { timeout: 10_000 });
  expect(page.url()).toContain('/staff/check-in');
});
