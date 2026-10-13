/**
 * Resolves the API base URL using a dynamic host check.
 *
 * Precedence (first non-empty wins):
 *   1. `import.meta.env.VITE_API_URL`   — build-time override (Vite)
 *   2. localStorage `lan_server_url`    — primary runtime key (LANServerConfig page)
 *   3. localStorage `server_ip`         — alternative runtime key (raw IP, port auto-added)
 *   4. localStorage `munyaka_lan_server_url` — legacy runtime key (auto-migrated on read)
 *   5. Fallback: `http://<window.location.hostname>:5000` — works for the
 *      dev machine (localhost), the LAN IP, or a deployed domain without code changes.
 *
 * Re-evaluated on every call so runtime changes (LAN Server Config screen)
 * take effect immediately — no APK rebuild required.
 */

export const DEFAULT_PORT = 5000;

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

const isAlreadyPrefixed = (value: string): boolean => /^https?:\/\//i.test(value);

const ensureProtocol = (value: string): string =>
  isAlreadyPrefixed(value) ? value : `http://${value}`;

const ensurePort = (value: string, port: number): string => {
  // If a port is already explicit, leave it alone. Otherwise append :port
  // so user-entered IPs like "192.168.1.42" automatically become
  // "http://192.168.1.42:5000".
  try {
    const u = new URL(ensureProtocol(value));
    if (!u.port) {
      u.port = String(port);
      return u.toString().replace(/\/$/, '');
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return value;
  }
};

const readConfiguredUrl = (): string | null => {
  // 1. Build-time override (Vite)
  const envUrl = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
  if (envUrl && String(envUrl || '').trim()) return ensurePort(String(envUrl || '').trim(), DEFAULT_PORT);

  if (typeof window === 'undefined' || !window.localStorage) return null;

  // 2. Primary runtime key — used by LANServerConfig page
  try {
    const stored = localStorage.getItem('lan_server_url');
    if (stored && String(stored || '').trim()) return ensurePort(String(stored || '').trim(), DEFAULT_PORT);
  } catch { /* private mode */ }

  // 3. Alternative runtime key — raw IP/hostname; port is auto-appended
  try {
    const stored = localStorage.getItem('server_ip');
    if (stored && String(stored || '').trim()) return ensurePort(String(stored || '').trim(), DEFAULT_PORT);
  } catch { /* private mode */ }

  // 4. Legacy runtime key — auto-migrate to the primary key on first read
  try {
    const legacy = localStorage.getItem('munyaka_lan_server_url');
    if (legacy && String(legacy || '').trim()) {
      const migrated = ensurePort(String(legacy || '').trim(), DEFAULT_PORT);
      try {
        localStorage.setItem('lan_server_url', migrated);
        localStorage.removeItem('munyaka_lan_server_url');
      } catch { /* ignore migration write failures */ }
      return migrated;
    }
  } catch { /* private mode */ }

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
 * Convenience getter for code paths that need a synchronous base URL.
 * Re-runs `getApiBaseUrl()` lazily on every access so that runtime
 * configuration changes are respected without reloading the page.
 */
export const getApiBase = (): string => getApiBaseUrl();

export { isLoopbackHost };

// ─── Server URL change notification ─────────────────────────────────────────────

/**
 * The event name fired when the LAN server URL changes. Components or hooks
 * that cache the URL (e.g. a stale `useState` variable) can listen for this
 * to force a re-read on the next request.
 */
export const SERVER_URL_CHANGE_EVENT = 'munyaka:server-url-changed';

/**
 * Read the currently configured server URL (mirrors getApiBaseUrl but without
 * the dynamic fallback — returns exactly what's in localStorage or env).
 * Useful for displaying the "current" URL in the LAN Server Config UI.
 */
export const getConfiguredServerUrl = (): string => {
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
 * Call this after writing a new URL to localStorage so all listeners
 * (including the request interceptor) know the server URL has changed.
 * The API client reads the new URL on the very next request automatically.
 */
export const notifyServerUrlChanged = (newUrl: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(SERVER_URL_CHANGE_EVENT, {
        detail: { url: newUrl, timestamp: Date.now() },
      })
    );
  } catch { /* no-op */ }
};
