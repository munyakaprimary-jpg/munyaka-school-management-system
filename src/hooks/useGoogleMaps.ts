import { useEffect, useState, useRef } from 'react';

// The Window.google type is declared in src/types/google-maps.d.ts.

// Per-key promise cache so concurrent callers share the same load.
const loadingPromises: Map<string, Promise<void>> = new Map();

/**
 * Load the Google Maps JavaScript API once per API key. The first caller
 * triggers the network request; subsequent callers (and concurrent ones)
 * reuse the same promise so the script tag is only added to the DOM a
 * single time even if multiple components request it at once.
 *
 * @param apiKey  The API key from System Configuration. Pass a different
 *                key to reload the script.
 * @returns       A promise that resolves when the API is ready.
 */
export function loadGoogleMapsScript(apiKey?: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not defined'));
  }

  const key = apiKey || '';

  // Already loaded and ready to use — short-circuit
  if (window.google?.maps?.Map) {
    return Promise.resolve();
  }

  // Reuse an in-flight load for the same key
  const cached = loadingPromises.get(key);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-maps-script-loader') as HTMLScriptElement | null;

    if (existing) {
      // Script already in DOM — check if it has the right key
      const existingKey = (existing.dataset.apiKey || '');
      if (existingKey === key) {
        // Same key — wait for its load/error events
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => {
          existing.remove();
          loadingPromises.delete(key);
          reject(new Error('Failed to load Google Maps JavaScript API'));
        });
        return;
      }
      // Different key — remove so we can re-add with the new one
      existing.remove();
    }

    const libraries = 'places,geometry';
    const src = key
      ? `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=${libraries}&v=weekly&loading=async`
      : `https://maps.googleapis.com/maps/api/js?libraries=${libraries}&v=weekly&loading=async`;

    const script = document.createElement('script');
    script.id = 'google-maps-script-loader';
    script.dataset.apiKey = key;
    script.src = src;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => {
      if (window.google?.maps?.Map) {
        resolve();
      } else {
        setTimeout(() => {
          if (window.google?.maps?.Map) {
            resolve();
          } else {
            script.remove();
            loadingPromises.delete(key);
            reject(new Error('Google Maps loaded but google.maps.Map is undefined'));
          }
        }, 50);
      }
    });

    script.addEventListener('error', () => {
      script.remove();
      loadingPromises.delete(key);
      reject(new Error('Failed to load Google Maps JavaScript API'));
    });

    document.head.appendChild(script);
  });

  loadingPromises.set(key, promise);
  return promise;
}

/**
 * React hook that reports whether the Google Maps JavaScript API is
 * ready to use.
 *
 * @param apiKey  The API key from System Configuration (optional — if
 *                omitted and no script is loaded, the hook returns false).
 */
export function useGoogleMapsReady(apiKey?: string): boolean {
  const [ready, setReady] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!window.google?.maps?.Map;
  });

  // Track the last key we attempted to load so we don't re-fetch unnecessarily
  const lastKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Skip if nothing changed
    if (apiKey === lastKeyRef.current) return;
    lastKeyRef.current = apiKey;

    let mounted = true;

    loadGoogleMapsScript(apiKey)
      .then(() => { if (mounted) setReady(true); })
      .catch(() => { if (mounted) setReady(false); });

    return () => { mounted = false; };
  }, [apiKey]);

  return ready;
}