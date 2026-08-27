import { test, expect } from '@playwright/test';

test('Notice & Events unified page renders notices and calendar events', async ({ page }) => {
  await page.goto('/');

  // Navigate to Notice & Events from sidebar or direct route
  await page.goto('/notices');

  // Check main title
  await expect(page.getByRole('heading', { name: 'Notice Board' })).toBeVisible();

  // Verify Notice Board feed section is present
  await expect(page.getByText('Notice Board Feed')).toBeVisible();

  // Verify Upcoming Events sidebar is present
  await expect(page.getByText('Upcoming Events')).toBeVisible();

  // Test Publish Modal trigger
  await page.getByRole('button', { name: 'Publish Notice' }).click();
  await expect(page.getByText('Publish New Notice')).toBeVisible();
});
