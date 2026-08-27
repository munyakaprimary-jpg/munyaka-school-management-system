import { test, expect } from '@playwright/test';

test('Notice attachment chip is wired to a downloadable URL', async ({ page }) => {
  await page.goto('/notices');

  // The seed notice n1 ships with a Term 3 fee guidelines attachment.
  const attachment = page.getByTestId('notice-attachment-n1');
  await expect(attachment).toBeVisible();
  await expect(attachment).toContainText('Term3_Fee_Guidelines_2025.pdf');

  // The element should be a real <button> with an accessible label and title
  // so screen readers and keyboard users can activate it.
  await expect(attachment).toHaveAttribute('type', 'button');
  await expect(attachment).toHaveAttribute('aria-label', /Download Term3_Fee_Guidelines_2025\.pdf/);
  await expect(attachment).toHaveAttribute('title', /Download Term3_Fee_Guidelines_2025\.pdf/);
});
