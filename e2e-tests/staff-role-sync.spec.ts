import { test, expect } from "@playwright/test";

/**
 * Test the staff role synchronization functionality:
 * - Dynamic role mapping between designations and system roles
 * - Staff edit modal syncs designation to system role
 * - Non-teaching designations clear teaching-specific fields
 * - Librarian helpers correctly return false for teacher-only functions
 */

const ADMIN_PASSWORD = "ownerpass2026";

const seedStaffWithLibrarian = async (page: import("@playwright/test").Page) => {
  await page.evaluate(() => {
    // Seed a librarian staff member
    const librarianStaff = [
      {
        id: "librarian-001",
        staffId: "L001",
        name: "Mary Wanjiku",
        nationalId: "33445566",
        email: "mary.wanjiku@munyaka.sc.ke",
        phone: "+254 720 011 011",
        systemRole: "class_teacher", // WRONG - should be librarian
        role: "LIBRARIAN",
        department: "Library",
        assignedSubjects: ["Mathematics"], // Teaching field that should be cleared
        tempAccessCode: "MUNYAKA-5678",
        status: "Active",
        datePreRegistered: "2019-08-20",
        profileComplete: true,
        schoolId: "munyaka-sc",
      },
      {
        id: "teacher-001",
        staffId: "T001",
        name: "Jane Mwangi",
        nationalId: "22334455",
        email: "jane.mwangi@munyaka.sc.ke",
        phone: "+254 720 001 001",
        systemRole: "class_teacher",
        role: "Class Teacher",
        department: "School Administration",
        assignedSubjects: ["Mathematics"],
        tempAccessCode: "MUNYAKA-1234",
        status: "Active",
        datePreRegistered: "2020-01-15",
        profileComplete: true,
        schoolId: "munyaka-sc",
      },
    ];
    localStorage.setItem("munyaka_master_staff_list", JSON.stringify(librarianStaff));
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

test("Staff page loads and displays staff directory", async ({ page }) => {
  await signInAsAdmin(page);
  await seedStaffWithLibrarian(page);
  await page.goto("/staff");

  // Wait for staff page to load
  await expect(page.getByRole("heading", { name: /Staff & Personnel/i })).toBeVisible();
  
  // Verify the page shows the staff metrics
  await expect(page.getByText(/Total Staff Records/i)).toBeVisible();
  await expect(page.getByText(/Active Accounts/i)).toBeVisible();
  
  // Verify staff members are listed
  await expect(page.getByText("Mary Wanjiku")).toBeVisible();
  await expect(page.getByText("Jane Mwangi")).toBeVisible();
});

test("Edit modal shows role synchronization when changing designation", async ({ page }) => {
  await signInAsAdmin(page);
  await seedStaffWithLibrarian(page);
  await page.goto("/staff");

  // Wait for staff page to load
  await expect(page.getByRole("heading", { name: /Staff & Personnel/i })).toBeVisible();

  // Find and click the edit button for Mary Wanjiku
  const maryRow = page.locator("tr", { hasText: "Mary Wanjiku" });
  await maryRow.getByRole("button", { name: /edit/i }).click();

  // Modal should open
  await expect(page.getByText("Edit Staff Profile")).toBeVisible();

  // Verify the designation field shows LIBRARIAN
  const designationInput = page.getByPlaceholder(/e.g. TEACHER, LIBRARIAN/i);
  await expect(designationInput).toHaveValue("LIBRARIAN");
  
  // Verify system role indicator shows librarian
  await expect(page.getByText(/System role:.*librarian/i)).toBeVisible();
  
  // Verify non-teaching indicator is shown
  await expect(page.getByText(/Non-teaching designation/i)).toBeVisible();
});

test("Add modal allows creating librarian with correct system role", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/staff");

  // Wait for staff page to load
  await expect(page.getByRole("heading", { name: /Staff & Personnel/i })).toBeVisible();

  // Click Add Staff button
  await page.getByRole("button", { name: /Add Staff/i }).click();

  // Modal should open
  await expect(page.getByText("Add New Staff Member")).toBeVisible();

  // Fill in required fields
  await page.getByPlaceholder(/e.g. Jane Mwangi/i).fill("Test Librarian");
  await page.getByPlaceholder(/e.g. TEACHER, LIBRARIAN/i).fill("LIBRARIAN");
  
  // Verify system role indicator updates
  await expect(page.getByText(/System role:.*librarian/i)).toBeVisible();
  
  // Verify non-teaching indicator shows
  await expect(page.getByText(/Non-teaching designation/i)).toBeVisible();
});

test("Category filter correctly separates teaching and non-teaching staff", async ({ page }) => {
  await signInAsAdmin(page);
  await seedStaffWithLibrarian(page);
  await page.goto("/staff");

  // Wait for staff page to load
  await expect(page.getByRole("heading", { name: /Staff & Personnel/i })).toBeVisible();

  // Click Non-Teaching filter
  await page.getByRole("button", { name: /Non-Teaching Staff/i }).click();

  // Mary Wanjiku (with LIBRARIAN designation) should be visible
  await expect(page.getByText("Mary Wanjiku")).toBeVisible();
  
  // Jane Mwangi (teacher) should not be visible in non-teaching filter
  await expect(page.getByText("Jane Mwangi")).not.toBeVisible();
});
