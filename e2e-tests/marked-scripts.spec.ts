import { test, expect } from "@playwright/test";

test.describe("Marked Scripts Management View", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the Marked Scripts page.
    await page.goto("/assessments/marked-scripts");
  });

  test("page loads and shows empty state when no scripts exist", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Marked Scripts/i })).toBeVisible();
    // Either an empty-state message or the table should be visible.
    const emptyState = page.getByText(/No Marked Scripts Yet/i);
    const table = page.locator("table");
    await expect(emptyState.or(table)).toBeVisible();
  });

  test("displays scripts badge with count", async ({ page }) => {
    // The scripts badge is always present (shows 0 or a count).
    const badge = page.locator('[class*="rounded-xl"][class*="bg-indigo-50"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/script/);
  });

  test("search filters scripts by student name", async ({ page }) => {
    // Inject a marked script directly into localStorage so we have data.
    await page.evaluate(() => {
      const submission = {
        id: "marked_test_exam_student_001",
        examId: "test_exam",
        examTitle: "Mathematics Mid-Term",
        studentName: "Jane Wanjiku",
        admissionNo: "ADM-001",
        score: 78,
        totalPoints: 100,
        percentage: 78,
        submittedAt: new Date().toISOString(),
        answers: { q1: "b" },
        marks: { q1: 2 },
        feedback: {},
      };
      localStorage.setItem(
        "marked_student_submissions",
        JSON.stringify({ [submission.id]: submission })
      );
    });

    // Reload to pick up the injected data.
    await page.reload();
    await page.waitForLoadState("networkidle");

    // The table should now contain Jane's row.
    await expect(page.getByText("Jane Wanjiku")).toBeVisible();
    await expect(page.getByText("Mathematics Mid-Term")).toBeVisible();

    // Search for Jane.
    const searchInput = page.getByPlaceholder(/Search by student/i);
    await searchInput.fill("Jane");
    await expect(page.getByText("Jane Wanjiku")).toBeVisible();

    // Search for a non-existent name — table should be gone / show no rows.
    await searchInput.fill("NobodyXYZ");
    await expect(page.getByText("Jane Wanjiku")).not.toBeVisible();
  });

  test('"View Script" opens the preview dialog', async ({ page }) => {
    await page.evaluate(() => {
      const submission = {
        id: "marked_test2_exam_student_002",
        examId: "test_exam2",
        examTitle: "English Composition",
        studentName: "John Kamau",
        admissionNo: "ADM-002",
        score: 65,
        totalPoints: 80,
        percentage: 81,
        submittedAt: new Date().toISOString(),
        answers: { q1: "c" },
        marks: { q1: 3 },
        feedback: { q1: "Good structure." },
      };
      localStorage.setItem(
        "marked_student_submissions",
        JSON.stringify({ [submission.id]: submission })
      );
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Click "View Script".
    const viewBtn = page.getByRole("button", { name: /View Script/i }).first();
    await viewBtn.click();

    // Dialog should appear.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("John Kamau");
    await expect(dialog).toContainText("English Composition");

    // Close the dialog.
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test('"Download PDF" button is present on each row', async ({ page }) => {
    await page.evaluate(() => {
      const submission = {
        id: "marked_test3_exam_student_003",
        examId: "test_exam3",
        examTitle: "Science Quiz",
        studentName: "Mary Njoroge",
        admissionNo: "ADM-003",
        score: 45,
        totalPoints: 50,
        percentage: 90,
        submittedAt: new Date().toISOString(),
        answers: { q1: "a" },
        marks: { q1: 5 },
        feedback: {},
      };
      localStorage.setItem(
        "marked_student_submissions",
        JSON.stringify({ [submission.id]: submission })
      );
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const downloadBtns = page.getByRole("button", { name: /Download PDF/i });
    await expect(downloadBtns).toHaveCount(1);
  });

  test("stats card shows class statistics when scripts exist", async ({ page }) => {
    await page.evaluate(() => {
      const submissions = [
        {
          id: "marked_stats_1",
          examId: "stats_exam",
          examTitle: "Math Test",
          studentName: "Alice A",
          admissionNo: "A001",
          score: 80,
          totalPoints: 100,
          percentage: 80,
          submittedAt: new Date().toISOString(),
          answers: {},
          marks: {},
        },
        {
          id: "marked_stats_2",
          examId: "stats_exam",
          examTitle: "Math Test",
          studentName: "Bob B",
          admissionNo: "A002",
          score: 60,
          totalPoints: 100,
          percentage: 60,
          submittedAt: new Date().toISOString(),
          answers: {},
          marks: {},
        },
      ];
      localStorage.setItem(
        "marked_student_submissions",
        JSON.stringify(Object.fromEntries(submissions.map((s) => [s.id, s])))
      );
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Stats cards should be visible.
    await expect(page.getByText("Total Scripts")).toBeVisible();
    await expect(page.getByText("Class Average")).toBeVisible();
    await expect(page.getByText("Highest")).toBeVisible();
    await expect(page.getByText("Lowest")).toBeVisible();
    // Average of 80 and 60 = 70.
    await expect(page.getByText("70%")).toBeVisible();
  });

  test("exam filter dropdown filters the table", async ({ page }) => {
    await page.evaluate(() => {
      const submissions = [
        {
          id: "marked_filter_math",
          examId: "math_exam",
          examTitle: "Mathematics",
          studentName: "Student Math",
          admissionNo: "M001",
          score: 50,
          totalPoints: 100,
          percentage: 50,
          submittedAt: new Date().toISOString(),
          answers: {},
          marks: {},
        },
        {
          id: "marked_filter_eng",
          examId: "eng_exam",
          examTitle: "English",
          studentName: "Student Eng",
          admissionNo: "E001",
          score: 75,
          totalPoints: 100,
          percentage: 75,
          submittedAt: new Date().toISOString(),
          answers: {},
          marks: {},
        },
      ];
      localStorage.setItem(
        "marked_student_submissions",
        JSON.stringify(Object.fromEntries(submissions.map((s) => [s.id, s])))
      );
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Both students visible.
    await expect(page.getByText("Student Math")).toBeVisible();
    await expect(page.getByText("Student Eng")).toBeVisible();

    // Filter by "Mathematics".
    const filterSelect = page.locator("select, [role='combobox']").first();
    // Click the select trigger.
    const selectTrigger = page.getByPlaceholder("All exams").or(page.locator("[role='combobox']").first());
    await selectTrigger.click();
    await page.getByRole("option", { name: /Mathematics/i }).click();

    // Only the math student should remain.
    await expect(page.getByText("Student Math")).toBeVisible();
    await expect(page.getByText("Student Eng")).not.toBeVisible();
  });
});
