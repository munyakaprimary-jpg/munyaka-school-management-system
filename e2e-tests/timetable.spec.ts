import { test, expect } from "@playwright/test";

test("timetable: inline slot editing, lesson assignment, and category rendering", async ({ page }) => {
  const origin = new URL(process.env.DYAD_TEST_BASE_URL || "http://localhost:32100").origin;
  const email = process.env.DYAD_TEST_USER_EMAIL;
  const password = process.env.DYAD_TEST_USER_PASSWORD;
  if (!email || !password) {
    test.skip(true, "DYAD_TEST_USER_EMAIL and DYAD_TEST_USER_PASSWORD are required");
    return;
  }

  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("school-timetable-data");
    localStorage.removeItem("school-timetable-grades");
  });

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

  // --- Inline edit: change a regular period's time ---
  const firstRow = page.locator("tbody tr").first();
  await firstRow.hover();
  await firstRow.getByRole("button", { name: "Edit time slot" }).click();
  await firstRow.locator("input[type='time']").first().fill("07:30");
  await firstRow.locator("input[type='time']").nth(1).fill("08:15");
  await firstRow.getByTitle("Save (Enter)").click();
  await expect(firstRow.getByText("07:30 - 08:15")).toBeVisible();

  // --- Add a category slot via Manage Slots ---
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await page.getByLabel("Start Time").fill("12:00");
  await page.getByLabel("End Time").fill("13:00");
  // Select "Lunch Break" from the period type dropdown
  await page.getByLabel("Period Type").click();
  await page.getByRole("option", { name: "Lunch Break" }).click();
  await page.getByRole("button", { name: /Add Slot/i }).click();
  await expect(page.getByText("Lunch Break")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  // --- Verify Lunch Break spans the row and appears in the grid ---
  const lunchRow = page.getByText("★ Lunch Break").locator("..").locator("..");
  await expect(page.getByText("★ Lunch Break")).toBeVisible();
  await expect(lunchRow).toContainText("12:00 - 13:00");

  // --- Add a custom category slot ---
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await page.getByLabel("Start Time").fill("15:00");
  await page.getByLabel("End Time").fill("15:45");
  await page.getByLabel("Period Type").click();
  await page.getByRole("option", { name: "Custom…" }).click();
  await page.getByLabel("Custom Name").fill("Music Practice");
  await page.getByRole("button", { name: /Add Slot/i }).click();
  await expect(page.getByText("Music Practice")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  // --- Assign a lesson to a regular period cell ---
  const addCell = page.getByRole("button", { name: /Add/i }).first();
  await addCell.click();
  await expect(page.getByRole("heading", { name: "Assign Lesson" })).toBeVisible();
  await page.getByRole("button", { name: "Mathematics" }).click();
  await page.getByRole("button", { name: /Save Lesson/i }).click();
  await expect(page.getByRole("button", { name: "Mathematics" }).first()).toBeVisible();

  // --- Reload and verify everything persisted ---
  await page.reload();
  await expect(page.getByRole("heading", { name: "School Timetable" })).toBeVisible();
  await expect(firstRow.getByText("07:30 - 08:15")).toBeVisible();
  await expect(page.getByText("★ Lunch Break")).toBeVisible();
  await expect(page.getByText("★ Music Practice")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mathematics" }).first()).toBeVisible();
});
