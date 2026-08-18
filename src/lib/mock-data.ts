import { sortGrades } from '@/utils/gradeSort';

export const STUDENTS = [
  { id: "1", name: "Brian Kiptoo", assessment: "A827361", grade: "4", stream: "Blue", gender: "M", dob: "2014-05-12", guardian: "Samuel Kiptoo", phone: "+254 712 000 111", email: "sam.kiptoo@email.com", health: "None", needs: "None", feeBalance: 0, status: "Active", dateOfAdmission: "2020-01-15", coCurricularActivities: "Football team captain, Science fair winner" },
  { id: "2", name: "Mary Atieno", assessment: "A827362", grade: "4", stream: "Blue", gender: "F", dob: "2014-08-20", guardian: "Grace Atieno", phone: "+254 712 000 222", email: "g.atieno@email.com", health: "Asthma", needs: "None", feeBalance: 0, status: "Active", dateOfAdmission: "2020-01-15", coCurricularActivities: "Choir member, Debate team" },
  { id: "3", name: "Emmanuel Maina", assessment: "A827363", grade: "4", stream: "Green", gender: "M", dob: "2014-03-15", guardian: "David Maina", phone: "+254 712 000 333", email: "d.maina@email.com", health: "None", needs: "Vision Support", feeBalance: 5000, status: "Active", dateOfAdmission: "2020-01-15", coCurricularActivities: "Drama club, Chess team" },
  { id: "4", name: "Sheila Chepkoech", assessment: "A827364", grade: "5", stream: "Alpha", gender: "F", dob: "2013-11-05", guardian: "Rose Chep", phone: "+254 712 000 444", email: "rose.chep@email.com", health: "None", needs: "None", feeBalance: 0, status: "Active", dateOfAdmission: "2019-01-15", coCurricularActivities: "Athletics, Student council" },
  { id: "5", name: "David Mutua", assessment: "A827365", grade: "5", stream: "Alpha", gender: "M", dob: "2013-09-28", guardian: "John Mutua", phone: "+254 712 000 555", email: "j.mutua@email.com", health: "Allergy: Peanuts", needs: "None", feeBalance: 3000, status: "Active", dateOfAdmission: "2019-01-15", coCurricularActivities: "Music, Drama club" },
];

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

import { sortGrades } from '@/utils/gradeSort';

export const GRADES_DATA: Grade[] = sortGrades([
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
      { id: "s6a", name: "Alpha", teacher: "Unassigned", studentsCount: 38 },
      { id: "s6b", name: "Beta", teacher: "Unassigned", studentsCount: 35 }
    ]
  },
  {
    id: "g7",
    name: "Grade 7",
    category: "Junior School",
    streams: [
      { id: "s7", name: "Alpha", teacher: "Peter Omondi", studentsCount: 45 },
      { id: "s8", name: "Beta", teacher: "Unassigned", studentsCount: 31 }
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
].map(g => ({ ...g, name: formatGradeName(g.name) })));

export const BOOKS = [
  { id: "1", title: "Spark: English Grade 4", author: "Oxford", isbn: "978-019", category: "Core Text", stock: 120, borrowed: 85 },
  { id: "2", title: "KLB Mathematics Grade 5", author: "KLB", isbn: "978-9966", category: "Core Text", stock: 150, borrowed: 142 },
  { id: "3", title: "Dunia Yetu: Kiswahili", author: "Longhorn", isbn: "978-9977", category: "Reference", stock: 45, borrowed: 12 },
  { id: "4", title: "Science in Action", author: "Pearson", isbn: "978-0321", category: "Supplementary", stock: 60, borrowed: 58 },
];

export const MESSAGES = [
  { id: "1", recipient: "All Parents", subject: "Fee Balance Reminder", type: "SMS", date: "Oct 18, 2024", status: "Delivered" },
  { id: "2", recipient: "Grade 4 Blue", subject: "Trip to Museum", type: "Email", date: "Oct 16, 2024", status: "Opened" },
  { id: "3", recipient: "Samuel Kiptoo", subject: "Disciplinary Notice", type: "SMS", date: "Oct 15, 2024", status: "Delivered" },
];

export const NOTICES = [
  { id: "1", title: "Half-Term Break", content: "School will close on Friday 20th Oct for a one-week break.", date: "Oct 15, 2024", category: "Urgent", color: "bg-red-50 text-red-600" },
  { id: "2", title: "Sports Day 2024", content: "All parents are invited to the annual sports day on Nov 5th.", date: "Oct 12, 2024", category: "Event", color: "bg-blue-50 text-blue-600" },
  { id: "3", title: "CBC Materials Needed", description: "Grade 4 learners require clay for Creative Arts next week.", date: "Oct 10, 2024", category: "Notice", color: "bg-emerald-50 text-emerald-600" },
];

export const INVENTORY = [
  { id: "1", item: "Jembes (Small)", category: "Agriculture", qty: 45, status: "Available", color: "text-emerald-600" },
  { id: "2", item: "Science Kits", category: "Science & Tech", qty: 12, status: "Low Stock", color: "text-amber-600" },
  { id: "3", item: "Music Keyboards", category: "Creative Arts", qty: 8, status: "Available", color: "text-purple-600" },
  { id: "4", item: "Grade 4 English Textbooks", category: "Library", qty: 120, status: "In Use", color: "text-blue-600" },
];

export const ASSET_LOGS = [
  { id: 1, item: "Science Kit #04", issuedTo: "Unassigned", date: "Oct 18, 2024", dateReturned: undefined, status: "In Use" },
  { id: 2, item: "Music Keyboard #01", issuedTo: "Brian Kiptoo", date: "Oct 17, 2024", dateReturned: "Oct 20, 2024", status: "Returned" },
  { id: 3, item: "Jembe #22", issuedTo: "Grade 4 Blue", date: "Oct 19, 2024", dateReturned: undefined, status: "In Use" },
];

export interface StaffMember {
  id: string;
  id_no: string;
  tsc_no?: string;
  name: string;
  role: string;
  subjects: string[];
  phone: string;
  email: string;
  status: 'Active' | 'Pre-Registered' | 'Suspended';
  joined: string;
  department: string;
}

export const STAFF: StaffMember[] = [
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
    department: "Mathematics & Science"
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
    department: "Languages & Humanities"
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
    department: "Technical & Vocational"
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
    department: "Languages & Humanities"
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
    department: "School Administration"
  }
];

export const EVENTS = [
  { id: 1, title: "Staff Meeting", date: "2024-10-25", time: "02:00 PM", type: "Internal" },
  { id: 2, title: "Music Festival", date: "2024-11-02", time: "08:00 AM", type: "County" },
  { id: 3, title: "End of Term Exams", date: "2024-11-15", time: "All Day", type: "Academic" },
];

export const TIMETABLE = [
  { time: "08:00 - 08:30", mon: "Assembly", tue: "Pastoral", wed: "Assembly", thu: "Pastoral", fri: "Assembly" },
  { time: "08:30 - 09:10", mon: "Mathematics", tue: "English", wed: "Kiswahili", thu: "Science", fri: "Creative Arts" },
  { time: "09:10 - 09:50", mon: "Mathematics", tue: "English", wed: "Kiswahili", thu: "Science", fri: "Creative Arts" },
  { time: "09:50 - 10:30", mon: "English", tue: "Mathematics", wed: "Science", thu: "Kiswahili", fri: "Social Studies" },
  { time: "10:30 - 11:00", mon: "BREAK", tue: "BREAK", wed: "BREAK", thu: "BREAK", fri: "BREAK" },
  { time: "11:00 - 11:40", mon: "Physical Ed", tue: "Pre-Tech", wed: "Agri", thu: "Nutrition", fri: "Library" },
];

export const ATTENDANCE_TREND = [
  { day: "Mon", rate: 94 },
  { day: "Tue", rate: 96 },
  { day: "Wed", rate: 92 },
  { day: "Thu", rate: 95 },
  { day: "Fri", rate: 91 },
];

export const FEES_DATA = [
  { id: "1", student: "Brian Kiptoo", total: 15000, paid: 12000, status: "Partial" },
  { id: "2", student: "Mary Atieno", total: 15000, paid: 15000, status: "Cleared" },
  { id: "3", student: "Emmanuel Maina", total: 15000, paid: 5000, status: "Pending" },
];

export const TRANSACTIONS = [
  { id: "TX-901", date: "Oct 12, 2024", amount: 5000, method: "M-Pesa", ref: "RI82JD91S", category: "Tuition" },
  { id: "TX-882", date: "Sep 28, 2024", amount: 2000, method: "Bank Deposit", ref: "DEP-2938", category: "Activity" },
  { id: "TX-750", date: "Aug 15, 2024", amount: 5000, method: "M-Pesa", ref: "QH12LK34P", category: "Tuition" },
];
