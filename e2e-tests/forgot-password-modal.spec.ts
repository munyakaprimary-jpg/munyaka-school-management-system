import { test, expect } from "@playwright/test";

test("forgot password link opens the offline recovery modal", async ({ page }) => {
  await page.goto("/login");

  // The "Forgot Password / Locked Out?" link should be visible at the bottom
  const link = page.getByRole("button", { name: /Forgot Password/i });
  await expect(link).toBeVisible();

  // Click it
  await link.click();

  // The modal should open with the recovery instructions
  await expect(page.getByRole("heading", { name: /Forgot Password|Locked Out/i })).toBeVisible();

  // It should contain the example JSON
  await expect(page.getByText("reset_password")).toBeVisible();
  await expect(page.getByText(/"role": "admin"/)).toBeVisible();
  await expect(page.getByText(/"newPassword": "YourNewSecurePassword"/)).toBeVisible();

  // It should also mention superadmin recovery
  await expect(page.getByText(/"role": "superadmin"/)).toBeVisible();

  // Close the modal
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("heading", { name: /Forgot Password|Locked Out/i })).not.toBeVisible();
});
