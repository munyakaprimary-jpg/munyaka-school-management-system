/**
 * Server Seed Exporter Script
 * Extracts data across ALL school management modules and data entry menus
 * and serializes them into src/data/initialSeedData.ts with detailed summary counts.
 *
 * Run with: node server/exportSeed.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CENTRAL_DB_FILE = path.join(ROOT, 'server', 'data', 'central_db.json');
const OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'initialSeedData.ts');

function readCentralDb() {
  try {
    if (fs.existsSync(CENTRAL_DB_FILE)) {
      return JSON.parse(fs.readFileSync(CENTRAL_DB_FILE, 'utf8'));
    }
    const altPath = path.join(ROOT, 'data', 'central_db.json');
    if (fs.existsSync(altPath)) {
      return JSON.parse(fs.readFileSync(altPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Error reading central db:', e.message);
  }
  return {};
}

const db = readCentralDb();

// Extract categories across ALL school management modules & menus
const feeStructures = db.feeStructures || db.fees_structures || [
  { id: 'fs_1', grade: 'Grade 4', term: 'Term 1', tuitionFee: 12000, activityFee: 2500, lunchFee: 4500, total: 19000 }
];

const fees = db.fees || db.feePayments || db.transactions || [
  { id: 'fee_1', studentId: 'stu_1', studentName: 'Amina Kiprop', amount: 15000, term: 'Term 1', date: '2026-01-10', status: 'Completed' }
];

const examTypes = db.examTypes || [
  { id: 'et_1', name: 'Formative Assessment', weight: 30 },
  { id: 'et_2', name: 'Mid-Term Exam', weight: 30 },
  { id: 'et_3', name: 'End-Term Exam', weight: 40 }
];

const exams = db.exams || db.assessments || [
  { id: 'asm_1', title: 'Grade 4 Mathematics Opener', subject: 'Mathematics', classLevel: 'Grade 4', totalMarks: 50, duration: 60, status: 'published', questions: [] }
];

const studyCorner = db.studyCorner || db.studyMaterials || db.revisionGuides || [
  { id: 'sc_1', title: 'Grade 4 Science Revision Notes', subject: 'Science & Technology', category: 'class_notes', fileUrl: '#' }
];

const libraryBooks = db.libraryBooks || db.library || [
  { id: 'lib_1', title: 'Secondary Mathematics Bk 1', author: 'KLB', isbn: '978-9966-10-001-1', totalCopies: 10, availableCopies: 8 }
];

const libraryLogs = db.libraryLogs || db.bookIssues || [
  { id: 'log_1', bookId: 'lib_1', studentId: 'stu_1', issuedDate: '2026-02-01', dueDate: '2026-02-15', status: 'issued' }
];

const grades = db.grades || {
  "PP1": ["Stream A"],
  "PP2": ["Stream A"],
  "Grade 1": ["East", "West"],
  "Grade 2": ["East", "West"],
  "Grade 3": ["North", "South"],
  "Grade 4": ["Green", "Blue"],
  "Grade 5": ["Green", "Blue"],
  "Grade 6": ["Gold", "Silver"],
  "Grade 7": ["Alpha", "Beta"],
  "Grade 8": ["Alpha", "Beta"],
  "Grade 9": ["Alpha", "Beta"]
};

const streams = db.streams || ["Green", "Blue", "East", "West", "North", "South", "Gold", "Silver", "Alpha", "Beta"];

const learningAreas = db.learningAreas || [
  { id: 'la_1', name: 'Mathematics', tier: 'upper-primary' },
  { id: 'la_2', name: 'English Language', tier: 'upper-primary' },
  { id: 'la_3', name: 'Kiswahili', tier: 'upper-primary' },
  { id: 'la_4', name: 'Science & Technology', tier: 'upper-primary' }
];

const staff = db.staff || db.users || [
  { id: 'st_1', name: 'Teacher John Mwangi', role: 'teacher', department: 'ACADEMIC', staffCategory: 'TEACHING', email: 'john@munyaka.sc.ke' }
];

const students = db.students || db.learners || [
  { id: 'stu_1', admissionNumber: 'MUN/2026/001', name: 'Amina Kiprop', grade: 'Grade 4', stream: 'Green', gender: 'Female' }
];

const attendance = db.attendance || {
  '2026-02-10': { 'stu_1': 'present' }
};

const marks = db.marks || db.assessmentResults || {
  'asm_1': { 'stu_1': { score: 45, maxScore: 50, grade: 'EE' } }
};

const reportCards = db.reportCards || [];
const ictLabEquipment = db.ictLabEquipment || [];
const scienceLabInventory = db.scienceLabInventory || [];
const storeInventory = db.storeInventory || [];
const schoolSettings = db.schoolSettings || { schoolName: 'Munyaka School', county: 'Uasin Gishu' };

const fullSeedObject = {
  version: 'v2.6.0',
  generatedAt: new Date().toISOString(),
  feeStructures,
  fees,
  examTypes,
  exams,
  studyCorner,
  libraryBooks,
  libraryLogs,
  grades,
  streams,
  learningAreas,
  staff,
  students,
  attendance,
  marks,
  reportCards,
  ictLabEquipment,
  scienceLabInventory,
  storeInventory,
  schoolSettings,
};

const tsContent = `/**
 * AUTO-GENERATED SEED DATA FOR MUNYAKA SCHOOL MANAGEMENT SYSTEM
 * Generated at: ${fullSeedObject.generatedAt}
 * DO NOT EDIT DIRECTLY — Run "npm run export-seed" on the backend server to regenerate.
 */

export const initialFeeStructures = ${JSON.stringify(feeStructures, null, 2)};
export const initialFees = ${JSON.stringify(fees, null, 2)};
export const initialExamTypes = ${JSON.stringify(examTypes, null, 2)};
export const initialExams = ${JSON.stringify(exams, null, 2)};
export const initialStudyCorner = ${JSON.stringify(studyCorner, null, 2)};
export const initialLibrary = ${JSON.stringify(libraryBooks, null, 2)};
export const initialLibraryLogs = ${JSON.stringify(libraryLogs, null, 2)};
export const initialGrades = ${JSON.stringify(grades, null, 2)};
export const initialStreams = ${JSON.stringify(streams, null, 2)};
export const initialLearningAreas = ${JSON.stringify(learningAreas, null, 2)};
export const initialStaff = ${JSON.stringify(staff, null, 2)};
export const initialStudents = ${JSON.stringify(students, null, 2)};
export const initialLearners = initialStudents;
export const initialAttendance = ${JSON.stringify(attendance, null, 2)};
export const initialMarks = ${JSON.stringify(marks, null, 2)};
export const initialReportCards = ${JSON.stringify(reportCards, null, 2)};
export const initialIctLabEquipment = ${JSON.stringify(ictLabEquipment, null, 2)};
export const initialScienceLabInventory = ${JSON.stringify(scienceLabInventory, null, 2)};
export const initialStoreInventory = ${JSON.stringify(storeInventory, null, 2)};
export const initialSchoolSettings = ${JSON.stringify(schoolSettings, null, 2)};

export const initialSeedData = {
  version: "${fullSeedObject.version}",
  generatedAt: "${fullSeedObject.generatedAt}",
  feeStructures: initialFeeStructures,
  fees: initialFees,
  examTypes: initialExamTypes,
  exams: initialExams,
  studyCorner: initialStudyCorner,
  libraryBooks: initialLibrary,
  libraryLogs: initialLibraryLogs,
  grades: initialGrades,
  streams: initialStreams,
  learningAreas: initialLearningAreas,
  staff: initialStaff,
  students: initialStudents,
  learners: initialStudents,
  attendance: initialAttendance,
  marks: initialMarks,
  reportCards: initialReportCards,
  ictLabEquipment: initialIctLabEquipment,
  scienceLabInventory: initialScienceLabInventory,
  storeInventory: initialStoreInventory,
  schoolSettings: initialSchoolSettings,
};

export const INITIAL_SEED_DATA = initialSeedData;
export const mockLearners = initialStudents;
export const mockStudents = initialStudents;
export const mockStaff = initialStaff;
export const mockExams = initialExams;
export const mockLibrary = initialLibrary;
export const mockFinances = initialFees;

export default initialSeedData;
`;

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf8');

console.log('======================================================');
console.log(' 🚀 MUNYAKA SEED EXPORT SUMMARY (npm run export-seed) ');
console.log('======================================================');
console.log(` • Fee Structures        : ${feeStructures.length} records`);
console.log(` • Fee Payments / Fees   : ${fees.length} records`);
console.log(` • Exam Types            : ${examTypes.length} records`);
console.log(` • Exam Schedules / Exams: ${exams.length} records`);
console.log(` • Study Corner Materials: ${studyCorner.length} records`);
console.log(` • Library Book Inventory: ${libraryBooks.length} records`);
console.log(` • Library Issue Logs    : ${libraryLogs.length} records`);
console.log(` • Academic Grades       : ${Object.keys(grades).length} grade levels`);
console.log(` • Streams               : ${streams.length} streams`);
console.log(` • Learning Areas        : ${learningAreas.length} subjects`);
console.log(` • Personnel & Staff     : ${staff.length} staff records`);
console.log(` • Learners / Students   : ${students.length} student records`);
console.log(` • Attendance Records    : ${Object.keys(attendance).length} dates`);
console.log(` • Assessment Marks      : ${Object.keys(marks).length} assessments`);
console.log(` • Report Cards          : ${reportCards.length} records`);
console.log(` • ICT Lab Equipment     : ${ictLabEquipment.length} items`);
console.log(` • Science Lab Inventory : ${scienceLabInventory.length} items`);
console.log(` • Store Inventory       : ${storeInventory.length} items`);
console.log(` • School Settings       : Loaded`);
console.log('======================================================');
console.log(`✅ Successfully generated ${OUTPUT_FILE}`);
