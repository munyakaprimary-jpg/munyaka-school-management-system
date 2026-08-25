import { test, expect } from "@playwright/test";

test("Assessment Number validation and label in Register New Learner modal", async ({ page }) => {
  await page.goto("/students");

  // Open Add Student modal
  await page.getByRole("button", { name: /Add Student/i }).click();

  // Verify label is "Assessment Number *"
  await expect(page.getByText("Assessment Number *")).toBeVisible();

  // Test invalid assessment number starting with a number
  const admInput = page.locator("input[placeholder='e.g. A827361']");
  await admInput.fill("12345ABC");
  await page.getByPlaceholder("e.g. Brian Kiprop").fill("Jane Doe");

  // Fill required guardian fields
  await page.getByPlaceholder("Name").fill("Guardian Name");
  await page.getByPlaceholder("+254").fill("+254712345678");

  // Try submitting
  await page.getByRole("button", { name: /Register Student/i }).click();

  // Verify error message is shown
  await expect(page.getByText(/Assessment Number must strictly begin with an alphabetic letter/i)).toBeVisible();

  // Fix assessment number to valid format starting with letter
  await admInput.fill("Z827361");

  // Submit again
  await page.getByRole("button", { name: /Register Student/i }).click();

  // Verify learner appears successfully
  await expect(page.getByText("Jane Doe")).toBeVisible();
  await expect(page.getByText("Z827361")).toBeVisible();
});
