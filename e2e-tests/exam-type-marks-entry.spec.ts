import { test, expect } from "@playwright/test";

test("select exam type for marks entry pre-fills Enter Marks view", async ({ page }) => {
  // Navigate to the Exam Types page
  await page.goto("/exam-types");

  // Wait for exam cards to load
  await expect(page.getByText("Select for Marks Entry").first()).toBeVisible();

  // Get the title of the first active exam card
  const firstExamCard = page.locator("div", { hasText: "Select for Marks Entry" }).first();
  const examTitle = await firstExamCard.locator("h4").textContent();

  // Click "Select for Marks Entry" on the first exam card
  await page.getByRole("button", { name: /Select for Marks Entry/i }).first().click();

  // Should navigate to the Assessments (Enter Marks) page
  await expect(page.locator("h1")).toContainText("Marks Entry");

  // The Exam Type dropdown should be pre-filled with the selected exam title
  const examTypeSelect = page.locator("select").filter({ has: page.locator("option", { hasText: examTitle! }) });
  await expect(examTypeSelect).toHaveValue(examTitle!);
});
