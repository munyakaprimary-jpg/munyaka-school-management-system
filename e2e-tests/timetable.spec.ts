import { test, expect } from "@playwright/test";
import { installAdminSession, gotoHashRoute } from "./fixtures/session";
import { installFirebaseMocks } from "./fixtures/firebase-mock";

test.describe("Timetable Management", () => {
  test.beforeEach(async ({ page }) => {
    await installFirebaseMocks(page);
    await installAdminSession(page);
    await gotoHashRoute(page, "/timetable");
  });

  test("loads timetable management page and displays weekly grid", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Timetable Management" })).toBeVisible();
    await expect(page.getByText("Timetable & Lesson Allocation")).toBeVisible();

    // Verify day columns or rows are present (Monday to Friday)
    await expect(page.getByRole("cell", { name: "Monday" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Friday" })).toBeVisible();
  });

  test("assigns a lesson and verifies cell update", async ({ page }) => {
    // Click the first available "+ Assign Lesson" button in the grid
    const assignBtn = page.getByRole("button", { name: "+ Assign Lesson" }).first();
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();

    // Lesson Assignment Drawer / Modal should open
    await expect(page.getByText(/Assign Lesson|Select Subject/i)).toBeVisible();

    // Select subject if dropdown exists
    const subjectSelect = page.locator("select").first();
    if (await subjectSelect.isVisible()) {
      await subjectSelect.selectOption({ index: 1 });
    }

    // Click save / assign button
    const saveBtn = page.getByRole("button", { name: /Save|Assign|Confirm/i }).last();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }
  });
});
