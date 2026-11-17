import { test, expect } from '@playwright/test';

test('James Ndiki logs in and views ICT Teacher Portal without subject teacher mismatch', async ({ page }) => {
  await page.goto('/');

  // Navigate to Staff / Teacher login tab
  const staffTab = page.getByRole('tab', { name: 'Staff' });
  if (await staffTab.isVisible()) {
    await staffTab.click();
  }

  // Fill in James Ndiki's email and access code
  const emailInput = page.locator('#staff-id');
  const passwordInput = page.locator('#staff-password');

  await emailInput.fill('ndiki@munyaka.sc.ke');
  await passwordInput.fill('MUN-1234');

  const submitButton = page.getByRole('button', { name: /Sign In as Staff /i });
  await submitButton.click();

  // Verify successful sign in and redirection to ICT Lab or ICT Portal
  await expect(page).toHaveURL(/\/(dashboard|ict-lab|server)/);

  // Verify dashboard banner displays ICT Lab & Devices Management Hub rather than generic Subject Teacher Dashboard
  await expect(page.getByText('ICT Lab & Devices Management Hub')).toBeVisible();
});
