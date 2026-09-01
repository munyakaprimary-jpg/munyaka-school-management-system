import { test, expect } from "@playwright/test";

/**
 * Verify the rebuilt Dashboard Overview renders every required
 * section for the ADMIN role. The test seeds the same data shape
 * the Dashboard hook reads (school_learners_data, munyaka_staff,
 * munyaka_transactions, munyaka_attendance_records, munyaka_grades)
 * so the cards display real numbers instead of zeros.
 *
 * Sign-in path: the Super Admin / Owner tab uses the password
 * "ownerpass2026", which resolves to user.role === "owner".
 * The Dashboard's admin gate treats "owner" (a super_admin alias)
 * as ADMIN, so all admin-only sections render.
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

  const superTab = page.getByRole("tab", { name: /Super Admin/i });
  await expect(superTab).toBeVisible();
  await superTab.click();

  const superCard = page.getByRole("button", { name: /Super Admin \(Owner\)/i });
  await superCard.click();

  const passwordInput = page.getByPlaceholder(/Enter your password/i);
  await passwordInput.fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^Sign In$/i }).click();

  // Owner is routed to /payment-management after sign-in; navigate to /
  await page.waitForURL("**/payment-management", { timeout: 10_000 });
  await page.goto("/");
};

test("ADMIN sees Dashboard Overview with all required sections", async ({ page }) => {
  await signInAsAdmin(page);
  await seedAdminData(page);
  await page.reload();

  // Header
  await expect(page.getByRole("heading", { name: /Dashboard Overview/i })).toBeVisible();
  await expect(page.getByText(/System vitals for Munyaka Primary and Junior School/i)).toBeVisible();

  // LIVE FACTUAL SYNC banner — header + Recent Alerts
  const liveBadges = page.getByText("LIVE FACTUAL SYNC");
  await expect(liveBadges.first()).toBeVisible();

  // System vitals cards
  await expect(page.getByText("Total Students")).toBeVisible();
  await expect(page.getByText("Total Teachers")).toBeVisible();
  await expect(page.getByText("Today's Attendance")).toBeVisible();
  await expect(page.getByText("Junior School")).toBeVisible();
  await expect(page.getByText("System Status")).toBeVisible();

  // System Status value
  await expect(page.getByText("Live").first()).toBeVisible();

  // Fees collected card
  await expect(page.getByText("Fees Collected")).toBeVisible();

  // Attendance Trends (Weekly)
  await expect(page.getByRole("heading", { name: /Attendance Trends \(Weekly\)/i })).toBeVisible();
  await expect(page.getByText("Real-time Data")).toBeVisible();

  // Recent Alerts section
  await expect(page.getByRole("heading", { name: /Recent Alerts/i })).toBeVisible();

  // Simulation buttons
  await expect(page.getByRole("button", { name: /Simulate Fee/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Simulate Reg/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Simulate Attendance/i })).toBeVisible();

  // Factual Class Participation table
  await expect(page.getByRole("heading", { name: /Factual Class Participation/i })).toBeVisible();
  await expect(page.getByText("CLASS NAME", { exact: false })).toBeVisible();
  await expect(page.getByText("ENROLLMENT", { exact: false })).toBeVisible();
});

test("ADMIN Simulate Fee button appends an alert to the timeline", async ({ page }) => {
  await signInAsAdmin(page);
  await seedAdminData(page);
  await page.reload();

  const simulateFee = page.getByRole("button", { name: /Simulate Fee/i });
  await expect(simulateFee).toBeVisible();
  await simulateFee.click();

  // After clicking, a fee-payment alert should appear in the timeline
  await expect(page.getByText(/Fee payment: AUTO-GEN/i).first()).toBeVisible();
});

test("ADMIN Simulate Reg button appends a registration alert", async ({ page }) => {
  await signInAsAdmin(page);
  await seedAdminData(page);
  await page.reload();

  const simulateReg = page.getByRole("button", { name: /Simulate Reg/i });
  await simulateReg.click();

  await expect(page.getByText(/New student registered/i).first()).toBeVisible();
});

test("ADMIN Simulate Attendance button appends an attendance alert", async ({ page }) => {
  await signInAsAdmin(page);
  await seedAdminData(page);
  await page.reload();

  const simulateAttn = page.getByRole("button", { name: /Simulate Attendance/i });
  await simulateAttn.click();

  await expect(page.getByText(/Attendance marked/i).first()).toBeVisible();
});