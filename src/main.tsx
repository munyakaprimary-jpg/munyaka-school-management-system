import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initializeAppStorage } from "./services/StorageInitService";

// Run auto-sync version check and seed population on app startup
initializeAppStorage();

createRoot(document.getElementById("root")!).render(<App />);

/**
 * Load the Google Maps JavaScript API once at startup.
 *
 * This runs inside the React entry module, so `import.meta.env` is legal
 * here (Vite inlines the value at build time). We inject the script tag
 * into <head> ourselves instead of relying on a classic <script> in
 * index.html, because a classic script would try to evaluate
 * `import.meta` and crash with:
 *   "SyntaxError: Cannot use 'import.meta' outside a module".
 *
 * Falls back to a no-API-key embed URL when the key is not provided, so
 * the app still works in offline / local-dev environments.
 */
const GOOGLE_MAPS_API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
const LIBRARIES = 'places,geometry';
const mapsSrc = GOOGLE_MAPS_API_KEY
  ? `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=${LIBRARIES}&v=weekly&loading=async`
  : `https://maps.googleapis.com/maps/api/js?libraries=${LIBRARIES}&v=weekly&loading=async`;

if (typeof window !== 'undefined' && !document.getElementById('google-maps-script-loader')) {
  const script = document.createElement('script');
  script.id = 'google-maps-script-loader';
  script.src = mapsSrc;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}