import { useEffect, useState } from "react";
import { initialSeedData } from "@/data/initialSeedData";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "@/components/ui/notification-provider";
import ProtectedRoute from "./components/ProtectedRoute";
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
    try {
      const purged = localStorage.getItem('munyaka_staff_v2_purged');
      if (!purged) {
        localStorage.setItem('munyaka_master_staff_list', JSON.stringify([]));

        const lKeys = ['munyaka_master_learners', 'munyaka_learners', 'munyaka_students', 'school_learners_data', 'munyaka_learners_db'];
        let allLearners: any[] = [];
        for (const k of lKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                allLearners = [...allLearners, ...parsed];
              }
            } catch {}
          }
        }
        if (allLearners.length > 0) {
          const map = new Map();
          allLearners.forEach(l => {
            const key = l.admissionNumber || l.id || l.assessmentNumber || l.name;
            if (key) map.set(String(key).trim().toLowerCase(), l);
          });
          localStorage.setItem('munyaka_master_learners', JSON.stringify(Array.from(map.values())));
        }

        localStorage.setItem('munyaka_staff_v2_purged', 'true');
      }
    } catch {}

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
import OwnersDashboardHome from "./pages/OwnersDashboardHome";
import OwnersDashboard from "./pages/ownersDashboard";
import OwnerPortalRouter from "./pages/OwnerPortalRouter";
import GamesHub from "./pages/GamesHub";
import AppUnlock from "./components/AppUnlock";
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
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import AuthGate from "./components/AuthGate";
import { startHeartbeatService, stopHeartbeatService } from "./services/deviceHeartbeat";
import { runOneTimeAdmissionNoBackfill } from "./utils/backfillAdmissionNumbers";
import { runOneTimeAssessmentCleanup, runOneTimeLegacyAdmNoMigration } from "./utils/assessmentNoMigration";
import { initializeCentralStorage } from "./utils/centralDbInit";
import { runBillingAutoLockCheck } from "./utils/billingAutoLock";
import { AdminLayout, OwnersPortalLayout } from "@/components/PortalLayouts";
import { LoginPortalSelector } from "@/components/LoginPortalSelector";

initializeCentralStorage();

if (typeof window !== 'undefined') {
  try {
    runBillingAutoLockCheck();
    setInterval(() => {
      runBillingAutoLockCheck();
    }, 24 * 60 * 60 * 1000);
  } catch (err) {
    console.error('Failed to run billing auto-lock check on boot:', err);
  }

  try {
    const serverUrl = localStorage.getItem('lan_server_url') || 'http://10.53.221.196:5000';
    startHeartbeatService(serverUrl);
  } catch (err) {
    console.error('Failed to start device heartbeat service on boot:', err);
  }
}

const MIGRATION_DONE_FLAG = 'munyaka_legacy_migration_v2_done';

const migrateStorageKey = (oldKey: string, newKey: string) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const oldData = localStorage.getItem(oldKey);
    const newData = localStorage.getItem(newKey);
    if ((!newData || newData === '[]') && oldData && oldData !== '[]') {
      localStorage.setItem(newKey, oldData);
      localStorage.removeItem(oldKey);
    }
  } catch (err) {
    console.warn(`[migrateStorageKey] Skipped migrating ${oldKey} to ${newKey} to protect quota:`, err);
  }
};

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

runLegacyKeyMigrations();

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

const FEE_SANITIZER_FLAG = 'munyaka_fee_sanitizer_v1';
const LEARNER_PURGE_FLAG = 'munyaka_learner_purge_v1';
function runOneTimeLearnerPurge(): void {}

function runOneTimeFeeSanitizer(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (window.localStorage.getItem(FEE_SANITIZER_FLAG) === 'done') return;

  try {
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

    for (const key of FEE_LEDGER_KEYS) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch { continue; }
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (key === 'munyaka_fees_records' || key === 'munyaka_student_fees') {
            window.localStorage.setItem(key, JSON.stringify({}));
          }
        } else if (key === 'munyaka_fees_records' || key === 'munyaka_student_fees') {
          window.localStorage.setItem(key, JSON.stringify({}));
        }
      } catch {}
    }

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
        const cleaned = parsed.filter((row: any) => {
          if (!row || typeof row !== 'object') return true;
          const amt = typeof row.amount === 'number' ? row.amount : null;
          if (amt === null) return true;
          const isLegacyRef = typeof row.ref === 'string' && /^REF00\d$/.test(row.ref);
          if (LEGACY_MOCK_AMOUNTS.has(amt) && isLegacyRef) return false;
          return true;
        });
        if (cleaned.length !== parsed.length) {
          window.localStorage.setItem(key, JSON.stringify(cleaned));
        }
      } catch {}
    }

    window.localStorage.setItem(FEE_SANITIZER_FLAG, 'done');
  } catch (err) {
    console.error('[fee-sanitizer] Unexpected failure:', err);
  }
}

const queryClient = new QueryClient();

const App = () => {
  const [userRole, setUserRole] = useState<'ADMIN' | 'OWNER' | 'STAFF' | null>(() => {
    return (localStorage.getItem('munyaka_user_role') as 'ADMIN' | 'OWNER' | 'STAFF' | null) || null;
  });

  useEffect(() => {
    try {
      const existingDb = localStorage.getItem('munyaka_central_db');
      if (!existingDb) {
        const initialDb = {
          students: (initialSeedData as any).students || (initialSeedData as any).learners || [],
          staff: initialSeedData.staff || [],
        };
        const ok = safeWrite('munyaka_central_db', initialDb, { operation: 'seed' });
        if (ok) {
          window.dispatchEvent(new Event('central_db_updated'));
        }
      } else {
        const parsed = JSON.parse(existingDb);
        if (!parsed.students || parsed.students.length === 0) {
          parsed.students = (initialSeedData as any).students || (initialSeedData as any).learners || [];
          const ok = safeWrite('munyaka_central_db', parsed, { operation: 're-seed' });
          if (ok) {
            window.dispatchEvent(new Event('central_db_updated'));
          }
        }
      }
    } catch (err) {
      console.error("Failed to seed munyaka_central_db:", err);
    }
  }, []);

  useEffect(() => {
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

        for (const [key, value] of seedKeys) {
          const existing = localStorage.getItem(key);
          if (!existing) {
            localStorage.setItem(key, JSON.stringify(value));
          } else {
            try {
              const parsed = JSON.parse(existing);
              if ((Array.isArray(parsed) && parsed.length === 0) && Array.isArray(value) && value.length > 0) {
                localStorage.setItem(key, JSON.stringify(value));
              }
            } catch {}
          }
        }

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

  const renderCurrentPortal = () => {
    if (userRole === 'ADMIN') {
      return (
        <AdminLayout>
          {/* Render strict school admin dashboard & operational modules */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/learners/archive" element={<TransferredLearnersArchive />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/grades" element={<GradesStreams />} />
            <Route path="/learning-areas" element={<LearningAreas />} />
            <Route path="/exam-types" element={<ExamTypes />} />
            <Route path="/staff/attendance" element={<StaffAttendancePage />} />
            <Route path="/staff/check-in" element={<StaffCheckInSelector />} />
            <Route path="/staff-checkin" element={<StaffCheckIn />} />
            <Route path="/staff/attendance-monitor" element={<AttendanceMonitor />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/notices" element={<NoticeAndEvents defaultTab="announcements" />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/assessment-settings" element={<AssessmentSettings />} />
            <Route path="/admin/harmonization" element={<AdminHarmonizationHub />} />
            <Route path="/admin-harmonization-hub" element={<AdminHarmonizationHub />} />
            <Route path="/question-creator" element={<QuestionCreator />} />
            <Route path="/student-assessment" element={<StudentAssessment />} />
            <Route path="/grading" element={<GradingReview />} />
            <Route path="/assessments/import" element={<AssessmentImport />} />
            <Route path="/assessments/student" element={<StudentAssessmentPage />} />
            <Route path="/assessments/grading" element={<TeacherGradingPage />} />
            <Route path="/assessments/create" element={<ExamCreatorPage />} />
            <Route path="/assessments/list" element={<SetExamsListPage />} />
            <Route path="/assessments/marked-scripts" element={<MarkedScriptsPage />} />
            <Route path="/analysis" element={<ResultsAnalysis />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/staff-registry" element={<StaffRegistry />} />
            <Route path="/library" element={<Library />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/central-data" element={<CentralDataService />} />
            <Route path="/reports" element={<ReportCards />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<AdminProfile />} />
            <Route path="/promote" element={<Promote />} />
            <Route path="/digital-hub" element={<DigitalHub />} />
            <Route path="/digital-literacy-videos" element={<DigitalLiteracyVideos />} />
            <Route path="/ict-lab" element={<ICTLabManagement />} />
            <Route path="/system-management" element={<SystemAndAccountManagement />} />
            <Route path="/admin/control-center" element={<AdminControlCenter />} />
            <Route path="/mobile/settings" element={<MobileSettings />} />
            <Route path="/digital-skills" element={<DigitalSkillsAssessment />} />
            <Route path="/practical-competencies" element={<PracticalCompetencies />} />
            <Route path="/science-lab" element={<ScienceLab />} />
            <Route path="/study-corner" element={<StudyCorner />} />
            <Route path="/games" element={<GamesHub />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminLayout>
      );
    }
    
    if (userRole === 'OWNER') {
      return (
        <OwnersPortalLayout>
          {/* Render strict executive owner portal & governance modules */}
          <Routes>
            <Route path="/" element={<OwnerPortalRouter />} />
            <Route path="/dashboard" element={<OwnerPortalRouter />} />
            <Route path="/owner" element={<OwnerPortalRouter />} />
            <Route path="/tenants" element={<OwnerPortalRouter />} />
            <Route path="/lan" element={<OwnerPortalRouter />} />
            <Route path="/payments" element={<OwnerPortalRouter />} />
            <Route path="/dev/subscriptions" element={<PaymentManagement />} />
            <Route path="/payment-management" element={<PaymentManagement />} />
            <Route path="/dev/tenants" element={<OwnersDashboard />} />
            <Route path="/settings" element={<ProfileSettings />} />
            <Route path="/lan-config" element={<LANServerConfig />} />
            <Route path="/lan-server-config" element={<LANServerConfig />} />
            <Route path="/teacher-lan-config" element={<TeacherLanConfig />} />
            <Route path="/server" element={<LANServerConfig />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OwnersPortalLayout>
      );
    }

    return <LoginPortalSelector onSelectRole={(role) => {
      setUserRole(role);
      localStorage.setItem('munyaka_user_role', role);
    }} />;
  };

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
                    <GlobalExportListener />
                    <SchoolProvider>
                      <LearnerProvider>
                        {renderCurrentPortal()}
                      </LearnerProvider>
                    </SchoolProvider>
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
