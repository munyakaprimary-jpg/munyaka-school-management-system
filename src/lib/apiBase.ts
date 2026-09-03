/**
 * Resolves the API base URL using a dynamic host check.
 *
 * - If a backend URL is explicitly configured via `import.meta.env.VITE_API_URL`
 *   or the `lan_server_url` localStorage key, that value is used as-is.
 * - Otherwise, the host is derived from the current page so the same build
 *   works on the developer machine (localhost), the LAN IP, and a deployed
 *   domain without code changes.
 */

const DEFAULT_PORT = 5000;

const isLoopbackHost = (host: string): boolean =>
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host === '0.0.0.0' ||
  host === '::1';

const stripPort = (host: string): string => {
  // window.location.hostname never contains a port, but be defensive in case
  // this helper is ever fed a `host:port` string from a config source.
  const colonIndex = host.indexOf(':');
  return colonIndex === -1 ? host : host.slice(0, colonIndex);
};

const readConfiguredUrl = (): string | null => {
  // Build-time override (Vite)
  const envUrl = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) return envUrl.trim();

  // Runtime override (LAN server config page)
  try {
    const stored = localStorage.getItem('lan_server_url');
    if (stored && stored.trim()) return stored.trim();
  } catch {
    // localStorage can throw in private modes; fall through
  }

  return null;
};

/**
 * Returns the API base URL (e.g. "http://localhost:5000" or
 * "http://192.168.1.42:5000") using the dynamic host check.
 */
export const getApiBaseUrl = (): string => {
  const configured = readConfiguredUrl();
  if (configured) return configured;

  if (typeof window === 'undefined' || !window.location?.hostname) {
    return `http://localhost:${DEFAULT_PORT}`;
  }

  const host = stripPort(window.location.hostname);
  if (isLoopbackHost(host)) {
    return `http://localhost:${DEFAULT_PORT}`;
  }
  return `http://${host}:${DEFAULT_PORT}`;
};

/**
 * Convenience constant for code paths that need a synchronous base URL.
 * This re-runs `getApiBaseUrl()` lazily on each access so that runtime
 * configuration changes are respected without reloading the page.
 */
export const API_BASE: string = getApiBaseUrl();

export { DEFAULT_PORT, isLoopbackHost };
