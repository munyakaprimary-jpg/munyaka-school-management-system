import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { initialSeedData } from "@/data/initialSeedData";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "@/components/ui/notification-provider";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import { ForcePasswordResetModal } from "./components/ForcePasswordResetModal";
import PasswordResetCallback from "./components/PasswordResetCallback";
import Login from "./pages/Login";
import CoverPage from "./pages/CoverPage";
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
import StaffRegistry from "./components/StaffRegistry";
import Timetable from "./pages/Timetable";
import NoticeAndEvents from "./pages/NoticeAndEvents";
import AdminProfile from "./pages/AdminProfile";
import { ExportSuccessShareModal } from "@/components/teacher/ExportSuccessShareModal";

function GlobalExportListener() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    filename: string;
    data: string;
    mimeType: string;
    nativeUri?: string;
    title: string;
  }>({
    isOpen: false,
    filename: '',
    data: '',
    mimeType: 'application/json',
    nativeUri: undefined,
    title: ''
  });

  useEffect(() => {
    const handleExportEvent = (e: any) => {
      const { filename, data, mimeType, nativeUri, title } = e.detail || {};
      if (filename) {
        setModalState({
          isOpen: true,
          filename,
          data: data || '',
          mimeType: mimeType || 'application/json',
          nativeUri,
          title: title || 'File Successfully Generated & Downloaded'
        });
      }
    };

    window.addEventListener('munyaka_file_exported', handleExportEvent);
    return () => {
      window.removeEventListener('munyaka_file_exported', handleExportEvent);
    };
  }, []);

  return (
    <ExportSuccessShareModal
      isOpen={modalState.isOpen}
      onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      filename={modalState.filename}
      data={modalState.data}
      mimeType={modalState.mimeType}
      nativeUri={modalState.nativeUri}
      title={modalState.title}
      description="File generated & downloaded successfully! Instantly beam this file via Quick Share to the Admin Harmonization Hub or WhatsApp."
    />
  );
}
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
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import ProfileSettings from "./pages/ProfileSettings";
import AdminControlCenter from "./pages/AdminControlCenter";
import MobileSettings from "./pages/MobileSettings";
import LANServerConfig from "./pages/LANServerConfig";
import TeacherLanConfig from "./pages/TeacherLanConfig";
import AdminHarmonizationHub from "./components/admin/AdminHarmonizationHub";
import TeacherExportView from "./pages/TeacherExportView";
import LibrarianPortalView from "./pages/LibrarianPortalView";
import ICTTechnicalPortalView from "./pages/ICTTechnicalPortalView";
import BursarPortalView from "./pages/BursarPortalView";
import HeadteacherPortalView from "./pages/HeadteacherPortalView";
import SupportStaffPortalView from "./pages/SupportStaffPortalView";
import SecurityPortalView from "./pages/SecurityPortalView";
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
import { SchoolProvider } from "./context/SchoolContext";
import { LearnerProvider } from './context/LearnerContext';
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

// ── Legacy Key Auto-Migration (One-time safe migration) ──────────────────
const MIGRATION_DONE_FLAG = 'munyaka_legacy_migration_v2_done';

const migrateStorageKey = (oldKey: string, newKey: string) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const oldData = localStorage.getItem(oldKey);
    const newData = localStorage.getItem(newKey);
    
    // If new key is empty but old key has valid data, preserve and copy over
    if ((!newData || newData === '[]') && oldData && oldData !== '[]') {
      localStorage.setItem(newKey, oldData);
      // Remove old redundant key to reclaim localStorage quota
      localStorage.removeItem(oldKey);
    }
  } catch (err) {
    console.warn(`[migrateStorageKey] Skipped migrating ${oldKey} to ${newKey} to protect quota:`, err);
  }
};

// Run migrations for all modules on boot exactly once
export function runLegacyKeyMigrations() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (localStorage.getItem(MIGRATION_DONE_FLAG)) return;
    
    migrateStorageKey('learners', 'munyaka_learners');
    migrateStorageKey('students', 'munyaka_learners');
    migrateStorageKey('staff', 'munyaka_staff');
    migrateStorageKey('assessments', 'munyaka_assessments');
    migrateStorageKey('marks', 'munyaka_assessments');

    localStorage.setItem(MIGRATION_DONE_FLAG, 'true');
  } catch (err) {
    console.warn('[runLegacyKeyMigrations] Protected from storage quota error:', err);
  }
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

/**
 * Wraps protected portal routes with the LearnerProvider so learner data is
 * only mounted for authenticated routes. Public routes (login, parent portal,
 * reset-password) never mount — or crash from — the learner subscription.
 */
const ProtectedShell = ({
  allowedRoles,
  blockedRoles,
  children,
}: {
  allowedRoles?: string[];
  blockedRoles?: string[];
  children: ReactNode;
}) => (
  <LearnerProvider>
    <ProtectedRoute allowedRoles={allowedRoles} blockedRoles={blockedRoles}>
      {children}
    </ProtectedRoute>
  </LearnerProvider>
);

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
  
      // Initialize admin_pin and owner_pin in localStorage to 'munyaka' if they do not exist yet
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          if (!localStorage.getItem('admin_pin')) {
            localStorage.setItem('admin_pin', 'munyaka');
          }
          if (!localStorage.getItem('owner_pin')) {
            localStorage.setItem('owner_pin', 'munyaka');
          }
        } catch {
          /* localStorage unavailable — non-fatal */
        }
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
      <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <HashRouter>
          <AuthProvider>
            <AuthGate>
              <NotificationProvider>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <GlobalExportListener />
                    <SchoolProvider>
                      <Routes>
                        {/* Public Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/portal" element={<ParentPortal />} />
                      <Route path="/reset-password" element={<PasswordResetCallback />} />

                      {/* Protected Routes */}
                      <Route path="/" element={<ProtectedShell><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/dashboard" element={<ProtectedShell><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/admin-dashboard" element={<ProtectedShell allowedRoles={['admin']} blockedRoles={['owner']}><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/index" element={<ProtectedShell><AppUnlock><Layout><Index /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/students" element={<ProtectedShell><AppUnlock><Layout><Students /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/learners/archive" element={<ProtectedShell allowedRoles={['admin']}><AppUnlock><Layout><TransferredLearnersArchive /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/students/:id" element={<ProtectedShell><AppUnlock><Layout><StudentProfile /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/grades" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><GradesStreams /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/learning-areas" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><LearningAreas /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/exam-types" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><ExamTypes /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/staff" element={<ProtectedShell allowedRoles={['admin', 'head_teacher']}><AppUnlock><Layout><div className="p-12 text-center font-bold text-slate-500">Staff Management Disabled</div></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/staff/attendance" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><StaffAttendancePage /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/staff/check-in" element={<ProtectedShell><AppUnlock><Layout><StaffCheckInSelector /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/staff-checkin" element={<ProtectedShell><AppUnlock><Layout><StaffCheckIn /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/staff/attendance-monitor" element={<ProtectedShell><AppUnlock><Layout><AttendanceMonitor /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/staff/:id" element={<ProtectedShell><AppUnlock><Layout><div className="p-12 text-center font-bold text-slate-500">Staff Profile Disabled</div></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/communication" element={<ProtectedShell><AppUnlock><Layout><Communication /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/teacher-communication" element={<ProtectedShell allowedRoles={['teacher', 'class_teacher', 'subject_teacher', 'head_teacher']}><AppUnlock><Layout><TeacherCommunication /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/notices" element={<ProtectedShell><AppUnlock><Layout><NoticeAndEvents defaultTab="announcements" /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/timetable" element={<ProtectedShell allowedRoles={['admin']}><AppUnlock><Layout><Timetable /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/registration" element={<ProtectedShell><AppUnlock><Layout><Registration /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/attendance" element={<ProtectedShell allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><Attendance /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/assessments" element={<ProtectedShell allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><Assessments /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/assessment-settings" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><AssessmentSettings /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/admin/harmonization" element={<ProtectedShell allowedRoles={['admin']}><AppUnlock><Layout><AdminHarmonizationHub /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/admin-harmonization-hub" element={<ProtectedShell allowedRoles={['admin']}><AppUnlock><Layout><AdminHarmonizationHub /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/teacher/export" element={<ProtectedShell allowedRoles={['teacher', 'class_teacher', 'subject_teacher', 'head_teacher', 'admin']}><AppUnlock><Layout><TeacherExportView /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/teacher-export" element={<ProtectedShell allowedRoles={['teacher', 'class_teacher', 'subject_teacher', 'head_teacher', 'admin']}><AppUnlock><Layout><TeacherExportView /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/librarian/portal" element={<ProtectedShell allowedRoles={['librarian', 'library_teacher', 'admin']}><AppUnlock><Layout><LibrarianPortalView /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/ict/portal" element={<ProtectedShell allowedRoles={['ict_teacher', 'ict_technician', 'admin']}><AppUnlock><Layout><ICTTechnicalPortalView /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/bursar/portal" element={<ProtectedShell allowedRoles={['bursar', 'admin']}><AppUnlock><Layout><BursarPortalView /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/headteacher/portal" element={<ProtectedShell allowedRoles={['head_teacher', 'senior_teacher', 'admin']}><AppUnlock><Layout><HeadteacherPortalView /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/support/portal" element={<ProtectedShell allowedRoles={['support', 'maintenance', 'admin']}><AppUnlock><Layout><SupportStaffPortalView /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/security/portal" element={<ProtectedShell allowedRoles={['security', 'guard', 'admin']}><AppUnlock><Layout><SecurityPortalView /></Layout></AppUnlock></ProtectedShell>} />
                                            <Route path="/question-creator" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><QuestionCreator /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/student-assessment" element={<ProtectedShell><AppUnlock><Layout><StudentAssessment /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/grading" element={<ProtectedShell allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><GradingReview /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/assessments/import" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><AssessmentImport /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/assessments/student" element={<ProtectedShell allowedRoles={['admin', 'head_teacher', 'teacher', 'student']}><AppUnlock><Layout><StudentAssessmentPage /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/assessments/grading" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><TeacherGradingPage /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/assessments/create" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><ExamCreatorPage /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/assessments/list" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher', 'student']}><AppUnlock><Layout><SetExamsListPage /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/assessments/marked-scripts" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><MarkedScriptsPage /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/analysis" element={<ProtectedShell allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><ResultsAnalysis /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/portfolio" element={<ProtectedShell><AppUnlock><Layout><Portfolio /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/staff-registry" element={<ProtectedShell><AppUnlock><Layout><StaffRegistry /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/library" element={<ProtectedShell><AppUnlock><Layout><Library /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/inventory" element={<ProtectedShell><AppUnlock><Layout><Inventory /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/fees" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><Fees /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/central-data" element={<ProtectedShell allowedRoles={['admin']}><AppUnlock><Layout><CentralDataService /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/reports" element={<ProtectedShell allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><ReportCards /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/settings" element={<ProtectedShell><AppUnlock><Layout><Settings /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/profile" element={<ProtectedShell><AppUnlock><Layout><AdminProfile /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/promote" element={<ProtectedShell><AppUnlock><Layout><Promote /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/digital-hub" element={<ProtectedShell><AppUnlock><Layout><DigitalHub /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/digital-literacy-videos" element={<ProtectedShell><AppUnlock><Layout><DigitalLiteracyVideos /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/ict-lab" element={<ProtectedShell allowedRoles={['admin', 'head_teacher', 'ICT_TEACHER', 'ICT_TECHNICIAN']}><AppUnlock><Layout><ICTLabManagement /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/system-management" element={<ProtectedShell allowedRoles={['admin', 'head_teacher']}><AppUnlock><Layout><SystemAndAccountManagement /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/owner/subscriptions" element={<ProtectedShell allowedRoles={['owner', 'admin']}><AppUnlock><Layout><PaymentManagement /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/dev/subscriptions" element={<ProtectedShell allowedRoles={['owner', 'admin']}><AppUnlock><Layout><PaymentManagement /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/payment-management" element={<ProtectedShell><AppUnlock><Layout><PaymentManagement /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/dev/tenants" element={<ProtectedShell allowedRoles={['owner', 'admin']}><AppUnlock><Layout><OwnersDashboard /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/digital-skills" element={<ProtectedShell><AppUnlock><Layout><DigitalSkillsAssessment /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/practical-competencies" element={<ProtectedShell><AppUnlock><Layout><PracticalCompetencies /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/science-lab" element={<ProtectedShell><AppUnlock><Layout><ScienceLab /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/study-corner" element={<ProtectedShell><AppUnlock><Layout><StudyCorner /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/games" element={<ProtectedShell><AppUnlock><Layout><GamesHub /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/settings/profile" element={<ProtectedShell allowedRoles={['owner', 'admin']}><AppUnlock><Layout><ProfileSettings /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/admin/control-center" element={<ProtectedShell allowedRoles={['admin']} blockedRoles={['owner', 'bursar', 'parent', 'student']}><AppUnlock><Layout><AdminControlCenter /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/mobile/settings" element={<ProtectedShell><AppUnlock><Layout><MobileSettings /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/lan-config" element={<ProtectedShell allowedRoles={['owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'admin', 'bursar', 'support_staff', 'librarian']}><AppUnlock><Layout><LANServerConfig /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/lan-server-config" element={<ProtectedShell allowedRoles={['owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'admin', 'bursar', 'support_staff', 'librarian']}><AppUnlock><Layout><LANServerConfig /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/teacher-lan-config" element={<ProtectedShell allowedRoles={['owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'admin', 'bursar', 'support_staff', 'librarian']}><AppUnlock><Layout><TeacherLanConfig /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="/server" element={<ProtectedShell allowedRoles={['owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'admin', 'bursar', 'support_staff', 'librarian']}><AppUnlock><Layout><LANServerConfig /></Layout></AppUnlock></ProtectedShell>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </SchoolProvider>
                  </TooltipProvider>
                </ThemeProvider>
              </NotificationProvider>
            </AuthGate>
          </AuthProvider>
        </HashRouter>
      </div>
    </AppErrorBoundary>
  );
};

export default App;
