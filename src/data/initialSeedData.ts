export const initialSeedData = {
  // --- LEARNERS & STUDENTS ---
  students: [
    { id: "1-001", admNo: "B002961576", name: "MUTWIKA KILONZO", fullName: "MUTWIKA KILONZO", grade: "Grade 7", stream: "VENUS", status: "Active" },
    { id: "1-002", admNo: "B004123291", name: "OCTEVIOR LUVISIA", fullName: "OCTEVIOR LUVISIA", grade: "Grade 6", stream: "Yellow", status: "Active" },
    { id: "1-003", admNo: "B004761829", name: "SAMWEL KAMAU WANJIKU", fullName: "SAMWEL KAMAU WANJIKU", grade: "Grade 6", stream: "Yellow", status: "Active" },
    { id: "1-006", admNo: "B004276095", name: "ALFRED JUMA", fullName: "ALFRED JUMA", grade: "Grade 6", stream: "East", status: "Active" },
    { id: "1-007", admNo: "B005110023", name: "BRIAN KIPTOO", fullName: "BRIAN KIPTOO", grade: "Grade 7", stream: "VENUS", status: "Suspended" },
    { id: "1-008", admNo: "B005233114", name: "MARY ATIENO", fullName: "MARY ATIENO", grade: "Grade 5", stream: "Blue", status: "Active" },
    { id: "1-009", admNo: "MUN-G6-001/2021", name: "SAMSON KIBET", fullName: "SAMSON KIBET", grade: "Grade 6", stream: "Blue", status: "Active" }
  ],
  learners: [],

  // --- EXAMS & ASSESSMENT MARKS ---
  exams: [
    // Add your exam definitions here (e.g., Opener Term 1, Mid Term)
  ],
  marks: [
    // Add recorded assessment marks here
  ],

  // --- LIBRARY MANAGEMENT ---
  libraryBooks: [
    // Add library book records (e.g., titles, ISBNs, quantities, issued status)
  ],

  // --- ICT & ASSET INVENTORY ---
  ictAssets: [
    // Add ICT items (e.g., laptops, tablets, projectors, serial numbers)
  ],

  // --- FINANCES & FEE TRACKING ---
  feeStructures: [],
  transactions: []
};

// Auto-alias learners array to match students
initialSeedData.learners = initialSeedData.students;

export const mockLearners = initialSeedData.learners;
export const mockStudents = initialSeedData.students;
export const mockExams = initialSeedData.exams;
export const mockMarks = initialSeedData.marks;
export const mockLibrary = initialSeedData.libraryBooks;
export const mockICT = initialSeedData.ictAssets;
export const mockFinances = initialSeedData.transactions;

export default initialSeedData;