import { test, expect } from "@playwright/test";

/**
 * Verify the rebuilt Dashboard Overview renders every required
 * section for the ADMIN role. The test seeds the same data shape
 * the Dashboard hook reads (school_learners_data, munyaka_staff,
 * munyaka_transactions, munyaka_attendance_records, munyaka_grades)
 * so the cards display real numbers instead of zeros.
 *
 * Sign-in path: the System Administrator tab uses the password
 * "ownerpass2026", which resolves to user.role === "super_admin".
 * This is the FULL ADMIN role (distinct from the owner/billing role).
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

    const attendance = {
      "Grade 1_all_morning": {
        savedAt: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
      },
    };
    localStorage.setItem("munyaka_attendance_records", JSON.stringify(attendance));

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

  // Click the "System Administrator" tab (super_admin role — full admin, NOT owner)
  const sysadminTab = page.getByRole("tab", { name: /System Administrator/i });
  await expect(sysadminTab).toBeVisible();
  await sysadminTab.click();

  const sysadminCard = page.getByRole("button", { name: /System Administrator/i });
  await sysadminCard.click();

  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await passwordInput.fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^Sign In$/i }).click();

  // super_admin lands on /admin-dashboard after sign-in (redirected from /dashboard)
  await page.waitForURL("**/admin-dashboard", { timeout: 10_000 });
};

test("ADMIN sees Dashboard Overview with all required sections", async ({ page }) => {
  await signInAsAdmin(page);
  await seedAdminData(page);
  await page.reload();

  // System Administrator Dashboard heading
  await expect(page.getByRole("heading", { name: /System Administrator Dashboard/i })).toBeVisible();

  // System vitals section renders
  await expect(page.getByText(/Total Students/i)).toBeVisible();
  await expect(page.getByText(/Total Teachers/i)).toBeVisible();
  await expect(page.getByText(/Fees Collected/i)).toBeVisible();

  // Admin-specific sections are visible
  await expect(page.getByText(/Quick Actions/i)).toBeVisible();
  await expect(page.getByText(/System Alerts/i)).toBeVisible();
  await expect(page.getByText(/Connected Devices/i)).toBeVisible();
  await expect(page.getByText(/LAN Server Status/i)).toBeVisible();
});

test("OWNER is redirected to Owner Dashboard and does NOT see admin operational sections", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.removeItem("munyaka_session");
  });
  await page.goto("/login");

  // Click the "School Owner" tab (owner role — billing only)
  const ownerTab = page.getByRole("tab", { name: /School Owner/i });
  await expect(ownerTab).toBeVisible();
  await ownerTab.click();

  const ownerCard = page.getByRole("button", { name: /School Owner/i });
  await ownerCard.click();

  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await passwordInput.fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^Sign In$/i }).click();

  // Owner lands on /dashboard → Owner Dashboard
  await page.waitForURL("**/dashboard", { timeout: 10_000 });

  // Owner Dashboard sections are visible
  await expect(page.getByRole("heading", { name: /Owner Dashboard/i })).toBeVisible();
  await expect(page.getByText(/Subscription/i)).toBeVisible();
  await expect(page.getByText(/Platform Billing/i)).toBeVisible();
  await expect(page.getByText(/System Billing/i)).toBeVisible();

  // Operational sections (not in scope for owner) are absent
  await expect(page.getByText(/Total Students/i)).not.toBeVisible();
  await expect(page.getByText(/Total Teachers/i)).not.toBeVisible();
});
