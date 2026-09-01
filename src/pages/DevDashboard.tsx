import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Code2, Server, Globe, Bug, Shield, ArrowRight,
  X, Rocket, Database, Network, Terminal, GitBranch,
} from 'lucide-react';

type DevModule = 'overview' | 'build' | 'system' | 'tenant' | 'debug';

interface ModuleDef {
  id: DevModule;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  color: string;
  description: string;
}

const MODULES: ModuleDef[] = [
  {
    id: 'build',
    Icon: Code2,
    label: 'Build & Deploy',
    path: '/dev/build-deploy',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    description: 'CI/CD pipelines, release builds, version tagging, and deployment history.',
  },
  {
    id: 'system',
    Icon: Server,
    label: 'System Config',
    path: '/dev/system-config',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Global platform settings, feature flags, environment variables, and integrations.',
  },
  {
    id: 'tenant',
    Icon: Globe,
    label: 'Multi-Tenant',
    path: '/dev/multi-tenant',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Manage schools (tenants), provisioning, data isolation, and onboarding.',
  },
  {
    id: 'debug',
    Icon: Bug,
    label: 'Debug Console',
    path: '/dev/debug',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Live logs, error inspector, performance metrics, and runtime diagnostics.',
  },
];

// Derive active module from the current path — called on mount and on navigation
function moduleFromPath(pathname: string): DevModule {
  if (pathname.startsWith('/dev/build-deploy')) return 'build';
  if (pathname.startsWith('/dev/system-config')) return 'system';
  if (pathname.startsWith('/dev/multi-tenant')) return 'tenant';
  if (pathname.startsWith('/dev/debug')) return 'debug';
  return 'overview';
}

const DevDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState<DevModule>(() =>
    moduleFromPath(location.pathname)
  );

  // Keep activeModule in sync when the URL changes (e.g. browser back/forward)
  useEffect(() => {
    setActiveModule(moduleFromPath(location.pathname));
  }, [location.pathname]);

  const handleModuleClick = (mod: ModuleDef) => {
    setActiveModule(mod.id);
    // Route to the module's path so it survives refresh and is shareable
    navigate(mod.path);
  };

  return (
    <div className="p-6 md:p-10 bg-[#FBFBFA] min-h-screen text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Developer Dashboard</h1>
            <span className="px-3 py-1 bg-violet-50 text-violet-700 border border-violet-200 text-xs font-semibold rounded-full">
              DEV
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Platform maintenance, global system configuration, and debugging.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {MODULES.map(({ Icon, label, color, description, id, path }) => {
          const isActive = activeModule === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleModuleClick({ id, Icon, label, color, description, path })}
              aria-label={`Open ${label} module`}
              aria-pressed={isActive}
              className={[
                'p-5 border-2 rounded-2xl bg-white text-left transition-all',
                'cursor-pointer select-none',
                'hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]',
                isActive
                  ? 'ring-2 ring-violet-400 border-violet-300 shadow-lg'
                  : 'border-slate-200 hover:border-violet-200',
                color,
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/70 rounded-xl">
                  <Icon size={22} />
                </div>
                <ArrowRight
                  size={18}
                  className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                />
              </div>
              <p className="font-black text-sm">{label}</p>
              <p className="text-[10px] font-medium opacity-80 mt-1 line-clamp-2">
                {description}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-3 opacity-70">
                {isActive ? '● Active' : 'Open →'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active module inline panel (also reachable via route) */}
      {activeModule !== 'overview' && (
        <div className="mb-8 bg-white border-2 border-violet-100 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {(() => {
                const mod = MODULES.find((m) => m.id === activeModule);
                if (!mod) return null;
                const Icon = mod.Icon;
                return (
                  <>
                    <div className={`p-3 rounded-xl ${mod.color}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">{mod.label}</h2>
                      <p className="text-xs text-slate-500">{mod.description}</p>
                      <code className="text-[10px] font-mono text-violet-600 mt-1 inline-block">
                        {mod.path}
                      </code>
                    </div>
                  </>
                );
              })()}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveModule('overview');
                navigate('/dev/dashboard');
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              aria-label="Close module"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeModule === 'build' && (
              <>
                <DevAction Icon={Rocket} label="Trigger Production Build" />
                <DevAction Icon={GitBranch} label="Manage Release Branches" />
                <DevAction Icon={Terminal} label="View CI Run Logs" />
                <DevAction Icon={Database} label="Database Migration Status" />
              </>
            )}
            {activeModule === 'system' && (
              <>
                <DevAction Icon={Server} label="Environment Variables" />
                <DevAction Icon={Shield} label="Feature Flags" />
                <DevAction Icon={Database} label="API Rate Limits" />
                <DevAction Icon={Network} label="Webhook Configuration" />
              </>
            )}
            {activeModule === 'tenant' && (
              <>
                <DevAction Icon={Globe} label="Provision New School" />
                <DevAction Icon={Database} label="Tenant Data Isolation" />
                <DevAction Icon={Server} label="Tenant Health & Quotas" />
                <DevAction Icon={Network} label="Cross-Tenant Migrations" />
              </>
            )}
            {activeModule === 'debug' && (
              <>
                <DevAction Icon={Terminal} label="Live Server Logs" />
                <DevAction Icon={Bug} label="Error Inspector" />
                <DevAction Icon={Shield} label="Session Diagnostics" />
                <DevAction Icon={Database} label="Storage Inspector" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Default developer console panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Developer Console</h2>
            <p className="text-xs text-slate-500">
              Platform-level operations. Use with care.
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          This dashboard is reserved exclusively for the platform developer. It provides
          access to global system configuration, multi-tenant setup, and debugging tools
          that are not available to school administrators. Click any module above to open
          its control panel — your selection is also reflected in the URL so you can share
          or bookmark the active view.
        </p>
      </div>
    </div>
  );
};

const DevAction: React.FC<{ Icon: React.ComponentType<{ size?: number; className?: string }>; label: string }> = ({ Icon, label }) => (
  <button
    type="button"
    onClick={() => {
      // Hook into the real module action once each module is implemented.
      // For now, surface an inline console line so the developer knows the
      // click was registered.
      // eslint-disable-next-line no-console
      console.log(`[Dev] ${label} clicked`);
    }}
    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 border border-slate-200 rounded-xl text-left transition-all cursor-pointer group active:scale-[0.98]"
  >
    <div className="p-2 bg-white rounded-lg text-violet-600 group-hover:text-violet-700">
      <Icon size={16} />
    </div>
    <span className="font-bold text-sm text-slate-700 group-hover:text-violet-700">{label}</span>
    <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-violet-500 transition-all" />
  </button>
);

export default DevDashboard;
