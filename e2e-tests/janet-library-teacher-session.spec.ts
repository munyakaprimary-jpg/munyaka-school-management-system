import { test, expect } from '@playwright/test';

const dismissCover = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: /Proceed to Portal Sign In/i }).click();
};

test('Janet Gathoni Kungu logs in with correct library teacher session role and sees Librarian Portal', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('munyaka_session'));

  await dismissCover(page);

  // Sign in as Janet Gathoni Kungu (Library Teacher)
  await page.getByLabel(/School Email Address/i).fill('janetkungu@munyaka.sc.ke');
  // Access code for staff
  await page.getByLabel(/Access Code/i).fill('MUN-7849');
  await page.getByRole('button', { name: /Sign In as Staff/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 10_000 });

  // Navigate to Librarian / Library portal
  const libraryNav = page.getByRole('link', { name: /Library & E-Resources/i });
  await expect(libraryNav).toBeVisible();
  await libraryNav.click();

  await page.waitForURL('**/library', { timeout: 10_000 });
  expect(page.url()).toContain('/library');

  // Verify workstation banner reads Librarian & Asset Portal or has librarian control buttons
  await expect(page.getByText(/Librarian & Asset Portal/i)).toBeVisible();
});
