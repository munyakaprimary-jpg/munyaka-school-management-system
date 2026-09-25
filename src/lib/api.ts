/**
 * Central API Client for Munyaka LAN School Management System
 * 
 * 1. Dynamically resolves API base URL using `admin_server_url` (and fallback keys).
 * 2. Prompts user or handles unconfigured server state.
 * 3. Intercepts network failure errors, shows "Working Offline - Changes saved locally" banner,
 *    and falls back to cached data in localStorage / IndexedDB.
 */

import { toast } from "@/components/ui/use-toast";

const STORAGE_KEYS = {
  ADMIN_SERVER_URL: "admin_server_url",
  LAN_SERVER_URL: "lan_server_url",
  SERVER_IP: "server_ip"
};

const DEFAULT_PORT = 5000;

export class ApiError extends Error {
  status: number;
  body: unknown;
  isOfflineFallback?: boolean;

  constructor(message: string, status: number, body: unknown, isOfflineFallback = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.isOfflineFallback = isOfflineFallback;
  }
}

/**
 * Get dynamic API Base URL with precedence:
 * 1. localStorage `admin_server_url`
 * 2. localStorage `lan_server_url` / `server_ip`
 * 3. Vite env `VITE_API_URL`
 * 4. Fallback: http://<window.location.hostname>:5000
 */
export const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return `http://localhost:${DEFAULT_PORT}`;
  }

  try {
    const adminUrl = localStorage.getItem(STORAGE_KEYS.ADMIN_SERVER_URL);
    if (adminUrl && adminUrl.trim()) {
      return normalizeUrl(adminUrl.trim());
    }

    const lanUrl = localStorage.getItem(STORAGE_KEYS.LAN_SERVER_URL) || localStorage.getItem(STORAGE_KEYS.SERVER_IP);
    if (lanUrl && lanUrl.trim()) {
      return normalizeUrl(lanUrl.trim());
    }
  } catch { /* private mode / SSR */ }

  const envUrl = (import.meta as any)?.env?.VITE_API_URL;
  if (envUrl && String(envUrl).trim()) {
    return normalizeUrl(String(envUrl).trim());
  }

  const hostname = window.location.hostname || 'localhost';
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return `http://localhost:${DEFAULT_PORT}`;
  }

  return `http://${hostname}:${DEFAULT_PORT}`;
};

const normalizeUrl = (url: string): string => {
  let cleaned = url.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `http://${cleaned}`;
  }
  if (!/(:\d+)$/.test(cleaned.replace(/\/+$/, ''))) {
    cleaned = `${cleaned.replace(/\/+$/, '')}:${DEFAULT_PORT}`;
  }
  return cleaned.replace(/\/+$/, '');
};

/**
 * Check if server address has been configured. If not, dispatches event or returns false.
 */
export const isServerConfigured = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const url = localStorage.getItem(STORAGE_KEYS.ADMIN_SERVER_URL) || localStorage.getItem(STORAGE_KEYS.LAN_SERVER_URL);
    return !!(url && url.trim().length > 0);
  } catch {
    return true;
  }
};

// Global offline banner trigger flag to prevent toast spamming
let lastOfflineToastTime = 0;
const showOfflineBanner = () => {
  const now = Date.now();
  if (now - lastOfflineToastTime > 10000) { // Max once every 10s
    lastOfflineToastTime = now;
    toast({
      title: "Working Offline",
      description: "Changes saved locally to device storage. Sync will resume when reconnected.",
      className: "bg-amber-50 border-amber-200 text-amber-900 font-medium",
    });
  }
};

/**
 * Creates an AbortSignal with a timeout.
 * Uses AbortSignal.timeout when available (modern browsers), otherwise falls back to AbortController.
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  // Fallback for older environments
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Core Request wrapper with offline fallback, response interceptors, and robust timeout handling.
 * All network requests are wrapped in try/catch to prevent state corruption on network failures.
 */
async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // Inject Auth Token if present
  try {
    const token = localStorage.getItem('munyaka_auth_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch { /* ignore */ }

  // Create a timeout signal (default 10s for POST/PUT, 6s for GET)
  const defaultTimeout = method === 'GET' ? 6000 : 10000;
  const timeoutSignal = createTimeoutSignal(defaultTimeout);

  // Combine with any user-provided signal
  let combinedSignal: AbortSignal;
  if (options.signal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal.addEventListener('abort', abort);
    timeoutSignal.addEventListener('abort', abort);
    combinedSignal = controller.signal;
  } else {
    combinedSignal = timeoutSignal;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, signal: combinedSignal });
  } catch (err: any) {
    // Network error / unreachable / offline fallback
    showOfflineBanner();

    // Attempt offline cache lookup from localStorage
    const cacheKey = `offline_cache_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    if (method === 'GET') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          return parsed as T;
        }
      } catch { /* ignore cache read failure */ }
    } else if (method === 'POST' || method === 'PUT') {
      // Queue offline mutation
      try {
        const queueKey = 'offline_mutation_queue';
        const existingQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
        existingQueue.push({
          path,
          method,
          body: options.body,
          timestamp: Date.now()
        });
        localStorage.setItem(queueKey, JSON.stringify(existingQueue));
      } catch { /* ignore */ }
    }

    throw new ApiError(
      `Working Offline - Server unreachable at ${baseUrl}. Using local cache.`,
      503,
      { offline: true },
      true
    );
  }

  let body: any = null;
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }
  } catch {
    body = null;
  }

  // Cache successful GET responses for offline fallback
  if (response.ok && method === 'GET') {
    try {
      const cacheKey = `offline_cache_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.setItem(cacheKey, JSON.stringify(body));
    } catch { /* quota exceeded or private mode */ }
  }

  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && (body.error || body.message)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(String(message), response.status, body);
  }

  return body as T;
}

/**
 * Health check endpoint with timeout - useful for checking server connectivity
 * before attempting critical operations.
 */
export async function checkServerHealth(timeoutMs = 5000): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export const api = {
  get: <T = unknown>(path: string, options?: RequestInit) => request<T>(path, { ...(options || {}), method: 'GET' }),
  post: <T = unknown>(path: string, data?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...(options || {}),
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  put: <T = unknown>(path: string, data?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...(options || {}),
      method: 'PUT',
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  del: <T = unknown>(path: string, options?: RequestInit) => request<T>(path, { ...(options || {}), method: 'DELETE' }),
};

export const API_BASE_URL: string = getApiBaseUrl();
export const getApiBase = (): string => getApiBaseUrl();
