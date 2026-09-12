import { test, expect } from "@playwright/test";

test("Add learner persists across page reloads", async ({ page }) => {
  await page.goto("/students");

  // Click Add Student button
  await page.getByRole("button", { name: /Add Student/i }).click();

  // Fill in the form
  await page.getByPlaceholder("John Doe").fill("Test Learner New");
  await page.getByPlaceholder("A100200").fill("Z999888");

  // Select Grade
  await page.getByRole("combobox", { name: /Select grade/i }).click();
  await page.getByRole("option", { name: /Grade 4/i }).click();

  // Select Stream
  await page.getByRole("combobox", { name: /Choose stream/i }).click();
  await page.getByRole("option", { name: /Blue/i }).click();

  // Fill guardian & phone
  await page.getByPlaceholder("Name").fill("Test Guardian");
  await page.getByPlaceholder("+254").fill("+254 700 999 888");
  await page.getByPlaceholder("Eldoret").fill("Eldoret Town");

  // Submit
  await page.getByRole("button", { name: /Register Student/i }).click();

  // Verify learner appears in table
  await expect(page.getByText("Test Learner New")).toBeVisible();
  await expect(page.getByText("Z999888")).toBeVisible();

  // Reload page
  await page.reload();

  // Verify learner still persists in table after reload
  await expect(page.getByText("Test Learner New")).toBeVisible();
  await expect(page.getByText("Z999888")).toBeVisible();
});
