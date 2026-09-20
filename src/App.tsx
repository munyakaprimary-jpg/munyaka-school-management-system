import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Staff from './pages/Staff';
import Fees from './pages/Fees';
import Settings from './pages/Settings';
import { LayoutDashboard, Users, UserCheck, CreditCard, Settings as SettingsIcon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'staff' | 'fees' | 'settings'>('dashboard');

  return (
    <AppErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <div style={{
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {/* Top Navigation & Status Bar */}
            <header style={{
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              position: 'sticky',
              top: 0,
              zIndex: 50
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  🏫
                </div>
                <div>
                  <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Munyaka School Portal
                  </h1>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                    Router-First Provider Hierarchy
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'dashboard' ? '#2563eb' : 'transparent',
                    color: activeTab === 'dashboard' ? '#ffffff' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <LayoutDashboard size={15} /> Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'students' ? '#2563eb' : 'transparent',
                    color: activeTab === 'students' ? '#ffffff' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <Users size={15} /> Learners
                </button>
                <button
                  onClick={() => setActiveTab('staff')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'staff' ? '#2563eb' : 'transparent',
                    color: activeTab === 'staff' ? '#ffffff' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <UserCheck size={15} /> Staff
                </button>
                <button
                  onClick={() => setActiveTab('fees')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'fees' ? '#2563eb' : 'transparent',
                    color: activeTab === 'fees' ? '#ffffff' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <CreditCard size={15} /> Fees
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'settings' ? '#2563eb' : 'transparent',
                    color: activeTab === 'settings' ? '#ffffff' : '#475569',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <SettingsIcon size={15} /> Settings
                </button>
              </div>
            </header>

            {/* Main Content Area with Isolated Error Boundaries per Module */}
            <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
              {activeTab === 'dashboard' && (
                <AppErrorBoundary>
                  <Dashboard />
                </AppErrorBoundary>
              )}
              {activeTab === 'students' && (
                <AppErrorBoundary>
                  <Students />
                </AppErrorBoundary>
              )}
              {activeTab === 'staff' && (
                <AppErrorBoundary>
                  <Staff />
                </AppErrorBoundary>
              )}
              {activeTab === 'fees' && (
                <AppErrorBoundary>
                  <Fees />
                </AppErrorBoundary>
              )}
              {activeTab === 'settings' && (
                <AppErrorBoundary>
                  <Settings />
                </AppErrorBoundary>
              )}
            </main>
          </div>
        </AuthProvider>
      </HashRouter>
    </AppErrorBoundary>
  );
}
