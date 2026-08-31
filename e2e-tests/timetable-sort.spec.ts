import { test, expect } from "@playwright/test";

test("timetable rows auto-sort chronologically by start time", async ({ page }) => {
  const origin = new URL(process.env.DYAD_TEST_BASE_URL || "http://localhost:32100").origin;
  const email = process.env.DYAD_TEST_USER_EMAIL;
  const password = process.env.DYAD_TEST_USER_PASSWORD;
  if (!email || !password) {
    test.skip(true, "DYAD_TEST_USER_EMAIL and DYAD_TEST_USER_PASSWORD are required");
    return;
  }

  // Reset persisted state
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

  // Get initial row order
  const initialTimes = await page.locator("tbody tr").evaluateAll((rows) =>
    rows.map((r) => (r.textContent ?? "").match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)?.[0] ?? "")
  );
  // Sanity: initial set should already be sorted ascending
  const initialSorted = [...initialTimes].sort();
  expect(initialTimes).toEqual(initialSorted);

  // ===== Add a period that should land in the MIDDLE =====
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await page.getByLabel("Start Time").fill("09:30");
  await page.getByLabel("End Time").fill("10:00");
  await page.getByRole("button", { name: /Add Slot/i }).click();
  await page.getByRole("button", { name: "Done" }).click();

  // Verify chronological order in the rendered grid
  const timesAfterAdd = await page.locator("tbody tr").evaluateAll((rows) =>
    rows.map((r) => (r.textContent ?? "").match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)?.[0] ?? "")
  );
  const sortedAfterAdd = [...timesAfterAdd].sort();
  expect(timesAfterAdd).toEqual(sortedAfterAdd);

  // ===== Inline-edit a row's start time to move it to the END =====
  const lastRow = page.locator("tbody tr").last();
  await lastRow.hover();
  await lastRow.getByRole("button", { name: "Edit time slot" }).click();
  const startInput = lastRow.locator("input[type='time']").first();
  const endInput = lastRow.locator("input[type='time']").nth(1);
  // Move it to 15:00-15:30, which should now be the latest period
  await startInput.fill("15:00");
  await endInput.fill("15:30");
  await lastRow.getByTitle("Save (Enter)").click();

  // Re-verify chronological order
  const timesAfterInline = await page.locator("tbody tr").evaluateAll((rows) =>
    rows.map((r) => (r.textContent ?? "").match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)?.[0] ?? "")
  );
  const sortedAfterInline = [...timesAfterInline].sort();
  expect(timesAfterInline).toEqual(sortedAfterInline);

  // The 15:00-15:30 row should be the LAST row
  const lastRowText = await page.locator("tbody tr").last().textContent();
  expect(lastRowText).toContain("15:00 - 15:30");

  // ===== Inline-edit a row's start time to move it to the START =====
  const secondRow = page.locator("tbody tr").nth(1);
  await secondRow.hover();
  await secondRow.getByRole("button", { name: "Edit time slot" }).click();
  const startInput2 = secondRow.locator("input[type='time']").first();
  const endInput2 = secondRow.locator("input[type='time']").nth(1);
  await startInput2.fill("07:00");
  await endInput2.fill("07:30");
  await secondRow.getByTitle("Save (Enter)").click();

  // Verify order again — first row should now be 07:00-07:30
  const firstRowText = await page.locator("tbody tr").first().textContent();
  expect(firstRowText).toContain("07:00 - 07:30");

  // Full chronological verification
  const finalTimes = await page.locator("tbody tr").evaluateAll((rows) =>
    rows.map((r) => (r.textContent ?? "").match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)?.[0] ?? "")
  );
  const finalSorted = [...finalTimes].sort();
  expect(finalTimes).toEqual(finalSorted);

  // Reload and verify sort persists
  await page.reload();
  const persistedTimes = await page.locator("tbody tr").evaluateAll((rows) =>
    rows.map((r) => (r.textContent ?? "").match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)?.[0] ?? "")
  );
  const persistedSorted = [...persistedTimes].sort();
  expect(persistedTimes).toEqual(persistedSorted);
});
