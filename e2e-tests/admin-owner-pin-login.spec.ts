import { test, expect } from '@playwright/test';

// ── New authentication sync flow ──────────────────────────────────────────────
// The Login page now checks the local `admin_pin` / `owner_pin` first, then
// falls back to Firebase Cloud Auth. These specs exercise that flow end to end.

const dismissCover = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: /Proceed to Portal Sign In/i }).click();
};

test('Admin signs in with local admin_pin and lands on dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('munyaka_session'));
  await page.evaluate(() => localStorage.removeItem('munyaka_admin_session'));

  await dismissCover(page);

  // Switch to the Admin tab
  const adminTab = page.getByRole('tab', { name: /Admin/i });
  await expect(adminTab).toBeVisible();
  await adminTab.click();

  // Fill the password field (placeholder "Enter your password")
  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('munyaka');

  await page.getByRole('button', { name: /^Sign In$/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 10_000 });
  expect(page.url()).toContain('/dashboard');
});

test('Owner signs in with local owner_pin and lands on dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('munyaka_session'));
  await page.evaluate(() => localStorage.removeItem('munyaka_owner_session'));

  await dismissCover(page);

  // Switch to the Owner tab
  const ownerTab = page.getByRole('tab', { name: /Owner/i });
  await expect(ownerTab).toBeVisible();
  await ownerTab.click();

  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('munyaka');

  await page.getByRole('button', { name: /^Sign In$/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 10_000 });
  expect(page.url()).toContain('/dashboard');
});

test('Wrong admin PIN shows invalid password error instead of navigating', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('munyaka_session'));
  await page.evaluate(() => localStorage.removeItem('munyaka_admin_session'));

  await dismissCover(page);

  const adminTab = page.getByRole('tab', { name: /Admin/i });
  await adminTab.click();

  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await passwordInput.fill('wrongpass');

  await page.getByRole('button', { name: /^Sign In$/i }).click();

  // The local PIN check fails, then Firebase Cloud Auth fails too — an error
  // banner should appear rather than navigating away.
  await expect(page.getByText(/Invalid password for School Administrator/i)).toBeVisible({
    timeout: 8_000,
  });
});
