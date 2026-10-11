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
import AuthLoadingFallback from "@/components/AuthLoadingFallback";

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
import { startHeartbeatService } from "./services/deviceHeartbeat";
import { runOneTimeAdmissionNoBackfill } from "./utils/backfillAdmissionNumbers";
import { runOneTimeAssessmentCleanup, runOneTimeLegacyAdmNoMigration } from "./utils/assessmentNoMigration";
import { initializeCentralStorage } from "./utils/centralDbInit";
import { runBillingAutoLockCheck } from "./utils/billingAutoLock";

const queryClient = new QueryClient();

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const performInitialization = async () => {
      try {
        // Safe asynchronous initialization wrapped in try/catch with timeout fallback safeguard
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            initializeCentralStorage();
          } catch (e) {
            console.warn("Central storage init notice:", e);
          }

          try {
            const existingDb = localStorage.getItem('munyaka_central_db');
            if (!existingDb) {
              const initialDb = {
                students: (initialSeedData as any).students || (initialSeedData as any).learners || [],
                staff: initialSeedData.staff || [],
                rbacConfig: {},
                attendance: [],
                marks: [],
                fees: []
              };
              localStorage.setItem('munyaka_central_db', JSON.stringify(initialDb));
            }
          } catch (e) {
            console.warn("Storage seed notice:", e);
          }

          try {
            runBillingAutoLockCheck();
          } catch (e) {
            console.warn("Billing auto-lock check notice:", e);
          }

          try {
            const serverUrl = localStorage.getItem('lan_server_url') || 'http://10.53.221.196:5000';
            startHeartbeatService(serverUrl);
          } catch (e) {
            console.warn("Heartbeat start notice:", e);
          }

          try {
            runOneTimeAssessmentCleanup();
            runOneTimeLegacyAdmNoMigration();
            runOneTimeAdmissionNoBackfill();
          } catch (e) {
            console.warn("Migration helper notice:", e);
          }
        }

        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (err: any) {
        console.error("App initialization error:", err);
        if (isMounted) {
          setInitError(err?.message || "Initialization error");
          setIsInitialized(true); // Unblock rendering even if non-fatal error occurred
        }
      }
    };

    performInitialization();

    // Timeout fallback safeguard: guarantee UI mounts even if init stalls
    const timeoutId = setTimeout(() => {
      if (isMounted && !isInitialized) {
        console.warn("App initialization timeout fallback triggered.");
        setIsInitialized(true);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isInitialized) {
    return <AuthLoadingFallback message="Initializing Munyaka Portal..." />;
  }

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
                      <Route path="/staff" element={<ProtectedRoute allowedRoles={['admin', 'head_teacher']}><AppUnlock><Layout><div className="p-12 text-center font-bold text-slate-500">Staff Management Disabled</div></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/attendance" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><StaffAttendancePage /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/check-in" element={<ProtectedRoute><AppUnlock><Layout><StaffCheckInSelector /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff-checkin" element={<ProtectedRoute><AppUnlock><Layout><StaffCheckIn /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/attendance-monitor" element={<ProtectedRoute><AppUnlock><Layout><AttendanceMonitor /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/staff/:id" element={<ProtectedRoute><AppUnlock><Layout><div className="p-12 text-center font-bold text-slate-500">Staff Profile Disabled</div></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/communication" element={<ProtectedRoute><AppUnlock><Layout><Communication /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/teacher-communication" element={<ProtectedRoute allowedRoles={['teacher', 'class_teacher', 'subject_teacher', 'head_teacher']}><AppUnlock><Layout><TeacherCommunication /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/notices" element={<ProtectedRoute><AppUnlock><Layout><NoticeAndEvents defaultTab="announcements" /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/timetable" element={<ProtectedRoute allowedRoles={['admin']}><AppUnlock><Layout><Timetable /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/registration" element={<ProtectedRoute><AppUnlock><Layout><Registration /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><Attendance /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessments" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><Assessments /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/assessment-settings" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><AssessmentSettings /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/admin/harmonization" element={<ProtectedRoute allowedRoles={['admin']}><AppUnlock><Layout><AdminHarmonizationHub /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/admin-harmonization-hub" element={<ProtectedRoute allowedRoles={['admin']}><AppUnlock><Layout><AdminHarmonizationHub /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/teacher/export" element={<ProtectedRoute allowedRoles={['teacher', 'class_teacher', 'subject_teacher', 'head_teacher', 'admin']}><AppUnlock><Layout><TeacherExportView /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/teacher-export" element={<ProtectedRoute allowedRoles={['teacher', 'class_teacher', 'subject_teacher', 'head_teacher', 'admin']}><AppUnlock><Layout><TeacherExportView /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/librarian/portal" element={<ProtectedRoute allowedRoles={['librarian', 'library_teacher', 'admin']}><AppUnlock><Layout><LibrarianPortalView /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/ict/portal" element={<ProtectedRoute allowedRoles={['ict_teacher', 'ict_technician', 'admin']}><AppUnlock><Layout><ICTTechnicalPortalView /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/bursar/portal" element={<ProtectedRoute allowedRoles={['bursar', 'admin']}><AppUnlock><Layout><BursarPortalView /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/headteacher/portal" element={<ProtectedRoute allowedRoles={['head_teacher', 'senior_teacher', 'admin']}><AppUnlock><Layout><HeadteacherPortalView /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/support/portal" element={<ProtectedRoute allowedRoles={['support', 'maintenance', 'admin']}><AppUnlock><Layout><SupportStaffPortalView /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/security/portal" element={<ProtectedRoute allowedRoles={['security', 'guard', 'admin']}><AppUnlock><Layout><SecurityPortalView /></Layout></AppUnlock></ProtectedRoute>} />
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
                      <Route path="/staff-registry" element={<ProtectedRoute><AppUnlock><Layout><StaffRegistry /></Layout></AppUnlock></ProtectedRoute>} />
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
                      <Route path="/lan-server-config" element={<ProtectedRoute allowedRoles={['owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'admin', 'bursar', 'support_staff', 'librarian']}><AppUnlock><Layout><LANServerConfig /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/teacher-lan-config" element={<ProtectedRoute allowedRoles={['owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'admin', 'bursar', 'support_staff', 'librarian']}><AppUnlock><Layout><TeacherLanConfig /></Layout></AppUnlock></ProtectedRoute>} />
                      <Route path="/server" element={<ProtectedRoute allowedRoles={['owner', 'ict_technician', 'ict_teacher', 'teacher', 'class_teacher', 'subject_teacher', 'senior_teacher', 'admin', 'bursar', 'support_staff', 'librarian']}><AppUnlock><Layout><LANServerConfig /></Layout></AppUnlock></ProtectedRoute>} />
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
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
