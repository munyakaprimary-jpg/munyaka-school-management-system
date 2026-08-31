import { test, expect } from "@playwright/test";

test("timetable rows auto-sort chronologically by start time including category slots", async ({ page }) => {
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

  // Helper: extract all time-range texts from the grid (both regular rows and category rows)
  const getAllTimes = async () =>
    page.locator("tbody tr").evaluateAll(rows =>
      rows.map(r => (r.textContent ?? "").match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)?.[0] ?? "")
    );

  // Default slots should be sorted
  const initialTimes = await getAllTimes();
  expect(initialTimes).toEqual([...initialTimes].sort());

  // --- Add a Lunch Break in the middle of the day ---
  await page.getByRole("button", { name: /Manage Slots/i }).click();
  await page.getByLabel("Start Time").fill("12:00");
  await page.getByLabel("End Time").fill("13:00");
  await page.getByLabel("Period Type").click();
  await page.getByRole("option", { name: "Lunch Break" }).click();
  await page.getByRole("button", { name: /Add Slot/i }).click();
  await expect(page.getByText("★ Lunch Break")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  const afterLunchTimes = await getAllTimes();
  expect(afterLunchTimes).toEqual([...afterLunchTimes].sort());
  // Lunch Break should appear in its correct chronological position
  const lunchIndex = afterLunchTimes.indexOf("12:00 - 13:00");
  expect(lunchIndex).toBeGreaterThan(0);

  // --- Inline-edit a period to push it after Lunch Break ---
  // Find a row with a time cell containing "10:" and move it to 14:00
  const rows = page.locator("tbody tr");
  const count = await rows.count();
  let targetRow = null;
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = await row.textContent() ?? "";
    if (text.match(/\d{2}:\d{2} - \d{2}:\d{2}/) && text.includes("10:")) {
      targetRow = row;
      break;
    }
  }
  expect(targetRow).not.toBeNull();

  await targetRow!.hover();
  await targetRow!.getByRole("button", { name: "Edit time slot" }).click();
  await targetRow!.locator("input[type='time']").first().fill("14:00");
  await targetRow!.locator("input[type='time']").nth(1).fill("14:45");
  await targetRow!.getByTitle("Save (Enter)").click();
  await expect(targetRow!.getByText("14:00 - 14:45")).toBeVisible();

  const afterEditTimes = await getAllTimes();
  expect(afterEditTimes).toEqual([...afterEditTimes].sort());

  // 14:00 row should be the last
  const lastRowText = await page.locator("tbody tr").last().textContent();
  expect(lastRowText).toContain("14:00 - 14:45");

  // --- Inline-edit a period to move it to the very beginning ---
  const secondRow = page.locator("tbody tr").nth(1);
  const secondRowText = await secondRow.textContent() ?? "";
  if (secondRowText.match(/\d{2}:\d{2} - \d{2}:\d{2}/)) {
    await secondRow.hover();
    await secondRow.getByRole("button", { name: "Edit time slot" }).click();
    await secondRow.locator("input[type='time']").first().fill("07:00");
    await secondRow.locator("input[type='time']").nth(1).fill("07:30");
    await secondRow.getByTitle("Save (Enter)").click();
    await expect(secondRow.getByText("07:00 - 07:30")).toBeVisible();
  }

  // First row should now be 07:00-07:30
  const firstRowText = await page.locator("tbody tr").first().textContent();
  expect(firstRowText).toContain("07:00 - 07:30");

  const finalTimes = await getAllTimes();
  expect(finalTimes).toEqual([...finalTimes].sort());

  // --- Reload and verify sort persists ---
  await page.reload();
  const persistedTimes = await getAllTimes();
  expect(persistedTimes).toEqual([...persistedTimes].sort());
});
