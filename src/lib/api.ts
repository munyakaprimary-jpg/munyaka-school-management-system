/**
 * Lightweight fetch wrapper for the local Express API.
 * Centralizes base URL and error handling so we can surface the server's
 * exact failure reasons (e.g. SQLite constraint errors) in the UI.
 *
 * The base URL is resolved dynamically via `getApiBaseUrl()`, which:
 *   1. honors `VITE_API_URL` (build time) or `lan_server_url` (runtime), or
 *   2. falls back to `http://<window.location.hostname>:5000` so the
 *      same bundle works on the dev machine, the LAN IP, or a deployed
 *      domain without code changes.
 */

import { getApiBaseUrl } from './apiBase';

const resolveBaseUrl = (): string => getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err: any) {
    // Network-level error (server unreachable, CORS, DNS, etc.)
    throw new ApiError(
      `Cannot reach server at ${baseUrl}. ${err?.message || ''}`.trim(),
      0,
      null
    );
  }

  let body: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json().catch(() => null);
  } else {
    body = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && (body.error || body.message)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(String(message), response.status, body);
  }

  return body as T;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T = unknown>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  put: <T = unknown>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  del: <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * Synchronous getter for the currently-resolved base URL. Re-evaluates on
 * each access so runtime configuration changes (e.g. the LAN server
 * settings page) are picked up without a page reload.
 */
export const API_BASE_URL: string = resolveBaseUrl();
