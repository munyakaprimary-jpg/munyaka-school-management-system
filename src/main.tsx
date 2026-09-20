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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);