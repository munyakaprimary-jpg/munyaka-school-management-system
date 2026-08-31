import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initializeAppStorage } from "./services/StorageInitService";
import { processPasswordResetOverride } from "./services/PasswordResetOverrideService";

// ── 1. Check for offline emergency password-reset override ──────────────────────
processPasswordResetOverride().then((processed) => {
  if (processed) {
    // eslint-disable-next-line no-console
    console.log(
      '[PasswordResetOverride] Override applied. Please reload the page to continue.'
    );
  }

  // ── 2. Seed initial data once the override (if any) has been processed ───────
  initializeAppStorage();

  // ── 3. Mount the React tree ────────────────────────────────────────────────
  createRoot(document.getElementById("root")!).render(<App />);
});
