TeacherSelection -> StaffCheckIn with full back-arrow support.">
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
import TeacherSelection from "./pages/TeacherSelection";
import AttendanceMonitor from "./pages/AttendanceMonitor";
import DigitalHub from "./pages/DigitalHub";
import DigitalLiteracyVideos from "./pages/DigitalLiteracyVideos";
import ICTLabManagement from "./pages/ICTLabManagement";
import SystemAndAccountManagement from "./pages/SystemAndAccountManagement";
import DigitalSkillsAssessment from "./pages/DigitalSkillsAssessment";
import PracticalCompetencies from "./pages/PracticalCompetencies";
import ScienceLab from "./pages/ScienceLab";
import CentralDataService from "./pages/CentralDataService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Application Routes */}
                <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/index" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><Layout><Students /></Layout></ProtectedRoute>} />
                <Route path="/students/:id" element={<ProtectedRoute><Layout><StudentProfile /></Layout></ProtectedRoute>} />
                <Route path="/grades" element={<ProtectedRoute><Layout><GradesStreams /></Layout></ProtectedRoute>} />
                <Route path="/learning-areas" element={<ProtectedRoute><Layout><LearningAreas /></Layout></ProtectedRoute>} />
                <Route path="/exam-types" element={<ProtectedRoute><Layout><ExamTypes /></Layout></ProtectedRoute>} />
                
                {/* Staff Routes */}
                <Route path="/staff" element={<ProtectedRoute><Layout><Staff /></Layout></ProtectedRoute>} />
                <Route path="/staff/registration" element={<ProtectedRoute><Layout><StaffRegistration /></Layout></ProtectedRoute>} />
                <Route path="/staff/pre-registration" element={<ProtectedRoute><Layout><StaffPreRegistration /></Layout></ProtectedRoute>} />
                <Route path="/staff/attendance" element={<ProtectedRoute><Layout><StaffAttendancePage /></Layout></ProtectedRoute>} />
                <Route path="/staff/select-teacher" element={<ProtectedRoute><Layout><TeacherSelection /></Layout></ProtectedRoute>} />
                <Route path="/staff/check-in" element={<ProtectedRoute><Layout><StaffCheckIn /></Layout></ProtectedRoute>} />
                <Route path="/staff/attendance-monitor" element={<ProtectedRoute><Layout><AttendanceMonitor /></Layout></ProtectedRoute>} />
                <Route path="/staff/:id" element={<ProtectedRoute><Layout><StaffProfile /></Layout></ProtectedRoute>} />
                
                <Route path="/communication" element={<ProtectedRoute><Layout><Communication /></Layout></ProtectedRoute>} />
                <Route path="/notices" element={<ProtectedRoute><Layout><NoticeAndEvents defaultTab="announcements" /></Layout></ProtectedRoute>} />
                <Route path="/timetable" element={<ProtectedRoute><Layout><Timetable /></Layout></ProtectedRoute>} />
                <Route path="/registration" element={<ProtectedRoute><Layout><Registration /></Layout></ProtectedRoute>} />
                <Route path="/attendance" element={<ProtectedRoute><Layout><Attendance /></Layout></ProtectedRoute>} />
                <Route path="/assessments" element={<ProtectedRoute><Layout><Assessments /></Layout></ProtectedRoute>} />
                <Route path="/analysis" element={<ProtectedRoute><Layout><ResultsAnalysis /></Layout></ProtectedRoute>} />
                <Route path="/portfolio" element={<ProtectedRoute><Layout><Portfolio /></Layout></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><Layout><Library /></Layout></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>} />
                <Route path="/fees" element={<ProtectedRoute><Layout><Fees /></Layout></ProtectedRoute>} />
                <Route path="/central-data" element={<ProtectedRoute><Layout><CentralDataService /></Layout></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Layout><ReportCards /></Layout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Layout><AdminProfile /></Layout></ProtectedRoute>} />
                <Route path="/promote" element={<ProtectedRoute><Layout><Promote /></Layout></ProtectedRoute>} />
                <Route path="/digital-hub" element={<ProtectedRoute><Layout><DigitalHub /></Layout></ProtectedRoute>} />
                <Route path="/digital-literacy-videos" element={<ProtectedRoute><Layout><DigitalLiteracyVideos /></Layout></ProtectedRoute>} />
                <Route path="/ict-lab" element={<ProtectedRoute><Layout><ICTLabManagement /></Layout></ProtectedRoute>} />
                <Route path="/system-management" element={<ProtectedRoute><Layout><SystemAndAccountManagement /></Layout></ProtectedRoute>} />
                <Route path="/digital-skills" element={<ProtectedRoute><Layout><DigitalSkillsAssessment /></Layout></ProtectedRoute>} />
                <Route path="/practical-competencies" element={<ProtectedRoute><Layout><PracticalCompetencies /></Layout></ProtectedRoute>} />
                <Route path="/science-lab" element={<ProtectedRoute><Layout><ScienceLab /></Layout></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;