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
    mimeType: '',
    title: ''
  });

  useEffect(() => {
    const handleShowExportModal = (e: CustomEvent) => {
      if (e.detail) {
        setModalState({
          isOpen: true,
          filename: e.detail.filename || 'export.csv',
          data: e.detail.data || '',
          mimeType: e.detail.mimeType || 'text/csv',
          nativeUri: e.detail.nativeUri,
          title: e.detail.title || 'Export Successful'
        });
      }
    };

    window.addEventListener('munyaka_show_export_modal' as any, handleShowExportModal as any);
    return () => {
      window.removeEventListener('munyaka_show_export_modal' as any, handleShowExportModal as any);
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
    />
  );
}

const queryClient = new QueryClient();

export function AppContent() {
  // Startup Storage Sanitizer
  useEffect(() => {
    const OBSOLETE_KEYS = [
      'munyaka_students',
      'munyaka_pupils',
      'munyaka_staff',
      'munyaka_staff_db',
      'munyaka_staff_directory',
      'munyaka_staff_master',
    ];

    // Purge legacy storage fragmentation
    OBSOLETE_KEYS.forEach((key) => localStorage.removeItem(key));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      <GlobalExportListener />
      <Routes>
        {/* Public Routes */}
        <Route path="/cover" element={<CoverPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/parent-portal" element={<ParentPortal />} />
        <Route path="/auth/callback" element={<PasswordResetCallback />} />

        {/* Protected Dashboard Routes inside App Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learners" element={<Learners />} />
          <Route path="/learners/archive" element={<TransferredLearnersArchive />} />
          <Route path="/learners/:id" element={<LearnerProfile />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/analysis" element={<ResultsAnalysis />} />
          <Route path="/report-cards" element={<ReportCards />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/staff" element={<StaffRegistry />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/notices" element={<NoticeAndEvents />} />
          <Route path="/admin-profile" element={<AdminProfile />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ForcePasswordResetModal />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <NotificationProvider>
            <HashRouter>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </HashRouter>
          </NotificationProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
