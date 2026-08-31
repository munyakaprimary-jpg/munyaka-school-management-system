import { test, expect } from "@playwright/test";

/**
 * Learner deletion PIN confirmation flow.
 *
 * Prerequisites:
 *   - The default admin password is "sysadmin2026" (hardcoded default in
 *     src/services/adminCredentials.ts and used by AdminPinModal).
 *   - A learner row must exist in the table so we have a delete target.
 */
test("Admin PIN modal appears on delete and removes learner on correct password", async ({ page }) => {
  await page.goto("/students");

  // 1. Ensure at least one learner row is visible.
  const learnerRows = page.locator("tbody tr");
  await expect(learnerRows.first()).toBeVisible();
  const initialCount = await learnerRows.count();

  // Capture the first learner's name so we can assert after deletion.
  const firstNameCell = learnerRows.first().locator("td:nth-child(2)");
  const learnerName = await firstNameCell.textContent();

  // 2. Click the delete (trash) button on the first row.
  const deleteBtn = learnerRows.first().locator("button[title='Delete learner']");
  await deleteBtn.click();

  // 3. The Admin PIN modal appears.
  await expect(page.getByRole("heading", { name: /Confirm Permanent Deletion/i })).toBeVisible();
  await expect(page.getByText(learnerName?.trim() ?? "")).toBeVisible();

  // 4. The PIN input field is present.
  const pinInput = page.getByRole("textbox", { name: /admin password/i });
  await expect(pinInput).toBeVisible();

  // 5. Submitting the wrong PIN shows an error and the learner stays.
  await pinInput.fill("wrongpassword");
  await page.getByRole("button", { name: /Confirm/i }).click();
  await expect(page.getByText(/incorrect admin password/i)).toBeVisible();
  await expect(learnerRows.first()).toBeVisible(); // learner still there

  // 6. Close the modal.
  await page.getByRole("button", { name: /Cancel/i }).click();
  await expect(page.getByRole("heading", { name: /Confirm Permanent Deletion/i })).not.toBeVisible();

  // 7. Re-open and submit the correct default PIN.
  await deleteBtn.click();
  await expect(page.getByRole("heading", { name: /Confirm Permanent Deletion/i })).toBeVisible();
  const pinInput2 = page.getByRole("textbox", { name: /admin password/i });
  await pinInput2.fill("sysadmin2026");
  await page.getByRole("button", { name: /Confirm/i }).click();

  // 8. The modal closes and the learner is removed.
  await expect(page.getByRole("heading", { name: /Confirm Permanent Deletion/i })).not.toBeVisible();
  await expect(page.getByText(learnerName?.trim() ?? "")).not.toBeVisible();
  const newCount = await learnerRows.count();
  expect(newCount).toBe(initialCount - 1);
});
