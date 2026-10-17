/**
 * Standardized school streams utility (`schoolStreams.ts`)
 * Centralized definition of standard Kenyan primary school streams (Green, Blue, Red, Yellow, Alpha, Beta)
 * replacing old compass placeholders.
 */

export const STANDARD_STREAMS = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
export const DEFAULT_STREAM = 'RED';

export function getActiveStreams(): string[] {
  try {
    for (const key of ['configured_streams', 'munyaka_configured_streams', 'munyaka_grades', 'grades_and_streams']) {
      const custom = localStorage.getItem(key);
      if (custom) {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'object' && parsed[0] !== null) {
            const streamsSet = new Set<string>();
            parsed.forEach((item: any) => {
              const rawStreams = item.streams || item.classes || [];
              rawStreams.forEach((s: any) => {
                const sName = typeof s === 'string' ? s : (s?.name ?? s?.label);
                if (sName) {
                  const upper = String(sName).toUpperCase();
                  // Exclude directional placeholders (East, West, North, South, Alpha, Beta, Delta, Gamma)
                  if (!['EAST', 'WEST', 'NORTH', 'SOUTH', 'ALPHA', 'BETA', 'DELTA', 'GAMMA'].includes(upper)) {
                    streamsSet.add(upper);
                  }
                }
              });
            });
            if (streamsSet.size > 0) return Array.from(streamsSet);
          } else {
            return parsed
              .map((s: any) => String(s).toUpperCase())
              .filter((s: string) => !['EAST', 'WEST', 'NORTH', 'SOUTH', 'ALPHA', 'BETA', 'DELTA', 'GAMMA'].includes(s));
          }
        }
      }
    }
  } catch {}
  return STANDARD_STREAMS;
}
