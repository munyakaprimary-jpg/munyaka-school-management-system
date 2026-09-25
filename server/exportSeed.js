import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CENTRAL_DB_FILES = [
  path.join(ROOT, 'server', 'data', 'central_db.json'),
  path.join(ROOT, 'server', 'central_db.json'),
  path.join(ROOT, 'data', 'central_db.json'),
  path.join(ROOT, 'src', 'data', 'central_db.json'),
  path.join(ROOT, 'server', 'data', 'users.json'),
  path.join(ROOT, 'server', 'db.json')
];

const INITIAL_SEED_FILE = path.join(ROOT, 'src', 'data', 'initialSeedData.ts');
const BACKUP_SEED_FILE = path.join(ROOT, 'src', 'services', 'initialSeedData.ts');

function exportSeed() {
  try {
    let dbData = null;
    let foundPath = '';

    // 1. Try finding external JSON database files
    for (const filePath of CENTRAL_DB_FILES) {
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.students?.length > 0 || parsed.staff?.length > 0 || parsed.users?.length > 0 || (Array.isArray(parsed) && parsed.length > 0))) {
            dbData = parsed;
            foundPath = filePath;
            break;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    // 2. If no external JSON with records was found, parse existing initialSeedData.ts files
    if (!dbData || (!dbData.students?.length && !dbData.staff?.length)) {
      for (const seedPath of [INITIAL_SEED_FILE, BACKUP_SEED_FILE]) {
        if (fs.existsSync(seedPath)) {
          try {
            const content = fs.readFileSync(seedPath, 'utf8');
            // Match export const initialSeedData = { ... };
            const match = content.match(/export const initialSeedData\s*=\s*(\{[\s\S]*?\});/);
            if (match && match[1]) {
              // Safely evaluate object literal
              const evaluated = eval('(' + match[1] + ')');
              if (evaluated && (evaluated.students?.length > 0 || evaluated.staff?.length > 0)) {
                dbData = evaluated;
                foundPath = seedPath;
                break;
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    // 3. Final fallback: ensure we have populated default arrays if absolutely nothing was found
    if (!dbData) {
      dbData = {
        students: [],
        staff: [],
        grades: [],
        streams: [],
        classAssignments: [],
        attendance: {},
        fees: [],
        examTypes: [],
        libraryBooks: [],
        feeStructures: [],
        notices: [],
        settings: {}
      };
    }

    if (!dbData.staff && dbData.users) {
      dbData.staff = dbData.users;
    }

    const studentsCount = Array.isArray(dbData.students) ? dbData.students.length : 0;
    const teachingStaffCount = Array.isArray(dbData.staff) ? dbData.staff.filter((s) => s.role === 'teacher' || s.role === 'Teacher' || s.isTeacher || s.teaching).length : (Array.isArray(dbData.staff) ? dbData.staff.length : 0);
    const nonTeachingStaffCount = Array.isArray(dbData.staff) ? dbData.staff.length - teachingStaffCount : 0;
    const staffCount = Array.isArray(dbData.staff) ? dbData.staff.length : 0;
    const gradesCount = Array.isArray(dbData.grades) ? dbData.grades.length : 0;
    const streamsCount = Array.isArray(dbData.streams) ? dbData.streams.length : 0;
    const attendanceRecordsCount = dbData.attendance ? (Array.isArray(dbData.attendance) ? dbData.attendance.length : Object.keys(dbData.attendance).length) : 0;
    const ictCount = Array.isArray(dbData.ictEquipment || dbData.ictLabEquipment) ? (dbData.ictEquipment || dbData.ictLabEquipment).length : 0;
    const scienceCount = Array.isArray(dbData.scienceInventory || dbData.scienceLabInventory) ? (dbData.scienceInventory || dbData.scienceLabInventory).length : 0;
    const storeCount = Array.isArray(dbData.storeInventory || dbData.storeStock) ? (dbData.storeInventory || dbData.storeStock).length : 0;
    const settingsObj = dbData.settings || dbData.schoolSettings || {};
    const settingsCount = Object.keys(settingsObj).length;
    const institutionName = settingsObj.schoolName || settingsObj.name || settingsObj.institutionName || 'Munyaka School';
    const noticesCount = Array.isArray(dbData.notices || dbData.munyaka_notices) ? (dbData.notices || dbData.munyaka_notices).length : 0;
    const eventsCount = Array.isArray(dbData.events || dbData.munyaka_events) ? (dbData.events || dbData.munyaka_events).length : 0;
    const examsCount = Array.isArray(dbData.exams || dbData.all_set_exams || dbData.question_bank) ? (dbData.exams || dbData.all_set_exams || dbData.question_bank).length : 0;
    const examSchedulesCount = Array.isArray(dbData.examSchedules || dbData.assessment_schedules) ? (dbData.examSchedules || dbData.assessment_schedules).length : 0;
    const examTypesCount = Array.isArray(dbData.examTypes || dbData.exam_types) ? (dbData.examTypes || dbData.exam_types).length : 0;
    const marksCount = Array.isArray(dbData.marks || dbData.assessments || dbData.marked_student_submissions) ? (dbData.marks || dbData.assessments || dbData.marked_student_submissions).length : 0;
    const questionsCount = Array.isArray(dbData.questions || dbData.question_bank) ? (dbData.questions || dbData.question_bank).length : 0;

    console.log(`[ExportSeed] Source: ${foundPath || 'Default'}`);
    console.log(`[ExportSeed] Exported Learners: ${studentsCount}, Teaching Staff: ${teachingStaffCount}, Non-Teaching Staff: ${nonTeachingStaffCount}`);
    console.log(`[ExportSeed] Exported ${gradesCount} grades, ${streamsCount} streams`);
    console.log(`[ExportSeed] Exported Attendance Records: ${attendanceRecordsCount}`);
    console.log(`[ExportSeed] Exported ICT Equipment: ${ictCount}, Science Inventory: ${scienceCount}, Store Stock: ${storeCount}`);
    console.log(`[ExportSeed] Exported Institution Name: "${institutionName}", Settings Fields Count: ${settingsCount}`);
    console.log(`[ExportSeed] Exported Notices: ${noticesCount}, Events: ${eventsCount}`);
    console.log(`[ExportSeed] Exported Exams: ${examsCount}, Schedules: ${examSchedulesCount}, Exam Types: ${examTypesCount}, Marks: ${marksCount}`);

    const fileContent = `export const DEFAULT_CBC_CLUSTERS = [
  {
    id: "cluster_1",
    name: "Languages & Literacy",
    description: "English, Kiswahili, Indigenous Languages, Foreign Languages",
    color: "bg-indigo-500",
    icon: "BookOpen",
    learningAreas: [
      { id: "la_eng", name: "English Language Activities", code: "ENG-01", category: "Core", gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] },
      { id: "la_kisw", name: "Kiswahili Language Activities", code: "KISW-01", category: "Core", gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] }
    ]
  },
  {
    id: "cluster_2",
    name: "Mathematics & Science",
    description: "Mathematics, Integrated Science, Health Education",
    color: "bg-emerald-500",
    icon: "Calculator",
    learningAreas: [
      { id: "la_math", name: "Mathematics Activities", code: "MATH-01", category: "Core", gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] },
      { id: "la_sci", name: "Integrated Science", code: "SCI-01", category: "Core", gradeLevels: ["Grade 4", "Grade 5", "Grade 6"] }
    ]
  }
];

export const buildDefaultClusters = () => DEFAULT_CBC_CLUSTERS;

export const initialSeedData = ${JSON.stringify(dbData, null, 2)};

(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;

export const SEED_VERSION = "2026.09.25.FULL_PORTAL_v1";

export const initialAttendance = (initialSeedData as any).attendance || {};
export const initialIctEquipment = (initialSeedData as any).ictEquipment || (initialSeedData as any).ictLabEquipment || [];
export const initialScienceInventory = (initialSeedData as any).scienceInventory || (initialSeedData as any).scienceLabInventory || [];
export const initialStoreInventory = (initialSeedData as any).storeInventory || (initialSeedData as any).storeStock || [];
export const initialSettings = (initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {};
export const initialNotices = (initialSeedData as any).notices || (initialSeedData as any).munyaka_notices || [];
export const initialEvents = [];
export const initialExams = (initialSeedData as any).exams || (initialSeedData as any).all_set_exams || (initialSeedData as any).question_bank || [];
export const initialExamSchedules = (initialSeedData as any).examSchedules || (initialSeedData as any).assessment_schedules || [];
export const initialExamTypes = (initialSeedData as any).examTypes || (initialSeedData as any).exam_types || [];
export const initialMarks = (initialSeedData as any).marks || (initialSeedData as any).assessments || (initialSeedData as any).marked_student_submissions || [];
export const initialQuestions = (initialSeedData as any).questions || (initialSeedData as any).question_bank || [];
export const initialLearners = initialSeedData.students || [];
export const initialStaff = initialSeedData.staff || [];
export const initialReportCards = (initialSeedData as any).reportCards || [];
export const initialFeeStructures = (initialSeedData as any).feeStructures || (initialSeedData as any).fees_structures || [];
export const initialFeePayments = (initialSeedData as any).fees || (initialSeedData as any).payments || [];
export const initialStudyCorner = (initialSeedData as any).studyCorner || (initialSeedData as any).study_materials || [];
export const initialLibraryBooks = (initialSeedData as any).libraryBooks || (initialSeedData as any).library_books || [];
export const initialLibraryLogs = (initialSeedData as any).libraryLogs || (initialSeedData as any).library_logs || [];
export const mockLearners = initialSeedData.students || [];
export const mockStudents = initialSeedData.students || [];
export const mockStaff = initialSeedData.staff || [];
export const initialGrades = (initialSeedData as any).grades || [];
export const initialStreams = (initialSeedData as any).streams || [];
export const initialClassAssignments = (initialSeedData as any).classAssignments || [];
export const mockExams = (initialSeedData as any).exams || [];
export const mockLibrary = (initialSeedData as any).libraryBooks || [];
export const mockFinances = (initialSeedData as any).fees || [];

export default initialSeedData;
`;

    fs.writeFileSync(INITIAL_SEED_FILE, fileContent, 'utf8');
    console.log(`[ExportSeed] Successfully generated and exported data to ${INITIAL_SEED_FILE}`);
  } catch (err) {
    console.error('[ExportSeed] Error exporting seed data:', err);
    process.exit(1);
  }
}

exportSeed();
