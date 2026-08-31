import { test, expect } from "@playwright/test";

test("timetable supports inline time editing and lesson assignment", async ({ page }) => {
  // Sign in as admin
  const origin = new URL(process.env.DYAD_TEST_BASE_URL || "http://localhost:32100").origin;
  const email = process.env.DYAD_TEST_USER_EMAIL;
  const password = process.env.DYAD_TEST_USER_PASSWORD;
  if (!email || !password) {
    test.skip(true, "DYAD_TEST_USER_EMAIL and DYAD_TEST_USER_PASSWORD are required");
    return;
  }

  // Clear any prior timetable data
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("school-timetable-data");
    localStorage.removeItem("school-timetable-grades");
  });

  // Sign in via the test-user endpoint
  const signInResponse = await page.request.post(`${origin}/api/auth/sign-in`, {
    headers: { origin, referer: origin + "/" },
    data: { email, password },
  });
  if (signInResponse.ok()) {
    const setCookie = signInResponse.headers()["set-cookie"];
    if (setCookie) {
      const cookies = setCookie.split(/,(?=\s*[A-Za-z0-9_-]+=)/);
      for (const cookie of cookies) {
        const [pair] = cookie.split(";");
        const [name, ...rest] = pair.split("=");
        await page.context().addCookies([{
          name: name.trim(),
          value: rest.join("=").trim(),
          url: origin,
        }]);
      }
    }
  }

  await page.goto("/timetable");
  await expect(page.getByRole("heading", { name: "School Timetable" })).toBeVisible();

  // ===== Inline time-slot editing =====
  // Hover the first period row to reveal the edit pencil
  const firstRow = page.locator("tbody tr").first();
  await firstRow.hover();

  // Click the inline "Edit time slot" button on the first period
  await firstRow.getByRole("button", { name: "Edit time slot" }).click();

  // The two time inputs should appear in the time cell
  const startTimeInput = firstRow.locator("input[type='time']").first();
  const endTimeInput = firstRow.locator("input[type='time']").nth(1);
  await startTimeInput.fill("07:30");
  await endTimeInput.fill("08:15");

  // Click the green checkmark to save inline
  await firstRow.getByTitle("Save (Enter)").click();

  // The new time should appear in the row header
  await expect(firstRow.getByText("07:30 - 08:15")).toBeVisible();

  // ===== Add a new period via the Manage Slots modal =====
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await expect(page.getByRole("heading", { name: "Manage Time Slots" })).toBeVisible();

  await page.getByLabel("Start Time").fill("14:00");
  await page.getByLabel("End Time").fill("14:40");
  await page.getByRole("button", { name: /Add Slot/i }).click();
  await expect(page.getByText("14:00 - 14:40")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  // ===== Assign a lesson by clicking a cell =====
  const firstAddCell = page.getByRole("button", { name: /Add/i }).first();
  await firstAddCell.click();
  await expect(page.getByRole("heading", { name: "Assign Lesson" })).toBeVisible();

  await page.getByRole("button", { name: "Mathematics" }).click();
  await page.getByRole("button", { name: /Save Lesson/i }).click();

  await expect(page.getByRole("button", { name: "Mathematics" }).first()).toBeVisible();

  // ===== Reload and verify everything persisted =====
  await page.reload();
  await expect(page.getByRole("heading", { name: "School Timetable" })).toBeVisible();

  // Inline-edited time should still be there
  const firstRowAfterReload = page.locator("tbody tr").first();
  await expect(firstRowAfterReload.getByText("07:30 - 08:15")).toBeVisible();

  // Lesson should still be there
  await expect(page.getByRole("button", { name: "Mathematics" }).first()).toBeVisible();

  // Newly added period should still be there
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await expect(page.getByText("14:00 - 14:40")).toBeVisible();
});
