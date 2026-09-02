import { test, expect } from "@playwright/test";

/**
 * Verify the Learner Enrollment Trend chart renders correctly in the Admin Dashboard.
 * Tests the chart header, chart rendering, and tooltip interaction.
 */

const ADMIN_PASSWORD = "ownerpass2026";

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

test("Admin Dashboard displays the Enrollment Trend chart with header and chart elements", async ({ page }) => {
  await signInAsAdmin(page);

  // Verify section header
  await expect(page.getByText(/Enrollment Analytics/i)).toBeVisible();

  // Verify chart card header elements
  await expect(page.getByText(/Learner Enrollment Trend/i)).toBeVisible();
  await expect(page.getByText(/Monthly enrollment growth/i)).toBeVisible();

  // Verify chart has rendered with the Recharts SVG
  const chartContainer = page.locator(".recharts-wrapper");
  await expect(chartContainer).toBeVisible();

  // Verify X-axis months are rendered
  await expect(page.getByText("Apr")).toBeVisible();
  await expect(page.getByText("May")).toBeVisible();
  await expect(page.getByText("Jun")).toBeVisible();
  await expect(page.getByText("Jul")).toBeVisible();
  await expect(page.getByText("Aug")).toBeVisible();
  await expect(page.getByText("Sept")).toBeVisible();

  // Verify footer stats are present
  await expect(page.getByText(/Total Enrolled/i)).toBeVisible();
  await expect(page.getByText(/Growth This Period/i)).toBeVisible();
  await expect(page.getByText(/\+118\.8%/i)).toBeVisible();
});

test("Enrollment chart displays correct bar values in tooltip on hover", async ({ page }) => {
  await signInAsAdmin(page);

  // Find a bar in the chart and hover over it
  const chartBars = page.locator(".recharts-bar-rectangle");
  await expect(chartBars.first()).toBeVisible();

  // Hover over the first bar (April)
  await chartBars.first().hover();

  // The tooltip should appear with the month name in uppercase
  await expect(page.getByText("APR")).toBeVisible();

  // The tooltip should show learner count (e.g., "320 Learners")
  await expect(page.getByText(/320 Learners/i)).toBeVisible();
});

test("Enrollment chart tooltip shows different values for each month", async ({ page }) => {
  await signInAsAdmin(page);

  const chartBars = page.locator(".recharts-bar-rectangle");
  const barCount = await chartBars.count();

  // We should have 6 bars for the 6 months
  expect(barCount).toBe(6);

  // Hover over the last bar (September - highest value)
  const lastBar = chartBars.last();
  await lastBar.hover();

  // Verify tooltip shows September's value
  await expect(page.getByText("SEPT")).toBeVisible();
  await expect(page.getByText(/700 Learners/i)).toBeVisible();
});
