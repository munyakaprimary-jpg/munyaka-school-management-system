import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

function saveSeedPlugin() {
  return {
    name: 'vite-plugin-save-seed',
    configureServer(server: any) {
      server.middlewares.use('/api/save-seed', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const fullDbObject = JSON.parse(body);
              const generatedSeedVersion = "BUILD_OFFLINE_" + Date.now();

              const fileContent = `export const SEED_VERSION = "${generatedSeedVersion}";

export const DEFAULT_CBC_CLUSTERS = [
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

export const initialSeedData = ${JSON.stringify(fullDbObject, null, 2)};

(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;

export const initialAttendance = (initialSeedData as any).attendance || {};
export const initialIctEquipment = (initialSeedData as any).ictEquipment || (initialSeedData as any).ictLabEquipment || [];
export const initialScienceInventory = (initialSeedData as any).scienceInventory || (initialSeedData as any).scienceLabInventory || [];
export const initialStoreInventory = (initialSeedData as any).storeInventory || (initialSeedData as any).storeStock || [];
export const initialSettings = (initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {};
export const initialNotices = (initialSeedData as any).notices || (initialSeedData as any).munyaka_notices || [];
export const initialEvents = (initialSeedData as any).events || [];
export const initialExams = (initialSeedData as any).exams || (initialSeedData as any).all_set_exams || (initialSeedData as any).question_bank || [];
export const initialExamSchedules = (initialSeedData as any).examSchedules || (initialSeedData as any).assessment_schedules || [];
export const initialExamTypes = (initialSeedData as any).examTypes || (initialSeedData as any).exam_types || [];
export const initialMarks = (initialSeedData as any).marks || (initialSeedData as any).assessments || (initialSeedData as any).marked_student_submissions || [];
export const initialQuestions = (initialSeedData as any).questions || (initialSeedData as any).question_bank || [];
export const initialLearners = initialSeedData.students || [];
export const initialStaff = [];
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

              const targetPath = path.resolve(__dirname, 'src/data/initialSeedData.ts');
              fs.writeFileSync(targetPath, fileContent, 'utf-8');

              exec('git add src/data/initialSeedData.ts && git commit -m "Auto-commit updated initialSeedData.ts"', () => {});

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Saved directly to initialSeedData.ts on disk!' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    saveSeedPlugin(),
    saveSeedPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
