/**
 * archiveExport.ts
 * ──────────────────
 * Export helpers for TransferredLearnersArchive.
 *
 * Exports respect the active UI filters:
 *   • The caller passes in the already-filtered list of records
 *   • The filename includes today's date
 *
 * Formats supported:
 *   • Excel (.xlsx)  — uses the `xlsx` library
 *   • CSV (.csv)     — uses the `xlsx` library (UTF-8 with BOM for Excel compatibility)
 *   • PDF Summary    — uses `jspdf` + `jspdf-autotable` with school branding
 */

import type { TransferredLearnerArchive } from '@/types/archive';

// ─── Column definitions ───────────────────────────────────────────────────

type ColumnKey = keyof TransferredLearnerArchive | 'serial';

interface ExportColumn {
  /** Displayed in the header row */
  header: string;
  /** Dot-notation path into the record object, or a getter function */
  accessor:
    | ColumnKey
    | ((record: TransferredLearnerArchive, index: number) => string);
}

const COLUMNS: ExportColumn[] = [
  { header: 'S/N', accessor: 'serial' },
  { header: 'Student Name', accessor: 'name' },
  { header: 'Admission No / NEMIS', accessor: 'admNo' },
  { header: 'Last Grade & Stream', accessor: 'grade' },
  { header: 'Transfer Reference #', accessor: 'certificateNumber' },
  { header: 'Destination School', accessor: 'destinationSchool' },
  { header: 'Transfer Date', accessor: 'transferDate' },
  { header: 'Headteacher Exit Remarks', accessor: 'headteacherRemarks' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const buildRows = (
  records: TransferredLearnerArchive[]
): string[][] =>
  records.map((r, i) =>
    COLUMNS.map((col) => {
      if (col.accessor === 'serial') {
        return String(i + 1);
      }
      if (typeof col.accessor === 'function') {
        return col.accessor(r, i);
      }
      const raw = r[col.accessor as keyof TransferredLearnerArchive];
      if (col.accessor === 'transferDate' || col.accessor === 'dateOfAdmission' || col.accessor === 'dob') {
        return formatDate(String(raw ?? ''));
      }
      if (col.accessor === 'grade') {
        return `Grade ${r.grade} · ${r.stream}`;
      }
      return String(raw ?? '—');
    })
  );

// ─── Excel (.xlsx) ─────────────────────────────────────────────────────────

export const exportToExcel = (records: TransferredLearnerArchive[]): void => {
  // Dynamic import keeps the initial bundle lean
  import('xlsx').then((XLSX) => {
    const sheetData = [
      COLUMNS.map((c) => c.header),
      ...buildRows(records),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Column widths — first col (S/N) narrow, rest comfortable
    worksheet['!cols'] = [
      { wch: 6 },   // S/N
      { wch: 28 },  // Student Name
      { wch: 20 },  // Adm. No / NEMIS
      { wch: 22 },  // Last Grade & Stream
      { wch: 24 },  // Transfer Ref #
      { wch: 30 },  // Destination School
      { wch: 16 },  // Transfer Date
      { wch: 40 },  // Headteacher Remarks
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transferred Learners');

    const filename = `Transferred_Learners_Archive_${todayISO()}.xlsx`;
    XLSX.writeFile(workbook, filename);
  });
};

// ─── CSV (.csv) ────────────────────────────────────────────────────────────

export const exportToCSV = (records: TransferredLearnerArchive[]): void => {
  import('xlsx').then((XLSX) => {
    const sheetData = [
      COLUMNS.map((c) => c.header),
      ...buildRows(records),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transferred Learners');

    // CSV output with UTF-8 BOM so Excel opens special chars correctly
    const csvString = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n' });
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Transferred_Learners_Archive_${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
};

// ─── PDF Summary Report ────────────────────────────────────────────────────

export const exportToPDF = (records: TransferredLearnerArchive[]): void => {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ── School header band ──────────────────────────────────────────────
      // Background strip
      doc.setFillColor(52, 45, 126); // deep indigo
      doc.rect(0, 0, pageWidth, 28, 'F');

      // School name
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('Munyaka Primary & Junior School', pageWidth / 2, 11, { align: 'center' });

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Transferred Learners Summary', pageWidth / 2, 18, { align: 'center' });

      // Date stamp
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageWidth - 10, 24, { align: 'right' });

      // ── Summary stats row ───────────────────────────────────────────────
      const totalLearners = records.length;
      const feeCleared = records.filter((r) => r.isFeeCleared).length;
      const withRemarks = records.filter((r) => r.headteacherRemarks?.trim()).length;

      doc.setFillColor(248, 250, 252);
      doc.rect(0, 28, pageWidth, 14, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(0, 28, pageWidth, 28);

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);

      const statX = 14;
      const statGap = 52;
      const statY = 28 + 9;

      doc.text(`Total Transferred: ${totalLearners}`, statX, statY);
      doc.text(`Fee Cleared: ${feeCleared}`, statX + statGap, statY);
      doc.text(`With Exit Remarks: ${withRemarks}`, statX + statGap * 2, statY);
      doc.text(`Active Filter Results: ${totalLearners} record${totalLearners === 1 ? '' : 's'}`, statX + statGap * 3, statY);

      // ── Table ───────────────────────────────────────────────────────────
      const tableRows: [string, string, string, string, string, string, string][] = records.map(
        (r, i) => [
          String(i + 1),
          r.name,
          r.admNo,
          `Grade ${r.grade} · ${r.stream}`,
          r.certificateNumber,
          r.destinationSchool,
          formatDate(r.transferDate),
        ]
      );

      autoTable(doc, {
        startY: 42,
        head: [['S/N', 'Student Name', 'Adm. No / NEMIS', 'Last Grade & Stream', 'Transfer Ref #', 'Destination School', 'Transfer Date']],
        body: tableRows,
        margin: { left: 10, right: 10 },
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 3,
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [99, 102, 241], // indigo-500
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 42 },
          2: { cellWidth: 26 },
          3: { cellWidth: 32 },
          4: { cellWidth: 38 },
          5: { cellWidth: 55 },
          6: { cellWidth: 24, halign: 'center' },
        },
        didParseCell: (data) => {
          // Truncate remarks preview if column ever added
        },
      });

      // ── Footer ──────────────────────────────────────────────────────────
      const finalY = (doc as any).lastAutoTable.finalY ?? 80;
      doc.setDrawColor(226, 232, 240);
      doc.line(10, finalY + 4, pageWidth - 10, finalY + 4);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Munyaka Primary & Junior School — Transferred Learners Archive | Confidential — For Administrative Use Only',
        pageWidth / 2,
        finalY + 8,
        { align: 'center' }
      );

      const filename = `Transferred_Learners_Summary_${todayISO()}.pdf`;
      doc.save(filename);
    });
  });
};
