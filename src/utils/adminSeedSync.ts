import { toast } from "@/components/ui/use-toast";

/**
 * Gathers all active database entities from localStorage and creates a formatted JSON snapshot
 * string that can be used to update initialSeedData.ts or downloaded as a seed file.
 */
export function generateAdminSeedSnapshot(): { seedCode: string; stats: Record<string, number> } {
  const students = JSON.parse(localStorage.getItem('munyaka_students') || localStorage.getItem('learners') || '[]');
  const staff = JSON.parse(localStorage.getItem('munyaka_staff') || localStorage.getItem('staff') || '[]');
  const exams = JSON.parse(localStorage.getItem('all_set_exams') || localStorage.getItem('exams') || '[]');
  const questions = JSON.parse(localStorage.getItem('question_bank') || localStorage.getItem('questions') || '[]');
  const examSchedules = JSON.parse(localStorage.getItem('examSchedules') || '[]');
  const examTypes = JSON.parse(localStorage.getItem('munyaka_exam_types') || '[]');
  const marks = JSON.parse(localStorage.getItem('marked_student_submissions') || localStorage.getItem('marks') || '[]');
  const fees = JSON.parse(localStorage.getItem('munyaka_payments') || localStorage.getItem('munyaka_fees') || localStorage.getItem('fees') || '[]');
  const feeStructures = JSON.parse(localStorage.getItem('munyaka_fee_structures') || '[]');
  const libraryBooks = JSON.parse(localStorage.getItem('munyaka_library_books') || localStorage.getItem('libraryBooks') || '[]');
  const libraryLogs = JSON.parse(localStorage.getItem('munyaka_library_borrowings') || '[]');
  const scienceInventory = JSON.parse(localStorage.getItem('munyaka_science_lab') || '[]');
  const ictEquipment = JSON.parse(localStorage.getItem('munyaka_ict_lab') || '[]');
  const storeInventory = JSON.parse(localStorage.getItem('munyaka_store_items') || '[]');
  const attendance = JSON.parse(localStorage.getItem('munyaka_attendance') || '{}');
  const settings = JSON.parse(localStorage.getItem('munyaka_system_settings_v3') || localStorage.getItem('settings') || '{}');
  const notices = JSON.parse(localStorage.getItem('munyaka_notices') || '[]');
  const reportCards = JSON.parse(localStorage.getItem('munyaka_report_cards') || '[]');
  const studyCorner = JSON.parse(localStorage.getItem('munyaka_study_materials') || '[]');
  const grades = JSON.parse(localStorage.getItem('munyaka_grades') || '[]');
  const streams = JSON.parse(localStorage.getItem('munyaka_streams') || '[]');

  const snapshotObj = {
    students,
    staff,
    exams,
    questions,
    examSchedules,
    examTypes,
    marks,
    fees,
    feeStructures,
    libraryBooks,
    libraryLogs,
    scienceInventory,
    ictEquipment,
    storeInventory,
    attendance,
    settings,
    notices,
    reportCards,
    studyCorner,
    grades,
    streams
  };

  const newVersion = `BUILD_${Date.now()}`;

  const seedCode = `export const DEFAULT_CBC_CLUSTERS = [
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

export const initialSeedData = ${JSON.stringify(snapshotObj, null, 2)};

(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;

export const SEED_VERSION = "${newVersion}";

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

  const stats = {
    students: students.length,
    staff: staff.length,
    exams: exams.length,
    marks: marks.length,
    fees: fees.length,
    libraryBooks: libraryBooks.length
  };

  return { seedCode, stats };
}

/**
 * Triggers full live sync: updates localStorage version and forces fresh reload.
 */
export async function syncAdminDataToSeed(): Promise<Record<string, number>> {
  const { seedCode, stats } = generateAdminSeedSnapshot();
  
  // Update stored seed version to trigger fresh hydration on next load
  const newVersion = `BUILD_${Date.now()}`;
  localStorage.setItem('stored_seed_version', newVersion);
  localStorage.setItem('munyaka_seed_version', newVersion);
  localStorage.setItem('munyaka_initialized', 'false');

  // Download the generated seed file for APK / codebase persistence
  const blob = new Blob([seedCode], { type: 'text/typescript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'initialSeedData.ts';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('[AdminSeedSync] Synchronized data snapshot:', stats);
  return stats;
}
