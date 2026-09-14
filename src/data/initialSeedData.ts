/**
 * MUNYAKA PRIMARY AND JUNIOR SCHOOL — Initial Seed Data
 * ======================================================
 * Cold-start defaults for the APK / offline-first app.
 *
 * Consolidated Export Structure matching all required mock models.
 */

import type { LearnerMenuItem } from "@/types/learnerMenu";
import type { ClusterData } from "@/types/assessments";
import type { ChemicalItem, EquipmentItem, LabBooking, BreakageLog } from "@/types/scienceLab";

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
}

export interface MarkRecord {
  currentTerm: string;
  terms: Record<string, {
    examType: string;
    scores: Record<string, number>;
  }>;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  method: string;
  ref: string;
  category: string;
  studentId?: string;
  learnerName?: string;
  admNo?: string;
  grade?: string;
  stream?: string;
  invoiceId?: string;
  description?: string;
  currency?: string;
  status?: string;
  paymentMethod?: string;
  paymentDetails?: any;
  paidAt?: string;
}

export type StrandCategory =
  | "CRE & Values"
  | "Languages"
  | "Mathematics & STEM"
  | "Agriculture & Nutrition"
  | "Social Studies & Arts"
  | "KICD Revision Bank"
  | "Assessments & Quizzes"
  | "Indigenous Language Activities"
  | "Kiswahili Language / Kenya Sign Language Activities"
  | "English Language Activities"
  | "Mathematical Activities"
  | "Environmental Activities"
  | "Hygiene and Nutrition Activities"
  | "Religious Education Activities"
  | "Movement and Creative Activities"
  | "English"
  | "Kiswahili / Kenya Sign Language"
  | "Mathematics"
  | "Science and Technology"
  | "Agriculture and Nutrition"
  | "Social Studies"
  | "Religious Education"
  | "Creative Arts"
  | "Physical and Health Education"
  | "Pastoral Instruction Programme"
  | "Integrated Science"
  | "Health Education"
  | "Pre-Technical and Pre-Career Studies"
  | "Business Studies"
  | "Physical Education and Sports"
  | "Computer Science / Foreign Languages";

export interface MemoryVerse {
  reference: string;
  text: string;
}

export interface RevisionQuestion {
  question: string;
  answer: string;
  rubric?: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export type AssessmentType =
  | "Topical Quiz"
  | "CAT (Continuous Assessment Test)"
  | "Mid-Term Exam"
  | "End of Term Exam"
  | "Revision Paper"
  | "KNEC Sample Paper"
  | "Mock Exam"
  | "Opener Quiz"
  | "Other";

export interface ContentItem {
  id: string;
  grade: number | string;
  strand: StrandCategory;
  subject?: string;
  category?: StrandCategory | string;
  subStrand?: string;
  title?: string;
  topic?: string;
  summary: string;
  notes?: string[];
  fullNotes?: string[];
  keyTerms?: string[];
  practiceQuestions?: { question: string; options?: string[]; answer: string; rubric?: string }[];
  memoryVerses?: MemoryVerse[];
  revisionQuestions?: RevisionQuestion[];
  difficulty: "beginner" | "intermediate" | "advanced" | "Beginner" | "Intermediate" | "Advanced";
  tags?: string[];
  attachment?: Attachment;
  markingScheme?: Attachment;
  assessmentType?: AssessmentType;
  totalMarks?: number;
  durationMinutes?: number;
  readTimeMin?: number;
}

// ── Mock Data Collections ──────────────────────────────────────────────────

export const MOCK_LEARNERS: LearnerMenuItem[] = [
  {
    id: "l-001",
    admNo: "B002961576",
    fullName: "MUTWIKA KILONZO",
    grade: "Grade 7",
    stream: "VENUS",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "STEPHEN KILONZO KINGOO",
    phone: "0705221675",
  },
  {
    id: "l-002",
    admNo: "B004123291",
    fullName: "OCTEVIOR LUVISIA",
    grade: "Grade 6",
    stream: "Yellow",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "TITUS KIJUSA LUVISIA",
    phone: "0705138090",
  },
  {
    id: "l-003",
    admNo: "B004761829",
    fullName: "SAMWEL KAMAU WANJIKU",
    grade: "Grade 6",
    stream: "Yellow",
    status: "Active",
    attendanceStatus: "Late",
    avatarUrl: null,
    guardian: "MARY WANJIKU WAIRIMU",
    phone: "0719182804",
  },
  {
    id: "l-004",
    admNo: "A009702345",
    fullName: "EMILY CHEBET",
    grade: "Grade 5",
    stream: "Yellow",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "EDWARD LIMO",
    phone: "07892356787",
  },
  {
    id: "l-005",
    admNo: "B004779091",
    fullName: "PETER WAITITU",
    grade: "Grade 6",
    stream: "South",
    status: "Active",
    attendanceStatus: "Absent",
    avatarUrl: null,
    guardian: "JANE WANJIKU WAITITO",
    phone: "0114222031",
  },
  {
    id: "l-006",
    admNo: "B004276095",
    fullName: "ALFRED JUMA",
    grade: "Grade 6",
    stream: "East",
    status: "Active",
    attendanceStatus: "Unmarked",
    avatarUrl: null,
    guardian: "PHANICE NASIMIYU KIRISWA",
    phone: "0141893904",
  },
  {
    id: "l-007",
    admNo: "B005110023",
    fullName: "BRIAN KIPTOO",
    grade: "Grade 7",
    stream: "VENUS",
    status: "Suspended",
    attendanceStatus: "Unmarked",
    avatarUrl: null,
    guardian: "MARY KIPTOO",
    phone: "0722001122",
  },
  {
    id: "l-008",
    admNo: "B005233114",
    fullName: "MARY ATIENO",
    grade: "Grade 5",
    stream: "Blue",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "JOHN ATIENO",
    phone: "0711002233",
  },
  {
    id: "l-009",
    admNo: "B005477992",
    fullName: "EMMANUEL MAINA",
    grade: "Grade 5",
    stream: "Blue",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "ESTHER MAINA",
    phone: "0733445566",
  },
  {
    id: "l-010",
    admNo: "B005881023",
    fullName: "FAITH WAMBUI",
    grade: "Grade 4",
    stream: "Blue",
    status: "Active",
    attendanceStatus: "Late",
    avatarUrl: null,
    guardian: "PETER WAMBUI",
    phone: "0700112233",
  },
  {
    id: "l-011",
    admNo: "B006121445",
    fullName: "KEVIN ODHIAMBO",
    grade: "Grade 8",
    stream: "Alpha",
    status: "Active",
    attendanceStatus: "Present",
    avatarUrl: null,
    guardian: "LUCY ODHIAMBO",
    phone: "0799887766",
  },
  {
    id: "l-012",
    admNo: "B006552001",
    fullName: "GLADYS NYAMBURA",
    grade: "Grade 8",
    stream: "Alpha",
    status: "Graduated",
    attendanceStatus: "Unmarked",
    avatarUrl: null,
    guardian: "SAMUEL NYAMBURA",
    phone: "0722334455",
  },
];

export const mockStaffList = [
  { id: "staff-001", name: "Grace Njeri", tscNo: "TSC-88421", idNo: "22345678", phone: "+254720001001", email: "grace.njeri@munyaka.sc.ke", role: "Head Teacher", grade: "—", stream: "—", gender: "Female", status: "Active", salary: 95000, joinedDate: "2018-01-15", emergencyContact: "+254711001001", emergencyName: "John Njeri", profileComplete: true, schoolId: "munyaka-sc" },
  { id: "staff-002", name: "John Kamau",  tscNo: "TSC-77102", idNo: "11223344", phone: "+254720002002", email: "john.kamau@munyaka.sc.ke",  role: "Teacher", grade: "Grade 7", stream: "MERCURY", gender: "Male", status: "Active", salary: 75000, joinedDate: "2020-03-01", emergencyContact: "+254722002002", emergencyName: "Mary Kamau", profileComplete: true, schoolId: "munyaka-sc" },
];

export const mockAttendanceData = {
  byStudent: {
    '1787737452457': {
      present: 42,
      absent: 2,
      late: 1,
    },
  },
};

export const mockMarksData = {
  studentRecords: {
    '1787737452457': {
      currentTerm: 'Term 1',
      terms: {
        'Term 1': {
          examType: 'Formative Assessment',
          scores: {
            Mathematics: 88,
            English: 75,
            Kiswahili: 82,
            'Science & Technology': 92,
            'Social Studies': 78,
            'Agriculture & Nutrition': 84,
            'Creative Arts': 90,
            'Religious Education': 80,
          },
        },
      },
    },
  },
  classAverages: {
    Mathematics: { 'Term 1': 72, 'Term 2': 75, 'Term 3': 78 },
    English: { 'Term 1': 68, 'Term 2': 70, 'Term 3': 73 },
    Kiswahili: { 'Term 1': 70, 'Term 2': 72, 'Term 3': 75 },
    'Science & Technology': { 'Term 1': 74, 'Term 2': 76, 'Term 3': 79 },
    'Social Studies': { 'Term 1': 71, 'Term 2': 73, 'Term 3': 76 },
    'Agriculture & Nutrition': { 'Term 1': 75, 'Term 2': 77, 'Term 3': 80 },
    'Creative Arts': { 'Term 1': 78, 'Term 2': 80, 'Term 3': 82 },
    'Religious Education': { 'Term 1': 73, 'Term 2': 75, 'Term 3': 78 },
  },
};

export const mockTransactionsList: Transaction[] = [
  {
    id: 'TX-516',
    date: '8/26/2026',
    amount: 700,
    method: 'M-Pesa',
    ref: 'AUTO-GEN',
    category: 'Tuition',
    studentId: '1787737452457',
    grade: '',
  },
  {
    id: 'TX-901',
    date: '8/15/2026',
    amount: 5000,
    method: 'M-Pesa',
    ref: 'RI82JD91S',
    category: 'Tuition',
    studentId: '1787737452457',
    grade: '',
  },
  {
    id: 'TX-882',
    date: '7/28/2026',
    amount: 2000,
    method: 'Bank Deposit',
    ref: 'DEP-2938',
    category: 'Activity',
    studentId: '1787737452457',
    grade: '',
  },
  {
    id: 'TX-750',
    date: '7/15/2026',
    amount: 5000,
    method: 'M-Pesa',
    ref: 'QH12LK34P',
    category: 'Tuition',
    studentId: '1787737452457',
    grade: '',
  },
];

export const DEFAULT_CBC_CLUSTERS: ClusterData[] = [
  {
    id: 'pre-primary',
    name: 'Pre-Primary',
    description: 'Early childhood development learning areas (PP1 - PP2)',
    learningAreas: [
      { name: 'Mathematical Activities', type: 'Core' },
      { name: 'Language Activities', type: 'Core' },
      { name: 'Religious Education Activities (CRE/IRE/HRE)', type: 'Core' },
      { name: 'Environmental Activities', type: 'Core' },
      { name: 'Psychomotor and Creative Activities', type: 'Core' },
    ],
  },
  {
    id: 'lower-primary',
    name: 'Lower Primary',
    description: 'Foundational learning areas for Grades 1, 2, and 3',
    learningAreas: [
      { name: 'Mathematics', type: 'Core' },
      { name: 'English Language Activities', type: 'Core' },
      { name: 'Kiswahili Language Activities / Kenya Sign Language', type: 'Core' },
      { name: 'Religious Education Activities (CRE/IRE/HRE)', type: 'Core' },
      { name: 'Environmental Activities', type: 'Core' },
      { name: 'Creative Activities', type: 'Core' },
    ],
  },
  {
    id: 'upper-primary',
    name: 'Upper Primary',
    description: 'Intermediate learning areas for Grades 4, 5, and 6',
    learningAreas: [
      { name: 'Mathematics', type: 'Core' },
      { name: 'English', type: 'Core' },
      { name: 'Kiswahili', type: 'Core' },
      { name: 'Science and Technology', type: 'Core' },
      { name: 'Agriculture and Nutrition', type: 'Core' },
      { name: 'Social Studies', type: 'Core' },
      { name: 'Religious Education (CRE/IRE/HRE)', type: 'Core' },
      { name: 'Creative Arts', type: 'Core' },
    ],
  },
  {
    id: 'junior-school',
    name: 'Junior School',
    description: 'Secondary preparation learning areas for Grades 7, 8, and 9',
    learningAreas: [
      { name: 'English', type: 'Core' },
      { name: 'Kiswahili / Kenya Sign Language', type: 'Core' },
      { name: 'Mathematics', type: 'Core' },
      { name: 'Integrated Science', type: 'Core' },
      { name: 'Health Education', type: 'Core' },
      { name: 'Social Studies', type: 'Core' },
      { name: 'Religious Education (CRE/IRE/HRE)', type: 'Core' },
      { name: 'Pre-Technical Studies', type: 'Core' },
      { name: 'Agriculture and Nutrition', type: 'Core' },
      { name: 'Creative Arts and Sports', type: 'Core' },
    ],
  },
];

export const buildDefaultClusters = (): ClusterData[] => {
  return DEFAULT_CBC_CLUSTERS.map((cluster) => ({
    ...cluster,
    learningAreas: cluster.learningAreas.map((area, index) => ({
      id: `default-${cluster.id}-${index}-${Date.now().toString(36)}`,
      name: area.name,
      type: area.type,
    })),
  }));
};

export const cbcStudyContentData: ContentItem[] = [
  {
    id: "cre-1-bible-reader",
    grade: 1,
    strand: "CRE & Values",
    subStrand: "Bible Reader",
    topic: "Creation Story",
    summary: "God creates the world in six days and rests on the seventh.",
    notes: [
      "God created light and separated it from darkness on Day 1.",
      "God created the sky and waters on Day 2.",
      "God created land, plants, and trees on Day 3.",
      "God created the sun, moon, and stars on Day 4.",
      "God created sea creatures and birds on Day 5.",
      "God created animals and human beings on Day 6.",
      "God rested on the seventh day — this is why we rest on Sunday.",
    ],
    memoryVerses: [
      { reference: "Genesis 1:1", text: "In the beginning God created the heavens and the earth." },
    ],
    revisionQuestions: [
      { question: "How many days did God take to create the world?", answer: "Six days", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["creation", "genesis", "days", "rest"],
  },
];

export const scienceLabDataStructure = {
  chemicals: [
    {
      id: "CHM-001",
      name: "Hydrochloric Acid",
      formula: "HCl",
      quantity: 2.5,
      unit: "L",
      location: "Chemical Cabinet A1",
      expiryDate: "2026-12-31",
      hazardLevel: "High",
      minThreshold: 0.5,
    } as ChemicalItem,
  ],
  equipment: [
    {
      id: "EQP-001",
      name: "Bunsen Burner",
      category: "Heating",
      totalQty: 30,
      functionalQty: 28,
      damagedQty: 2,
      location: "Lab Bench Row 1",
    } as EquipmentItem,
  ],
  bookings: [
    {
      id: "LBK-001",
      date: "2025-01-20",
      timeSlot: "08:00-09:30",
      teacher: "Mr. Peter Omondi",
      gradeClass: "Grade 7 Alpha",
      topic: "Acid-Base Titration",
      itemsRequested: ["Hydrochloric Acid"],
      status: "Approved",
    } as LabBooking,
  ],
  breakages: [
    {
      id: "BRK-001",
      date: "2025-01-15",
      studentName: "Brian Kiptoo",
      admNo: "A827361",
      gradeClass: "Grade 7 Alpha",
      itemBroken: "Test Tube (15mL)",
      qty: 2,
      cost: 120,
      status: "Paid",
    } as BreakageLog,
  ],
};

// ── Consolidated Export Structure ──────────────────────────────────────────

export const initialSeedData = {
  version: "sample-v1",
  seedVersion: "sample-v1",
  exportDate: new Date().toISOString(),
  school: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
  students: MOCK_LEARNERS,
  learners: MOCK_LEARNERS,
  staff: mockStaffList,
  staffPrereg: [],
  fees: {},
  feeStructures: [
    { id: "fs-1", gradeId: "gpp1", gradeName: "PP1", year: "2026", term: "term1", amount: 8000 },
    { id: "fs-2", gradeId: "gpp2", gradeName: "PP2", year: "2026", term: "term1", amount: 8000 },
  ],
  attendance: mockAttendanceData,
  marks: mockMarksData,
  transactions: mockTransactionsList,
  grades: [
    { id: "gpp1", name: "PP1", category: "Pre-Primary", streams: [
      { id: "spp1a", name: "Yellow", teacher: "Unassigned", studentsCount: 0 },
      { id: "spp1b", name: "Green", teacher: "Unassigned", studentsCount: 0 },
    ]},
  ],
  examTypes: [
    { id: "et-1", name: "Formative Assessment", code: "FORMATIVE", weight: 40, category: "Formative", description: "Continuous assessment tests and classroom activities" },
  ],
  learningAreas: DEFAULT_CBC_CLUSTERS,
  assessmentScores: {},
  libraryBooks: [],
  ictAssets: [],
  notices: [],
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
        { level: "ME", descriptor: "Meeting Expectations", min: 50, max: 79, points: 3 },
      ],
    },
    permissions: {},
    geofence: { lat: 0.5142, lng: 35.2698, radius: 500 },
    geofenceEnabled: true,
    devBypass: false,
    sessionSecurity: {
      idleTimeout: "30m",
      requirePasswordOnFirstLogin: true,
    },
    auditLogs: [],
  },
  portalStats: {
    totalStudents: 0,
    totalTeachers: 0,
    juniorSchoolCount: 0,
    feesCollected: 0,
    todayAttendanceRate: 0,
    lastUpdated: new Date().toISOString(),
  },
  studyContent: cbcStudyContentData,
  scienceLab: scienceLabDataStructure
};

export const INITIAL_SEED_DATA = initialSeedData;

export const strandCategories = [
  "CRE & Values",
  "Languages",
  "Mathematics & STEM",
  "Agriculture & Nutrition",
  "Social Studies & Arts",
  "KICD Revision Bank",
  "Assessments & Quizzes",
] as const;

export const gradeLevels = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"] as const;

export const assessmentTypeOptions = [
  "Topical Quiz",
  "CAT (Continuous Assessment Test)",
  "Mid-Term Exam",
  "End of Term Exam",
  "Revision Paper",
  "KNEC Sample Paper",
  "Mock Exam",
  "Opener Quiz",
  "Other",
] as const;

// Named exports for backwards compatibility
export const mockLearners = initialSeedData.learners;
export const mockStaff = initialSeedData.staff;
export const mockAttendance = initialSeedData.attendance;
export const mockMarks = initialSeedData.marks;
export const mockTransactions = initialSeedData.transactions;
export const defaultCbcLearningAreas = initialSeedData.learningAreas;
export const cbcStudyContent = initialSeedData.studyContent;
export const scienceLabData = initialSeedData.scienceLab;

export default initialSeedData;
