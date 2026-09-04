/**
 * Mobile / LAN Teacher Authentication Service
 *
 * Handles teacher credential verification against the LAN backend server.
 * Designed for APK deployments where the app must authenticate against a
 * real LAN Express backend rather than the purely-local AuthContext.
 *
 * The service reads the server URL dynamically from localStorage so the
 * APK can be pointed at any LAN server without rebuilding.
 *
 * Usage:
 *   import { teacherLogin } from '@/services/mobileAuthService';
 *   const result = await teacherLogin('teacher1', 'mypassword');
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
}

export interface LoginSuccess {
  success: true;
  token: string;
  user: TeacherUser;
}

export interface LoginFailure {
  success: false;
  error: string;
  code: 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'ROLE_NOT_ALLOWED' | 'UNKNOWN';
}

export type LoginResult = LoginSuccess | LoginFailure;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalize the identifier before sending to the server.
 * Accepts: email, staff_id, staffId, tsc_number, or raw username.
 */
const normalizeIdentifier = (raw: string): string => raw.trim().toLowerCase();

/**
 * Attempt to parse a JSON error body, falling back to the raw status text.
 */
const parseErrorBody = async (res: Response): Promise<string> => {
  try {
    const body = await res.json();
    if (body && typeof body === 'object' && (body.error || body.message)) {
      return String(body.error || body.message);
    }
  } catch { /* ignore JSON parse failures */ }
  return `Server returned ${res.status} ${res.statusText}`;
};

// ─── Core login function ──────────────────────────────────────────────────────

/**
 * Authenticate a teacher using their TSC Number / Staff ID / Email
 * and password against the configured LAN backend server.
 *
 * @param identifier - staff ID (e.g. "teacher1"), TSC number (e.g. "TSC-12345"),
 *                     or email address (e.g. "jane@school.com")
 * @param password   - the teacher's password
 * @returns LoginResult with either { success: true, token, user } or
 *          { success: false, error, code }
 */
export async function teacherLogin(
  identifier: string,
  password: string
): Promise<LoginResult> {
  const serverUrl = getApiBaseUrl();
  const normalizedId = normalizeIdentifier(identifier);

  console.log(`[mobileAuth] Logging in teacher: "${normalizedId}" at ${serverUrl}`);

  let response: Response;
  try {
    response = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: normalizedId,
        password: password.trim(),
        // Also send staff_id for routes that check it
        staff_id: normalizedId,
      }),
    });
  } catch (err: any) {
    // Network-level failure: server unreachable, DNS failure, CORS blocked, etc.
    const message = err?.message || 'Connection refused';
    console.error(`[mobileAuth] Network error reaching ${serverUrl}:`, err);
    return {
      success: false,
      error: `Cannot reach server at ${serverUrl}. Check your network connection and server status. (${message})`,
      code: 'NETWORK_ERROR',
    };
  }

  // Parse the response body regardless of status, so we can surface server errors
  let errorMessage = '';
  let errorCode: LoginFailure['code'] = 'UNKNOWN';

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const body = await response.json();
      errorMessage = String(body?.error || body?.message || 'Unknown server error');
      if (!response.ok) {
        // Map server error types to client codes
        if (response.status === 401) {
          errorCode = 'INVALID_CREDENTIALS';
        } else if (response.status === 403) {
          errorCode = 'ROLE_NOT_ALLOWED';
        } else if (response.status >= 500) {
          errorCode = 'SERVER_ERROR';
        } else {
          errorCode = 'UNKNOWN';
        }
      }
    } catch {
      errorMessage = `Server returned ${response.status} ${response.statusText} (non-JSON response)`;
    }
  } else {
    errorMessage = `Server returned ${response.status} ${response.statusText}`;
    errorCode = response.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN';
  }

  // ── Success path ────────────────────────────────────────────────────────
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
      };
    }

    // Validate the expected shape before returning
    if (!data.token || !data.user) {
      console.error('[mobileAuth] Server response missing token or user:', data);
      return {
        success: false,
        error: 'Server returned an incomplete authentication response.',
        code: 'SERVER_ERROR',
      };
    }

    console.log(`[mobileAuth] Login successful for user:`, data.user);

    // Persist the JWT so the API client's interceptors can inject it
    try {
      localStorage.setItem('munyaka_auth_token', data.token);
    } catch { /* private mode */ }

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
      },
    };
  }

  // ── Error paths ─────────────────────────────────────────────────────────
  console.error(`[mobileAuth] Login failed (${response.status}):`, errorMessage);

  // Translate server messages to user-friendly display strings
  const displayError = (() => {
    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        return 'Invalid TSC Number / Staff ID or Password. Please check your credentials and try again.';
      case 'ROLE_NOT_ALLOWED':
        return 'Your account type does not have permission to log in on this device.';
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
  };
}

// ─── Convenience: check if the LAN server is reachable ─────────────────────

/**
 * Ping the server's health endpoint to verify it is reachable.
 * Useful on the login screen to show a "Server Offline" state
 * before the user even attempts to log in.
 */
export async function checkServerHealth(): Promise<{
  reachable: boolean;
  latencyMs?: number;
  serverVersion?: string;
  error?: string;
}> {
  const serverUrl = getApiBaseUrl();

  const start = performance.now();
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
      return {
        reachable: true,
        latencyMs,
        serverVersion: data?.version || data?.engine || undefined,
      };
    }
    return { reachable: false, error: `Server responded with ${res.status}` };
  } catch (err: any) {
    const reason = err?.name === 'AbortError' ? 'Connection timed out' : (err?.message || 'Unreachable');
    return { reachable: false, error: reason };
  }
}
