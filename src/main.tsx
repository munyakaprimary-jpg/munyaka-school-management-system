import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initializeAppStorage } from "./services/StorageInitService";
import { processPasswordResetOverride } from "./services/PasswordResetOverrideService";
import { hydrateAllStores } from "./utils/storage";
import { runMigrations } from "./services/schemaMigrations";
import { simulateDeviceHeartbeat } from "./types/device";

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

  // ── 2b. Send device heartbeat telemetry ───────────────────────────────────
  // Lightweight payload: identifies the device, captures OS / app version, and
  // records last-active time. Stored in localStorage under 'monitored_devices'
  // for the school owner dashboard to read. No PII beyond the session user ID.
  const sendInitialHeartbeat = () => {
    try {
      const sessionRaw = localStorage.getItem("munyaka_session");
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;
      if (!session || !session.id) return;
      const ua = navigator.userAgent || "";
      // Best-effort UA parsing — keep lightweight, no Capacitor import here so
      // web-only contexts still work.
      const osMatch = ua.match(/(Android\s\d+|iOS\s\d+|Windows\sNT\s\d+\.\d+|Mac\sOS\sX\s\d+_\d+)/);
      const browserMatch = ua.match(/(Chrome\/[\d.]+|Safari\/[\d.]+)/);
      const phoneModel = osMatch
        ? `${osMatch[0].split(" ")[0]} Mobile`
        : "Web Browser";
      const osVersion = osMatch ? osMatch[0] : navigator.platform || "Unknown";
      simulateDeviceHeartbeat({
        deviceId: `web-${(session.id || "anon").toString().replace(/[^a-z0-9]/gi, "").toLowerCase()}-${(navigator.userAgent.length % 1000)}`,
        teacherId: session.id,
        teacherName: session.name || "Unknown Teacher",
        phoneModel,
        osVersion,
        appVersion: "v1.3.0",
        isOnline: navigator.onLine,
      });
    } catch {
      /* telemetry is best-effort — never block app boot */
    }
  };
  sendInitialHeartbeat();

  // ── 3. Mount the React tree ───────────────────────────────────────────────
  createRoot(document.getElementById("root")!).render(<App />);
});
