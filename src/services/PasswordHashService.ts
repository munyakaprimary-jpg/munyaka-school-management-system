/**
 * Password Hashing Service
 *
 * Provides SHA-256 hashing for the admin password using the Web Crypto API.
 * This is a local-first SPA — passwords are stored in localStorage.
 * We hash them at rest so plain-text credentials are not trivially visible
 * to anyone who inspects the browser's developer tools.
 *
 * All hash operations are async (Web Crypto is promise-based).
 */

/**
 * Hash a plain-text password using SHA-256.
 * Returns a hex string of the digest.
 */
export async function hashPassword(plain: string): Promise<string> {
  const encoded = new TextEncoder().encode(plain.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a plain-text password against a stored hash.
 * Returns true if they match, false otherwise.
 */
export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  if (!plain || !storedHash) return false;
  const incoming = await hashPassword(plain);
  // Constant-time comparison to reduce timing-attack surface
  if (incoming.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < incoming.length; i++) {
    diff |= incoming.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}
