import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ─── PWA Service Worker Registration ─────────────────────────────────────────
// Only register the service worker in browser/web environments.
// Disable SW entirely in Capacitor native WebView to prevent it from intercepting
// WebView fetch calls (which would cause CORS/network failures on Android).
if ('serviceWorker' in navigator && !(window as unknown as { Capacitor?: unknown }).Capacitor) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('[SW] Service Worker registration failed:', err);
      });
  });
}

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error('Failed to find root element with id "root"');
  }
} catch (e) {
  console.error('Critical error mounting React root:', e);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 24px; font-family: sans-serif; text-align: center; color: #333;">
        <h2>Application Loading Error</h2>
        <p>An unexpected error occurred while starting the application.</p>
        <pre style="background: #f1f5f9; padding: 12px; border-radius: 6px; text-align: left; max-width: 600px; margin: 16px auto; overflow: auto;">${e instanceof Error ? e.message : String(e)}</pre>
        <button onclick="localStorage.clear(); window.location.reload();" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Clear Storage & Retry</button>
      </div>
    `;
  }
}