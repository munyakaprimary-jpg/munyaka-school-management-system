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
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import { ForcePasswordResetModal } from "./components/ForcePasswordResetModal";
import PasswordResetCallback from "./components/PasswordResetCallback";
import Login from "./pages/Login";
import CoverPage from "./pages/CoverPage";
import ParentPortal from "./pages/ParentPortal";
import Index from "./pages/Index";
import Learners from "./pages/Learners";
import TransferredLearnersArchive from "./pages/TransferredLearnersArchive";
import LearnerProfile from "./pages/LearnerProfile";
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
import LearnerAssessment from "./pages/LearnerAssessment";
import GradingReview from "./pages/GradingReview";
import AssessmentImport from "./pages/AssessmentImport";
import LearnerAssessmentPage from "./pages/LearnerAssessmentPage";
import TeacherGradingPage from "./pages/TeacherGradingPage";
import ExamCreatorPage from "./pages/ExamCreatorPage";
import SetExamsListPage from "./pages/SetExamsListPage";
import MarkedScriptsPage from "./pages/MarkedScriptsPage";
import SchoolAnnouncements from "./pages/SchoolAnnouncements";
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

// Execute unified central storage initialization on application load
initializeCentralStorage();

// Execute billing auto-lock check on application boot
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
    console.warn(`[migrateStorageKey] Skipped migrating ${oldKey} to ${newKey}:`, err);
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
    console.warn('[runLegacyKeyMigrations] Storage quota error:', err);
  }
}

runLegacyKeyMigrations();

const LEARNER_STORAGE_KEYS = ['munyaka_students', 'munyaka_master_learner_list'];
const FEE_LEDGER_KEYS = ['munyaka_fees_records', 'munyaka_student_fees', 'munyaka_payment_records', 'munyaka_transactions'];
const FEE_SANITIZER_FLAG = 'munyaka_fee_sanitizer_v1';

function runOneTimeFeeSanitizer(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (window.localStorage.getItem(FEE_SANITIZER_FLAG) === 'done') return;
  try {
    window.localStorage.setItem(FEE_SANITIZER_FLAG, 'done');
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
        safeWrite('munyaka_central_db', initialDb, { operation: 'seed' });
      }
    } catch (err) {
      console.error("Failed to seed munyaka_central_db:", err);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (!localStorage.getItem('admin_pin')) localStorage.setItem('admin_pin', 'munyaka');
        if (!localStorage.getItem('owner_pin')) localStorage.setItem('owner_pin', 'munyaka');
      } catch {}
    }
  }, []);

  useEffect(() => {
    runOneTimeAssessmentCleanup();
    runOneTimeLegacyAdmNoMigration();
    runOneTimeAdmissionNoBackfill();
    runOneTimeFeeSanitizer();
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
                      <LearnerProvider>
                        <Routes>
                          {/* Public & Auth Routes */}
                          <Route path="/login" element={<Login />} />
                          <Route path="/portal" element={<ParentPortal />} />
                          <Route path="/reset-password" element={<PasswordResetCallback />} />

                          {/* Root & Legacy Redirects */}
                          <Route path="/" element={<Navigate to="/portal/dashboard" replace />} />
                          <Route path="/dashboard" element={<Navigate to="/portal/dashboard" replace />} />

                          {/* ── UNIFIED PORTAL ROUTE MAPPING REGISTRY ── */}
                          
                          {/* 1. Dashboard & Overview: key 'admin_dashboard' -> path '/portal/dashboard' -> <DashboardView /> */}
                          <Route path="/portal/dashboard" element={<ProtectedRoute><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 2. Data Harmonization Hub: key 'data_harmonization' -> path '/portal/data-harmonization' -> <DataHarmonizationView /> */}
                          <Route path="/portal/data-harmonization" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><AdminHarmonizationHub /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 3. Learners: key 'learners' -> path '/portal/learners' -> <LearnersView /> */}
                          <Route path="/portal/learners" element={<ProtectedRoute><AppUnlock><Layout><Learners /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 4. Staff Registry: key 'staff_registry' -> path '/portal/staff' -> <StaffRegistryView /> */}
                          <Route path="/portal/staff" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><StaffRegistry /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 5. Games Hub: key 'games_hub' -> path '/portal/games-hub' -> <GamesHubView /> */}
                          <Route path="/portal/games-hub" element={<ProtectedRoute><AppUnlock><Layout><GamesHub /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 6. Grades & Streams: key 'grades_streams' -> path '/portal/grades-streams' -> <GradesStreamsView /> */}
                          <Route path="/portal/grades-streams" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'class_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><GradesStreams /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 7. Transferred Archive: key 'transferred_archive' -> path '/portal/transferred' -> <TransferredArchiveView /> */}
                          <Route path="/portal/transferred" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><TransferredLearnersArchive /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 8. Learning Areas: key 'learning_areas' -> path '/portal/learning-areas' -> <LearningAreasView /> */}
                          <Route path="/portal/learning-areas" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><LearningAreas /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 9. Exam Types: key 'exam_types' -> path '/portal/exam-types' -> <ExamTypesView /> */}
                          <Route path="/portal/exam-types" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><ExamTypes /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 10. Tenants / Campuses: key 'tenants_campuses' -> path '/portal/tenants' -> <TenantsCampusesView /> */}
                          <Route path="/portal/tenants" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><OwnersDashboard /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 11. Admin Control Center: key 'admin_control' -> path '/portal/admin-control' -> <AdminControlView /> */}
                          <Route path="/portal/admin-control" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><AdminControlCenter /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 12. Communication: key 'communication' -> path '/portal/communication' -> <CommunicationView /> */}
                          <Route path="/portal/communication" element={<ProtectedRoute><AppUnlock><Layout><SchoolAnnouncements /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 13. Events & Notices: key 'events_notices' -> path '/portal/notices' -> <EventsNoticesView /> */}
                          <Route path="/portal/notices" element={<ProtectedRoute><AppUnlock><Layout><NoticeAndEvents defaultTab="announcements" /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 14. Timetable: key 'timetable' -> path '/portal/timetable' -> <TimetablePage /> */}
                          <Route path="/portal/timetable" element={<ProtectedRoute><AppUnlock><Layout><Timetable /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 15. Central Data & APK: key 'central_data_apk' -> path '/portal/central-data' -> <CentralDataApkView /> */}
                          <Route path="/portal/central-data" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><CentralDataService /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 16. Learner Attendance: key 'learner_attendance' -> path '/portal/learner-attendance' -> <LearnerAttendanceView /> */}
                          <Route path="/portal/learner-attendance" element={<ProtectedRoute><AppUnlock><Layout><Attendance /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 17. Daily Check-In: key 'daily_checkin' -> path '/portal/attendance' -> <StaffAttendance /> (Geofenced Check-In terminal) */}
                          <Route path="/portal/attendance" element={<ProtectedRoute><AppUnlock><Layout><StaffAttendancePage /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 18. Attendance Monitor: key 'attendance_monitor' -> path '/portal/attendance-monitor' -> <AttendanceMonitorView /> */}
                          <Route path="/portal/attendance-monitor" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><AttendanceMonitor /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 19. Attendance Management: key 'attendance_management' -> path '/portal/attendance-mgmt' -> <AttendanceManagementView /> */}
                          <Route path="/portal/attendance-mgmt" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'class_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><Attendance /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 20. Enter Marks: key 'enter_marks' -> path '/portal/enter-marks' -> <EnterMarksView /> */}
                          <Route path="/portal/enter-marks" element={<ProtectedRoute><AppUnlock><Layout><Assessments /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 21. Results Analysis: key 'results_analysis' -> path '/portal/results-analysis' -> <ResultsAnalysisView /> */}
                          <Route path="/portal/results-analysis" element={<ProtectedRoute><AppUnlock><Layout><ResultsAnalysis /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 22. Grading Review: key 'grading_review' -> path '/portal/grading-review' -> <GradingReviewView /> */}
                          <Route path="/portal/grading-review" element={<ProtectedRoute><AppUnlock><Layout><GradingReview /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 23. Create Exam / Quiz: key 'create_exam' -> path '/portal/create-exam' -> <CreateExamView /> */}
                          <Route path="/portal/create-exam" element={<ProtectedRoute><AppUnlock><Layout><ExamCreatorPage /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 24. Question Bank & Import: key 'question_bank' -> path '/portal/question-bank' -> <QuestionBankView /> */}
                          <Route path="/portal/question-bank" element={<ProtectedRoute><AppUnlock><Layout><QuestionCreator /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 25. Grading & Marks: key 'grading_marks' -> path '/portal/grading-marks' -> <GradingMarksView /> */}
                          <Route path="/portal/grading-marks" element={<ProtectedRoute><AppUnlock><Layout><TeacherGradingPage /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 26. All Set Exams: key 'all_set_exams' -> path '/portal/all-set-exams' -> <AllSetExamsView /> */}
                          <Route path="/portal/all-set-exams" element={<ProtectedRoute><AppUnlock><Layout><SetExamsListPage /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 27. Digital Hub: key 'digital_hub' -> path '/portal/digital-hub' -> <DigitalHubView /> */}
                          <Route path="/portal/digital-hub" element={<ProtectedRoute><AppUnlock><Layout><DigitalHub /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 28. ICT Lab & Devices: key 'ict_lab_devices' -> path '/portal/ict-lab' -> <IctLabDevicesView /> */}
                          <Route path="/portal/ict-lab" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'ict_teacher', 'lab_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><ICTLabManagement /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 29. Digital Skills Assessment: key 'digital_skills' -> path '/portal/digital-skills' -> <DigitalSkillsView /> */}
                          <Route path="/portal/digital-skills" element={<ProtectedRoute><AppUnlock><Layout><DigitalSkillsAssessment /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 30. Practical Competencies: key 'practical_competencies' -> path '/portal/practical-competencies' -> <PracticalCompetenciesView /> */}
                          <Route path="/portal/practical-competencies" element={<ProtectedRoute><AppUnlock><Layout><PracticalCompetencies /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 31. Portfolios: key 'portfolios' -> path '/portal/portfolios' -> <PortfoliosView /> */}
                          <Route path="/portal/portfolios" element={<ProtectedRoute><AppUnlock><Layout><Portfolio /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 32. Library & E-Resources: key 'library_e_resources' -> path '/portal/library' -> <LibraryResourcesView /> */}
                          <Route path="/portal/library" element={<ProtectedRoute><AppUnlock><Layout><Library /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 33. Study Corner: key 'study_corner' -> path '/portal/study-corner' -> <StudyCornerView /> */}
                          <Route path="/portal/study-corner" element={<ProtectedRoute><AppUnlock><Layout><StudyCorner /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 34. Tools & Inventory: key 'tools_inventory' -> path '/portal/tools-inventory' -> <ToolsInventoryView /> */}
                          <Route path="/portal/tools-inventory" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'tools_inventory_teacher', 'ict_teacher', 'lab_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><Inventory /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 35. Fees & Finance: key 'fees_finance' -> path '/portal/fees' -> <FeesFinanceView /> */}
                          <Route path="/portal/fees" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><Fees /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 36. Report Cards: key 'report_cards' -> path '/portal/report-cards' -> <ReportCardsView /> */}
                          <Route path="/portal/report-cards" element={<ProtectedRoute><AppUnlock><Layout><ReportCards /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 37. Settings: key 'settings' -> path '/portal/settings' -> <SettingsView /> */}
                          <Route path="/portal/settings" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><Settings /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* 38. Promote Learners: key 'promote_learners' -> path '/portal/promote' -> <PromoteLearnersView /> */}
                          <Route path="/portal/promote" element={<ProtectedRoute allowedRoles={['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']}><AppUnlock><Layout><Promote /></Layout></AppUnlock></ProtectedRoute>} />

                          {/* Backward compatibility legacy redirects */}
                          <Route path="/learners" element={<Navigate to="/portal/learners" replace />} />
                          <Route path="/fees" element={<Navigate to="/portal/fees" replace />} />
                          <Route path="/staff-registry" element={<Navigate to="/portal/staff" replace />} />
                          <Route path="/settings" element={<Navigate to="/portal/settings" replace />} />

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </LearnerProvider>
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
