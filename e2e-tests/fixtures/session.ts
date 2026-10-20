import { Page } from "@playwright/test";

export const ADMIN_SESSION = {
  role: "admin",
  email: "admin@munyaka.edu",
  name: "Admin User",
  permissions: ["all"],
};

export async function installAdminSession(page: Page) {
  await page.addInitScript((session) => {
    localStorage.setItem("munyaka_current_auth_role", JSON.stringify(session.role));
    localStorage.setItem("munyaka_session", JSON.stringify(session));
    localStorage.setItem("munyaka_auth_state", JSON.stringify({ isAuthenticated: true, user: session }));
  }, ADMIN_SESSION);
}

export async function gotoHashRoute(page: Page, path: string) {
  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  await page.goto("/#" + cleanPath);
}
