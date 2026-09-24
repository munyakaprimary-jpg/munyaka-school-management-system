import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CENTRAL_DB_FILES = [
  path.join(ROOT, 'server', 'data', 'central_db.json'),
  path.join(ROOT, 'server', 'central_db.json'),
  path.join(ROOT, 'src', 'data', 'central_db.json'),
  path.join(ROOT, 'data', 'central_db.json')
];

const INITIAL_SEED_FILE = path.join(ROOT, 'src', 'data', 'initialSeedData.ts');

function exportSeed() {
  try {
    let dbData = null;
    let foundPath = '';

    for (const filePath of CENTRAL_DB_FILES) {
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.students || parsed.staff || parsed.users || Array.isArray(parsed))) {
            dbData = parsed;
            foundPath = filePath;
            break;
          }
        } catch (e) {
          // Ignore and continue searching
        }
      }
    }

    if (!dbData) {
      console.warn('[ExportSeed] No active central_db.json found. Falling back to default empty structure.');
      dbData = {
        students: [],
        staff: [],
        attendance: {},
        fees: [],
        grades: {},
        examTypes: [],
        libraryBooks: [],
        feeStructures: [],
        notices: [],
        settings: {}
      };
    } else {
      console.log(`[ExportSeed] Found active database at: ${foundPath}`);
      if (!dbData.staff && dbData.users) {
        dbData.staff = dbData.users;
      }
    }

    const studentsCount = Array.isArray(dbData.students) ? dbData.students.length : 0;
    const staffCount = Array.isArray(dbData.staff) ? dbData.staff.length : (Array.isArray(dbData.users) ? dbData.users.length : 0);
    const marksCount = dbData.grades && typeof dbData.grades === 'object' ? Object.keys(dbData.grades).length : 0;

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

export const mockLearners = initialSeedData.students || [];
export const mockStudents = initialSeedData.students || [];
export const mockStaff = initialSeedData.staff || [];
export const mockExams = (initialSeedData as any).exams || [];
export const mockLibrary = (initialSeedData as any).libraryBooks || [];
export const mockFinances = (initialSeedData as any).fees || [];

export default initialSeedData;
`;

    fs.writeFileSync(INITIAL_SEED_FILE, fileContent, 'utf8');
    console.log(`[ExportSeed] Exported ${staffCount} staff, ${studentsCount} students, ${marksCount} marks records to ${INITIAL_SEED_FILE}`);
  } catch (err) {
    console.error('[ExportSeed] Error exporting seed data:', err);
    process.exit(1);
  }
}

exportSeed();
