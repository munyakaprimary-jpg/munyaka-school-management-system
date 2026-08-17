import { test, expect } from "@playwright/test";

test("marks entry with dynamic subject columns", async ({ page }) => {
  // Navigate to the assessments page
  await page.goto("/assessments");

  // Wait for the page to load
  await expect(page.locator("h1")).toContainText("Marks Entry");

  // Check that the table is present
  const table = page.locator("table");
  await expect(table).toBeVisible();

  // Check that there are subject columns (should be at least one)
  const headerCells = table.locator("thead th");
  const headerCount = await headerCells.count();
  expect(headerCount).toBeGreaterThan(2); // At least Name, Assessment ID, and one subject

  // Check that there are learner rows
  const learnerRows = table.locator("tbody tr");
  const rowCount = await learnerRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // Test entering marks in the first subject column
  const firstSubjectCell = learnerRows.first().locator("td").nth(2);
  await firstSubjectCell.click();
  await firstSubjectCell.fill("85");

  // Verify the mark was entered
  const input = firstSubjectCell.locator("input");
  await expect(input).toHaveValue("85");

  // Test the export functionality
  const exportButton = page.locator("button").filter({ hasText: /Export/ });
  await expect(exportButton).toBeVisible();
  await exportButton.click();

  // Check that export was triggered (file download would happen)
  // Note: We can't easily test file downloads in Playwright without more setup
  // but we can verify the button click was successful

  // Test save functionality
  const saveButton = page.locator("button").filter({ hasText: /Save/ });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Verify save was triggered
  // The save would be handled by the app logic
});

test("marks entry with dynamic subject columns - multiple subjects", async ({ page }) => {
  // Navigate to the assessments page
  await page.goto("/assessments");

  // Wait for the page to load
  await expect(page.locator("h1")).toContainText("Marks Entry");

  // Check that the table is present
  const table = page.locator("table");
  await expect(table).toBeVisible();

  // Get the number of subject columns
  const headerCells = table.locator("thead th");
  const headerCount = await headerCells.count();
  const subjectCount = headerCount - 2; // Subtract Name and Assessment ID columns

  // Verify we have multiple subject columns
  expect(subjectCount).toBeGreaterThan(1);

  // Test entering marks in multiple subject columns
  for (let i = 2; i < headerCount - 1; i++) {
    const subjectCell = learnerRows.first().locator("td").nth(i);
    await subjectCell.click();
    await subjectCell.fill("90");

    // Verify the mark was entered
    const input = subjectCell.locator("input");
    await expect(input).toHaveValue("90");
  }

  // Test the export functionality
  const exportButton = page.locator("button").filter({ hasText: /Export/ });
  await expect(exportButton).toBeVisible();
  await exportButton.click();
});

test("marks entry table with summary rows", async ({ page }) => {
  // Navigate to the assessments page
  await page.goto("/assessments");

  // Wait for the page to load
  await expect(page.locator("h1")).toContainText("Marks Entry");

  // Check that the table is present
  const table = page.locator("table");
  await expect(table).toBeVisible();

  // Check that there are summary rows at the bottom
  const summaryRows = table.locator("tbody tr:last-child");
  await expect(summaryRows).toBeVisible();

  // Check that the summary rows contain the expected text
  const summaryText = await summaryRows.textContent();
  expect(summaryText).toContain("Subject Totals");
  expect(summaryText).toContain("Subject MSS");
});