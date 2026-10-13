import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LogOut, 
  Layers, 
  Plus, 
  Settings, 
  ShieldCheck, 
  Globe, 
  Database, 
  Sliders, 
  ChevronRight, 
  Key, 
  Users, 
  X,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OwnersDashboard from '@/pages/ownersDashboard';
import PaymentManagement from '@/pages/PaymentManagement';
import { TenantConfigModal, TenantFormData } from '@/components/TenantConfigModal';
import { toast } from 'sonner';

interface OwnersPortalProps {
  onLogout: () => void;
}

export type OwnerTab = 'Dashboard' | 'Subscriptions' | 'Platform Settings';

export default function OwnersPortal({ onLogout }: OwnersPortalProps) {
  const [activeTab, setActiveTab] = useState<OwnerTab>('Dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);

  // Ensure role is stored as OWNER
  useEffect(() => {
    localStorage.setItem('munyaka_portal_role', 'OWNER');
  }, []);

  const handleModalSubmit = (data: TenantFormData) => {
    toast.success(`Executive Action: School instance "${data.schoolName}" configured successfully.`);
    setIsProvisionModalOpen(false);
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Executive Owner Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">Munyaka Executive Owner Portal</h1>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono">EXECUTIVE GOVERNANCE</Badge>
            </div>
            <p className="text-xs text-slate-400">Multi-tenant platform orchestration & license governance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDrawerOpen(true)}
            className="bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 hover:text-white rounded-xl text-xs font-semibold"
          >
            <Layers className="h-4 w-4 mr-1.5" />
            Governance Drawer
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all rounded-xl text-xs font-semibold"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Exit to Gateway
          </Button>
        </div>
      </header>

      {/* Main Owner Views */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('Dashboard')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'Dashboard'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Tenants Overview
          </button>
          <button
            onClick={() => setActiveTab('Subscriptions')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'Subscriptions'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Subscriptions & Billing
          </button>
        </div>

        {activeTab === 'Dashboard' && <OwnersDashboard />}
        {activeTab === 'Subscriptions' && <PaymentManagement />}
      </main>

      {/* Slide-in Overlay Drawer for Multi-Tenant Governance */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slide-left">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h2 className="font-bold text-lg text-white">Multi-Tenant Governance</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Actions</h3>
                <Button
                  onClick={() => setIsProvisionModalOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white justify-start gap-2 py-3 rounded-xl shadow-lg shadow-emerald-600/20 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Provision New School Instance
                </Button>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform Status</h3>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Global Architecture</span>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Isolated Multi-Tenant</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Master Sync Engine</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Active Tenant Nodes</span>
                    <span className="text-white font-mono font-bold">4 Instances</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security & Compliance</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All tenant databases are encrypted at rest with strict row-level security isolation and automated offline-first SQLite sync nodes.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950/50">
              <Button
                variant="outline"
                onClick={() => setIsDrawerOpen(false)}
                className="w-full bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl font-semibold"
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Config Modal triggered from Drawer */}
      <TenantConfigModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onSubmit={handleModalSubmit}
        title="Provision New School Tenant Instance"
      />
    </div>
  );
}
