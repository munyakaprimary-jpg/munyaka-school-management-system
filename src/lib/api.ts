/**
 * Lightweight fetch wrapper for the local Express API.
 * Centralizes base URL and error handling so we can surface the server's
 * exact failure reasons (e.g. SQLite constraint errors) in the UI.
 *
 * The base URL is resolved dynamically via `getApiBaseUrl()`, which:
 *   1. honors `VITE_API_URL` (build time) or `lan_server_url`/`server_ip`
 *      (runtime), or
 *   2. falls back to `http://<window.location.hostname>:5000` so the
 *      same bundle works on the dev machine, the LAN IP, or a deployed
 *      domain without code changes.
 *
 * A request interceptor injects the JWT (when present) and stamps every
 * outgoing request with `X-LAN-Server` so the LAN Server Config page can
 * see which backend the requests are hitting.
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

/**
 * Request interceptor — runs before every request. Mutates the supplied
 * headers object and (optionally) the URL. Multiple interceptors can be
 * registered; they execute in FIFO order.
 */
export type RequestInterceptor = (ctx: {
  url: string;
  method: string;
  headers: Record<string, string>;
  /** Mutate this to abort the request with a custom error */
  abort?: (err: Error) => void;
}) => void | Promise<void>;

const interceptors: RequestInterceptor[] = [];

/** Register a request interceptor. Returns an unsubscribe function. */
export const addRequestInterceptor = (i: RequestInterceptor): (() => void) => {
  interceptors.push(i);
  return () => {
    const idx = interceptors.indexOf(i);
    if (idx !== -1) interceptors.splice(idx, 1);
  };
};

/**
 * Built-in interceptor #1: stamp every outgoing request with the current
 * LAN server URL so it shows up in browser dev-tools network tabs and on
 * the server's access logs.
 */
addRequestInterceptor(({ url, headers }) => {
  try {
    const u = new URL(url);
    headers['X-LAN-Server'] = `${u.host}`;
  } catch { /* ignore */ }
});

/**
 * Built-in interceptor #2: inject the auth JWT when one is in localStorage.
 * Server's `verifyToken` middleware accepts requests with or without a
 * token, so missing tokens don't block unauthenticated endpoints.
 */
addRequestInterceptor(async ({ headers }) => {
  try {
    const token = localStorage.getItem('munyaka_auth_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch { /* private mode */ }
});

async function runInterceptors(ctx: {
  url: string;
  method: string;
  headers: Record<string, string>;
  abort?: (err: Error) => void;
}): Promise<void> {
  for (const i of interceptors) {
    await i(ctx);
    if (ctx.abort) {
      throw ctx.abort(new Error('Aborted by request interceptor'));
    }
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}${path}`;
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  let abort: ((err: Error) => void) | undefined;
  const interceptorCtx = {
    url,
    method,
    headers,
    get abort() { return abort; },
    set abort(fn: ((err: Error) => void) | undefined) { abort = fn; },
  };
  await runInterceptors(interceptorCtx);

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
 * every access so runtime configuration changes (e.g. the LAN server
 * settings page) are picked up without a page reload.
 */
export const API_BASE_URL: string = resolveBaseUrl();

/**
 * Re-export the base URL getter for callers that need to display or log it.
 */
export const getApiBase = (): string => resolveBaseUrl();
