/**
 * MUNYAKA PRIMARY AND JUNIOR SCHOOL — Initial Seed Data
 * ======================================================
 * Cold-start defaults for the APK / offline-first app.
 *
 * On first launch (when localStorage is empty), `hydrateAllStores` in
 * `src/utils/storage.ts` reads from this export to populate every store.
 * All collections are empty by default — learners, staff, fees, and
 * transactions are created through the app's own registration and
 * data-entry flows.  Only structural/scaffolding data (grades, exam types,
 * system settings) is populated so the app is immediately usable.
 *
 * Version: "empty-v1"
 */
export const INITIAL_SEED_DATA = {
  version: "empty-v1",
  seedVersion: "empty-v1",
  exportDate: new Date().toISOString(),
  school: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",

  // ── Students / Learners ───────────────────────────────────────────────────────
  // Empty: learners are registered through the app's own onboarding flow.
  students: [],

  // ── Staff / Teachers ──────────────────────────────────────────────────────
  // Empty: staff are pre-registered through the Pre-Registration page.
  staff: [],

  // ── Staff Pre-Registration ────────────────────────────────────────────────
  // Empty: pre-registration is a UI-driven workflow.
  staffPrereg: [],

  // ── Fee Records ───────────────────────────────────────────────────────────
  // Empty: fees are recorded through the Fees page.
  fees: [],

  // ── Fee Structures (per grade) ──────────────────────────────────────────
  // Seeded so the Fee Configuration page has a starting structure.
  feeStructures: [
    { id: "fs-1",  gradeId: "gpp1", gradeName: "PP1",       year: "2026", term: "term1", amount: 8000  },
    { id: "fs-2",  gradeId: "gpp2", gradeName: "PP2",       year: "2026", term: "term1", amount: 8000  },
    { id: "fs-3",  gradeId: "g1",   gradeName: "Grade 1",   year: "2026", term: "term1", amount: 12000 },
    { id: "fs-4",  gradeId: "g2",   gradeName: "Grade 2",   year: "2026", term: "term1", amount: 12000 },
    { id: "fs-5",  gradeId: "g3",   gradeName: "Grade 3",   year: "2026", term: "term1", amount: 12000 },
    { id: "fs-6",  gradeId: "g4",   gradeName: "Grade 4",   year: "2026", term: "term1", amount: 15000 },
    { id: "fs-7",  gradeId: "g5",   gradeName: "Grade 5",   year: "2026", term: "term1", amount: 15000 },
    { id: "fs-8",  gradeId: "g6",   gradeName: "Grade 6",   year: "2026", term: "term1", amount: 15000 },
    { id: "fs-9",  gradeId: "g7",   gradeName: "Grade 7",   year: "2026", term: "term1", amount: 18000 },
    { id: "fs-10", gradeId: "g8",   gradeName: "Grade 8",   year: "2026", term: "term1", amount: 18000 },
    { id: "fs-11", gradeId: "g9",   gradeName: "Grade 9",   year: "2026", term: "term1", amount: 20000 },
  ],

  // ── Transactions ──────────────────────────────────────────────────────────
  // Empty: transactions are recorded through the Fees page.
  transactions: [],

  // ── Attendance Records ────────────────────────────────────────────────────
  // Empty: attendance is taken through the Attendance page.
  attendance: {},

  // ── Grades / Classes ──────────────────────────────────────────────────────
  // Seeded with grade + stream structure so the app has a starting
  // grade-roster configuration.  All student counts are zero.
  grades: [
    { id: "gpp1", name: "PP1",  category: "Pre-Primary",    streams: [
      { id: "spp1a", name: "Yellow", teacher: "Unassigned", studentsCount: 0 },
      { id: "spp1b", name: "Green",  teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "gpp2", name: "PP2",  category: "Pre-Primary",    streams: [
      { id: "spp2a", name: "Yellow", teacher: "Unassigned", studentsCount: 0 },
      { id: "spp2b", name: "Green",  teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "g1",   name: "Grade 1", category: "Primary", streams: [
      { id: "s1", name: "Blue",  teacher: "Unassigned", studentsCount: 0 },
      { id: "s2", name: "Green", teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "g2",   name: "Grade 2", category: "Primary", streams: [
      { id: "s2a", name: "Blue",  teacher: "Unassigned", studentsCount: 0 },
      { id: "s2b", name: "Green", teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "g3",   name: "Grade 3", category: "Primary", streams: [
      { id: "s3a", name: "Blue",  teacher: "Unassigned", studentsCount: 0 },
      { id: "s3b", name: "Green", teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "g4",   name: "Grade 4", category: "Primary", streams: [
      { id: "s3", name: "Blue",  teacher: "Unassigned", studentsCount: 0 },
      { id: "s4", name: "Green", teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "g5",   name: "Grade 5", category: "Primary", streams: [
      { id: "s5", name: "Alpha", teacher: "Unassigned", studentsCount: 0 },
      { id: "s6", name: "Beta",  teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "g6",   name: "Grade 6", category: "Primary", streams: [
      { id: "s6a", name: "Yellow", teacher: "Unassigned", studentsCount: 0 },
      { id: "s6b", name: "Green",  teacher: "Unassigned", studentsCount: 0 },
      { id: "s6c", name: "South",  teacher: "Unassigned", studentsCount: 0 },
      { id: "s6d", name: "East",   teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "g7",   name: "Grade 7", category: "Junior School", streams: [
      { id: "s7a", name: "MERCURY", teacher: "Unassigned", studentsCount: 0 },
      { id: "s7b", name: "VENUS",   teacher: "Unassigned", studentsCount: 0 },
      { id: "s7c", name: "JUPITER", teacher: "Unassigned", studentsCount: 0 },
      { id: "s7d", name: "NEPTUNE", teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "g8",   name: "Grade 8", category: "Junior School", streams: [
      { id: "s9",  name: "Alpha", teacher: "Unassigned", studentsCount: 0 },
      { id: "s10", name: "Beta",  teacher: "Unassigned", studentsCount: 0 },
    ]},
    { id: "g9",   name: "Grade 9", category: "Junior School", streams: [
      { id: "s11", name: "Alpha", teacher: "Unassigned", studentsCount: 0 },
      { id: "s12", name: "Beta",  teacher: "Unassigned", studentsCount: 0 },
    ]},
  ],

  // ── Exam Types ────────────────────────────────────────────────────────────
  // Seeded so the Exam Creator has CBC exam type options.
  examTypes: [
    { id: "et-1", name: "Formative Assessment",  code: "FORMATIVE",  weight: 40, category: "Formative",  description: "Continuous assessment tests and classroom activities" },
    { id: "et-2", name: "Summative Assessment", code: "SUMMATIVE", weight: 60, category: "Summative",  description: "End of term comprehensive evaluation" },
    { id: "et-3", name: "Opener Exam",          code: "OPENER",    weight: 0,  category: "Other",      description: "Beginning of term diagnostic test" },
    { id: "et-4", name: "Mid-Term Exam",         code: "MIDTERM",   weight: 0,  category: "Other",      description: "Mid-term progress evaluation" },
  ],

  // ── Learning Areas ─────────────────────────────────────────────────────────
  // Seeded with cluster structure so the CBC Learning Areas page has defaults.
  learningAreas: [
    { id: "pre-primary",    name: "Pre-Primary",   description: "Early childhood development learning areas", learningAreas: [] },
    { id: "lower-primary",  name: "Lower Primary", description: "Foundational learning areas for Grades 1, 2, and 3", learningAreas: [] },
    { id: "upper-primary",  name: "Upper Primary", description: "Intermediate learning areas for Grades 4, 5, and 6", learningAreas: [] },
    { id: "junior-school",  name: "Junior School",  description: "Secondary preparation learning areas", learningAreas: [] },
  ],

  // ── Assessment Scores ──────────────────────────────────────────────────────
  // Empty: scores are entered through the Marks Entry page.
  assessmentScores: {},

  // ── Library Books ───────────────────────────────────────────────────────────
  // Empty: books are added through the Library page.
  libraryBooks: [],

  // ── ICT Assets ─────────────────────────────────────────────────────────────
  // Empty: assets are registered through the ICT Lab Management page.
  ictAssets: [],

  // ── Notices / Announcements ────────────────────────────────────────────────
  // Empty: notices are published through the Notice Board page.
  notices: [],

  // ── System Settings ────────────────────────────────────────────────────────
  // Seeded with sensible school defaults so the app boots with configuration.
  settings: {
    general: {
      schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
      motto: "KNOWLEDGE IS POWER",
      postalAddress: "P.O. BOX 5239-30100 ELDORET",
      phone: "+254 712 345 678",
      email: "info@munyaka.sc.ke",
      location: "Munyaka, Eldoret East, Uasin Gishu County",
      maintenanceMode: false,
    },
    academic: {
      activeYear: new Date().getFullYear().toString(),
      activeTerm: "term1",
      termStartDate: "",
      termEndDate: "",
      gradingScale: [
        { level: "EE", descriptor: "Exceeding Expectations", min: 80, max: 100, points: 4 },
        { level: "ME", descriptor: "Meeting Expectations",     min: 50, max: 79,  points: 3 },
        { level: "AE", descriptor: "Approaching Expectations",  min: 30, max: 49,  points: 2 },
        { level: "BE", descriptor: "Below Expectations",      min: 0,  max: 29,  points: 1 },
      ],
    },
    permissions: {
      owner: {
        sys_config: { read: true, create: true, edit: true, delete: true },
        academic_grading: { read: true, create: true, edit: true, delete: true },
        student_records: { read: true, create: true, edit: true, delete: true },
        finance_fees: { read: true, create: true, edit: true, delete: true },
        payment_subscriptions: { read: true, create: true, edit: true, delete: true },
        staff_mgmt: { read: true, create: true, edit: true, delete: true },
      },
      admin: {
        sys_config: { read: true, create: true, edit: true, delete: true },
        academic_grading: { read: true, create: true, edit: true, delete: true },
        student_records: { read: true, create: true, edit: true, delete: true },
        finance_fees: { read: true, create: true, edit: true, delete: true },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: true, create: true, edit: true, delete: true },
      },
      head_teacher: {
        sys_config: { read: true, create: true, edit: true, delete: false },
        academic_grading: { read: true, create: true, edit: true, delete: false },
        student_records: { read: true, create: true, edit: true, delete: false },
        finance_fees: { read: true, create: true, edit: true, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: true, create: true, edit: true, delete: false },
      },
      bursar: {
        sys_config: { read: false, create: false, edit: false, delete: false },
        academic_grading: { read: false, create: false, edit: false, delete: false },
        student_records: { read: false, create: false, edit: false, delete: false },
        finance_fees: { read: true, create: false, edit: false, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: false, create: false, edit: false, delete: false },
      },
      teacher: {
        sys_config: { read: false, create: false, edit: false, delete: false },
        academic_grading: { read: true, create: false, edit: false, delete: false },
        student_records: { read: true, create: false, edit: false, delete: false },
        finance_fees: { read: true, create: false, edit: false, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: false, create: false, edit: false, delete: false },
      },
      parent: {
        sys_config: { read: false, create: false, edit: false, delete: false },
        academic_grading: { read: false, create: false, edit: false, delete: false },
        student_records: { read: true, create: false, edit: false, delete: false },
        finance_fees: { read: false, create: false, edit: false, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: false, create: false, edit: false, delete: false },
      },
      student: {
        sys_config: { read: true, create: false, edit: false, delete: false },
        academic_grading: { read: true, create: false, edit: false, delete: false },
        student_records: { read: true, create: false, edit: false, delete: false },
        finance_fees: { read: true, create: false, edit: false, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: true, create: false, edit: false, delete: false },
      },
    },
    geofence: { lat: 0.5142, lng: 35.2698, radius: 500 },
    geofenceEnabled: true,
    devBypass: false,
    sessionSecurity: {
      idleTimeout: "30m",
      requirePasswordOnFirstLogin: true,
    },
    auditLogs: [],
  },

  // ── Portal Statistics Baseline ───────────────────────────────────────────────
  // Empty: stats are computed from real localStorage data at runtime.
  portalStats: {
    totalStudents: 0,
    totalTeachers: 0,
    juniorSchoolCount: 0,
    feesCollected: 0,
    todayAttendanceRate: 0,
    lastUpdated: new Date().toISOString(),
  },
};
