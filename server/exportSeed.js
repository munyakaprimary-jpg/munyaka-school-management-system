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
    const teachingStaffCount = Array.isArray(dbData.staff) ? dbData.staff.filter((s: any) => s.role === 'teacher' || s.role === 'Teacher' || s.isTeacher || s.teaching).length : (Array.isArray(dbData.staff) ? dbData.staff.length : 0);
    const nonTeachingStaffCount = Array.isArray(dbData.staff) ? dbData.staff.length - teachingStaffCount : 0;
    const staffCount = Array.isArray(dbData.staff) ? dbData.staff.length : 0;
    const gradesCount = Array.isArray(dbData.grades) ? dbData.grades.length : 0;
    const streamsCount = Array.isArray(dbData.streams) ? dbData.streams.length : 0;

    console.log(`[ExportSeed] Source: ${foundPath || 'Default'}`);
    console.log(`[ExportSeed] Exported Learners: ${studentsCount}, Teaching Staff: ${teachingStaffCount}, Non-Teaching Staff: ${nonTeachingStaffCount}`);
    console.log(`[ExportSeed] Exported ${gradesCount} grades, ${streamsCount} streams`);

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

export const SEED_VERSION = "2026.09.25.PERSONNEL_v1";

export const initialLearners = initialSeedData.students || [];
export const initialStaff = initialSeedData.staff || [];
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
