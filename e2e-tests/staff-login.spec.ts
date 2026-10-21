import { test, expect } from '@playwright/test';

// ── Staff Login End-to-End Spec ─────────────────────────────────────────────
// Updated to match the current UI (CoverPage dismissal, correct tab and label names).

const dismissCover = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: /Proceed to Portal Sign In/i }).click();
};

test('Staff member can sign in using school email and access code', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('munyaka_session'));

  await dismissCover(page);

  // The default tab is 'Staff'
  const staffTab = page.getByRole('tab', { name: /^Staff$/i });
  await expect(staffTab).toBeVisible();

  // Fill staff credentials
  await page.getByLabel(/School Email Address/i).fill('teacher1@munyaka.sc.ke');
  await page.getByLabel(/Access Code/i).fill('MUN-9632');

  await page.getByRole('button', { name: /Sign In as Staff/i }).click();

  // Should navigate to dashboard or staff portal
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
  expect(page.url()).toContain('/dashboard');
});
