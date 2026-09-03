/**
 * Lightweight fetch wrapper for the local Express API.
 * Centralizes base URL and error handling so we can surface the server's
 * exact failure reasons (e.g. SQLite constraint errors) in the UI.
 */

const API_BASE_URL =
  (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';

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
  const url = `${API_BASE_URL}${path}`;

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
      `Cannot reach server at ${API_BASE_URL}. ${err?.message || ''}`.trim(),
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

export { API_BASE_URL };
