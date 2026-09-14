/**
 * Central Data Export Service
 * ============================
 * Aggregates all persistent data stores across the Munyaka school management system
 * into a single unified snapshot for export as `initialSeedData.ts`.
 */

export const generateFullSnapshot = (): string => {
  const safeParse = (raw: string | null, fallback: any) => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const snapshot = {
    // Core Academics & Structure
    students: safeParse(
      localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_learners_db') || localStorage.getItem('school_learners_data'),
      []
    ),
    classes: safeParse(localStorage.getItem('munyaka_classes'), []),
    streams: safeParse(localStorage.getItem('munyaka_streams'), []),
    learningAreas: safeParse(localStorage.getItem('munyaka_learning_areas'), []),

    // Exams & Assessment Scores
    exams: safeParse(localStorage.getItem('munyaka_exams'), []),
    assessments: safeParse(localStorage.getItem('munyaka_assessments'), []),
    gradingScales: safeParse(localStorage.getItem('munyaka_grading_scales'), []),
    reportCards: safeParse(localStorage.getItem('munyaka_report_cards'), []),

    // Personnel & Staff Directory
    staff: safeParse(
      localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_directory') || localStorage.getItem('munyaka_master_staff_list'),
      []
    ),
    roles: safeParse(localStorage.getItem('munyaka_roles'), []),

    // Financial Ledger & Payments
    payments: safeParse(localStorage.getItem('munyaka_payments'), []),
    feeStructures: safeParse(localStorage.getItem('munyaka_fee_structures'), []),
    invoices: safeParse(localStorage.getItem('munyaka_invoices'), []),

    // Specialized Support & Laboratory Logs
    libraryBooks: safeParse(localStorage.getItem('munyaka_library_books'), []),
    libraryLogs: safeParse(localStorage.getItem('munyaka_library_borrowings'), []),
    scienceLabInventory: safeParse(localStorage.getItem('munyaka_science_lab'), []),
    ictLabEquipment: safeParse(localStorage.getItem('munyaka_ict_lab'), []),
    storeInventory: safeParse(localStorage.getItem('munyaka_store_items'), []),
    attendance: safeParse(localStorage.getItem('munyaka_attendance'), []),

    // System Configuration
    schoolSettings: safeParse(localStorage.getItem('munyaka_school_settings') || localStorage.getItem('munyaka_system_settings_v3'), {}),
  };

  return `export const initialSeedData = ${JSON.stringify(snapshot, null, 2)};\n\nexport const INITIAL_SEED_DATA = initialSeedData;\n`;
};

export const downloadSeedFile = () => {
  const content = generateFullSnapshot();
  const blob = new Blob([content], { type: 'text/typescript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'initialSeedData.ts';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
