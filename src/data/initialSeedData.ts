/**
 * MUNYAKA PRIMARY AND JUNIOR SCHOOL — Initial Seed Data
 * ======================================================
 * Cold-start defaults for the APK / offline-first app.
 *
 * On first launch (when localStorage is empty), `hydrateAllStores` in
 * `src/utils/storage.ts` reads from this export to populate every store.
 *
 * Version: "sample-v1"
 */
export const INITIAL_SEED_DATA = {
  version: "sample-v1",
  seedVersion: "sample-v1",
  exportDate: new Date().toISOString(),
  school: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",

  // ── Students / Learners ───────────────────────────────────────────────────────
  // Sample learners pre-seeded so the APK is immediately usable for demos.
  //
  // NOTE: Legacy MUN-XXX placeholders have been cleared from both `admNo`
  //       and `assessmentNo`.  `assessmentNo` is intentionally "" so the
  //       Learners table renders "—" until a real KNEC/NEMIS number is
  //       entered.  The school-admission number (MUN-FAMILY-SEQ/YEAR)
  //       is assigned automatically by the one-time backfill in App.tsx.
  students: [
    { id: "stu-001", admNo: "", assessmentNo: "", name: "Aisha Wanjiku Mwangi",    grade: "Grade 4", stream: "Blue",  gender: "Female", guardian: "James Mwangi",    phone: "+254711001001", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-002", admNo: "", assessmentNo: "", name: "Brian Kipkorir Cheruiyot", grade: "Grade 5", stream: "Alpha", gender: "Male",   guardian: "David Cheruiyot", phone: "+254711002002", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-003", admNo: "", assessmentNo: "", name: "Cynthia Nafula Ochieng",   grade: "Grade 6", stream: "Yellow", gender: "Female", guardian: "Peter Ochieng",   phone: "+254711003003", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-004", admNo: "", assessmentNo: "", name: "Daniel Kipng'eno Ruto",   grade: "Grade 7", stream: "MERCURY", gender: "Male", guardian: "Samuel Ruto",    phone: "+254711004004", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-005", admNo: "", assessmentNo: "", name: "Evelyn Adhiambo Otieno",   grade: "Grade 3", stream: "Green",  gender: "Female", guardian: "Joseph Otieno",  phone: "+254711005005", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-006", admNo: "", assessmentNo: "", name: "Faith Wanjiru Kamau",      grade: "Grade 8", stream: "Alpha",  gender: "Female", guardian: "George Kamau",   phone: "+254711006006", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-007", admNo: "", assessmentNo: "", name: "George Kiptoo Letting",    grade: "Grade 4", stream: "Blue",   gender: "Male",   guardian: "Paul Letting",   phone: "+254711007007", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-008", admNo: "", assessmentNo: "", name: "Happiness Muthoni Karanja",grade: "Grade 9", stream: "Alpha",  gender: "Female", guardian: "Peter Karanja",  phone: "+254711008008", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-009", admNo: "", assessmentNo: "", name: "Ian Kibet Rotich",         grade: "Grade 5", stream: "Beta",   gender: "Male",   guardian: "Robert Rotich",  phone: "+254711009009", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-010", admNo: "", assessmentNo: "", name: "Joyce Chepkoech Kirui",    grade: "Grade 6", stream: "Green",  gender: "Female", guardian: "Sam Kirui",      phone: "+254711010010", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-011", admNo: "", assessmentNo: "", name: "Kevin Kipng'etich Yego",   grade: "Grade 7", stream: "VENUS",  gender: "Male",   guardian: "John Yego",     phone: "+254711011011", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-012", admNo: "", assessmentNo: "", name: "Laura Achieng Opiyo",     grade: "PP1",     stream: "Yellow", gender: "Female", guardian: "Francis Opiyo",  phone: "+254711012012", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-013", admNo: "", assessmentNo: "", name: "Moses Kiptanui Bett",     grade: "Grade 2", stream: "Green",  gender: "Male",   guardian: "Elijah Bett",   phone: "+254711013013", status: "Active", schoolId: "munyaka-sc" },
    { id: "stu-014", admNo: "", assessmentNo: "", name: "Nancy Wambui Njoroge",    grade: "Grade 1", stream: "Blue",   gender: "Female", guardian: "Simon Njoroge",  phone: "+254711014014", status: "Active", schoolId: "munyaka-sc" },
  ],

  // ── Staff / Teachers ──────────────────────────────────────────────────────
  // Sample staff pre-seeded for immediate APK usability.
  staff: [
    { id: "staff-001", name: "Grace Njeri", tscNo: "TSC-88421", idNo: "22345678", phone: "+254720001001", email: "grace.njeri@munyaka.sc.ke", role: "Head Teacher", grade: "—", stream: "—", gender: "Female", status: "Active", salary: 95000, joinedDate: "2018-01-15", emergencyContact: "+254711001001", emergencyName: "John Njeri", profileComplete: true, schoolId: "munyaka-sc" },
    { id: "staff-002", name: "John Kamau",  tscNo: "TSC-77102", idNo: "11223344", phone: "+254720002002", email: "john.kamau@munyaka.sc.ke",  role: "Teacher", grade: "Grade 7", stream: "MERCURY", gender: "Male", status: "Active", salary: 75000, joinedDate: "2020-03-01", emergencyContact: "+254722002002", emergencyName: "Mary Kamau", profileComplete: true, schoolId: "munyaka-sc" },
    { id: "staff-003", name: "Sarah Achieng", tscNo: "TSC-66211", idNo: "33445566", phone: "+254720003003", email: "sarah.achieng@munyaka.sc.ke", role: "Teacher", grade: "Grade 4", stream: "Blue", gender: "Female", status: "Active", salary: 72000, joinedDate: "2021-06-10", emergencyContact: "+254722003003", emergencyName: "Peter Achieng", profileComplete: true, schoolId: "munyaka-sc" },
    { id: "staff-004", name: "Peter Omondi", tscNo: "TSC-55330", idNo: "44556677", phone: "+254720004004", email: "peter.omondi@munyaka.sc.ke", role: "Teacher", grade: "Grade 8", stream: "Alpha", gender: "Male", status: "Active", salary: 73000, joinedDate: "2019-09-01", emergencyContact: "+254722004004", emergencyName: "Jane Omondi", profileComplete: true, schoolId: "munyaka-sc" },
    { id: "staff-005", name: "Mary Wanjiku", tscNo: "TSC-44019", idNo: "55667788", phone: "+254720005005", email: "mary.wanjiku@munyaka.sc.ke", role: "Teacher", grade: "Grade 5", stream: "Alpha", gender: "Female", status: "Active", salary: 71000, joinedDate: "2022-01-20", emergencyContact: "+254722005005", emergencyName: "Joseph Wanjiku", profileComplete: true, schoolId: "munyaka-sc" },
    { id: "staff-006", name: "David Kiprotich", tscNo: "TSC-33128", idNo: "66778899", phone: "+254720006006", email: "david.kiprotich@munyaka.sc.ke", role: "Bursar", grade: "—", stream: "—", gender: "Male", status: "Active", salary: 80000, joinedDate: "2017-04-05", emergencyContact: "+254722006006", emergencyName: "Grace Kiprotich", profileComplete: true, schoolId: "munyaka-sc" },
  ],

  // ── Staff Pre-Registration ────────────────────────────────────────────────
  // Sample pre-registrations awaiting approval.
  staffPrereg: [
    { id: "prereg-001", name: "Faith Chebet", phone: "+254720101101", idNo: "77889900", role: "Teacher", status: "pending", requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), schoolId: "munyaka-sc" },
    { id: "prereg-002", name: "Kevin Kipkemoi", phone: "+254720202202", idNo: "88990011", role: "Lab Technician", status: "pending", requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), schoolId: "munyaka-sc" },
  ],

  // ── Fee Records ───────────────────────────────────────────────────────────
  // All learners start at KES 0 balance. Fee records are accumulated only
  // through the Fees page's payment recording flow — never pre-seeded.
  // NOTE: the `fees` object maps studentId → fee ledger row. Each entry
  // represents a configured fee structure for the student's grade, not
  // historical payment data. Historical payments live in `transactions`.
  fees: {},

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
  // Sample fee payment transactions.
  transactions: [
    { id: "tx-001", studentId: "stu-001", studentName: "Aisha Wanjiku Mwangi",    amount: 15000, method: "M-PESA", ref: "MG7K8H2J", category: "Term 1 Fees", date: "2026-02-10", status: "Completed", type: "payment" },
    { id: "tx-002", studentId: "stu-002", studentName: "Brian Kipkorir Cheruiyot", amount: 10000, method: "M-PESA", ref: "NG3P9L4M", category: "Term 1 Fees", date: "2026-02-15", status: "Completed", type: "payment" },
    { id: "tx-003", studentId: "stu-004", studentName: "Daniel Kipng'eno Ruto",   amount: 18000, method: "Bank Transfer", ref: "BK20260201", category: "Term 1 Fees", date: "2026-01-30", status: "Completed", type: "payment" },
    { id: "tx-004", studentId: "stu-005", studentName: "Evelyn Adhiambo Otieno",  amount: 12000, method: "M-PESA", ref: "PG1R6W8N", category: "Term 1 Fees", date: "2026-02-05", status: "Completed", type: "payment" },
    { id: "tx-005", studentId: "stu-007", studentName: "George Kiptoo Letting",   amount: 15000, method: "Cash", ref: "CSH001", category: "Term 1 Fees", date: "2026-02-01", status: "Completed", type: "payment" },
    { id: "tx-006", studentId: "stu-010", studentName: "Joyce Chepkoech Kirui",  amount: 15000, method: "M-PESA", ref: "RG9T2V5X", category: "Term 1 Fees", date: "2026-01-28", status: "Completed", type: "payment" },
    { id: "tx-007", studentId: "stu-011", studentName: "Kevin Kipng'etich Yego", amount: 18000, method: "Bank Transfer", ref: "BK20260208", category: "Term 1 Fees", date: "2026-02-08", status: "Completed", type: "payment" },
    { id: "tx-008", studentId: "stu-012", studentName: "Laura Achieng Opiyo",    amount: 8000,  method: "M-PESA", ref: "TG4Q7Y1Z", category: "Term 1 Fees", date: "2026-02-20", status: "Completed", type: "payment" },
    { id: "tx-009", studentId: "stu-014", studentName: "Nancy Wambui Njoroge",   amount: 12000, method: "M-PESA", ref: "UG2M5A3B", category: "Term 1 Fees", date: "2026-02-19", status: "Completed", type: "payment" },
    { id: "tx-010", studentId: "stu-006", studentName: "Faith Wanjiru Kamau",    amount: 9000,  method: "M-PESA", ref: "VH8N6C7D", category: "Term 1 Fees", date: "2026-02-12", status: "Completed", type: "payment" },
    { id: "tx-011", studentId: "stu-009", studentName: "Ian Kibet Rotich",       amount: 7500,  method: "M-PESA", ref: "WJ5P9E2F", category: "Term 1 Fees", date: "2026-02-18", status: "Completed", type: "payment" },
    { id: "tx-012", studentId: "stu-013", studentName: "Moses Kiptanui Bett",   amount: 4000,  method: "Cash", ref: "CSH002", category: "Term 1 Fees", date: "2026-02-22", status: "Completed", type: "payment" },
  ],

  // ── Attendance Records ────────────────────────────────────────────────────
  // Sample attendance snapshot for today.
  attendance: (() => {
    const today = new Date().toISOString().slice(0, 10);
    const present: Record<string, string> = {};
    const seedIds = ["stu-001","stu-002","stu-004","stu-005","stu-007","stu-010","stu-011","stu-012","stu-014"];
    seedIds.forEach((id) => {
      present[id] = `${today}T08:05:00.000Z`;
    });
    return { [today]: { date: today, present, late: {}, absent: ["stu-003","stu-006","stu-008","stu-009","stu-013"] } };
  })(),

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
  // Sample library catalogue.
  libraryBooks: [
    { id: "bk-001", title: "Things Fall Apart",         author: "Chinua Achebe",        isbn: "978-0385474542", category: "Fiction",   copies: 6, available: 4, shelf: "A-12" },
    { id: "bk-002", title: "The River Between",        author: "Ngugi wa Thiong'o",    isbn: "978-0435901680", category: "Fiction",   copies: 4, available: 2, shelf: "A-13" },
    { id: "bk-003", title: "Primary Mathematics",      author: "MoE Kenya",            isbn: "978-9966001212", category: "Textbook",  copies: 80, available: 65, shelf: "B-04" },
    { id: "bk-004", title: "KLB English",              author: "KLB",                  isbn: "978-9966001401", category: "Textbook",  copies: 60, available: 48, shelf: "B-09" },
    { id: "bk-005", title: "Science & Technology",     author: "KLB",                  isbn: "978-9966001551", category: "Textbook",  copies: 50, available: 35, shelf: "C-02" },
    { id: "bk-006", title: "Kiswahili Mufti",          author: "KLB",                  isbn: "978-9966001771", category: "Textbook",  copies: 45, available: 38, shelf: "C-11" },
    { id: "bk-007", title: "Social Studies Atlas",     author: "Oxford",               isbn: "978-0198329882", category: "Reference", copies: 10, available: 8,  shelf: "D-01" },
    { id: "bk-008", title: "Creative Arts Book 4",     author: "Longhorn",             isbn: "978-9966003011", category: "Textbook",  copies: 40, available: 32, shelf: "C-15" },
  ],

  // ── ICT Assets ─────────────────────────────────────────────────────────────
  // Sample ICT inventory.
  ictAssets: [
    { id: "ict-001", name: "HP Desktop PC",    type: "Desktop",   serial: "HPDX-2024-001", status: "Working", location: "ICT Lab 1", assignedTo: "", purchaseDate: "2024-05-12", warrantyUntil: "2027-05-12" },
    { id: "ict-002", name: "HP Desktop PC",    type: "Desktop",   serial: "HPDX-2024-002", status: "Working", location: "ICT Lab 1", assignedTo: "", purchaseDate: "2024-05-12", warrantyUntil: "2027-05-12" },
    { id: "ict-003", name: "Lenovo Laptop",    type: "Laptop",    serial: "LNV-2023-014",  status: "Working", location: "Staff Room",  assignedTo: "Grace Njeri", purchaseDate: "2023-09-04", warrantyUntil: "2026-09-04" },
    { id: "ict-004", name: "Epson Projector",  type: "Projector", serial: "EPN-2024-003",  status: "Working", location: "Library",     assignedTo: "",         purchaseDate: "2024-01-22", warrantyUntil: "2027-01-22" },
    { id: "ict-005", name: "Cisco Router",     type: "Network",   serial: "CSC-2024-007",  status: "Working", location: "Server Room", assignedTo: "",         purchaseDate: "2024-02-10", warrantyUntil: "2029-02-10" },
    { id: "ict-006", name: "iPad Tablet",      type: "Tablet",    serial: "IPD-2024-022",  status: "Repair",  location: "ICT Lab 2",  assignedTo: "",         purchaseDate: "2024-04-18", warrantyUntil: "2026-04-18" },
  ],

  // ── Notices / Announcements ────────────────────────────────────────────────
  notices: [
    { id: "nt-001", title: "Term 1 Opening Day",     body: "Welcome back! Term 1 officially begins on Monday. All learners are expected to report in full school uniform.",          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), priority: "high",   audience: "All" },
    { id: "nt-002", title: "Parent-Teacher Meeting", body: "Half-term parent-teacher meeting is scheduled for Saturday from 9:00 AM. Please plan to attend.",                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),  priority: "medium", audience: "Parents" },
    { id: "nt-003", title: "Sports Day",             body: "Inter-house athletics competition will be held on the last Friday of the month. All learners are encouraged to participate.", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),  priority: "low",    audience: "All" },
  ],

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
  // Stats reflect the seeded sample dataset.
  portalStats: {
    totalStudents: 14,
    totalTeachers: 5,
    juniorSchoolCount: 4,
    feesCollected: 161500,
    todayAttendanceRate: 64,
    lastUpdated: new Date().toISOString(),
  },
};
