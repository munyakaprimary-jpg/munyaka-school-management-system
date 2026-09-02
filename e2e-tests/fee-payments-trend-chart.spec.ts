import { test, expect } from "@playwright/test";

/**
 * Verify the Termly Fee Collections chart renders correctly in the Admin Dashboard.
 * Tests the chart header, term-based data grouping, year selector, and tooltip.
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

test("Admin Dashboard displays the Termly Fee Collections chart with header and chart elements", async ({ page }) => {
  await signInAsAdmin(page);

  // Verify section header
  await expect(page.getByText(/Financial Analytics/i)).toBeVisible();

  // Verify chart card header elements
  await expect(page.getByText(/Termly Fee Collections/i)).toBeVisible();
  await expect(page.getByText(/Fee collection totals grouped by academic terms/i)).toBeVisible();

  // Verify chart has rendered with the Recharts SVG
  const chartContainer = page.locator(".recharts-wrapper");
  await expect(chartContainer).toBeVisible();

  // Verify X-axis shows term labels
  await expect(page.getByText("Term 1 (Jan-Mar)")).toBeVisible();
  await expect(page.getByText("Term 2 (May-Jul)")).toBeVisible();
  await expect(page.getByText("Term 3 (Sep-Nov)")).toBeVisible();

  // Verify year selector is present
  await expect(page.getByText(/Academic Year/i)).toBeVisible();
  await expect(page.getByText("2026")).toBeVisible();

  // Verify footer stats are present
  await expect(page.getByText(/Total Collected/i)).toBeVisible();
  await expect(page.getByText(/Highest Collection/i)).toBeVisible();
});

test("Year selector dropdown shows all academic years and allows switching", async ({ page }) => {
  await signInAsAdmin(page);

  // Find and click the year selector
  const yearSelector = page.getByRole("button", { name: /Academic Year/i });
  await yearSelector.click();

  // Verify dropdown options are visible
  await expect(page.getByText("Academic Year 2026")).toBeVisible();
  await expect(page.getByText("Academic Year 2025")).toBeVisible();
  await expect(page.getByText("Academic Year 2024")).toBeVisible();

  // Click 2025 option
  await page.getByText("Academic Year 2025").click();

  // Verify the selected year changed
  await expect(yearSelector).toContainText("2025");
});

test("Fee chart displays KES values in tooltip on hover", async ({ page }) => {
  await signInAsAdmin(page);

  // Find a bar in the chart and hover over it
  const chartBars = page.locator(".recharts-bar-rectangle");
  await expect(chartBars.first()).toBeVisible();

  // Hover over the first bar (Term 1)
  await chartBars.first().hover();

  // The tooltip should appear with the term name
  await expect(page.getByText(/Term 1 \(Jan-Mar\)/i)).toBeVisible();

  // The tooltip should show KES amount
  await expect(page.getByText(/KES/i)).toBeVisible();
});

test("Fee chart shows three bars for three academic terms", async ({ page }) => {
  await signInAsAdmin(page);

  const chartBars = page.locator(".recharts-bar-rectangle");
  const barCount = await chartBars.count();

  // We should have 3 bars for the 3 terms
  expect(barCount).toBe(3);
});
