export const STUDENTS = [
  { id: "1", name: "Brian Kiptoo", assessment: "A827361", grade: "4", stream: "Blue", gender: "M" },
  { id: "2", name: "Mary Atieno", assessment: "A827362", grade: "4", stream: "Blue", gender: "F" },
  { id: "3", name: "Emmanuel Maina", assessment: "A827363", grade: "4", stream: "Green", gender: "M" },
  { id: "4", name: "Sheila Chepkoech", assessment: "A827364", grade: "5", stream: "Alpha", gender: "F" },
  { id: "5", name: "David Mutua", assessment: "A827365", grade: "5", stream: "Alpha", gender: "M" },
];

export const STAFF = [
  { id: "1", name: "Jane Mwangi", role: "Class Teacher", subjects: ["Math", "Science"], status: "Active" },
  { id: "2", name: "Peter Kamau", role: "Senior Teacher", subjects: ["English", "CRE"], status: "Active" },
  { id: "3", name: "Sarah Chebet", role: "Junior School Lead", subjects: ["Pre-Tech", "Agri"], status: "On Leave" },
  { id: "4", name: "John Onyango", role: "Head Teacher", subjects: ["Administration"], status: "Active" },
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