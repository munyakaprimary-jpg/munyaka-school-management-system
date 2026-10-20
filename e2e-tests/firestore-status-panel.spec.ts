import { test, expect } from "@playwright/test";
import { installAdminSession, gotoHashRoute } from "./fixtures/session";
import { installFirebaseMocks } from "./fixtures/firebase-mock";

test.describe("Firestore Status Panel Layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("header stacks vertically and grid is two columns on mobile", async ({ page }) => {
    await installFirebaseMocks(page);
    await installAdminSession(page);
    await gotoHashRoute(page, "/settings");

    // Open the Cloud DB (Firestore) tab if needed
    const cloudTab = page.getByRole("tab", { name: /Cloud DB|Firestore/i }).or(
      page.getByText(/Cloud DB \(Firestore\)/i)
    );
    if (await cloudTab.isVisible()) {
      await cloudTab.click();
    }

    const heading = page.getByRole("heading", { name: /Firestore Cloud Collections Status/i });
    const testBtn = page.getByRole("button", { name: /Test Cloud Collections/i });

    await expect(heading).toBeVisible();
    await expect(testBtn).toBeVisible();

    // Header items must stack vertically on mobile (button below heading)
    const headingBox = await heading.boundingBox();
    const btnBox = await testBtn.boundingBox();
    expect(headingBox).not.toBeNull();
    expect(btnBox).not.toBeNull();
    expect(btnBox!.y).toBeGreaterThan(headingBox!.y + headingBox!.height);

    // Grid must be single-column on mobile (<640px) and hold every status card
    const grid = page.getByTestId("firestore-status-grid");
    await expect(grid).toBeVisible();
    await expect(grid).toHaveComputedStyle({
      gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    });
    await expect(grid.locator("> div")).toHaveCount(18);
  });
});
