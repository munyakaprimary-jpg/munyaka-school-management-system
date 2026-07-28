import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import Registration from "./pages/Registration";
import Attendance from "./pages/Attendance";
import Assessments from "./pages/Assessments";
import ReportCards from "./pages/ReportCards";
import Portfolio from "./pages/Portfolio";
import Fees from "./pages/Fees";
import Settings from "./pages/Settings";
import Staff from "./pages/Staff";
import StaffProfile from "./pages/StaffProfile";
import StaffRegistration from "./pages/StaffRegistration";
import Timetable from "./pages/Timetable";
import Notices from "./pages/Notices";
import Inventory from "./pages/Inventory";
import Library from "./pages/Library";
import Communication from "./pages/Communication";
import SchoolCalendar from "./pages/SchoolCalendar";
import AdminProfile from "./pages/AdminProfile";
import GradesStreams from "./pages/GradesStreams";
import LearningAreas from "./pages/LearningAreas";
import ExamTypes from "./pages/ExamTypes";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Protected Application Routes */}
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/index" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
                <Route path="/students/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
                <Route path="/grades" element={<ProtectedRoute><GradesStreams /></ProtectedRoute>} />
                <Route path="/learning-areas" element={<ProtectedRoute><LearningAreas /></ProtectedRoute>} />
                <Route path="/exam-types" element={<ProtectedRoute><ExamTypes /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
                <Route path="/staff/:id" element={<ProtectedRoute><StaffProfile /></ProtectedRoute>} />
                <Route path="/staff/registration" element={<ProtectedRoute><StaffRegistration /></ProtectedRoute>} />
                <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} />
                <Route path="/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><SchoolCalendar /></ProtectedRoute>} />
                <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
                <Route path="/registration" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
                <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
                <Route path="/assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
                <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportCards /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;