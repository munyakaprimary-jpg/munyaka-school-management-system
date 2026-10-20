import { test, expect } from "@playwright/test";
import { installAdminSession } from "./fixtures/session";

test.describe("PWA Service Worker & Build Version Update Flow", () => {
  test("admin can see build version and check for updates", async ({ page }) => {
    // Authenticate as admin using the standard test fixture
    await installAdminSession(page);
    await page.goto("/");

    // Verify the build version string is visible in the sidebar footer
    const buildInfo = page.getByText(/Build:/);
    await expect(buildInfo).toBeVisible();

    // Click the "Check for Updates" button
    const checkUpdatesBtn = page.getByRole("button", { name: "Check for Updates" });
    await expect(checkUpdatesBtn).toBeVisible();
    await checkUpdatesBtn.click();

    // Verify confirmation toast appears
    const toast = page.getByText(/latest build|New version found/i);
    await expect(toast).toBeVisible();
  });
});
