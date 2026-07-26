export const STUDENTS = [
  { id: "1", name: "Brian Kiptoo", assessment: "A827361", grade: "4", stream: "Blue", gender: "M", dob: "2014-05-12", guardian: "Samuel Kiptoo", phone: "+254 712 000 111", email: "sam.kiptoo@email.com", health: "None", needs: "None" },
  { id: "2", name: "Mary Atieno", assessment: "A827362", grade: "4", stream: "Blue", gender: "F", dob: "2014-08-20", guardian: "Grace Atieno", phone: "+254 712 000 222", email: "g.atieno@email.com", health: "Asthma", needs: "None" },
  { id: "3", name: "Emmanuel Maina", assessment: "A827363", grade: "4", stream: "Green", gender: "M", dob: "2014-03-15", guardian: "David Maina", phone: "+254 712 000 333", email: "d.maina@email.com", health: "None", needs: "Vision Support" },
  { id: "4", name: "Sheila Chepkoech", assessment: "A827364", grade: "5", stream: "Alpha", gender: "F", dob: "2013-11-05", guardian: "Rose Chep", phone: "+254 712 000 444", email: "rose.chep@email.com", health: "None", needs: "None" },
  { id: "5", name: "David Mutua", assessment: "A827365", grade: "5", stream: "Alpha", gender: "M", dob: "2013-09-28", guardian: "John Mutua", phone: "+254 712 000 555", email: "j.mutua@email.com", health: "Allergy: Peanuts", needs: "None" },
];

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

export const STAFF = [
  { id: "1", name: "Jane Mwangi", role: "Class Teacher", subjects: ["Math", "Science"], status: "Active", joined: "Jan 2020", id_no: "28374615", phone: "+254 700 111 222", email: "j.mwangi@munyaka.sc.ke" },
  { id: "2", name: "Peter Kamau", role: "Senior Teacher", subjects: ["English", "CRE"], status: "Active", joined: "May 2018", id_no: "24556122", phone: "+254 700 333 444", email: "p.kamau@munyaka.sc.ke" },
  { id: "3", name: "Sarah Chebet", role: "Junior School Lead", subjects: ["Pre-Tech", "Agri"], status: "On Leave", joined: "Feb 2021", id_no: "30112233", phone: "+254 700 555 666", email: "s.chebet@munyaka.sc.ke" },
  { id: "4", name: "John Onyango", role: "Head Teacher", subjects: ["Administration"], status: "Active", joined: "Jan 2015", id_no: "12334455", phone: "+254 700 777 888", email: "headteacher@munyaka.sc.ke" },
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