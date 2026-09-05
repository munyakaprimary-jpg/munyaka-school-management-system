import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initializeAppStorage } from "./services/StorageInitService";
import { processPasswordResetOverride } from "./services/PasswordResetOverrideService";
import { hydrateAllStores } from "./utils/storage";
import { runMigrations } from "./services/schemaMigrations";

// ── 0. Run schema migrations (IndexedDB ← legacy localStorage) ──────────────
// This detects legacy mock-key data and migrates structured localStorage data
// into IndexedDB. It is a no-op on subsequent launches once the schema
// version is current. Runs in parallel with hydration — both are idempotent.
runMigrations().then((result) => {
  if (import.meta.env.DEV) {
    if (result.migrated) {
      console.log(
        `[SchemaMigration] v${result.schemaVersion} — ` +
          `${result.idbRecordsWritten} IDB records written, ` +
          `${result.legacyKeysCleared} mock keys cleared.`
      );
    } else {
      console.log(`[SchemaMigration] Already on schema v${result.schemaVersion}.`);
    }
  }
});

// ── 0b. Hydrate persistent storage before anything else renders ─────────────
// This populates every primary store from localStorage (or falls back to seed
// data) so that the app has correct state on very first load.
const hydrationReport = hydrateAllStores();
if (import.meta.env.DEV && hydrationReport.hydrated) {
  const { restoredFromSeed } = hydrationReport;
  if (restoredFromSeed.length > 0) {
    console.log("[Storage] Hydrated from seed:", restoredFromSeed.join(", "));
  }
}

// ── 1. Check for offline emergency password-reset override ─────────────────
processPasswordResetOverride().then((processed) => {
  if (processed) {
    // eslint-disable-next-line no-console
    console.log(
      "[PasswordResetOverride] Override applied. Please reload the page to continue."
    );
  }

  // ── 2. Seed initial data once the override (if any) has been processed ───────
  initializeAppStorage();

  // ── 3. Mount the React tree ───────────────────────────────────────────────
  createRoot(document.getElementById("root")!).render(<App />);
});
