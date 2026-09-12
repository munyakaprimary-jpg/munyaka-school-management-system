import { test, expect } from "@playwright/test";

/**
 * Verify the rebuilt Dashboard Overview renders every required
 * section for the ADMIN role.
 *
 * Sign-in path: the School Administrator tab uses the password
 * "ownerpass2026", which resolves to user.role === "admin".
 */

const ADMIN_PASSWORD = "ownerpass2026";

const seedAdminData = async (page: import("@playwright/test").Page) => {
  await page.evaluate(() => {
    const learners = [
      { id: "s1", admNo: "A001", name: "ALICE WAITHAKA", grade: "Grade 1", stream: "Blue", status: "Active" },
      { id: "s2", admNo: "A002", name: "BRIAN MUTUA", grade: "Grade 2", stream: "Green", status: "Active" },
      { id: "s3", admNo: "A003", name: "CHRISTINE ACHIENG", grade: "Grade 8", stream: "Alpha", status: "Active" },
      { id: "s4", admNo: "A004", name: "DAVID KIPNG'ENO", grade: "Grade 9", stream: "Beta", status: "Active" },
    ];
    localStorage.setItem("school_learners_data", JSON.stringify(learners));

    const staff = [
      { id: "t1", name: "Jane Mwangi", role: "Class Teacher", status: "Active" },
      { id: "t2", name: "John Kamau", role: "Senior Teacher", status: "Active" },
    ];
    localStorage.setItem("munyaka_staff_directory", JSON.stringify(staff));
    localStorage.setItem("munyaka_staff", JSON.stringify(staff));

    const transactions = [
      {
        id: "TX-516",
        date: new Date().toISOString(),
        amount: 700,
        ref: "AUTO-GEN",
        status: "paid",
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem("munyaka_transactions", JSON.stringify(transactions));

    const grades = [
      { id: "g1", name: "Grade 1" },
      { id: "g2", name: "Grade 2" },
      { id: "g8", name: "Grade 8" },
    ];
    localStorage.setItem("munyaka_grades", JSON.stringify(grades));
  });
};

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

test("ADMIN sees Dashboard Overview with all required sections", async ({ page }) => {
  await signInAsAdmin(page);
  await seedAdminData(page);
  await page.reload();

  // Header
  await expect(page.getByRole("heading", { name: /Dashboard Overview/i })).toBeVisible();
  await expect(page.getByText(/System vitals for Munyaka Primary and Junior School/i)).toBeVisible();

  // Live sync banner
  await expect(page.getByText(/LIVE FACTUAL SYNC/i).first()).toBeVisible();

  // System vitals
  await expect(page.getByText(/Total Students/i)).toBeVisible();
  await expect(page.getByText(/Total Teachers/i)).toBeVisible();
  await expect(page.getByText(/Today's Attendance/i)).toBeVisible();
  await expect(page.getByText(/Junior School/i)).toBeVisible();
  await expect(page.getByText(/System Status/i)).toBeVisible();
  await expect(page.getByText(/Live/i).first()).toBeVisible();

  // Attendance trends chart
  await expect(page.getByText(/Attendance Trends/i)).toBeVisible();
  await expect(page.getByText(/Real-time Data/i)).toBeVisible();

  // Recent alerts + simulation buttons
  await expect(page.getByRole("heading", { name: /Recent Alerts/i })).toBeVisible();
  await expect(page.getByTestId("simulate-fee-button")).toBeVisible();
  await expect(page.getByTestId("simulate-reg-button")).toBeVisible();
  await expect(page.getByTestId("simulate-attendance-button")).toBeVisible();

  // Class participation table
  await expect(page.getByText(/Current School Enrollment/i)).toBeVisible();
  await expect(page.getByText(/CLASS NAME/i)).toBeVisible();
  await expect(page.getByText(/BOYS/i)).toBeVisible();
  await expect(page.getByText(/GIRLS/i)).toBeVisible();
  await expect(page.getByText(/TOTAL/i)).toBeVisible();
});

test("Simulation buttons append a new alert to the Recent Alerts timeline", async ({ page }) => {
  await signInAsAdmin(page);
  await page.evaluate(() => localStorage.removeItem("munyaka_activity_log"));
  await page.reload();

  // Click the "SIMULATE FEE" button
  await page.getByTestId("simulate-fee-button").click();

  // The new alert should appear with the exact text pattern
  await expect(page.getByText(/Fee payment: AUTO-GEN \(KES 300\)/i)).toBeVisible();
});

test("OWNER is redirected to Owner Dashboard and does NOT see admin overview sections", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.removeItem("munyaka_session");
  });
  await page.goto("/login");

  const ownerTab = page.getByRole("tab", { name: /School Owner/i });
  await expect(ownerTab).toBeVisible();
  await ownerTab.click();

  const ownerCard = page.getByRole("button", { name: /School Owner/i });
  await ownerCard.click();

  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await passwordInput.fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^Sign In$/i }).click();

  await page.waitForURL("**/dashboard", { timeout: 10_000 });

  // Owner Dashboard sections are visible
  await expect(page.getByRole("heading", { name: /Owner Dashboard/i })).toBeVisible();
  await expect(page.getByText(/Subscription/i)).toBeVisible();

  // Admin overview sections (not in scope for owner) are absent
  await expect(page.getByText(/Current School Enrollment/i)).not.toBeVisible();
  await expect(page.getByText(/Junior School/i)).not.toBeVisible();
});
