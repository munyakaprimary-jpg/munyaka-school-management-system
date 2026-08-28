import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google?: any;
    initMap?: () => void;
  }
}

let scriptLoadingPromise: Promise<void> | null = null;

/**
 * Load the Google Maps JavaScript API once. The first caller triggers
 * the network request; subsequent callers reuse the same promise so
 * the script tag is only added to the DOM a single time even if
 * multiple components request it concurrently.
 */
export function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not defined'));
  }

  // Already loaded and ready to use
  if (window.google?.maps?.Map) {
    return Promise.resolve();
  }

  // Already loading — share the same promise
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  // Kick off the load
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script-loader') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')));
      return;
    }

    const apiKey = (typeof process !== "undefined" && (process as any).env?.VITE_GOOGLE_MAPS_API_KEY) || "";
    const libraries = 'places,geometry';
    const src = apiKey
      ? `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&v=weekly&loading=async`
      : `https://maps.googleapis.com/maps/api/js?libraries=${libraries}&v=weekly&loading=async`;

    const script = document.createElement('script');
    script.id = 'google-maps-script-loader';
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => {
      if (window.google?.maps?.Map) {
        resolve();
      } else {
        // Some builds fire 'load' before the namespace is fully populated;
        // wait a tick and check again.
        setTimeout(() => {
          if (window.google?.maps?.Map) {
            resolve();
          } else {
            reject(new Error('Google Maps loaded but google.maps.Map is undefined'));
          }
        }, 50);
      }
    });
    script.addEventListener('error', () => {
      scriptLoadingPromise = null;
      reject(new Error('Failed to load Google Maps JavaScript API'));
    });
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * React hook that reports whether the Google Maps JavaScript API is
 * ready to use. Components can use the boolean to conditionally render
 * the interactive map UI.
 */
export function useGoogleMapsReady(): boolean {
  const [ready, setReady] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!window.google?.maps?.Map;
  });

  useEffect(() => {
    let mounted = true;
    loadGoogleMapsScript()
      .then(() => { if (mounted) setReady(true); })
      .catch(() => { if (mounted) setReady(false); });
    return () => { mounted = false; };
  }, []);

  return ready;
}