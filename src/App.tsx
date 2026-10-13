import React, { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AdminPortal from "./pages/admin/AdminPortal";
import OwnersPortal from "./components/OwnersPortal";

// Role Selector Gateway Component
function RoleSelectorGateway({ onSelect }: { onSelect: (role: 'ADMIN' | 'OWNER') => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-600/30">
          MP
        </div>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Munyaka Primary School
          </span>
          <h1 className="text-2xl font-bold text-white mt-3">Select Portal Access</h1>
          <p className="text-slate-400 text-xs mt-1">Choose your role to access the correct operational portal.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-2">
          <button
            onClick={() => onSelect('ADMIN')}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-between group cursor-pointer"
          >
            <div className="text-left">
              <div className="text-base">School Admin Portal</div>
              <div className="text-xs font-normal text-emerald-100/80">Manage learners, roll call, fees & staff</div>
            </div>
            <span className="text-xl group-hover:translate-x-1 transition">→</span>
          </button>

          <button
            onClick={() => onSelect('OWNER')}
            className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl border border-slate-700 transition flex items-center justify-between group cursor-pointer"
          >
            <div className="text-left">
              <div className="text-base">School Owner Portal</div>
              <div className="text-xs font-normal text-slate-400">Multi-tenant overview & master control</div>
            </div>
            <span className="text-xl group-hover:translate-x-1 transition">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'OWNER' | null>(() => {
    try {
      const saved = localStorage.getItem('munyaka_portal_role') || localStorage.getItem('munyaka_current_role');
      if (saved === 'ADMIN' || saved === 'OWNER') return saved;
    } catch (e) {
      console.error('Failed to read saved role:', e);
    }
    return null;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('munyaka_portal_role') || localStorage.getItem('munyaka_current_role');
      if (saved === 'ADMIN' || saved === 'OWNER') {
        setUserRole(saved);
      }
    } catch (e) {
      console.error('Failed to read session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectRole = (role: 'ADMIN' | 'OWNER') => {
    setUserRole(role);
    try {
      localStorage.setItem('munyaka_portal_role', role);
      localStorage.setItem('munyaka_current_role', role);
    } catch (e) {
      console.error('Failed to persist role:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading Munyaka Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {userRole === 'ADMIN' && <AdminPortal />}
      {userRole === 'OWNER' && <OwnersPortal />}
      {!userRole && <RoleSelectorGateway onSelect={handleSelectRole} />}
    </BrowserRouter>
  );
}

export default App;
