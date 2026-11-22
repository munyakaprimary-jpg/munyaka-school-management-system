import { test, expect } from "@playwright/test";

test.describe("Student Role-Based Access Control (RBAC)", () => {
  test("student account is blocked from teacher portal and redirected to login", async ({ page }) => {
    // Open login page
    await page.goto("/login");

    // Use student portal login tab
    const studentTab = page.getByRole("tab", { name: /student portal/i });
    if (await studentTab.isVisible()) {
      await studentTab.click();
    }

    // Fill admission number for student login (e.g. JOSEPH KIMANI WANJIKU or demo admission)
    const admissionInput = page.getByPlaceholder(/admission|adm no|index/i);
    if (await admissionInput.isVisible()) {
      await admissionInput.fill("MKS/2024/001");
      const signInBtn = page.getByRole("button", { name: /sign in as student|access student portal/i });
      if (await signInBtn.isVisible()) {
        await signInBtn.click();
      }
    }

    // Try navigating directly to teacher dashboard
    await page.goto("/dashboard");

    // Verify student is blocked and redirected to login with unauthorized access message / signout
    await expect(page).toHaveURL(/\/login/);
    
    // Check that access restricted banner or message appears
    await expect(page.getByText(/access restricted/i)).toBeVisible();
  });
});
