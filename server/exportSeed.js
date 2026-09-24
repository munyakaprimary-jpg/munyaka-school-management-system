import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CENTRAL_DB_FILE = path.join(ROOT, 'data', 'central_db.json');
const INITIAL_SEED_FILE = path.join(ROOT, 'src', 'data', 'initialSeedData.ts');

function exportSeed() {
  try {
    let dbData = {};
    if (fs.existsSync(CENTRAL_DB_FILE)) {
      dbData = JSON.parse(fs.readFileSync(CENTRAL_DB_FILE, 'utf8'));
    } else {
      console.warn('[ExportSeed] data/central_db.json not found. Using fallback empty structure.');
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
    }

    const fileContent = `export const initialSeedData = ${JSON.stringify(dbData, null, 2)};

(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;

export const mockLearners = initialSeedData.students;
export const mockStudents = initialSeedData.students;
export const mockStaff = initialSeedData.staff;
export const mockExams = (initialSeedData as any).exams || [];
export const mockLibrary = (initialSeedData as any).libraryBooks || [];
export const mockFinances = (initialSeedData as any).fees || [];

export default initialSeedData;
`;

    fs.writeFileSync(INITIAL_SEED_FILE, fileContent, 'utf8');
    console.log(`[ExportSeed] Successfully exported central_db.json to ${INITIAL_SEED_FILE}`);
  } catch (err) {
    console.error('[ExportSeed] Error exporting seed data:', err);
    process.exit(1);
  }
}

exportSeed();
