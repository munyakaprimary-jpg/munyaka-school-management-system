export const SCHOOL_HEADER_LINES = [
  "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
  "P.O BOX 5239-30100 ELDORET",
  "MOTTO: KNOWLEDGE IS POWER"
];

export function getSchoolHeaderCsv(): string {
  return SCHOOL_HEADER_LINES.map(line => `"${line}"`).join("\n") + "\n";
}

export function renderSchoolHeaderHtml(): string {
  return `
    <div style="text-align: center; margin-bottom: 20px; font-family: system-ui, -apple-system, sans-serif;">
      <h2 style="font-size: 16px; font-weight: 900; letter-spacing: 1px; margin: 0 0 4px 0; color: #0f172a;">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h2>
      <p style="font-size: 12px; font-weight: 700; margin: 0 0 2px 0; color: #475569;">P.O BOX 5239-30100 ELDORET</p>
      <p style="font-size: 11px; font-weight: 800; margin: 0; color: #0d9488; text-transform: uppercase;">MOTTO: KNOWLEDGE IS POWER</p>
    </div>
  `;
}
