/**
 * Mobile / LAN Teacher Authentication Service
 *
 * Handles teacher credential verification against the LAN backend server.
 * Designed for APK deployments where the app must authenticate against a
 * real LAN Express backend rather than the purely-local AuthContext.
 *
 * The service reads the server URL dynamically from localStorage so the
 * APK can be pointed at any LAN server without rebuilding. When running
 * inside the native Capacitor/Android WebView, the localhost fallback is
 * explicitly disabled — the APK MUST use a configured LAN IP or fail
 * explicitly rather than silently falling back to localhost.
 *
 * Usage:
 *   import { teacherLogin } from '@/services/mobileAuthService';
 *   const result = await teacherLogin('TSC12345', 'Teacher@123');
 */

import { getApiBaseUrl } from '@/lib/apiBase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeacherUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  staff_id?: string;
  tsc_number?: string;
  tscNumber?: string;       // server may return either shape
  staffId?: string;
  status?: string;
}

export interface LoginSuccess {
  success: true;
  token: string;
  user: TeacherUser;
}

export interface LoginFailure {
  success: false;
  error: string;
  /** Maps HTTP status to typed code for differentiated UI messages */
  code: 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'ROLE_NOT_ALLOWED' | 'UNKNOWN';
  /** The raw server URL that was attempted (useful for diagnostics) */
  attemptedUrl?: string;
}

export type LoginResult = LoginSuccess | LoginFailure;

// ─── Environment detection ────────────────────────────────────────────────────

/**
 * Detects whether the app is running inside the native Capacitor Android WebView.
 * This is used to enforce that the app NEVER falls back to localhost on an APK —
 * the LAN server URL must be explicitly configured, and the user must be shown
 * a clear error if it is not.
 *
 * Detection strategy:
 * 1. Check window.Capacitor (set by the Capacitor runtime)
 * 2. Check for the custom "android" Capacitor platform flag
 * 3. Check the userAgent for "Capacitor" strings (secondary signal)
 */
export const isCapacitorNative = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Primary: Capacitor runtime injects a `Capacitor` object on native platforms
  if ((window as any).Capacitor?.platform === 'android') return true;

  // Secondary: UA string check (useful in WebView when Capacitor object
  // hasn't been injected yet or is stripped in some build configurations)
  const ua = (window.navigator.userAgent || '').toLowerCase();
  if (ua.includes('capacitor') || ua.includes('android')) return true;

  // Tertiary: detect the Android WebView custom scheme
  if (window.location.protocol === 'android-webview:') return true;

  return false;
};

/**
 * Returns the effective API base URL for login requests.
 *
 * On Capacitor Android builds, this function enforces an explicit server
 * configuration requirement — it returns null if no LAN URL has been saved
 * to localStorage, rather than silently falling back to localhost.
 *
 * This ensures APK deployments fail fast and visibly instead of silently
 * trying to reach localhost (which would fail in the Android WebView).
 */
export const getLoginServerUrl = (): string | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  // Attempt to read the explicitly configured LAN server URL
  for (const key of ['lan_server_url', 'server_ip', 'munyaka_lan_server_url']) {
      try {
        const stored = localStorage.getItem(key);
        if (stored && String(stored || '').trim()) {
          const trimmed = String(stored || '').trim();
        // Normalize: bare IP → http://IP:5000, full URL → used as-is
        if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, '');
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(trimmed)) {
          return `http://${trimmed}:5000`;
        }
        return `http://${trimmed}:5000`;
      }
    } catch { /* ignore private mode */ }
  }

  // On Capacitor Android: do NOT fall back to localhost — fail explicitly.
  // The calling code should surface a "configure server first" error.
  if (isCapacitorNative()) {
    console.error(
      '[mobileAuth] Capacitor APK detected but no LAN server URL configured.' +
      ' Open Settings → LAN Server Config and enter the server IP address.'
    );
    return null;
  }

  // On web/desktop: allow localhost fallback for development convenience
  return getApiBaseUrl();
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalize the identifier before sending to the server. */
const normalizeIdentifier = (raw: string): string => String(raw || '').trim().toLowerCase();

// ─── Core login function ──────────────────────────────────────────────────────

/**
 * Authenticate a teacher using their TSC Number / Staff ID / Email
 * and password against the configured LAN backend server.
 *
 * @param identifier - staff ID (e.g. "teacher1"), TSC number (e.g. "TSC12345"),
 *                     or email address (e.g. "jane@school.com")
 * @param password   - the teacher's password
 * @returns LoginResult with either { success: true, token, user } or
 *          { success: false, error, code, attemptedUrl }
 */
export async function teacherLogin(
  identifier: string,
  password: string
): Promise<LoginResult> {
  const serverUrl = getLoginServerUrl();
  const normalizedId = normalizeIdentifier(identifier);

  // ── APK without configured server ─────────────────────────────────────
  if (!serverUrl) {
    const isNative = isCapacitorNative();
    const errorMsg = isNative
      ? 'No LAN server configured. Open Settings → LAN Server Config and enter the server IP address.'
      : 'No server URL configured.';

    console.error('[mobileAuth] Login blocked — no server URL:', errorMsg);

    return {
      success: false,
      error: errorMsg,
      code: 'NETWORK_ERROR',
      attemptedUrl: null,
    };
  }

  console.log(`[mobileAuth] Logging in "${normalizedId}" → ${serverUrl}/api/login`);
  
    // ── Build the request body — send all possible identifier fields
    //    so the server's flexible lookup (email / staff_id / tsc_number)
    //    handles whichever field the user entered without needing client-side
    //    field-type detection.
    const requestBody = {
      email: normalizedId,
      password: String(password || '').trim(),
      staff_id: normalizedId,
      identifier: normalizedId,
      tscNumber: normalizedId,
      username: normalizedId,
    };
  
    let response: Response;
    try {
      const controller = new AbortController();
      // 3-second timeout for LAN server login
      const timeoutId = setTimeout(() => controller.abort(), 3000);
  
      response = await fetch(`${serverUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Client-Platform': isCapacitorNative() ? 'android' : 'web',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (err: any) {
    // ── Network-level failure ────────────────────────────────────────────────
    const isNative = isCapacitorNative();
    let displayMessage: string;

    if (err?.name === 'AbortError') {
      displayMessage = `Connection timed out after 15 seconds. Is the server running at ${serverUrl}?`;
    } else if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
      displayMessage = isNative
        ? `Cannot reach server at ${serverUrl}. Check that the LAN Server Config is correct and the server is running.`
        : `Cannot reach server at ${serverUrl}. Check your network connection.`;
    } else {
      displayMessage = `Network error: ${err?.message || 'Unknown error'}`;
    }

    console.error(`[mobileAuth] Network error reaching ${serverUrl}:`, err);

    return {
      success: false,
      error: displayMessage,
      code: 'NETWORK_ERROR',
      attemptedUrl: serverUrl,
    };
  }

  // ── Parse response body (regardless of HTTP status) ─────────────────────
  let errorMessage = '';
  let errorCode: LoginFailure['code'] = 'UNKNOWN';

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const body = await response.json();
      errorMessage = String(body?.error || body?.message || 'Unknown server error');
      if (!response.ok) {
        if (response.status === 401)       errorCode = 'INVALID_CREDENTIALS';
        else if (response.status === 403) errorCode = 'ROLE_NOT_ALLOWED';
        else if (response.status >= 500) errorCode = 'SERVER_ERROR';
      }
    } catch {
      errorMessage = `Server returned ${response.status} (non-JSON body)`;
    }
  } else {
    errorMessage = `Server returned ${response.status} ${response.statusText}`;
    errorCode = response.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN';
  }

  // ── Success path ─────────────────────────────────────────────────────────
  if (response.ok) {
    let data: any;
    try {
      data = await response.json();
    } catch {
      console.error('[mobileAuth] Server returned OK but non-JSON body');
      return {
        success: false,
        error: 'Server returned an invalid response. Please try again.',
        code: 'SERVER_ERROR',
        attemptedUrl: serverUrl,
      };
    }

    if (!data.token || !data.user) {
      console.error('[mobileAuth] Incomplete response — missing token or user:', data);
      return {
        success: false,
        error: 'Server returned an incomplete authentication response.',
        code: 'SERVER_ERROR',
        attemptedUrl: serverUrl,
      };
    }

    console.log(`[mobileAuth] Login successful:`, data.user);

    // Persist the JWT so api.ts interceptors inject it on subsequent calls
    try {
      localStorage.setItem('munyaka_auth_token', data.token);
    } catch { /* ignore private mode */ }

    return {
      success: true,
      token: data.token,
      user: {
        id: data.user.id,
        name: data.user.name || data.user.full_name || normalizedId,
        email: data.user.email || '',
        phone: data.user.phone || '',
        role: data.user.role || 'teacher',
        staff_id: data.user.staff_id || data.user.staffId || '',
        tsc_number: data.user.tsc_number || data.user.tscNumber || '',
        tscNumber: data.user.tsc_number || data.user.tscNumber || '',
        status: data.user.status,
      },
    };
  }

  // ── HTTP error paths ───────────────────────────────────────────────────────
  console.error(`[mobileAuth] Login failed (${response.status}):`, errorMessage);

  const displayError = (() => {
    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        return 'Invalid TSC Number, Staff ID, or Password. Please check your credentials and try again.';
      case 'ROLE_NOT_ALLOWED':
        return 'Your account type does not have permission to sign in on this device.';
      case 'SERVER_ERROR':
        return `Server error (${response.status}). Please try again in a moment.`;
      default:
        return errorMessage || 'Login failed. Please try again.';
    }
  })();

  return {
    success: false,
    error: displayError,
    code: errorCode,
    attemptedUrl: serverUrl,
  };
}

// ─── Convenience: check if the LAN server is reachable ─────────────────────

/**
 * Ping the server's health endpoint to verify it is reachable.
 * Returns { reachable, latencyMs, serverVersion } on success or
 * { reachable: false, error } on failure.
 *
 * Does NOT block login — only used to show connectivity status on the
 * login screen before the user attempts to authenticate.
 */
export async function checkServerHealth(): Promise<{
  reachable: boolean;
  latencyMs?: number;
  serverVersion?: string;
  error?: string;
}> {
  // Disable automatic port 5000 / localhost health checks unless explicitly enabled via environment variable
  const enableHealthCheck = typeof window !== 'undefined' &&
    (window.localStorage.getItem('ENABLE_LOCAL_HEALTH_CHECK') === 'true' ||
     (import.meta as any).env?.VITE_ENABLE_HEALTH_CHECK === 'true');

  if (!enableHealthCheck) {
    return {
      reachable: false,
      error: 'Health check disabled (offline / client-only mode)',
    };
  }

  const serverUrl = getLoginServerUrl();

  // If no URL is configured (APK case), report unreachable with guidance
  if (!serverUrl) {
    return {
      reachable: false,
      error: isCapacitorNative()
        ? 'No LAN server configured. Open Settings → LAN Server Config.'
        : 'No server URL configured.',
    };
  }

  const start = performance.now();

  // Wrap everything in try-catch so offline / network failures resolve
  // gracefully without propagating uncaught promise rejections.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const latencyMs = Math.round(performance.now() - start);
      let data: any;
      try { data = await res.json(); } catch { /* ignore */ }
      console.log(`[mobileAuth] Health check OK — ${serverUrl} (${latencyMs}ms)`);
      return {
        reachable: true,
        latencyMs,
        serverVersion: data?.version || data?.engine || undefined,
      };
    }
    return { reachable: false, error: `Server responded with HTTP ${res.status}` };
  } catch (err: any) {
    const reason = err?.name === 'AbortError'
      ? 'Connection timed out (5s)'
      : (err?.message || 'Unreachable');
    console.warn(`[mobileAuth] Health check failed — ${serverUrl}: ${reason}`);
    return { reachable: false, error: reason };
  }
}

