/**
 * PWA service worker lifecycle.
 *
 * Vercel deployments replace the built assets (and the generated /sw.js), but a
 * mobile browser keeps the previously installed worker alive. Without an
 * explicit update check the device can stay pinned to a stale bundle for weeks.
 *
 * This module:
 *  - registers the worker on every page load (register() always re-checks the
 *    worker script, bypassing the HTTP cache),
 *  - forces a newly installed worker out of the "waiting" state and reloads the
 *    page so the new deployment is actually served,
 *  - exposes a manual "check for updates" helper for administrators.
 */

/** Set once per page load so a single update cycle can never loop the reload. */
let reloadTriggered = false;

/** The active registration, kept so the admin "Check for Updates" button can use it. */
let activeRegistration: ServiceWorkerRegistration | null = null;

/**
 * The Capacitor native WebView has no origin-scoped service workers worth
 * registering, and an intercepting worker breaks its fetch/CORS behaviour.
 */
const isNativeShell = () =>
  Boolean((window as unknown as { Capacitor?: unknown }).Capacitor);

const isSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator;

function reloadOnce() {
  if (reloadTriggered) return;
  reloadTriggered = true;
  window.location.reload();
}

/** Ask a waiting worker to activate immediately instead of waiting for every tab to close. */
function activateWaitingWorker(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
}

export function registerServiceWorker() {
  if (!isSupported() || isNativeShell()) return;

  // A controller only exists once a worker has taken over the page, so a
  // first-time visitor must not be reloaded when their worker activates.
  const hadController = Boolean(navigator.serviceWorker.controller);

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        activeRegistration = registration;
        console.log('[SW] Service Worker registered with scope:', registration.scope);

        // A worker may already be waiting from a previous visit.
        if (registration.waiting && navigator.serviceWorker.controller) {
          console.log('[SW] Waiting worker found — activating new deployment.');
          activateWaitingWorker(registration);
          reloadOnce();
          return;
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New Vercel deployment detected — activating and reloading.');
              activateWaitingWorker(registration);
              reloadOnce();
            }
          };
        };
      })
      .catch((err) => {
        console.warn('[SW] Service Worker registration failed:', err);
      });
  });

  // Safety net: if the new worker takes control before the update hook above
  // runs, the page is still running the old bundle — reload it.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    console.log('[SW] Controller changed — reloading to pick up the new build.');
    reloadOnce();
  });
}

/**
 * Manually re-check the worker script. Returns true when a new deployment was
 * found and the page is reloading.
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!isSupported() || isNativeShell()) return false;

  const registration =
    activeRegistration ?? (await navigator.serviceWorker.getRegistration('/'));
  if (!registration) return false;

  await registration.update();

  if (registration.waiting) {
    activateWaitingWorker(registration);
    reloadOnce();
    return true;
  }

  if (registration.installing) {
    const installingWorker = registration.installing;
    await new Promise<void>((resolve) => {
      const onStateChange = () => {
        if (installingWorker.state === 'installed') {
          installingWorker.removeEventListener('statechange', onStateChange);
          resolve();
        }
      };
      installingWorker.addEventListener('statechange', onStateChange);
    });

    if (navigator.serviceWorker.controller) {
      activateWaitingWorker(registration);
      reloadOnce();
      return true;
    }
  }

  return false;
}
