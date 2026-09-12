import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DevDashboard from './pages/DevDashboard';
import Login from './pages/Login';
import ParentPortal from './pages/ParentPortal';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Settings from './pages/Settings';
import Staff from './pages/Staff';

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/portal" element={<ParentPortal />} />

          {/* Protected Admin & Dev Routes with Layout Sidebar */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/learners" element={<ProtectedRoute><Layout><Students /></Layout></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><Layout><Staff /></Layout></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Layout><Attendance /></Layout></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute><Layout><Fees /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          
          {/* Developer Routes */}
          <Route path="/dev/dashboard" element={<ProtectedRoute allowedRoles={['Dev']}><Layout><DevDashboard /></Layout></ProtectedRoute>} />
          <Route path="/dev/tenants" element={<ProtectedRoute allowedRoles={['Dev']}><Layout><DevDashboard /></Layout></ProtectedRoute>} />
          <Route path="/dev/settings" element={<ProtectedRoute allowedRoles={['Dev']}><Layout><Settings /></Layout></ProtectedRoute>} />

          {/* Default Fallback */}
          <Route path="*" element={<Login />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;