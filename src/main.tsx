import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./globals.css";
import { initializeAppStorage } from "./services/StorageInitService";
import { processPasswordResetOverride } from "./services/PasswordResetOverrideService";
import { hydrateAllStores } from "./utils/storage";
import { runMigrations } from "./services/schemaMigrations";
import { simulateDeviceHeartbeat } from "./types/device";
import { initializeStaffMaster } from "./services/staffMasterService";

/**
 * Boot orchestrator.
 *
 * Why this is structured the way it is
 * ------------------------------------
 * On the Android WebView a single uncaught exception thrown before
 * `createRoot().render()` is called will leave the WebView with a blank
 * white screen — there is no React to show a fallback, so the only
 * recovery is to kill the process and reopen the app. That is what
 * users experience as "the app crashes instantly on launch."
 *
 * To prevent that we wrap every pre-mount side-effect in try-catch and
 * ensure the React tree is mounted regardless of what happens in
 * the bootstrap chain. The order is preserved:
 *
 *   1. runMigrations()           — IndexedDB schema check (async, fire-and-forget)
 *   2. hydrateAllStores()        — synchronous localStorage seed
 *   3. processPasswordReset…     — async override check
 *   4. initializeAppStorage()    — synchronous seed sync
 *   5. simulateDeviceHeartbeat   — fire-and-forget telemetry
 *   6. createRoot().render(<App />)  — final, ALWAYS reached
 *
 * Each step is independently wrapped so a failure in one does not block
 * the React tree from mounting. Errors are surfaced via console.error
 * for debugging but never propagate to the user as a white screen.
 */

// ── Global error trap ───────────────────────────────────────────────────────
// On Android WebView, an uncaught error in synchronous or promise code can
// otherwise leave the screen blank with no feedback. We intercept both
// window.onerror and window.onunhandledrejection and dump the message +
// stack trace directly into the document body in red text so the failure
// is visible to anyone (developer, support, end user) who can see the
// screen.
const renderFatalError = (title: string, details: string) => {
  try {
    const safeTitle = String(title).replace(/[<>]/g, (ch) =>
      ch === "<" ? "&lt;" : "&gt;"
    );
    const safeDetails = String(details).replace(/[<>]/g, (ch) =>
      ch === "<" ? "&lt;" : "&gt;"
    );
    // Preserve any pre-existing <h1>Loading Munyaka Portal...</h1> by
    // prepending our error block above it instead of overwriting it.
    const errorBlock = `
      <div style="
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        background:#fef2f2;
        color:#b91c1c;
        border:2px solid #b91c1c;
        border-radius:12px;
        padding:20px;
        margin:20px;
        white-space:pre-wrap;
        word-break:break-word;
      ">
        <h1 style="font-size:18px;margin:0 0 8px;color:#991b1b;">${safeTitle}</h1>
        <pre style="margin:0;font-size:13px;line-height:1.5;">${safeDetails}</pre>
      </div>
    `;
    document.body.innerHTML = errorBlock + (document.body.innerHTML || "");
  } catch {
    // Last-ditch effort: at least make the page red so something is visible.
    document.body.style.color = "red";
  }
};

window.addEventListener("error", (event) => {
  // event.error is the original Error object; event.message is a string copy.
  const err = event.error;
  const message = err?.message || event.message || "Unknown error";
  const stack = err?.stack || "(no stack trace available)";
  // eslint-disable-next-line no-console
  console.error("[window.error]", message, err);
  renderFatalError("Uncaught error: " + message, stack);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
      ? reason
      : reason
      ? JSON.stringify(reason)
      : "Unknown rejection";
  const stack =
    reason instanceof Error
      ? reason.stack || "(no stack trace available)"
      : "(no stack trace available)";
  // eslint-disable-next-line no-console
  console.error("[unhandledrejection]", message, reason);
  renderFatalError("Unhandled promise rejection: " + message, stack);
});

const safeLogDev = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

// ── 0. Run schema migrations (IndexedDB ← legacy localStorage) ──────────────
// Fire-and-forget: this is async but the React tree does not depend on
// it finishing. The migration is idempotent so a second boot is safe.
runMigrations()
  .then((result) => {
    safeLogDev(
      `[SchemaMigration] v${result.schemaVersion} — ` +
        `${result.idbRecordsWritten} IDB records written, ` +
        `${result.legacyKeysCleared} mock keys cleared.`
    );
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[SchemaMigration] Migration threw — continuing boot:", err);
  });

// ── 0b. Hydrate persistent storage before anything else renders ─────────────
// Wrapped in try-catch so a malformed seed object can never abort boot.
try {
  const hydrationReport = hydrateAllStores();
  if (import.meta.env.DEV && hydrationReport.hydrated) {
    const { restoredFromSeed } = hydrationReport;
    if (restoredFromSeed.length > 0) {
      // eslint-disable-next-line no-console
      console.log("[Storage] Hydrated from seed:", restoredFromSeed.join(", "));
    }
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error("[Storage] Hydration failed — continuing boot with empty state:", err);
}

// ── 1. Check for offline emergency password-reset override ─────────────────
// Wrapped so a missing/invalid override file never blocks React mount.
const processOverrideSafely = async (): Promise<void> => {
  try {
    const processed = await processPasswordResetOverride();
    if (processed) {
      // eslint-disable-next-line no-console
      console.log(
        "[PasswordResetOverride] Override applied. Please reload the page to continue."
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[PasswordResetOverride] Override check failed — continuing boot:", err);
  }
};

// ── 2. Seed initial data (idempotent, sync) ───────────────────────────────
const seedInitialDataSafely = (): void => {
  try {
    initializeAppStorage();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[StorageInitService] Seed failed — continuing boot:", err);
  }
  // ── 2b. Seed staff master (single source of truth for all staff records) ──
  try {
    initializeStaffMaster();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[StaffMasterService] Seed failed — continuing boot:", err);
  }
};

// ── 2b. Send device heartbeat telemetry (best-effort) ─────────────────────
const sendInitialHeartbeat = () => {
  try {
    const sessionRaw = localStorage.getItem("munyaka_session");
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    if (!session || !session.id) return;
    const ua = navigator.userAgent || "";
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

// ── 3. Mount the React tree (always reached) ──────────────────────────────
const mountAppSafely = () => {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    // Without a #root the app literally cannot mount. Render a minimal
    // error message so the user sees *something* instead of a white screen.
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;padding:20px;text-align:center;">
        <div style="max-width:420px;">
          <h1 style="font-size:18px;color:#0f172a;margin:0 0 8px;">App failed to start</h1>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px;">The application could not find its mount point. Please reload.</p>
          <button onclick="location.reload()" style="padding:10px 20px;border-radius:12px;background:#4f46e5;color:#fff;border:none;font-weight:700;cursor:pointer;">Reload</button>
        </div>
      </div>
    `;
    return;
  }

  // Ensure the loading fallback is present in #root before React mounts.
  // This prevents a white flash on Android WebView where the initial DOM
  // may have been stripped by the host page.
  if (rootEl.childElementCount === 0) {
    rootEl.innerHTML = `<h1 style="font-family:system-ui,-apple-system,sans-serif;padding:20px;color:#2563eb;">Loading Munyaka Portal...</h1>`;
  }

  try {
    // Wrap the entire app tree in the AppErrorBoundary so any unhandled
    // exception during the very first paint is caught and the user sees
    // the friendly fallback instead of a blank white screen on Android.
    // The same boundary is also used inside App.tsx — doubling it here at
    // the entry point protects against crashes that happen *before*
    // App.tsx's tree mounts (e.g. inside an early provider or hook).
    createRoot(rootEl).render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    );
  } catch (err) {
    // Final safety net — if React itself throws during mount, at least
    // show a user-readable error and a reload button.
    // eslint-disable-next-line no-console
    console.error("[Boot] createRoot().render() threw:", err);
    rootEl.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:#fef2f2;padding:20px;text-align:center;">
        <div style="max-width:420px;">
          <h1 style="font-size:18px;color:#991b1b;margin:0 0 8px;">Something went wrong</h1>
          <p style="font-size:14px;color:#7f1d1d;margin:0 0 16px;">The app failed to start. Please reload to try again.</p>
          <button onclick="location.reload()" style="padding:10px 20px;border-radius:12px;background:#dc2626;color:#fff;border:none;font-weight:700;cursor:pointer;">Reload App</button>
        </div>
      </div>
    `;
  }
};

// ── Orchestrate the boot sequence ──────────────────────────────────────────
// Each phase is independently guarded. The React tree is mounted in the
// final .then() and ALSO in a setTimeout fallback so it always happens.
processOverrideSafely()
  .then(() => {
    seedInitialDataSafely();
    sendInitialHeartbeat();
    mountAppSafely();
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[Boot] Orchestrator rejected — mounting anyway:", err);
    seedInitialDataSafely();
    sendInitialHeartbeat();
    mountAppSafely();
  });

// ── Hard fallback ─────────────────────────────────────────────────────────
// If the async chain above ever hangs (e.g. a fetch that never resolves
// on a flaky mobile network), guarantee the React tree still mounts
// within 5 seconds. This is the "it crashes on launch" safety net.
setTimeout(() => {
  const rootEl = document.getElementById("root");
  if (rootEl && rootEl.childElementCount === 0) {
    // eslint-disable-next-line no-console
    console.warn("[Boot] Timeout fallback — React tree had not mounted, forcing mount now.");
    seedInitialDataSafely();
    sendInitialHeartbeat();
    mountAppSafely();
  }
}, 5000);
