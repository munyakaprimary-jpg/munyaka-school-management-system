/**
 * MUNYAKA PRIMARY AND JUNIOR SCHOOL — Initial Seed Data
 * ======================================================
 * This file is the single source of truth for the APK's default baseline.
 * On fresh install (APK boot) the StorageInitService and hydrateAllStores
 * populate every localStorage key from this export.
 *
 * Version: v_full_sync_v2  (matches StorageInitService.CURRENT_SEED_VERSION)
 * Last updated: matches current Dyad preview live dataset
 *
 * Statistics baseline:
 *   • 14 Active Learners (students)
 *   • 6 Staff Members (5 Active + 1 Pre-Registered)
 *   • 12 Grade Classes (PP1 → Grade 9)
 *   • Active attendance, fees, and transaction records
 */
export const INITIAL_SEED_DATA = {
  version: "4.0",
  seedVersion: "v_full_sync_v2",
  exportDate: new Date().toISOString(),
  school: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",

  // ── Students / Learners ───────────────────────────────────────────────────────
  students: [
    {
      id: "1787737452457",
      admNo: "B002961576",
      name: "MUTWIKA KILONZO",
      grade: "Grade 7",
      stream: "VENUS",
      gender: "Female",
      guardian: "STEPHEN KILONZO KINGOO",
      phone: "0705221675",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "1787724752520",
      admNo: "B004123291",
      name: "OCTEVIOR LUVISIA",
      grade: "Grade 6",
      stream: "Yellow",
      gender: "Male",
      guardian: "TITUS KIJUSA LUVISIA",
      phone: "0705138090",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "1787724509755",
      admNo: "B004761829",
      name: "SAMWEL KAMAU WANJIKU",
      grade: "Grade 6",
      stream: "Yellow",
      gender: "Male",
      guardian: "MARY WANJIKU WAIRIMU",
      phone: "0719182804",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "1787655781527",
      admNo: "A009702345",
      name: "EMILY CHEBET",
      grade: "Grade 5",
      stream: "Yellow",
      gender: "Female",
      guardian: "EDWARD LIMO",
      phone: "07892356787",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "2",
      admNo: "B004779091",
      name: "PETER WAITITU",
      grade: "Grade 6",
      stream: "South",
      gender: "Male",
      guardian: "JANE WANJIKU WAITITO",
      phone: "0114222031",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "3",
      admNo: "B004276095",
      name: "ALFRED JUMA",
      grade: "Grade 6",
      stream: "East",
      gender: "Male",
      guardian: "PHANICE NASIMIYU KIRISWA",
      phone: "0141893904",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "4",
      admNo: "B003881023",
      name: "BRIAN KIPTOO",
      grade: "Grade 4",
      stream: "Blue",
      gender: "Male",
      guardian: "JAMES KIPTOO",
      phone: "0712345678",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "5",
      admNo: "B003882045",
      name: "MARY ATIENO",
      grade: "Grade 4",
      stream: "Blue",
      gender: "Female",
      guardian: "PAUL ATIENO",
      phone: "0713456789",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "6",
      admNo: "B003883067",
      name: "EMMA NAKUMEN",
      grade: "Grade 5",
      stream: "Yellow",
      gender: "Female",
      guardian: "JOHN NAKUMEN",
      phone: "0723456789",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "7",
      admNo: "B002961577",
      name: "JAMES KIMUTAI",
      grade: "Grade 7",
      stream: "MERCURY",
      gender: "Male",
      guardian: "DAVID KIMUTAI",
      phone: "0734567890",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "8",
      admNo: "B002961578",
      name: "LUCY JEPKOCHIR",
      grade: "Grade 7",
      stream: "VENUS",
      gender: "Female",
      guardian: "SAMUEL JEPKOCHIR",
      phone: "0745678901",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "9",
      admNo: "B001223344",
      name: "DANIEL MWANGI",
      grade: "Grade 8",
      stream: "Alpha",
      gender: "Male",
      guardian: "PETER MWANGI",
      phone: "0756789012",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "10",
      admNo: "B001223345",
      name: "CAROLINE WANJIRU",
      grade: "Grade 8",
      stream: "Beta",
      gender: "Female",
      guardian: "JAMES WANJIRU",
      phone: "0767890123",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "11",
      admNo: "B001334455",
      name: "KEVIN CHERUIYOT",
      grade: "Grade 9",
      stream: "Alpha",
      gender: "Male",
      guardian: "SAMSON CHERUIYOT",
      phone: "0778901234",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "12",
      admNo: "B001334456",
      name: "FAITH JEPchirchir",
      grade: "Grade 9",
      stream: "Beta",
      gender: "Female",
      guardian: "JOHN CHERUIYOT",
      phone: "0789012345",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "13",
      admNo: "B001445566",
      name: "SAMUEL KIPROP",
      grade: "Grade 4",
      stream: "Green",
      gender: "Male",
      guardian: "WILLIAM KIPROP",
      phone: "0790123456",
      status: "Active",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "14",
      admNo: "B001445567",
      name: "MONICA JEPNG'OK",
      grade: "Grade 4",
      stream: "Green",
      gender: "Female",
      guardian: "DAVID JEPNG'OK",
      phone: "0701234567",
      status: "Active",
      schoolId: "MUNYAKA-001"
    }
  ],

  // ── Staff / Teachers ──────────────────────────────────────────────────────────
  staff: [
    {
      id: "ST-1787658809855",
      id_no: "122654",
      tsc_no: "1234566",
      name: "JOEL MWANGI",
      role: "TEACHER",
      subjects: [],
      phone: "0768234567",
      email: "joelmwangi@school.ac.ke",
      status: "Active",
      joined: "Aug 2026",
      department: "School Administration",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "ST-101",
      id_no: "28374615",
      tsc_no: "TSC-482910",
      name: "Jane Mwangi",
      role: "Class Teacher",
      subjects: ["Mathematics", "Science & Tech"],
      phone: "+254 712 345 678",
      email: "jane.mwangi@munyaka.sc.ke",
      status: "Active",
      joined: "Jan 2022",
      department: "Mathematics & Science",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "ST-102",
      id_no: "31948201",
      tsc_no: "TSC-592014",
      name: "John Kamau",
      role: "Senior Teacher",
      subjects: ["English", "Social Studies"],
      phone: "+254 722 987 654",
      email: "john.kamau@munyaka.sc.ke",
      status: "Active",
      joined: "Mar 2021",
      department: "Languages & Humanities",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "ST-103",
      id_no: "25839102",
      tsc_no: "TSC-382910",
      name: "Peter Omondi",
      role: "Subject Teacher",
      subjects: ["Pre-Technical", "Computer Science"],
      phone: "+254 733 456 789",
      email: "peter.omondi@munyaka.sc.ke",
      status: "Pre-Registered",
      joined: "Jan 2024",
      department: "Technical & Vocational",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "ST-104",
      id_no: "29482019",
      tsc_no: "TSC-610293",
      name: "Sarah Chebet",
      role: "Class Teacher",
      subjects: ["Kiswahili", "CRE"],
      phone: "+254 701 112 233",
      email: "sarah.chebet@munyaka.sc.ke",
      status: "Active",
      joined: "Sep 2022",
      department: "Languages & Humanities",
      schoolId: "MUNYAKA-001"
    },
    {
      id: "ST-105",
      id_no: "30291847",
      tsc_no: "TSC-719203",
      name: "Grace Njeri",
      role: "Head Teacher",
      subjects: ["Administration"],
      phone: "+254 700 000 111",
      email: "grace.njeri@munyaka.sc.ke",
      status: "Active",
      joined: "Jan 2020",
      department: "School Administration",
      schoolId: "MUNYAKA-001"
    }
  ],

  // ── Staff Pre-Registration ───────────────────────────────────────────────────
  staffPrereg: [
    {
      id: "PR-1787658909839",
      fullName: "Grace Njeri",
      nationalId: "30291847",
      tscNumber: "TSC-719203",
      email: "grace.njeri@munyaka.sc.ke",
      phone: "+254 700 000 111",
      systemRole: "head_teacher",
      department: "",
      assignedSubjects: ["Administration"],
      tempAccessCode: "MUNYAKA-9632",
      status: "Pre-Registered",
      datePreRegistered: "2026-08-25"
    },
    {
      id: "PR-1787658904111",
      fullName: "Peter Omondi",
      nationalId: "25839102",
      tscNumber: "TSC-382910",
      email: "peter.omondi@munyaka.sc.ke",
      phone: "+254 733 456 789",
      systemRole: "subject_teacher",
      department: "",
      assignedSubjects: ["Pre-Technical", "Computer Science"],
      tempAccessCode: "MUNYAKA-2647",
      status: "Pre-Registered",
      datePreRegistered: "2026-08-25"
    },
    {
      id: "PR-1787658895559",
      fullName: "Jane Mwangi",
      nationalId: "28374615",
      tscNumber: "TSC-482910",
      email: "jane.mwangi@munyaka.sc.ke",
      phone: "+254 712 345 678",
      systemRole: "class_teacher",
      department: "",
      assignedSubjects: ["Mathematics", "Science & Tech"],
      tempAccessCode: "MUNYAKA-9020",
      status: "Pre-Registered",
      datePreRegistered: "2026-08-25"
    },
    {
      id: "PR-1787658885534",
      fullName: "Sarah Chebet",
      nationalId: "29482019",
      tscNumber: "TSC-610293",
      email: "sarah.chebet@munyaka.sc.ke",
      phone: "+254 701 112 233",
      systemRole: "class_teacher",
      department: "",
      assignedSubjects: ["Kiswahili", "CRE"],
      tempAccessCode: "MUNYAKA-7496",
      status: "Pre-Registered",
      datePreRegistered: "2026-08-25"
    },
    {
      id: "PR-1787658875279",
      fullName: "John Kamau",
      nationalId: "31948201",
      tscNumber: "TSC-592014",
      email: "john.kamau@munyaka.sc.ke",
      phone: "+254 722 987 654",
      systemRole: "senior_teacher",
      department: "",
      assignedSubjects: ["English", "Social Studies"],
      tempAccessCode: "MUNYAKA-2116",
      status: "Pre-Registered",
      datePreRegistered: "2026-08-25"
    },
    {
      id: "PR-1787658841599",
      fullName: "JOEL MWANGI",
      nationalId: "122654",
      tscNumber: "1234566",
      email: "joelmwangi@school.ac.ke",
      phone: "0768234567",
      systemRole: "subject_teacher",
      department: "",
      assignedSubjects: [],
      tempAccessCode: "MUNYAKA-7849",
      status: "Pre-Registered",
      datePreRegistered: "2026-08-25"
    }
  ],

  // ── Fee Records ──────────────────────────────────────────────────────────────
  fees: [
    {
      id: "1",
      student: "Brian Kiptoo",
      studentId: "4",
      total: 15000,
      paid: 0,
      balance: 15000,
      status: "Pending"
    },
    {
      id: "2",
      student: "Mary Atieno",
      studentId: "5",
      total: 15000,
      paid: 15000,
      balance: 0,
      status: "Cleared"
    },
    {
      id: "3",
      student: "Emmanuel Maina",
      studentId: "6",
      total: 15000,
      paid: 5000,
      balance: 10000,
      status: "Pending"
    }
  ],

  // ── Fee Structures (per grade) ───────────────────────────────────────────────
  feeStructures: [
    { id: "fs-1", gradeId: "gpp1", gradeName: "PP1", year: "2026", term: "term1", amount: 8000 },
    { id: "fs-2", gradeId: "gpp2", gradeName: "PP2", year: "2026", term: "term1", amount: 8000 },
    { id: "fs-3", gradeId: "g1", gradeName: "Grade 1", year: "2026", term: "term1", amount: 12000 },
    { id: "fs-4", gradeId: "g2", gradeName: "Grade 2", year: "2026", term: "term1", amount: 12000 },
    { id: "fs-5", gradeId: "g3", gradeName: "Grade 3", year: "2026", term: "term1", amount: 12000 },
    { id: "fs-6", gradeId: "g4", gradeName: "Grade 4", year: "2026", term: "term1", amount: 15000 },
    { id: "fs-7", gradeId: "g5", gradeName: "Grade 5", year: "2026", term: "term1", amount: 15000 },
    { id: "fs-8", gradeId: "g6", gradeName: "Grade 6", year: "2026", term: "term1", amount: 15000 },
    { id: "fs-9", gradeId: "g7", gradeName: "Grade 7", year: "2026", term: "term1", amount: 18000 },
    { id: "fs-10", gradeId: "g8", gradeName: "Grade 8", year: "2026", term: "term1", amount: 18000 },
    { id: "fs-11", gradeId: "g9", gradeName: "Grade 9", year: "2026", term: "term1", amount: 20000 }
  ],

  // ── Transactions ─────────────────────────────────────────────────────────────
  transactions: [
    {
      id: "TX-516",
      date: "8/26/2026",
      paidAt: "2026-08-26T10:15:00.000Z",
      amount: 700,
      method: "M-Pesa",
      ref: "AUTO-GEN",
      category: "Tuition",
      studentId: "1787737452457",
      learnerName: "MUTWIKA KILONZO",
      status: "paid"
    },
    {
      id: "TX-901",
      date: "Oct 12, 2024",
      amount: 5000,
      method: "M-Pesa",
      ref: "RI82JD91S",
      category: "Tuition",
      status: "paid"
    },
    {
      id: "TX-882",
      date: "Sep 28, 2024",
      amount: 2000,
      method: "Bank Deposit",
      ref: "DEP-2938",
      category: "Activity",
      status: "paid"
    },
    {
      id: "TX-750",
      date: "Aug 15, 2024",
      amount: 5000,
      method: "M-Pesa",
      ref: "QH12LK34P",
      category: "Tuition",
      status: "paid"
    }
  ],

  // ── Attendance Records ───────────────────────────────────────────────────────
  attendance: {
    "Grade 4_Blue_2026-08-26_morning": {
      session: "morning",
      class: "Grade 4",
      stream: "Blue",
      date: "2026-08-26",
      savedAt: "2026-08-26T07:05:17.006Z",
      "4": "P",
      "5": "P"
    },
    "Grade 4_all_2026-08-26_morning": {
      session: "morning",
      class: "Grade 4",
      stream: "all",
      date: "2026-08-26",
      savedAt: "2026-08-26T07:13:13.158Z",
      "4": "P",
      "5": "P"
    },
    "Grade 6_all_2026-08-26_morning": {
      session: "morning",
      class: "Grade 6",
      stream: "all",
      date: "2026-08-26",
      savedAt: "2026-08-26T08:56:37.698Z",
      "2": "P",
      "3": "P"
    }
  },

  // ── Grades / Classes ─────────────────────────────────────────────────────────
  grades: [
    {
      id: "gpp1",
      name: "PP1",
      category: "Pre-Primary",
      streams: [
        { id: "spp1a", name: "Yellow", teacher: "Unassigned", studentsCount: 30 },
        { id: "spp1b", name: "Green", teacher: "Unassigned", studentsCount: 28 }
      ]
    },
    {
      id: "gpp2",
      name: "PP2",
      category: "Pre-Primary",
      streams: [
        { id: "spp2a", name: "Yellow", teacher: "Unassigned", studentsCount: 32 },
        { id: "spp2b", name: "Green", teacher: "Unassigned", studentsCount: 29 }
      ]
    },
    {
      id: "g1",
      name: "Grade 1",
      category: "Primary",
      streams: [
        { id: "s1", name: "Blue", teacher: "Unassigned", studentsCount: 42 },
        { id: "s2", name: "Green", teacher: "Unassigned", studentsCount: 38 }
      ]
    },
    {
      id: "g2",
      name: "Grade 2",
      category: "Primary",
      streams: [
        { id: "s2a", name: "Blue", teacher: "Unassigned", studentsCount: 40 },
        { id: "s2b", name: "Green", teacher: "Unassigned", studentsCount: 35 }
      ]
    },
    {
      id: "g3",
      name: "Grade 3",
      category: "Primary",
      streams: [
        { id: "s3a", name: "Blue", teacher: "Unassigned", studentsCount: 38 },
        { id: "s3b", name: "Green", teacher: "Unassigned", studentsCount: 36 }
      ]
    },
    {
      id: "g4",
      name: "Grade 4",
      category: "Primary",
      streams: [
        { id: "s3", name: "Blue", teacher: "Jane Mwangi", studentsCount: 42 },
        { id: "s4", name: "Green", teacher: "Unassigned", studentsCount: 38 }
      ]
    },
    {
      id: "g5",
      name: "Grade 5",
      category: "Primary",
      streams: [
        { id: "s5", name: "Alpha", teacher: "John Kamau", studentsCount: 40 },
        { id: "s6", name: "Beta", teacher: "Unassigned", studentsCount: 36 }
      ]
    },
    {
      id: "g6",
      name: "Grade 6",
      category: "Primary",
      streams: [
        { id: "s6a", name: "Yellow", teacher: "Unassigned", studentsCount: 38 },
        { id: "s6b", name: "Green", teacher: "Unassigned", studentsCount: 35 },
        { id: "s6c", name: "South", teacher: "Unassigned", studentsCount: 0 },
        { id: "s6d", name: "East", teacher: "Unassigned", studentsCount: 0 }
      ]
    },
    {
      id: "g7",
      name: "Grade 7",
      category: "Junior School",
      streams: [
        { id: "s7a", name: "MERCURY", teacher: "Unassigned", studentsCount: 0 },
        { id: "s7b", name: "VENUS", teacher: "Unassigned", studentsCount: 0 },
        { id: "s7c", name: "JUPITER", teacher: "Unassigned", studentsCount: 0 },
        { id: "s7d", name: "NEPTUNE", teacher: "Unassigned", studentsCount: 0 }
      ]
    },
    {
      id: "g8",
      name: "Grade 8",
      category: "Junior School",
      streams: [
        { id: "s9", name: "Alpha", teacher: "Unassigned", studentsCount: 35 },
        { id: "s10", name: "Beta", teacher: "Unassigned", studentsCount: 31 }
      ]
    },
    {
      id: "g9",
      name: "Grade 9",
      category: "Junior School",
      streams: [
        { id: "s11", name: "Alpha", teacher: "Unassigned", studentsCount: 30 },
        { id: "s12", name: "Beta", teacher: "Unassigned", studentsCount: 28 }
      ]
    }
  ],

  // ── Exam Types ───────────────────────────────────────────────────────────────
  examTypes: [
    {
      id: "et-1",
      name: "Formative Assessment",
      code: "FORMATIVE",
      weight: 40,
      category: "Formative",
      description: "Continuous assessment tests and classroom activities"
    },
    {
      id: "et-2",
      name: "Summative Assessment",
      code: "SUMMATIVE",
      weight: 60,
      category: "Summative",
      description: "End of term comprehensive evaluation"
    },
    {
      id: "et-3",
      name: "Opener Exam",
      code: "OPENER",
      weight: 0,
      category: "Other",
      description: "Beginning of term diagnostic test"
    },
    {
      id: "et-4",
      name: "Mid-Term Exam",
      code: "MIDTERM",
      weight: 0,
      category: "Other",
      description: "Mid-term progress evaluation"
    }
  ],

  // ── Learning Areas ───────────────────────────────────────────────────────────
  learningAreas: [
    {
      id: "pre-primary",
      name: "Pre-Primary",
      description: "Early childhood development learning areas",
      learningAreas: []
    },
    {
      id: "lower-primary",
      name: "Lower Primary",
      description: "Foundational learning areas for Grades 1, 2, and 3",
      learningAreas: []
    },
    {
      id: "upper-primary",
      name: "Upper Primary",
      description: "Intermediate learning areas for Grades 4, 5, and 6",
      learningAreas: []
    },
    {
      id: "junior-school",
      name: "Junior School",
      description: "Secondary preparation learning areas",
      learningAreas: []
    }
  ],

  // ── Assessment Scores ────────────────────────────────────────────────────────
  assessmentScores: {
    "2026_Term 1_Grade 4_All Subjects_Formative Assessment": {
      "4": {
        "English": "45",
        "Kiswahili": "56",
        "Mathematics": "87",
        "Science & Technology": "65",
        "Agriculture & Nutrition": "64",
        "Social Studies": "66",
        "Religious Education (CRE/IRE/HRE)": "45",
        "Creative Arts": "76"
      },
      "5": {
        "English": "54",
        "Kiswahili": "65",
        "Mathematics": "45",
        "Science & Technology": "66",
        "Agriculture & Nutrition": "76",
        "Social Studies": "80",
        "Religious Education (CRE/IRE/HRE)": "54",
        "Creative Arts": "66"
      }
    }
  },

  // ── Library Books ────────────────────────────────────────────────────────────
  libraryBooks: [
    { id: "lb-1", title: "Spark: English Grade 4", author: "Oxford", isbn: "978-019", category: "Core Text", stock: 120, borrowed: 85 },
    { id: "lb-2", title: "KLB Mathematics Grade 5", author: "KLB", isbn: "978-9966", category: "Core Text", stock: 150, borrowed: 142 },
    { id: "lb-3", title: "Dunia Yetu: Kiswahili", author: "Longhorn", isbn: "978-9977", category: "Reference", stock: 45, borrowed: 12 },
    { id: "lb-4", title: "Science in Action", author: "Pearson", isbn: "978-0321", category: "Supplementary", stock: 60, borrowed: 58 }
  ],

  // ── ICT Assets ───────────────────────────────────────────────────────────────
  ictAssets: [
    { id: "1", assetTag: "ICT-LP-01", name: "HP ProBook 450", category: "Laptops", serialNumber: "CND12345XYZ", status: "Active", location: "Computer Lab 1", assignedTo: "Jane Mwangi" },
    { id: "2", assetTag: "ICT-TB-05", name: "Samsung Galaxy Tab A8", category: "Tablets", serialNumber: "RF8S123456", status: "Active", location: "Mobile Cart A", assignedTo: "Grade 4 Blue" },
    { id: "3", assetTag: "ICT-PJ-01", name: "Epson EB-X41", category: "Projectors", serialNumber: "V11H843040", status: "In Maintenance", location: "Staff Room", assignedTo: "John Kamau" },
    { id: "4", assetTag: "ICT-NW-02", name: "TP-Link AX1800 Router", category: "Networking", serialNumber: "220C123456", status: "Active", location: "Server Room" },
    { id: "5", assetTag: "ICT-LP-02", name: "Dell Latitude 5420", category: "Laptops", serialNumber: "DL5420-001", status: "Active", location: "Computer Lab 1" },
    { id: "6", assetTag: "ICT-TB-10", name: "iPad 9th Gen", category: "Tablets", serialNumber: "IPAD9-010", status: "Active", location: "Mobile Cart B" }
  ],

  // ── Notices / Announcements ──────────────────────────────────────────────────
  notices: [
    { id: "1", title: "Half-Term Break", content: "School will close on Friday 20th Oct for a one-week break.", date: "Oct 15, 2024", category: "Urgent", color: "bg-red-50 text-red-600" },
    { id: "2", title: "Sports Day 2024", content: "All parents are invited to the annual sports day on Nov 5th.", date: "Oct 12, 2024", category: "Event", color: "bg-blue-50 text-blue-600" },
    { id: "3", title: "CBC Materials Needed", description: "Grade 4 learners require clay for Creative Arts next week.", date: "Oct 10, 2024", category: "Notice", color: "bg-emerald-50 text-emerald-600" }
  ],

  // ── System Settings ──────────────────────────────────────────────────────────
  settings: {
    general: {
      schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
      motto: "KNOWLEDGE IS POWER",
      postalAddress: "P.O. BOX 5239-30100 ELDORET",
      phone: "+254 712 345 678",
      email: "info@munyaka.sc.ke",
      location: "Munyaka, Eldoret East, Uasin Gishu County",
      maintenanceMode: false
    },
    academic: {
      activeYear: "2026",
      activeTerm: "term1",
      termStartDate: "2026-01-05",
      termEndDate: "2026-04-10",
      gradingScale: [
        { level: "EE", descriptor: "Exceeding Expectations", min: 80, max: 100, points: 4 },
        { level: "ME", descriptor: "Meeting Expectations", min: 50, max: 79, points: 3 },
        { level: "AE", descriptor: "Approaching Expectations", min: 30, max: 49, points: 2 },
        { level: "BE", descriptor: "Below Expectations", min: 0, max: 29, points: 1 }
      ]
    },
    permissions: {
      owner: {
        sys_config: { read: true, create: true, edit: true, delete: true },
        academic_grading: { read: true, create: true, edit: true, delete: true },
        student_records: { read: true, create: true, edit: true, delete: true },
        finance_fees: { read: true, create: true, edit: true, delete: true },
        payment_subscriptions: { read: true, create: true, edit: true, delete: true },
        staff_mgmt: { read: true, create: true, edit: true, delete: true }
      },
      super_admin: {
        sys_config: { read: true, create: true, edit: true, delete: true },
        academic_grading: { read: true, create: true, edit: true, delete: true },
        student_records: { read: true, create: true, edit: true, delete: true },
        finance_fees: { read: true, create: true, edit: true, delete: true },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: true, create: true, edit: true, delete: true }
      },
      head_teacher: {
        sys_config: { read: true, create: true, edit: true, delete: false },
        academic_grading: { read: true, create: true, edit: true, delete: false },
        student_records: { read: true, create: true, edit: true, delete: false },
        finance_fees: { read: true, create: true, edit: true, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: true, create: true, edit: true, delete: false }
      },
      bursar: {
        sys_config: { read: false, create: false, edit: false, delete: false },
        academic_grading: { read: false, create: false, edit: false, delete: false },
        student_records: { read: false, create: false, edit: false, delete: false },
        finance_fees: { read: true, create: false, edit: false, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: false, create: false, edit: false, delete: false }
      },
      teacher: {
        sys_config: { read: false, create: false, edit: false, delete: false },
        academic_grading: { read: true, create: false, edit: false, delete: false },
        student_records: { read: true, create: false, edit: false, delete: false },
        finance_fees: { read: true, create: false, edit: false, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: false, create: false, edit: false, delete: false }
      },
      parent: {
        sys_config: { read: false, create: false, edit: false, delete: false },
        academic_grading: { read: false, create: false, edit: false, delete: false },
        student_records: { read: true, create: false, edit: false, delete: false },
        finance_fees: { read: false, create: false, edit: false, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: false, create: false, edit: false, delete: false }
      },
      student: {
        sys_config: { read: true, create: false, edit: false, delete: false },
        academic_grading: { read: true, create: false, edit: false, delete: false },
        student_records: { read: true, create: false, edit: false, delete: false },
        finance_fees: { read: true, create: false, edit: false, delete: false },
        payment_subscriptions: { read: false, create: false, edit: false, delete: false },
        staff_mgmt: { read: true, create: false, edit: false, delete: false }
      }
    },
    geofence: { lat: 0.5142, lng: 35.2698, radius: 500 },
    geofenceEnabled: true,
    devBypass: false,
    sessionSecurity: {
      idleTimeout: "30m",
      requirePasswordOnFirstLogin: true
    },
    auditLogs: [
      { timestamp: "2026-03-31 09:14:02", admin: "System Admin", action: "Geofence Radius Updated (150m)", ip: "192.168.1.102 (Chrome/Win)" },
      { timestamp: "2026-03-30 16:45:11", admin: "System Admin", action: "Credentials Reset for J. Mwangi", ip: "192.168.1.102 (Chrome/Win)" },
      { timestamp: "2026-03-28 11:20:30", admin: "Head Teacher", action: "Grade Bounds Modified (Grade 4)", ip: "192.168.1.108 (Safari/Mac)" },
      { timestamp: "2026-03-25 08:30:15", admin: "System Admin", action: "Idle Session Timeout set to 30m", ip: "192.168.1.102 (Chrome/Win)" }
    ]
  },

  // ── Portal Statistics Baseline ───────────────────────────────────────────────
  portalStats: {
    totalStudents: 14,
    totalTeachers: 5,
    juniorSchoolCount: 5,
    feesCollected: 700,
    todayAttendanceRate: 100,
    lastUpdated: new Date().toISOString()
  }
};
