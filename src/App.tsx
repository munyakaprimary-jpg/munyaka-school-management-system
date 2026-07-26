import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
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
import Timetable from "./pages/Timetable";
import Notices from "./pages/Notices";
import Inventory from "./pages/Inventory";
import Library from "./pages/Library";
import Communication from "./pages/Communication";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/library" element={<Library />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/reports" element={<ReportCards />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;