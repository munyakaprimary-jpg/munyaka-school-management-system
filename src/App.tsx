import { useEffect } from "react";
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
import Library from "./pages/Library";
import Inventory from "./pages/Inventory";
import { LearnerProvider } from './context/LearnerContext';
import { initialSeedData } from './data/initialSeedData';
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import AuthGate from "./components/AuthGate";
import { initializeCentralStorage } from "./utils/centralDbInit";

initializeCentralStorage();

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const seedKeys: [string, unknown][] = [
      ['munyaka_students', initialSeedData.students || []],
      ['school_learners_data', initialSeedData.students || []],
      ['munyaka_staff', initialSeedData.staff || []],
      ['munyaka_staff_directory', initialSeedData.staff || []],
      ['munyaka_staff_master', initialSeedData.staff || []],
      ['munyaka_fees_records', (initialSeedData as any).fees || []],
      ['munyaka_student_fees', (initialSeedData as any).fees || []],
      ['munyaka_transactions', initialSeedData.transactions || []],
    ];
    for (const [k, v] of seedKeys) {
      if (!window.localStorage.getItem(k)) {
        window.localStorage.setItem(k, JSON.stringify(v));
      }
    }
  } catch (e) {
    console.error('[App Boot] Failed to seed initial data:', e);
  }
}

const migrateStorageKey = (oldKey: string, newKey: string) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const oldData = localStorage.getItem(oldKey);
  const newData = localStorage.getItem(newKey);
  if ((!newData || newData === '[]') && oldData && oldData !== '[]') {
    localStorage.setItem(newKey, oldData);
  }
};

export function runLegacyKeyMigrations() {
  migrateStorageKey('learners', 'munyaka_learners');
  migrateStorageKey('students', 'munyaka_learners');
  migrateStorageKey('staff', 'munyaka_staff');
  migrateStorageKey('assessments', 'munyaka_assessments');
  migrateStorageKey('marks', 'munyaka_assessments');
}

runLegacyKeyMigrations();

const queryClient = new QueryClient();

const App = () => {
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
                        <Route path="/learners/archive" element={<ProtectedRoute><AppUnlock><Layout><TransferredLearnersArchive /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/students/:id" element={<ProtectedRoute><AppUnlock><Layout><StudentProfile /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/grades" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><GradesStreams /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/learning-areas" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><LearningAreas /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/exam-types" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><ExamTypes /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/staff" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><Staff /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/staff/registration" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><StaffRegistration /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/staff/pre-registration" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><StaffPreRegistration /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/staff/attendance" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><StaffAttendancePage /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/staff/check-in" element={<ProtectedRoute><AppUnlock><Layout><StaffCheckInSelector /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/staff-checkin" element={<ProtectedRoute><AppUnlock><Layout><StaffCheckIn /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/staff/attendance-monitor" element={<ProtectedRoute><AppUnlock><Layout><AttendanceMonitor /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/staff/:id" element={<ProtectedRoute><AppUnlock><Layout><StaffProfile /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/communication" element={<ProtectedRoute><AppUnlock><Layout><Communication /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/notices" element={<ProtectedRoute><AppUnlock><Layout><NoticeAndEvents defaultTab="announcements" /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/timetable" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><Timetable /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/registration" element={<ProtectedRoute><AppUnlock><Layout><Registration /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><Attendance /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/assessments" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AppUnlock><Layout><Assessments /></Layout></AppUnlock></ProtectedRoute>} />
                        <Route path="/assessment-settings" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><AssessmentSettings /></Layout></AppUnlock></ProtectedRoute>} />
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
                        <Route path="/lan-config" element={<ProtectedRoute allowedRoles={['owner']} blockedRoles={['admin', 'super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student']}><AppUnlock><Layout><LANServerConfig /></Layout></AppUnlock></ProtectedRoute>} />
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
