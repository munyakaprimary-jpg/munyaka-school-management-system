import { test, expect } from "@playwright/test";
import { installAdminSession, gotoHashRoute } from "./fixtures/session";
import { installFirebaseMocks } from "./fixtures/firebase-mock";

test.describe("Timetable Cloud Sync", () => {
  test.beforeEach(async ({ page }) => {
    await installFirebaseMocks(page);
    await installAdminSession(page);
    // Navigate to settings page where Firestore sync tab is located
    await gotoHashRoute(page, "/settings");
  });

  test("syncs timetables to cloud from Cloud DB settings tab", async ({ page }) => {
    // Navigate or click to Cloud DB tab in settings if necessary
    const cloudTab = page.getByRole("tab", { name: /Cloud DB|Firestore/i }).or(page.getByText(/Cloud DB \(Firestore\)/i));
    if (await cloudTab.isVisible()) {
      await cloudTab.click();
    }

    // Verify timetable status card or section is visible
    const timetableSection = page.getByRole("heading", { name: /Timetable Cloud Sync/i }).or(page.getByText(/Timetable Cloud Sync/i));
    await expect(timetableSection).toBeVisible();

    // Click the sync timetables button
    const syncBtn = page.getByRole("button", { name: /Sync Timetables to Cloud/i });
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // Verify success toast or status update appears
    await expect(page.getByText(/Successfully synchronized|sync complete|success/i)).toBeVisible({ timeout: 10000 });
  });
});
