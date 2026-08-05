import React, { useEffect } from 'react';
import { dbService } from './services/DatabaseService';
import { syncService } from './services/SyncService';
import { SyncStatusHeader } from './components/SyncStatusHeader';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Staff from './pages/Staff';
import StaffProfile from './pages/StaffProfile';
import StaffRegistration from './pages/StaffRegistration';
import StaffPreRegistration from './pages/StaffPreRegistration';
import StaffAttendancePage from './pages/StaffAttendance';
import StaffCheckIn from './pages/StaffCheckIn';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Library from './pages/Library';
import Inventory from './pages/Inventory';
import Timetable from './pages/Timetable';
import Notices from './pages/Notices';
import SchoolCalendar from './pages/SchoolCalendar';
import TaskFlow from './pages/TaskFlow';
import ExamTypes from './pages/ExamTypes';
import LearningAreas from './pages/LearningAreas';
import GradesStreams from './pages/GradesStreams';
import Promote from './pages/Promote';
import Portfolio from './pages/Portfolio';
import Assessments from './pages/Assessments';
import ResultsAnalysis from './pages/ResultsAnalysis';
import ReportCards from './pages/ReportCards';
import ReportCardGenerator from './pages/ReportCardGenerator';
import Communication from './pages/Communication';
import DigitalHub from './pages/DigitalHub';
import DigitalLiteracyVideos from './pages/DigitalLiteracyVideos';
import DigitalSkillsAssessment from './pages/DigitalSkillsAssessment';
import PracticalCompetencies from './pages/PracticalCompetencies';
import ICTLabManagement from './pages/ICTLabManagement';
import SystemAndAccountManagement from './pages/SystemAndAccountManagement';
import Settings from './pages/Settings';
import AdminProfile from './pages/AdminProfile';
import Login from './pages/Login';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  useEffect(() => {
    const init = async () => {
      await dbService.initialize();
      syncService.startBackgroundSync(7000);
    };
    init();

    return () => {
      syncService.stopBackgroundSync();
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <SyncStatusHeader />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/staff/:id" element={<StaffProfile />} />
            <Route path="/staff/registration" element={<StaffRegistration />} />
            <Route path="/staff/pre-registration" element={<StaffPreRegistration />} />
            <Route path="/staff/attendance" element={<StaffAttendancePage />} />
            <Route path="/staff/check-in" element={<StaffCheckIn />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/library" element={<Library />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/calendar" element={<SchoolCalendar />} />
            <Route path="/taskflow" element={<TaskFlow />} />
            <Route path="/exam-types" element={<ExamTypes />} />
            <Route path="/learning-areas" element={<LearningAreas />} />
            <Route path="/grades" element={<GradesStreams />} />
            <Route path="/promote" element={<Promote />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/analysis" element={<ResultsAnalysis />} />
            <Route path="/reports" element={<ReportCards />} />
            <Route path="/report-generator" element={<ReportCardGenerator />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/digital-hub" element={<DigitalHub />} />
            <Route path="/digital-literacy-videos" element={<DigitalLiteracyVideos />} />
            <Route path="/digital-skills" element={<DigitalSkillsAssessment />} />
            <Route path="/practical-competencies" element={<PracticalCompetencies />} />
            <Route path="/ict-lab" element={<ICTLabManagement />} />
            <Route path="/system-management" element={<SystemAndAccountManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<AdminProfile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;