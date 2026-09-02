import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initializeAppStorage } from "./services/StorageInitService";
import { processPasswordResetOverride } from "./services/PasswordResetOverrideService";
import { hydrateAllStores } from "./utils/storage";

// ── 0. Hydrate persistent storage before anything else renders ─────────────
// This populates every primary store from localStorage (or falls back to seed data)
// so that the app has correct state on very first load.
const hydrationReport = hydrateAllStores();
if (import.meta.env.DEV && hydrationReport.hydrated) {
  const { restoredFromSeed } = hydrationReport;
  if (restoredFromSeed.length > 0) {
    console.log('[Storage] Hydrated from seed:', restoredFromSeed.join(', '));
  }
}

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
