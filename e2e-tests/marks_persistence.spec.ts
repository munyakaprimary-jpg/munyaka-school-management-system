import { test, expect } from "@playwright/test";

test("Assessment marks persistence across reloads", async ({ page }) => {
  await page.goto("/assessments");

  // Wait for assessments page to load
  await expect(page.locator("h1")).toContainText("Marks Entry");

  // Fill in a mark in the first input cell
  const firstInput = page.locator("input[type='text']").first();
  await firstInput.click();
  await firstInput.fill("88");

  // Reload the page to simulate closing and reopening the app
  await page.reload();

  // Verify the mark is still there (hydrated from localStorage)
  await expect(page.locator("input[type='text']").first()).toHaveValue("88");
});
