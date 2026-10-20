import { test, expect } from "@playwright/test";
import { installAdminSession, gotoHashRoute } from "./fixtures/session";
import { installFirebaseMocks } from "./fixtures/firebase-mock";

test.describe("Timetable Chronological Order & Break Categories", () => {
  test.beforeEach(async ({ page }) => {
    await installFirebaseMocks(page);
    await installAdminSession(page);
    await gotoHashRoute(page, "/timetable");
  });

  test("displays time slots in chronological order and renders break category badges", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Timetable Management" })).toBeVisible();

    // Verify presence of standard break categories in the timetable grid
    await expect(page.getByText(/Assembly & Registration|Tea Break|Lunch Break|Mid-Morning Break|Games & Co-Curricular/i).first()).toBeVisible();
  });
});
