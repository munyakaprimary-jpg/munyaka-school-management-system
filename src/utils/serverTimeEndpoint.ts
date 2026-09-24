/**
 * Central Server Time API Handler / Simulated Endpoint
 * Returns the authoritative trusted server timestamp and date.
 */
export function handleServerTimeRequest(req?: any, res?: any): void {
  const serverTimestamp = Date.now();
  const serverIsoDate = new Date(serverTimestamp).toISOString();
  
  const payload = {
    timestamp: serverTimestamp,
    iso: serverIsoDate,
    timezone: 'Africa/Nairobi',
    status: 'success'
  };

  if (res && typeof res.json === 'function') {
    res.json(payload);
    return;
  }

  // If called in browser environment or fetch polyfill interception
  return payload as any;
}
