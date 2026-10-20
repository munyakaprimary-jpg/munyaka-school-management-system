import { test, expect } from "@playwright/test";
import { installAdminSession, gotoHashRoute } from "./fixtures/session";
import { installFirebaseMocks } from "./fixtures/firebase-mock";

test.describe("Timetable Categories & Settings", () => {
  test.beforeEach(async ({ page }) => {
    await installFirebaseMocks(page);
    await installAdminSession(page);
    await gotoHashRoute(page, "/timetable");
  });

  test("opens timetable settings modal, modifies start time, and saves config", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Timetable Management" })).toBeVisible();

    // Open Timetable Settings modal
    const settingsBtn = page.getByRole("button", { name: /Timetable Settings/i });
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // Verify modal appears
    await expect(page.getByText("Advanced Timetable Settings")).toBeVisible();

    // Locate start time input and change it
    const startTimeInput = page.locator("input[type='time']").first();
    if (await startTimeInput.isVisible()) {
      await startTimeInput.fill("08:00");
    }

    // Save settings
    const saveSettingsBtn = page.getByRole("button", { name: /Save Settings/i });
    await expect(saveSettingsBtn).toBeVisible();
    await saveSettingsBtn.click();

    // Verify modal closes
    await expect(page.getByText("Advanced Timetable Settings")).not.toBeVisible();
  });
});
