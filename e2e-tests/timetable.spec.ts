import { test, expect } from "@playwright/test";

test("timetable supports editable slots and lesson assignment", async ({ page }) => {
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

  // Sign in via the test-user endpoint or fallback
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

  // Open Manage Slots modal
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await expect(page.getByRole("heading", { name: "Manage Time Slots" })).toBeVisible();

  // Verify initial default slots exist
  await expect(page.getByText("Current Time Slots")).toBeVisible();

  // Add a new time slot
  await page.getByLabel("Start Time").fill("13:00");
  await page.getByLabel("End Time").fill("13:40");
  await page.getByRole("button", { name: /Add Slot/i }).click();
  await expect(page.getByText("13:00 - 13:40")).toBeVisible();

  // Close modal
  await page.getByRole("button", { name: "Done" }).click();

  // Click the first empty cell to assign a lesson
  const firstAddCell = page.getByRole("button", { name: /Add/i }).first();
  await firstAddCell.click();

  // Lesson drawer should open
  await expect(page.getByRole("heading", { name: "Assign Lesson" })).toBeVisible();

  // Choose a preset subject
  await page.getByRole("button", { name: "Mathematics" }).click();

  // Save
  await page.getByRole("button", { name: /Save Lesson/i }).click();

  // Verify the lesson appears in the grid
  await expect(page.getByRole("button", { name: "Mathematics" }).first()).toBeVisible();

  // Reload and verify persistence
  await page.reload();
  await expect(page.getByRole("button", { name: "Mathematics" }).first()).toBeVisible();
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await expect(page.getByText("13:00 - 13:40")).toBeVisible();
});
