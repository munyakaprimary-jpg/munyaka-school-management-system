import React from 'react';

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

export interface Stream {
  id: string;
  name: string;
  teacher: string;
  studentsCount: number;
}

export interface Grade {
  id: string;
  name: string;
  category: 'Pre-Primary' | 'Primary' | 'Junior School';
  streams: Stream[];
}

export interface StaffMember {
  id: string;
  id_no: string;
  tsc_no?: string;
  name: string;
  role: string;
  subjects: string[];
  phone: string;
  email: string;
  status: string;
  joined: string;
  department: string;
}

export interface TimetableRow {
  time: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  description: string;
  date: string;
  category: string;
  color: string;
}

export interface MessageItem {
  id: string;
  recipient: string;
  subject: string;
  type: 'Email' | 'SMS';
  date: string;
  status: string;
}

// =====================================================================
// CLEANED STUDENT DATA — only valid UPI records remain.
// (Cleanup in v3.6 removed 7 stale Grade 6 Yellow records:
// SHEILA A827364, DAVID MUTUA A827365, GRACE WANJIKU A827366,
// JOSEPH KARIUKI A827367, FAITH NJERI A827368, GEORGE OCHIENG A827369,
// HELEN MORAA A827370 — they are not re-added here.)
// =====================================================================

export const STUDENTS = [
  { id: "1", name: "Brian Kiptoo", assessment: "A827361", grade: "6", stream: "Yellow", gender: "M", dob: "2014-05-12", guardian: "Samuel Kiptoo", phone: "+254 712 000 111", email: "sam.kiptoo@email.com", health: "None", needs: "None", feeBalance: 0, status: "Active", dateOfAdmission: "2020-01-15", coCurricularActivities: "Football team captain, Science fair winner" },
  { id: "2", name: "Mary Atieno", assessment: "A827362", grade: "6", stream: "Yellow", gender: "F", dob: "2014-08-20", guardian: "Grace Atieno", phone: "+254 712 000 222", email: "g.atieno@email.com", health: "Asthma", needs: "None", feeBalance: 0, status: "Active", dateOfAdmission: "2020-01-15", coCurricularActivities: "Choir member, Debate team" },
  { id: "3", name: "Emmanuel Maina", assessment: "A827363", grade: "6", stream: "Yellow", gender: "M", dob: "2014-03-15", guardian: "David Maina", phone: "+254 712 000 333", email: "d.maina@email.com", health: "None", needs: "Vision Support", feeBalance: 5000, status: "Active", dateOfAdmission: "2020-01-15", coCurricularActivities: "Drama club, Chess team" },
];

// =====================================================================
// GRADES & STREAMS MASTER CONFIGURATION
// =====================================================================

export const GRADES_DATA: Grade[] = [
  { id: "gpp1", name: "PP1", category: "Pre-Primary", streams: [
    { id: "spp1a", name: "Yellow", teacher: "Unassigned", studentsCount: 30 },
    { id: "spp1b", name: "Green", teacher: "Unassigned", studentsCount: 28 }
  ]},
  { id: "gpp2", name: "PP2", category: "Pre-Primary", streams: [
    { id: "spp2a", name: "Yellow", teacher: "Unassigned", studentsCount: 32 },
    { id: "spp2b", name: "Green", teacher: "Unassigned", studentsCount: 29 }
  ]},
  { id: "g1", name: "Grade 1", category: "Primary", streams: [
    { id: "s1", name: "Blue", teacher: "Unassigned", studentsCount: 42 },
    { id: "s2", name: "Green", teacher: "Unassigned", studentsCount: 38 }
  ]},
  { id: "g2", name: "Grade 2", category: "Primary", streams: [
    { id: "s2a", name: "Blue", teacher: "Unassigned", studentsCount: 40 },
    { id: "s2b", name: "Green", teacher: "Unassigned", studentsCount: 35 }
  ]},
  { id: "g3", name: "Grade 3", category: "Primary", streams: [
    { id: "s3a", name: "Blue", teacher: "Unassigned", studentsCount: 38 },
    { id: "s3b", name: "Green", teacher: "Unassigned", studentsCount: 36 }
  ]},
  { id: "g4", name: "Grade 4", category: "Primary", streams: [
    { id: "s3", name: "Blue", teacher: "Jane Mwangi", studentsCount: 42 },
    { id: "s4", name: "Green", teacher: "Unassigned", studentsCount: 38 },
    { id: "s-yel-4", name: "Yellow", teacher: "Unassigned", studentsCount: 0 },
    { id: "s-red-4", name: "Red", teacher: "Unassigned", studentsCount: 0 }
  ]},
  { id: "g5", name: "Grade 5", category: "Primary", streams: [
    { id: "s5a", name: "Blue", teacher: "Unassigned", studentsCount: 30 },
    { id: "s5b", name: "Yellow", teacher: "Unassigned", studentsCount: 28 }
  ]},
  { id: "g6", name: "Grade 6", category: "Primary", streams: [
    { id: "s6-blue", name: "BLUE", teacher: "Unassigned", studentsCount: 0 },
    { id: "s6-yellow", name: "YELLOW", teacher: "Unassigned", studentsCount: 3 },
    { id: "s6-green", name: "GREEN", teacher: "Unassigned", studentsCount: 0 },
    { id: "s6-red", name: "RED", teacher: "Unassigned", studentsCount: 0 }
  ]},
  { id: "g7", name: "Grade 7", category: "Junior School", streams: [
    { id: "s7-mercury", name: "MERCURY", teacher: "Unassigned", studentsCount: 0 },
    { id: "s7-venus", name: "VENUS", teacher: "Unassigned", studentsCount: 1 },
    { id: "s7-jupiter", name: "JUPITER", teacher: "Unassigned", studentsCount: 0 },
    { id: "s7-neptune", name: "NEPTUNE", teacher: "Unassigned", studentsCount: 0 }
  ]},
  { id: "g8", name: "Grade 8", category: "Junior School", streams: [
    { id: "s9", name: "Alpha", teacher: "Unassigned", studentsCount: 35 },
    { id: "s10", name: "Beta", teacher: "Unassigned", studentsCount: 31 }
  ]},
  { id: "g9", name: "Grade 9", category: "Junior School", streams: [
    { id: "s11", name: "Alpha", teacher: "Unassigned", studentsCount: 30 },
    { id: "s12", name: "Beta", teacher: "Unassigned", studentsCount: 28 }
  ]}
];

// =====================================================================
// STAFF MASTER DIRECTORY
// =====================================================================

export const STAFF: StaffMember[] = [
  { id: "ST-101", id_no: "28374615", tsc_no: "TSC-482910", name: "Jane Mwangi", role: "Class Teacher", subjects: ["Mathematics", "Science & Tech"], phone: "+254 712 345 678", email: "jane.mwangi@munyaka.sc.ke", status: "Active", joined: "Jan 2022", department: "Mathematics & Science" },
  { id: "ST-102", id_no: "31948201", tsc_no: "TSC-592014", name: "John Kamau", role: "Senior Teacher", subjects: ["English", "Social Studies"], phone: "+254 722 987 654", email: "john.kamau@munyaka.sc.ke", status: "Active", joined: "Mar 2021", department: "Languages & Humanities" },
  { id: "ST-103", id_no: "25839102", tsc_no: "TSC-382910", name: "Peter Omondi", role: "Subject Teacher", subjects: ["Pre-Technical", "Computer Science"], phone: "+254 733 456 789", email: "peter.omondi@munyaka.sc.ke", status: "Pre-Registered", joined: "Jan 2024", department: "Technical & Vocational" },
  { id: "ST-104", id_no: "29482019", tsc_no: "TSC-610293", name: "Sarah Chebet", role: "Class Teacher", subjects: ["Kiswahili", "CRE"], phone: "+254 701 112 233", email: "sarah.chebet@munyaka.sc.ke", status: "Active", joined: "Sep 2022", department: "Languages & Humanities" },
  { id: "ST-105", id_no: "30291847", tsc_no: "TSC-719203", name: "Grace Njeri", role: "Head Teacher", subjects: ["Administration"], phone: "+254 700 000 111", email: "grace.njeri@munyaka.sc.ke", status: "Active", joined: "Jan 2020", department: "School Administration" }
];

// =====================================================================
// FINANCIAL TRANSACTIONS & FEES
// =====================================================================

export const TRANSACTIONS = [
  { id: "TX-901", date: "Oct 12, 2024", amount: 5000, method: "M-Pesa", ref: "RI82JD91S", category: "Tuition" },
  { id: "TX-882", date: "Sep 28, 2024", amount: 2000, method: "Bank Deposit", ref: "DEP-2938", category: "Activity" },
  { id: "TX-750", date: "Aug 15, 2024", amount: 5000, method: "M-Pesa", ref: "QH12LK34P", category: "Tuition" }
];

export const FEES_DATA = [
  { id: "1", student: "Brian Kiptoo", total: 15000, paid: 0, status: "Pending" },
  { id: "2", student: "Mary Atieno", total: 15000, paid: 15000, status: "Cleared" },
  { id: "3", student: "Emmanuel Maina", total: 15000, paid: 5000, status: "Pending" }
];

// =====================================================================
// WEEKLY ATTENDANCE TREND
// =====================================================================

export const ATTENDANCE_TREND = [
  { day: "Mon", rate: 88, isFuture: false },
  { day: "Tue", rate: 92, isFuture: false },
  { day: "Wed", rate: 95, isFuture: false },
  { day: "Thu", rate: 90, isFuture: false },
  { day: "Fri", rate: 0, isFuture: true }
];

// =====================================================================
// WEEKLY TIMETABLE STRUCTURE
// =====================================================================

export const TIMETABLE: TimetableRow[] = [
  { time: "08:00 - 09:00", mon: "Math", tue: "English", wed: "Kiswahili", thu: "Science", fri: "Social Studies" },
  { time: "09:00 - 10:00", mon: "English", tue: "Math", wed: "Science", thu: "Kiswahili", fri: "CRE" },
  { time: "10:00 - 10:30", mon: "BREAK", tue: "BREAK", wed: "BREAK", thu: "BREAK", fri: "BREAK" },
  { time: "10:30 - 11:30", mon: "Kiswahili", tue: "Science", wed: "Math", thu: "English", fri: "Math" },
  { time: "11:30 - 12:30", mon: "Science", tue: "Social Studies", wed: "English", thu: "Math", fri: "Kiswahili" },
  { time: "12:30 - 13:30", mon: "LUNCH", tue: "LUNCH", wed: "LUNCH", thu: "LUNCH", fri: "LUNCH" },
  { time: "13:30 - 14:30", mon: "CRE", tue: "CRE", wed: "Social Studies", thu: "Pastoral", fri: "Pastoral" },
  { time: "14:30 - 15:30", mon: "Sports", tue: "Sports", wed: "Library", thu: "Club", fri: "Assembly" }
];

// =====================================================================
// NOTICE BOARD & COMMUNICATION MOCK DATA
// =====================================================================

export const NOTICES: NoticeItem[] = [
  {
    id: "1",
    title: "Mid-Term Examination Schedule Released",
    content: "The Mid-Term Examination schedule for Grades 1-9 has been finalized. Examinations begin Monday, Week 5.",
    description: "The Mid-Term Examination schedule for Grades 1-9 has been finalized.",
    date: "2 hours ago",
    category: "Notice",
    color: "bg-indigo-50 text-indigo-600"
  },
  {
    id: "2",
    title: "Parent-Teacher Meeting This Friday",
    content: "All parents and guardians are invited to the Parent-Teacher meeting this Friday from 9:00 AM to 12:00 PM.",
    description: "All parents and guardians are invited to the Parent-Teacher meeting.",
    date: "1 day ago",
    category: "Event",
    color: "bg-emerald-50 text-emerald-600"
  },
  {
    id: "3",
    title: "School Canteen Menu Update",
    content: "New weekly menu available. Includes balanced nutrition for all grade levels with local fresh produce.",
    description: "New weekly menu available with balanced nutrition for all grade levels.",
    date: "3 days ago",
    category: "General",
    color: "bg-amber-50 text-amber-600"
  }
];

export const MESSAGES: MessageItem[] = [
  { id: "1", recipient: "All Parents", subject: "Mid-Term Exam Schedule", type: "Email", date: "Today, 09:15", status: "Delivered" },
  { id: "2", recipient: "Grade 6 Yellow", subject: "Field Trip Permission", type: "SMS", date: "Yesterday, 14:30", status: "Opened" },
  { id: "3", recipient: "All Staff", subject: "Staff Meeting Reminder", type: "Email", date: "Oct 24, 2024", status: "Delivered" }
];