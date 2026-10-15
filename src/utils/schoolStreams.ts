/**
 * Standardized school streams utility (`schoolStreams.ts`)
 * Centralized definition of standard Kenyan primary school streams (Green, Blue, Red, Yellow, Alpha, Beta)
 * replacing old compass placeholders.
 */

export const STANDARD_STREAMS = ['BLUE', 'RED', 'GREEN', 'YELLOW', 'Alpha', 'Beta'];
export const DEFAULT_STREAM = 'BLUE';

export function getActiveStreams(): string[] {
  try {
    for (const key of ['configured_streams', 'munyaka_configured_streams', 'munyaka_grades', 'grades_and_streams']) {
      const custom = localStorage.getItem(key);
      if (custom) {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If it's an array of objects (like grades config)
          if (typeof parsed[0] === 'object' && parsed[0] !== null) {
            const streamsSet = new Set<string>();
            parsed.forEach((item: any) => {
              const rawStreams = item.streams || item.classes || [];
              rawStreams.forEach((s: any) => {
                const sName = typeof s === 'string' ? s : (s?.name ?? s?.label);
                if (sName) streamsSet.add(String(sName).toUpperCase());
              });
            });
            if (streamsSet.size > 0) return Array.from(streamsSet);
          } else {
            // Array of strings
            return parsed.map((s: any) => String(s).toUpperCase());
          }
        }
      }
    }
  } catch {}
  return STANDARD_STREAMS;
}
