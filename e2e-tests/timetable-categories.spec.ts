import { test, expect } from "@playwright/test";

test("timetable category selector and custom label rendering", async ({ page }) => {
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

  const res = await page.request.post(`${origin}/api/auth/sign-in`, {
    headers: { origin, referer: origin + "/" },
    data: { email, password },
  });
  if (res.ok()) {
    const setCookie = res.headers()["set-cookie"];
    if (setCookie) {
      const cookies = setCookie.split(/,(?=\s*[A-Za-z0-9_-]+=)/);
      for (const c of cookies) {
        const [pair] = c.split(";");
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

  // ── Add a Lunch Break slot via the modal ────────────────────────────────
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await expect(page.getByRole("heading", { name: "Manage Time Slots" })).toBeVisible();

  await page.getByLabel("Start Time").fill("12:00");
  await page.getByLabel("End Time").fill("13:00");
  // Open the category dropdown and pick "Lunch Break"
  await page.locator("#category").click();
  await page.getByRole("option", { name: "Lunch Break" }).click();
  await page.getByRole("button", { name: /Add Slot/i }).click();

  // Verify it appears in the list with the Lunch Break badge
  await expect(page.getByText("Lunch Break", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  // The Lunch Break row should span all 5 columns with its label visible in the grid
  await expect(page.getByText("Lunch Break").first()).toBeVisible();

  // ── Add a custom category slot via the modal ───────────────────────────
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await page.getByLabel("Start Time").fill("15:00");
  await page.getByLabel("End Time").fill("15:45");
  await page.locator("#category").click();
  await page.getByRole("option", { name: /Custom/i }).click();
  await page.getByLabel("Custom Name").fill("Music Practice");
  await page.getByRole("button", { name: /Add Slot/i }).click();

  await expect(page.getByText("Music Practice").first()).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  // Music Practice should appear as a full-width row in the grid
  await expect(page.getByText("Music Practice").first()).toBeVisible();

  // ── Inline-edit a category slot via the time cell ───────────────────────
  // Find the Lunch Break row and inline-edit it
  const lunchRow = page.locator("tbody tr").filter({ hasText: "Lunch Break" }).first();
  await lunchRow.hover();
  await lunchRow.getByRole("button", { name: "Edit time slot" }).click();

  // The category dropdown should already show "Lunch Break"
  const catTrigger = lunchRow.locator("[role='combobox']").first();
  await expect(catTrigger).toHaveValue("Lunch Break");

  // Change to "Games / PE"
  await catTrigger.click();
  await page.getByRole("option", { name: "Games / PE" }).click();
  await expect(catTrigger).toHaveValue("Games / PE");

  // Save
  await lunchRow.getByTitle("Save (Enter)").click();

  // The row should now show Games / PE
  await expect(page.getByText("Games / PE").first()).toBeVisible();

  // ── Reload and verify persistence ─────────────────────────────────────
  await page.reload();
  await expect(page.getByRole("heading", { name: "School Timetable" })).toBeVisible();
  await expect(page.getByText("Games / PE").first()).toBeVisible();
  await expect(page.getByText("Music Practice").first()).toBeVisible();
  await expect(page.getByText("Lunch Break").first()).toBeVisible();
});
