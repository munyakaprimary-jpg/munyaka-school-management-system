/**
 * Standardized school streams utility (`schoolStreams.ts`)
 * Centralized definition of standard Kenyan primary school streams (Green, Blue, Red, Yellow, Alpha, Beta)
 * replacing old compass placeholders.
 */

export const STANDARD_STREAMS = ['Green', 'Blue', 'Red', 'Yellow', 'Alpha', 'Beta', 'Stream A', 'Stream B', 'Stream C'];
export const DEFAULT_STREAM = 'Green';

export function getActiveStreams(): string[] {
  try {
    const custom = localStorage.getItem('munyaka_configured_streams');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return STANDARD_STREAMS;
}
