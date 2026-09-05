import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "@/components/ui/notification-provider";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
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
import Notices from "./pages/Notices";
import Inventory from "./pages/Inventory";
import Library from "./pages/Library";
import Communication from "./pages/Communication";
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
import CentralDataService from "./pages/CentralDataService";
import PaymentManagement from "./pages/PaymentManagement";
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
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import AuthGate from "./components/AuthGate";

const queryClient = new QueryClient();

/**
 * Loading fallback shown before React has fully mounted.
 * Critical for Android WebView: prevents the blank white screen
 * when the WebView tries to paint before JS bundle is parsed.
 */
const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#ffffff",
    }}
  >
    <p style={{ color: "#333333", fontFamily: "sans-serif" }}>
      Loading Munyaka App...
    </p>
  </div>
);

/**
 * App component.
 *
 * Provider hierarchy (top → bottom):
 *   1. AppErrorBoundary           — outermost boundary. Catches errors
 *                                    from BrowserRouter, AuthProvider,
 *                                    and the inactivity-timeout hook so
 *                                    a single crash cannot kill the
 *                                    Android WebView process.
 *   2. QueryClientProvider        — React Query
 *   3. BrowserRouter              — MUST sit above AuthProvider because
 *   4. AuthProvider               — its useInactivityTimeout hook calls
 *   5. AuthGate                   — renders a loading spinner while the
 *                                    session hydrates from localStorage,
 *                                    preventing null-user / undefined-role
 *                                    crashes on first paint.
 *   6. NotificationProvider       —   useNavigate(); if AuthProvider is
 *   7. ThemeProvider               —   above BrowserRouter the hook throws
 *   8. TooltipProvider            —   the "useNavigate() may be used only
 *   9. Toaster / Sonner            —   in the context of a <Router>"
 *                                    invariant on first render.
 *  10. <Routes />                 — application routes
 *
 * NOTE: AppErrorBoundary was lifted to the outermost position so that
 * errors thrown while AuthProvider hydrates the session (e.g. a
 * corrupted `munyaka_session` JSON value) are caught and the user sees
 * the fallback screen instead of a white screen / app crash.
 */
const App = () => {
  // Guard: ensure component tree is fully mounted before rendering the app.
  // This prevents the blank white screen on Android WebView where the
  // initial paint can occur before React finishes hydrating.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Give React time to settle the component tree and local state/storage
    // before painting the actual application UI.
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <LoadingFallback />;
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AuthGate>
              <NotificationProvider>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Application Routes — wrapped with AppUnlock (license gate) */}
                <Route path="/" element={<ProtectedRoute><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedRoute>} />
                {/* Admin-only dedicated dashboard route (strict 'admin' role)
                    — the `Dashboard` component already routes admin users
                    to AdminDashboardComponent internally, so /admin-dashboard
                    and /dashboard are equivalent for admin users. The explicit
                    allowedRoles enforces the separation from owner. */}
                <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']} blockedRoles={['owner']}><AppUnlock><Layout><Dashboard /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/index" element={<ProtectedRoute><AppUnlock><Layout><Index /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><AppUnlock><Layout><Students /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/learners/archive" element={<ProtectedRoute><AppUnlock><Layout><TransferredLearnersArchive /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/students/:id" element={<ProtectedRoute><AppUnlock><Layout><StudentProfile /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/grades" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><GradesStreams /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/learning-areas" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><LearningAreas /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/exam-types" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'head_teacher']}><AppUnlock><Layout><ExamTypes /></Layout></AppUnlock></ProtectedRoute>} />
                
                {/* Staff Routes */}
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
                <Route path="/payment-management" element={<ProtectedRoute blockedRoles={['admin']}><AppUnlock><Layout><PaymentManagement /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/digital-skills" element={<ProtectedRoute><AppUnlock><Layout><DigitalSkillsAssessment /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/practical-competencies" element={<ProtectedRoute><AppUnlock><Layout><PracticalCompetencies /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/science-lab" element={<ProtectedRoute><AppUnlock><Layout><ScienceLab /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/games" element={<ProtectedRoute><AppUnlock><Layout><GamesHub /></Layout></AppUnlock></ProtectedRoute>} />
                <Route path="/settings/profile" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><AppUnlock><Layout><ProfileSettings /></Layout></AppUnlock></ProtectedRoute>} />
                                <Route path="/admin/control-center" element={<ProtectedRoute allowedRoles={['admin']} blockedRoles={['owner', 'bursar', 'parent', 'student']}><AppUnlock><Layout><AdminControlCenter /></Layout></AppUnlock></ProtectedRoute>} />
                                                <Route path="/mobile/settings" element={<ProtectedRoute><AppUnlock><Layout><MobileSettings /></Layout></AppUnlock></ProtectedRoute>} />
                                                <Route path="/lan-config" element={<ProtectedRoute allowedRoles={['owner']} blockedRoles={['admin', 'super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student']}><AppUnlock><Layout><LANServerConfig /></Layout></AppUnlock></ProtectedRoute>} />
                
                                <Route path="*" element={<NotFound />} />
                                              </Routes>
                                                </TooltipProvider>
                                              </ThemeProvider>
                                            </NotificationProvider>
                                          </AuthGate>
                                        </AuthProvider>
                                      </BrowserRouter>
                                    </QueryClientProvider>
                                  </AppErrorBoundary>
                                  );
                                };
                                
                                export default App;