export const SCHOOL_HEADER_LINES = [
  "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
  "P.O BOX 5239-30100 ELDORET",
  "MOTTO: KNOWLEDGE IS POWER"
];

/**
 * Excel-safe cell formatting wrapper for numeric IDs, phone numbers, and assessment numbers
 * preventing Excel from collapsing long codes into scientific notation (e.g. 7.43E+08).
 * Example: "0712345678" -> '="0712345678"' or '\t0712345678'
 */
export function formatCsvValue(val: any, isNumericIdOrPhone: boolean = false): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).trim();
  if (str === '') return '""';
  
  if (isNumericIdOrPhone) {
    // Escape double quotes inside value
    const escaped = str.replace(/"/g, '""');
    // Excel formula text wrapper
    return `="\\"${escaped}\\""`;
  }
  
  // Standard string CSV quoting
  return `"${str.replace(/"/g, '""')}"`;
}

export function getSchoolHeaderCsv(reportTitle?: string, reportDate?: string): string {
  const lines = [
    ...SCHOOL_HEADER_LINES,
    reportTitle ? `"${reportTitle.replace(/"/g, '""')}"` : '""',
    reportDate ? `"${reportDate.replace(/"/g, '""')}"` : `"Generated: ${new Date().toLocaleString()}"`,
    ""
  ];
  return lines.join("\n") + "\n";
}

export function renderSchoolHeaderHtml(): string {
  return `
    <div class="munyaka-institutional-header" style="text-align: center; margin-bottom: 20px; font-family: system-ui, -apple-system, sans-serif;">
      <h2 class="school-name" style="font-size: 16px; font-weight: 900; letter-spacing: 1px; margin: 0 0 4px 0; color: #0f172a; text-transform: uppercase;">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h2>
      <p class="school-address" style="font-size: 12px; font-weight: 700; margin: 0 0 2px 0; color: #475569;">P.O BOX 5239-30100 ELDORET</p>
      <p class="school-motto" style="font-size: 11px; font-weight: 800; margin: 0; color: #0d9488; text-transform: uppercase;">MOTTO: KNOWLEDGE IS POWER</p>
    </div>
  `;
}
