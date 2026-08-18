"use client";

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Students from '@/pages/Students';
import StudentProfile from '@/pages/StudentProfile';
import Registration from '@/pages/Registration';
import GradesStreams from '@/pages/GradesStreams';
import LearningAreas from '@/pages/LearningAreas';
import ExamTypes from '@/pages/ExamTypes';
import Staff from '@/pages/Staff';
import StaffProfile from '@/pages/StaffProfile';
import StaffRegistration from '@/pages/StaffRegistration';
import StaffPreRegistration from '@/pages/StaffPreRegistration';
import SystemAndAccountManagement from '@/pages/SystemAndAccountManagement';
import Communication from '@/pages/Communication';
import Notices from '@/pages/Notices';
import SchoolCalendar from '@/pages/SchoolCalendar';
import Timetable from '@/pages/Timetable';
import Attendance from '@/pages/Attendance';
import StaffCheckIn from '@/pages/StaffCheckIn';
import StaffAttendancePage from '@/pages/StaffAttendance';
import Assessments from '@/pages/Assessments';
import ResultsAnalysis from '@/pages/ResultsAnalysis';
import DigitalHub from '@/pages/DigitalHub';
import DigitalLiteracyVideos from '@/pages/DigitalLiteracyVideos';
import DigitalSkillsAssessment from '@/pages/DigitalSkillsAssessment';
import PracticalCompetencies from '@/pages/PracticalCompetencies';
import Portfolio from '@/pages/Portfolio';
import Library from '@/pages/Library';
import Inventory from '@/pages/Inventory';
import Fees from '@/pages/Fees';
import ReportCards from '@/pages/ReportCards';
import Promote from '@/pages/Promote';
import Settings from '@/pages/Settings';
import AdminProfile from '@/pages/AdminProfile';
import TaskFlow from '@/pages/TaskFlow';
import RecordCardGenerator from '@/pages/RecordCardGenerator';
import ReportCardGenerator from '@/pages/ReportCardGenerator';
import ScienceLab from '@/pages/ScienceLab';
import ICTLabManagement from '@/pages/ICTLabManagement';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/sonner';

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/register" element={<Registration />} />
        <Route path="/students/:id" element={<StudentProfile />} />
        
        <Route path="/grades" element={<GradesStreams />} />
        <Route path="/learning-areas" element={<LearningAreas />} />
        <Route path="/exam-types" element={<ExamTypes />} />
        
        <Route path="/staff" element={<Staff />} />
        <Route path="/staff/registration" element={<StaffRegistration />} />
        <Route path="/staff/pre-registration" element={<StaffPreRegistration />} />
        <Route path="/staff/:id" element={<StaffProfile />} />
        <Route path="/staff/check-in" element={<StaffCheckIn />} />
        <Route path="/staff/attendance" element={<StaffAttendancePage />} />
        
        <Route path="/system-management" element={<SystemAndAccountManagement />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/calendar" element={<SchoolCalendar />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/attendance" element={<Attendance />} />
        
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/analysis" element={<ResultsAnalysis />} />
        
        <Route path="/digital-hub" element={<DigitalHub />} />
        <Route path="/digital-literacy-videos" element={<DigitalLiteracyVideos />} />
        <Route path="/digital-skills" element={<DigitalSkillsAssessment />} />
        <Route path="/practical-competencies" element={<PracticalCompetencies />} />
        
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/library" element={<Library />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/reports" element={<ReportCards />} />
        <Route path="/promote" element={<Promote />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<AdminProfile />} />
        
        <Route path="/taskflow" element={<TaskFlow />} />
        <Route path="/record-card-generator" element={<RecordCardGenerator />} />
        <Route path="/report-card-generator" element={<ReportCardGenerator />} />
        
        <Route path="/science-lab" element={<ScienceLab />} />
        <Route path="/ict-lab" element={<ICTLabManagement />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ className: 'rounded-2xl' }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;