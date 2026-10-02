import { useEffect } from "react";
import { initialSeedData } from "@/data/initialSeedData";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "@/components/ui/notification-provider";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import { ForcePasswordResetModal } from "./components/ForcePasswordResetModal";
import Login from "./pages/Login";
import ParentPortal from "./pages/ParentPortal";
import Index from "./pages/Index";
import Students from "./pages/Students";
import TransferredLearnersArchive from "./pages/TransferredLearnersArchive";
import StudentProfile from "./pages/StudentProfile";
import Registration from "./pages/Registration";
import Attendance from "./pages/Attendance";
import Assessments from "./pages/Assessments";
import ResultsAnalysis from "./pages/ResultsAnalysis";
import ReportCards from "./pages/ReportCards";
import Portfolio from "./pages/Portfolio";
import Fees from "./pages/Fees";
import Settings from "./pages/Settings";
import Staff from "./pages/Staff";
import StaffProfile from "./pages/StaffProfile";
import StaffRegistration from "./pages/StaffRegistration";
import StaffPreRegistration from "./pages/StaffPreRegistration";
import Timetable from "./pages/Timetable";
import NoticeAndEvents from "./pages/NoticeAndEvents";
import AdminProfile from "./pages/AdminProfile";
import GradesStreams from "./pages/GradesStreams";
import LearningAreas from "./pages/LearningAreas";
import ExamTypes from "./pages/ExamTypes";
import NotFound from "./pages/NotFound";
import Promote from "./pages/Promote";
import StaffAttendancePage from "./pages/StaffAttendance";
import StaffCheckIn from "./pages/StaffCheckIn";
import StaffCheckInSelector from "./pages/StaffCheckInSelector";
import AttendanceMonitor from "./pages/AttendanceMonitor";
import DigitalHub from "./pages/DigitalHub";
import DigitalLiteracyVideos from "./pages/DigitalLiteracyVideos";
import ICTLabManagement from "./pages/ICTLabManagement";
import SystemAndAccountManagement from "./pages/SystemAndAccountManagement";
import DigitalSkillsAssessment from "./pages/DigitalSkillsAssessment";
import PracticalCompetencies from "./pages/PracticalCompetencies";
import { safeWrite } from "@/utils/storageUtils";
import ScienceLab from "./pages/ScienceLab";
import StudyCorner from "./pages/StudyCorner";
import CentralDataService from "./pages/CentralDataService";
import PaymentManagement from "./pages/PaymentManagement";
import OwnersDashboard from "./pages/ownersDashboard";
import GamesHub from "./pages/GamesHub";
import AppUnlock from "./components/AppUnlock";
import ProfileSettings from "./pages/ProfileSettings";
import AdminControlCenter from "./pages/AdminControlCenter";
import MobileSettings from "./pages/MobileSettings";
import LANServerConfig from "./pages/LANServerConfig";
import AdminHarmonizationHub from "./components/admin/AdminHarmonizationHub";
import AssessmentSettings from "./pages/AssessmentSettings";
import QuestionCreator from "./pages/QuestionCreator";
import StudentAssessment from "./pages/StudentAssessment";
import GradingReview from "./pages/GradingReview";
import AssessmentImport from "./pages/AssessmentImport";
import StudentAssessmentPage from "./pages/StudentAssessmentPage";
import TeacherGradingPage from "./pages/TeacherGradingPage";
import ExamCreatorPage from "./pages/ExamCreatorPage";
import SetExamsListPage from "./pages/SetExamsListPage";
import MarkedScriptsPage from "./pages/MarkedScriptsPage";
import Communication from "./pages/Communication";
import TeacherCommunication from "./pages/TeacherCommunication";
import Library from "./pages/Library";
import Inventory from "./pages/Inventory";
import { LearnerProvider } from './context/LearnerContext';
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import AuthGate from "./components/AuthGate";
import { startHeartbeatService, stopHeartbeatService } from "./services/deviceHeartbeat";
import { runOneTimeAdmissionNoBackfill } from "./utils/backfillAdmissionNumbers";
import { runOneTimeAssessmentCleanup, runOneTimeLegacyAdmNoMigration } from "./utils/assessmentNoMigration";
import { initializeCentralStorage } from "./utils/centralDbInit";
import { runBillingAutoLockCheck } from "./utils/billingAutoLock";

// Execute unified central storage initialization on application load
initializeCentralStorage();

// Execute billing auto-lock check on application boot
if (typeof window !== 'undefined') {
  try {
    runBillingAutoLockCheck();
    // Set up daily interval for background auto-lock check
    setInterval(() => {
      runBillingAutoLockCheck();
    }, 24 * 60 * 60 * 1000); // 24 hours
  } catch (err) {
    console.error('Failed to run billing auto-lock check on boot:', err);
  }

  // Start background device heartbeat service on app boot/mount
  try {
    const serverUrl = localStorage.getItem('lan_server_url') || 'http://10.53.221.196:5000';
    startHeartbeatService(serverUrl);
  } catch (err) {
    console.error('Failed to start device heartbeat service on boot:', err);
  }
}

// ── Critical Central Database Initialization ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Initialize and hydrate state from remote central DB on boot

// ── Legacy Key Auto-Migration ─────────────────────────────────────────────
const migrateStorageKey = (oldKey: string, newKey: string) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const oldData = localStorage.getItem(oldKey);
  const newData = localStorage.getItem(newKey);
  
  // If new key is empty but old key has valid data, preserve and copy over
  if ((!newData || newData === '[]') && oldData && oldData !== '[]') {
    localStorage.setItem(newKey, oldData);
  }
};

// Run migrations for all modules on boot
export function runLegacyKeyMigrations() {
  migrateStorageKey('learners', 'munyaka_learners');
  migrateStorageKey('students', 'munyaka_learners');
  migrateStorageKey('staff', 'munyaka_staff');
  migrateStorageKey('assessments', 'munyaka_assessments');
  migrateStorageKey('marks', 'munyaka_assessments');
}

// Run immediately on module evaluation / boot
runLegacyKeyMigrations();

// ── LocalStorage keys that hold active learner rows ────────────────────────
const LEARNER_STORAGE_KEYS = [
  'munyaka_students',
  'munyaka_master_learner_list'
];
const FEE_LEDGER_KEYS = [
  'munyaka_fees_records',
  'munyaka_student_fees',
  'munyaka_payment_records',
  'munyaka_transactions',
];

// ── One-time fee sanitizer ────────────────────────────────────────────────
// Gated by a localStorage flag so it runs at most once per browser.
// Resets all hardcoded fee fields on every stored learner to 0 and
// clears any pre-seeded fee ledger so the app starts from a clean slate.
const FEE_SANITIZER_FLAG = 'munyaka_fee_sanitizer_v1';

// ── One-time learner purge ────────────────────────────────────────────────
// Forces the active learners array to an empty `[]` state on first
// launch. Also writes the empty list to every legacy learner storage
// key so any subsequent hydrate cannot fall back to a seed file. This
// is the last migration in the chain; after it runs the table renders
// its proper "no learners" empty state.
const LEARNER_PURGE_FLAG = 'munyaka_learner_purge_v1';
function runOneTimeLearnerPurge(): void {
  // Disabled permanently to prevent registered learners from disappearing during system changes
}

function runOneTimeFeeSanitizer(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (window.localStorage.getItem(FEE_SANITIZER_FLAG) === 'done') return;

  try {
    // 1. Reset all hardcoded fee fields on every stored learner row.
    for (const key of LEARNER_STORAGE_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { continue; }
      if (!Array.isArray(parsed) || parsed.length === 0) continue;

      let mutated = false;
      const cleaned = parsed.map((row) => {
        if (!row || typeof row !== 'object') return row;
        const r = row as Record<string, unknown>;
        const next = { ...r };
        let changed = false;
        // The fields the brief asked us to normalize. They collapse to 0
        // when the row has no custom ledger entries.
        const feeFields: Array<keyof typeof r> = [
          'totalBilled', 'totalPaid', 'balance', 'feeBalance',
          'total', 'paid', 'amountOwed', 'outstandingBalance', 'arrears',
        ];
        for (const f of feeFields) {
          if (f in next) {
            const v = next[f];
            if (typeof v === 'number' && v !== 0) {
              next[f] = 0;
              changed = true;
            } else if (v !== 0 && v !== undefined) {
              next[f] = 0;
              changed = true;
            }
          }
        }
        // Always start with an empty fee history.
        if ('feeHistory' in next) {
          if (!Array.isArray(next.feeHistory) || (next.feeHistory as unknown[]).length > 0) {
            next.feeHistory = [];
            changed = true;
          }
        }
        if (changed) mutated = true;
        return next;
      });

      if (mutated) {
        try {
          window.localStorage.setItem(key, JSON.stringify(cleaned));
        } catch (err) {
          console.error(`[fee-sanitizer] Failed to persist "${key}":`, err);
        }
      }
    }

    // 2. Clear pre-seeded fee ledgers so the app boots with empty ledgers.
    // Real fee records are only ever written through the Fees page.
    for (const key of FEE_LEDGER_KEYS) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch { continue; }
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep payment records / transactions intact if they exist as
          // user-entered data — only clear the legacy `fees_records` shape
          // that pre-seeded per-student ledgers into the store.
          if (key === 'munyaka_fees_records' || key === 'munyaka_student_fees') {
            window.localStorage.setItem(key, JSON.stringify({}));
          }
        } else if (key === 'munyaka_fees_records' || key === 'munyaka_student_fees') {
          // Force-write {} so the next hydrate cannot fall back to seed.
          window.localStorage.setItem(key, JSON.stringify({}));
        }
      } catch {
        /* no-op */
      }
    }

    // 3. Hard purge — remove any pre-seeded mock transaction entries that
    //    reference the legacy hardcoded amounts (45000, 52000, 38000, 68000,
    //    72000, 55000, 89000, 95000, 61000). These were used to fake the
    //    school-wide fee trend chart and must be wiped so the chart shows
    //    real data only.
    const LEGACY_MOCK_AMOUNTS = new Set([
      45000, 52000, 38000, 68000, 72000, 55000, 89000, 95000, 61000,
      12000, 8000, 4000, 15000, 18000, 20000,
    ]);
    for (const key of FEE_LEDGER_KEYS) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch { continue; }
        if (!Array.isArray(parsed) || parsed.length === 0) continue;
        // Keep only entries that are NOT pre-seeded mock values.
        const cleaned = parsed.filter((row: any) => {
          if (!row || typeof row !== 'object') return true;
          const amt = typeof row.amount === 'number' ? row.amount : null;
          if (amt === null) return true;
          // Drop rows whose only evidence of being a mock is the exact
          // legacy amount AND a REF-style reference.
          const isLegacyRef = typeof row.ref === 'string' && /^REF00\d$/.test(row.ref);
          if (LEGACY_MOCK_AMOUNTS.has(amt) && isLegacyRef) return false;
          return true;
        });
        if (cleaned.length !== parsed.length) {
          window.localStorage.setItem(key, JSON.stringify(cleaned));
        }
      } catch {
        /* no-op */
      }
    }

    window.localStorage.setItem(FEE_SANITIZER_FLAG, 'done');
    console.info('[fee-sanitizer] Reset hardcoded fee fields on stored learners.');
  } catch (err) {
    console.error('[fee-sanitizer] Unexpected failure:', err);
  }
}

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    try {
      const existingDb = localStorage.getItem('munyaka_central_db');
      if (!existingDb) {
              const initialDb = {
                students: (initialSeedData as any).students || (initialSeedData as any).learners || [],
                staff: initialSeedData.staff || [],
              };
              const ok = safeWrite('munyaka_central_db', initialDb, { operation: 'seed' });
              if (!ok) {
                console.error('Storage quota exceeded during initial seed. Please clear old records.');
              } else {
                window.dispatchEvent(new Event('central_db_updated'));
              }
            } else {
              const parsed = JSON.parse(existingDb);
              if (!parsed.students || parsed.students.length === 0) {
                parsed.students = (initialSeedData as any).students || (initialSeedData as any).learners || [];
                const ok = safeWrite('munyaka_central_db', parsed, { operation: 're-seed' });
                if (!ok) {
                  console.error('Storage quota exceeded while re-seeding munyaka_central_db. Please clear old records.');
                } else {
                  window.dispatchEvent(new Event('central_db_updated'));
                }
              }
            }
    } catch (err) {
      console.error("Failed to seed munyaka_central_db:", err);
    }
  }, []);

  // ── One-time learner-data migrations ───────────────────────────────────
    // Sequential, independently-gated migrations run on first launch:
    //
    //   1. Assessment-number cleanup — removes fake MUN-XXX values that
    //      may have leaked into the `assessment` (KNEC/NEMIS) field.
    //
    //   2. Legacy admNo → admissionNo — copies the old-school admission
    //      number from `admNo` into `admissionNo` for pre-column records.
    //
    //   3. Admission-number backfill (v6) — generates `MUN-{family}-{seq}/{year}`
    //      for any learner still missing `admissionNo`. Supports PP1/PP2.
    //
    //   4. Fee sanitizer (v1) — resets all hardcoded fee fields on stored
    //      learners to 0 and clears pre-seeded fee ledgers.
    //
    // Each is idempotent and gated by its own localStorage flag.
    useEffect(() => {
      // Re-seed canonical storage keys on mount to ensure data persistence
      // after any migrations or clean installs.
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const seedKeys: [string, unknown][] = [
            ['munyaka_students', (initialSeedData as any).students || (initialSeedData as any).learners || []],
            ['munyaka_fees_records', (initialSeedData as any).fees || []],
            ['munyaka_student_fees', (initialSeedData as any).fees || []],
            ['munyaka_fees', (initialSeedData as any).fees || []],
            ['munyaka_payments', (initialSeedData as any).payments || (initialSeedData as any).fees || []],
            ['munyaka_transactions', (initialSeedData as any).transactions || (initialSeedData as any).payments || []],
            ['munyaka_attendance', (initialSeedData as any).attendance || []],
            ['munyaka_grades', (initialSeedData as any).grades || []],
            ['munyaka_exam_types', (initialSeedData as any).examTypes || []],
            ['munyaka_library_books', (initialSeedData as any).libraryBooks || []],
            ['munyaka_fee_structures', (initialSeedData as any).feeStructures || []],
            ['munyaka_notices', (initialSeedData as any).notices || []],
            ['munyaka_system_settings_v3', (initialSeedData as any).settings || {}],
          ];
  
          let anySeeded = false;
          for (const [key, value] of seedKeys) {
            const existing = localStorage.getItem(key);
            if (!existing) {
              localStorage.setItem(key, JSON.stringify(value));
              anySeeded = true;
            } else {
              // If the existing data is an empty array and seed has data, re-seed it.
              try {
                const parsed = JSON.parse(existing);
                if ((Array.isArray(parsed) && parsed.length === 0) && Array.isArray(value) && value.length > 0) {
                  localStorage.setItem(key, JSON.stringify(value));
                  anySeeded = true;
                }
              } catch {
                // Keep existing data on parse error
              }
            }
          }
  
          // Also ensure munyaka_central_db is populated (used by CentralDataService)
          const existingDb = localStorage.getItem('munyaka_central_db');
          if (!existingDb) {
            const initialDb = {
              students: (initialSeedData as any).students || (initialSeedData as any).learners || [],
              staff: initialSeedData.staff || [],
            };
            localStorage.setItem('munyaka_central_db', JSON.stringify(initialDb));
          } else {
            const parsed = JSON.parse(existingDb);
            if (!parsed.students || parsed.students.length === 0) {
              parsed.students = (initialSeedData as any).students || (initialSeedData as any).learners || [];
              localStorage.setItem('munyaka_central_db', JSON.stringify(parsed));
            }
          }
  
          if (anySeeded) {
            console.log('[App Mount] Re-seeded canonical storage keys from initialSeedData.');
          }
        } catch (err) {
          console.error("Failed to re-seed storage keys:", err);
        }
      }
  
      runOneTimeAssessmentCleanup();
      runOneTimeLegacyAdmNoMigration();
      runOneTimeAdmissionNoBackfill();
      runOneTimeFeeSanitizer();
      runOneTimeLearnerPurge();
    }, []);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <AuthProvider>
            <AuthGate>
              <NotificationProvider>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <LearnerProvider>
                      <Routes>
                        {/* Public Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/portal" element={<ParentPortal />} />

                      {/* Protected Routes */}
                      <Route path="/" element={<ProtectedRoute><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/dashboard" element={<ProtectedRoute><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']} blockedRoles={['owner']}><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/index" element={<ProtectedRoute><AppUnlock><Layout><Index /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/students" element={<ProtectedRoute><AppUnlock><Layout><Students /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/learners/archive" element={<ProtectedRoute allowedRoles={['admin']}><AppUnlock><Layout><TransferredLearnersArchive /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/students/:id" element={<ProtectedRoute><AppUnlock><Layout><StudentProfile /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/grades" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><GradesStreams /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/learning-areas" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><LearningAreas /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/exam-types" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><ExamTypes /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff" element={<ProtectedRoute allowedRoles={['admin']}><AppUnlock><Layout><Staff /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/registration" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><StaffRegistration /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/pre-registration" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><StaffPreRegistration /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/attendance" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><StaffAttendancePage /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/check-in" element={<ProtectedRoute><AppUnlock><Layout><StaffCheckInSelector /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff-checkin" element={<ProtectedRoute><AppUnlock><Layout><StaffCheckIn /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/attendance-monitor" element={<ProtectedRoute><AppUnlock><Layout><AttendanceMonitor /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/:id" element={<ProtectedRoute><AppUnlock><Layout><StaffProfile /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/communication" element={<ProtectedRoute><AppUnlock><Layout><Communication /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/teacher-communication" element={<ProtectedRoute allowedRoles={['teacher', 'class_teacher', 'subject_teacher', 'head_teacher']}><AppUnlock><Layout><TeacherCommunication /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/notices" element={<ProtectedRoute><AppUnlock><Layout><NoticeAndEvents defaultTab="announcements" /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/timetable" element={<ProtectedRoute allowedRoles={['admin']}><AppUnlock><Layout><Timetable /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/registration" element={<ProtectedRoute><AppUnlock><Layout><Registration /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><Attendance /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessments" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><Assessments /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessment-settings" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><AssessmentSettings /></Layout></AppUnlock></ProtectedRoute>} />
                                            <Route path="/admin-harmonization-hub" element={<ProtectedRoute allowedRoles={['admin']}><AppUnlock><Layout><AdminHarmonizationHub /></Layout></AppUnlock></ProtectedRoute>} />
                                            <Route path="/question-creator" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><QuestionCreator /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/student-assessment" element={<ProtectedRoute><AppUnlock><Layout><StudentAssessment /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/grading" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><GradingReview /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessments/import" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><AssessmentImport /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessments/student" element={<ProtectedRoute allowedRoles={['admin', 'head_teacher', 'teacher', 'student']}><AppUnlock><Layout><StudentAssessmentPage /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessments/grading" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><TeacherGradingPage /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessments/create" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><ExamCreatorPage /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessments/list" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher', 'student']}><AppUnlock><Layout><SetExamsListPage /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessments/marked-scripts" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><MarkedScriptsPage /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/analysis" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><ResultsAnalysis /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/portfolio" element={<ProtectedRoute><AppUnlock><Layout><Portfolio /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/library" element={<ProtectedRoute><AppUnlock><Layout><Library /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/inventory" element={<ProtectedRoute><AppUnlock><Layout><Inventory /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/fees" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><Fees /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/central-data" element={<ProtectedRoute allowedRoles={['admin']}><AppUnlock><Layout><CentralDataService /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><ReportCards /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><AppUnlock><Layout><Settings /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><AppUnlock><Layout><AdminProfile /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/promote" element={<ProtectedRoute><AppUnlock><Layout><Promote /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/digital-hub" element={<ProtectedRoute><AppUnlock><Layout><DigitalHub /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/digital-literacy-videos" element={<ProtectedRoute><AppUnlock><Layout><DigitalLiteracyVideos /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/ict-lab" element={<ProtectedRoute allowedRoles={['admin', 'head_teacher', 'ICT_TEACHER', 'ICT_TECHNICIAN']}><AppUnlock><Layout><ICTLabManagement /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/system-management" element={<ProtectedRoute allowedRoles={['admin', 'head_teacher']}><AppUnlock><Layout><SystemAndAccountManagement /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/owner/subscriptions" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><AppUnlock><Layout><PaymentManagement /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/dev/subscriptions" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><AppUnlock><Layout><PaymentManagement /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/payment-management" element={<ProtectedRoute><AppUnlock><Layout><PaymentManagement /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/dev/tenants" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><AppUnlock><Layout><OwnersDashboard /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/digital-skills" element={<ProtectedRoute><AppUnlock><Layout><DigitalSkillsAssessment /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/practical-competencies" element={<ProtectedRoute><AppUnlock><Layout><PracticalCompetencies /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/science-lab" element={<ProtectedRoute><AppUnlock><Layout><ScienceLab /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/study-corner" element={<ProtectedRoute><AppUnlock><Layout><StudyCorner /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/games" element={<ProtectedRoute><AppUnlock><Layout><GamesHub /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/settings/profile" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><AppUnlock><Layout><ProfileSettings /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/admin/control-center" element={<ProtectedRoute allowedRoles={['admin']} blockedRoles={['owner', 'bursar', 'parent', 'student']}><AppUnlock><Layout><AdminControlCenter /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/mobile/settings" element={<ProtectedRoute><AppUnlock><Layout><MobileSettings /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/lan-config" element={<ProtectedRoute allowedRoles={['owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'admin', 'bursar', 'support_staff', 'librarian']}><AppUnlock><Layout><LANServerConfig /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/server" element={<ProtectedRoute allowedRoles={['owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'admin', 'bursar', 'support_staff', 'librarian']}><AppUnlock><Layout><LANServerConfig /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </LearnerProvider>
                  </TooltipProvider>
                </ThemeProvider>
              </NotificationProvider>
            </AuthGate>
          </AuthProvider>
        </HashRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
