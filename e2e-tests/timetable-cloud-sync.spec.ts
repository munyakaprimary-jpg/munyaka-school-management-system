import { test, expect } from "@playwright/test";

/**
 * Timetable cloud sync (Firestore `timetables` collection).
 *
 * Verifies the Cloud DB (Firestore) settings tab exposes the Timetable module:
 * the status grid card reports the local grade schedule count, and the
 * Timetable Cloud Sync section offers the sync control.
 */

const ADMIN_PASSWORD = "ownerpass2026";

const seedTimetableData = async (page: import("@playwright/test").Page) => {
  await page.evaluate(() => {
    const timetable = {
      "Grade 4 Green": {
        timeSlots: [
          { id: "slot-1", start: "08:00", end: "08:45", category: "Mathematics" },
          { id: "slot-2", start: "08:45", end: "09:30", category: "English" },
        ],
        entries: [
          { slotId: "slot-1", subject: "Mathematics", teacher: "Jane Mwangi" },
          { slotId: "slot-2", subject: "English", teacher: "John Kamau" },
        ],
      },
      "Grade 5 Red": {
        timeSlots: [{ id: "slot-1", start: "08:00", end: "08:45", category: "Science" }],
        entries: [{ slotId: "slot-1", subject: "Science", teacher: "Jane Mwangi" }],
      },
    };
    localStorage.setItem("school-timetable-data", JSON.stringify(timetable));
  });
};

const signInAsAdmin = async (page: import("@playwright/test").Page) => {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.removeItem("munyaka_session");
  });
  await page.goto("/login");

  const adminTab = page.getByRole("tab", { name: /School Administrator/i });
  await expect(adminTab).toBeVisible();
  await adminTab.click();

  const adminCard = page.getByRole("button", { name: /School Administrator/i });
  await adminCard.click();

  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await passwordInput.fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^Sign In$/i }).click();

  await page.waitForURL("**/dashboard", { timeout: 10_000 });
};

test("admin sees the Timetable module in the Firestore cloud sync tab", async ({ page }) => {
  await signInAsAdmin(page);
  await seedTimetableData(page);

  await page.goto("/settings");
  await page.getByRole("tab", { name: /Cloud DB \(Firestore\)/i }).click();

  // Status grid card for the Timetable collection.
  const timetableCard = page.getByTestId("timetable-status-card");
  await expect(timetableCard).toBeVisible();
  await expect(timetableCard.getByText("Timetable", { exact: true })).toBeVisible();
  await expect(timetableCard.getByText("Local: 2")).toBeVisible();

  // Dedicated Timetable Cloud Sync section with its sync control.
  await expect(page.getByRole("heading", { name: "Timetable Cloud Sync" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sync Timetables to Cloud/i })).toBeVisible();
});
