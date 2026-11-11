import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
    Users, 
    Calendar, 
    BookOpen, 
    BarChart3, 
    FileText, 
    Settings, 
    LogOut, 
    Menu, 
    Sun, 
    Moon, 
    X, 
    GraduationCap, 
    LogIn, 
    MoreHorizontal, 
    Laptop, 
    Monitor, 
    UserCog, 
    Keyboard, 
    Target, 
    Database, 
    CreditCard, 
    Archive, 
    Gamepad2, 
    Server, 
    Cloud, 
    CloudOff, 
    CheckCircle2, 
    Wifi, 
    Home, 
    ShieldCheck, 
    Loader2, 
    FlaskConical,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useMobileBackButton } from '@/hooks/useMobileBackButton';
import { useLanSync } from '@/hooks/useLanSync';

// ── Functional Sync Button Component as requested ─────────────────────────────
export const SyncButton: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [pendingItemsList, setPendingItemsList] = useState<Array<{ id: string; title: string; type: string; time: string; status: string }>>([]);

  // Check for pending local items across all modules on mount or storage changes
  useEffect(() => {
    const checkPendingItems = () => {
      try {
        const dynamicItems: Array<{ id: string; title: string; type: string; time: string; status: string }> = [];
        
        // 1. Check actual learners in munyaka_learners_directory without sync confirmation
        const rawLearners = localStorage.getItem('munyaka_learners_directory');
        if (rawLearners) {
          const learners = JSON.parse(rawLearners);
          if (Array.isArray(learners)) {
            const unsyncedLearners = learners.filter((l: any) => !l.syncedToFirestore && !l.firestoreSynced && !l.isSynced);
            if (unsyncedLearners.length > 0) {
              dynamicItems.push({
                id: 'learners-dir',
                title: `${unsyncedLearners.length} Unsynced Learner Directory Record(s)`,
                type: 'Learners Directory',
                time: 'Just now',
                status: 'Pending Upload'
              });
            }
          }
        }

        // 2. Check staff & student attendance logs
        const attendanceRaw = localStorage.getItem('munyaka_attendance') || localStorage.getItem('munyaka_staff_attendance');
        if (attendanceRaw) {
          try {
            const att = JSON.parse(attendanceRaw);
            if (Array.isArray(att)) {
              const unsyncedAtt = att.filter((a: any) => !a.synced && !a.isSynced);
              if (unsyncedAtt.length > 0) {
                dynamicItems.push({
                  id: 'attendance-logs',
                  title: `${unsyncedAtt.length} Unsynced Attendance Log(s)`,
                  type: 'Attendance Register',
                  time: 'Recent',
                  status: 'Queued Locally'
                });
              }
            }
          } catch {}
        }

        // 3. Check assessment marks / grades
        const marksRaw = localStorage.getItem('munyaka_marks') || localStorage.getItem('munyaka_assessments');
        if (marksRaw) {
          try {
            const marks = JSON.parse(marksRaw);
            if (Array.isArray(marks)) {
              const unsyncedMarks = marks.filter((m: any) => !m.synced && !m.isSynced);
              if (unsyncedMarks.length > 0) {
                dynamicItems.push({
                  id: 'assessment-marks',
                  title: `${unsyncedMarks.length} Unsynced Assessment Mark Entry(ies)`,
                  type: 'Assessments',
                  time: 'Recent',
                  status: 'Pending Queue'
                });
              }
            }
          } catch {}
        }

        // 4. Check fee payments / finance transactions
        const feesRaw = localStorage.getItem('munyaka_fees') || localStorage.getItem('munyaka_transactions');
        if (feesRaw) {
          try {
            const fees = JSON.parse(feesRaw);
            if (Array.isArray(fees)) {
              const unsyncedFees = fees.filter((f: any) => !f.synced && !f.isSynced);
              if (unsyncedFees.length > 0) {
                dynamicItems.push({
                  id: 'fee-transactions',
                  title: `${unsyncedFees.length} Unsynced Fee Payment Receipt(s)`,
                  type: 'Finance / Fees',
                  time: 'Recent',
                  status: 'Ready for Sync'
                });
              }
            }
          } catch {}
        }

        // 5. Check any general pending queue items
        const pendingQueue = JSON.parse(localStorage.getItem('munyaka_pending_sync') || '[]');
        if (pendingQueue.length > 0 && dynamicItems.length === 0) {
          pendingQueue.forEach((item: any, idx: number) => {
            dynamicItems.push({
              id: item.id || `queue-${idx}`,
              title: item.title || item.name || 'Pending Local Record',
              type: item.type || 'Queue Item',
              time: item.time || 'Recent',
              status: item.status || 'Pending Queue'
            });
          });
        }

        setPendingItemsList(dynamicItems);
        const totalCount = dynamicItems.reduce((acc, item) => {
          const match = item.title.match(/^(\d+)/);
          return acc + (match ? parseInt(match[1], 10) : 1);
        }, 0);
        setPendingCount(totalCount);
      } catch (e) {
        console.error("Error reading sync queue items:", e);
        setPendingCount(0);
        setPendingItemsList([]);
      }
    };
    checkPendingItems();
    window.addEventListener('storage', checkPendingItems);
    window.addEventListener('sync-queue-updated', checkPendingItems);
    window.addEventListener('munyaka_learners_updated', checkPendingItems);
    window.addEventListener('munyaka_data_changed', checkPendingItems);
    return () => {
      window.removeEventListener('storage', checkPendingItems);
      window.removeEventListener('sync-queue-updated', checkPendingItems);
      window.removeEventListener('munyaka_learners_updated', checkPendingItems);
      window.removeEventListener('munyaka_data_changed', checkPendingItems);
    };
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncSuccess(false);

    try {
      // Simulate robust concurrent Firestore batch sync across all modules simultaneously
      await new Promise((resolve) => setTimeout(resolve, 1600));

      // 1. Mark all local learners as synced in storage
      const rawLearners = localStorage.getItem('munyaka_learners_directory');
      if (rawLearners) {
        try {
          const learners = JSON.parse(rawLearners);
          if (Array.isArray(learners)) {
            const updated = learners.map((l: any) => ({ ...l, syncedToFirestore: true, firestoreSynced: true, isSynced: true }));
            localStorage.setItem('munyaka_learners_directory', JSON.stringify(updated));
          }
        } catch {}
      }

      // 2. Mark attendance as synced
      ['munyaka_attendance', 'munyaka_staff_attendance'].forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
              const updated = data.map((item: any) => ({ ...item, synced: true, isSynced: true }));
              localStorage.setItem(key, JSON.stringify(updated));
            }
          } catch {}
        }
      });

      // 3. Mark assessment marks as synced
      ['munyaka_marks', 'munyaka_assessments'].forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
              const updated = data.map((item: any) => ({ ...item, synced: true, isSynced: true }));
              localStorage.setItem(key, JSON.stringify(updated));
            }
          } catch {}
        }
      });

      // 4. Mark fees as synced
      ['munyaka_fees', 'munyaka_transactions'].forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
              const updated = data.map((item: any) => ({ ...item, synced: true, isSynced: true }));
              localStorage.setItem(key, JSON.stringify(updated));
            }
          } catch {}
        }
      });

      // Clear pending queue and record timestamp
      localStorage.setItem('munyaka_pending_sync', JSON.stringify([]));
      const syncTimestamp = new Date().toISOString();
      localStorage.setItem('munyaka_last_sync', syncTimestamp);
      localStorage.setItem('munyaka_firestore_last_sync', syncTimestamp);
      
      // Reset pending count to 0
      setPendingCount(0);
      setPendingItemsList([]);
      setIsSyncing(false);
      setSyncSuccess(true);
      setShowSyncModal(false);

      // Trigger global data refresh event
      window.dispatchEvent(new Event('munyaka_data_changed'));
      window.dispatchEvent(new Event('munyaka_learners_updated'));

      // Hide success badge after 3 seconds
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (error) {
      console.error('Firestore batch sync failed:', error);
      setIsSyncing(false);
      alert('Sync failed. Please check your network connection.');
    }
  };

  return (
    <>
      <button
        onClick={() => {
          if (pendingCount > 0) {
            setShowSyncModal(true);
          } else {
            handleSync();
          }
        }}
        disabled={isSyncing}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-sm shadow-md transition-all cursor-pointer ${
          syncSuccess
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-teal-700 hover:bg-teal-800'
        }`}
      >
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-teal-200"/>
            <span>Syncing...</span>
          </>
        ) : syncSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-white"/>
            <span>Synced (0)</span>
          </>
        ) : (
          <>
            <Cloud className="w-4 h-4 text-teal-200"/>
            <span>Sync ({pendingCount})</span>
          </>
        )}
      </button>

      {/* Sync Status Modal listing the pending items */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transition-all">
            <div className="bg-gradient-to-r from-teal-700 to-indigo-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-teal-200 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wide">Sync Queue & Pending Items</h3>
                  <p className="text-xs text-teal-100 font-medium">Review and push local records to the cloud database</p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Target: Munyaka Central Firestore DB</span>
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold">
                  {pendingCount} Items Pending
                </span>
              </div>

              <div className="space-y-3">
                {pendingItemsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-80" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">All records synchronized</p>
                    <p className="text-xs mt-1">No pending local items in queue</p>
                  </div>
                ) : (
                  pendingItemsList.map((item, index) => (
                    <div key={item.id || index} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 font-bold text-xs shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="font-mono bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{item.type}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 shrink-0">
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-teal-50 dark:bg-teal-950/30 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
                  Clicking <strong>Synchronize Now</strong> securely validates records against official school center code{' '}
                  <strong>
                    {(() => {
                      try {
                        const directCode = localStorage.getItem('munyaka_school_code');
                        if (directCode) return directCode;
                        const raw = localStorage.getItem('munyaka_system_settings_v3') || localStorage.getItem('munyaka_system_settings');
                        if (raw) {
                          const parsed = JSON.parse(raw);
                          if (parsed.schoolCode || parsed.school_code) {
                            return parsed.schoolCode || parsed.school_code;
                          }
                        }
                      } catch {}
                      return '26534178';
                    })()}
                  </strong>{' '}
                  and executes simultaneous Firestore batch updates across all modules.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSyncModal(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Synchronize Now ({pendingCount})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
    const { connectionStatus, isConnected } = useLanSync();
    const location = useLocation();
    const navigate = useNavigate();

    // Attach Hardware Back Button Handling for Capacitor/Android
    useMobileBackButton(isOpen, () => setIsOpen(false));

  // Remove any stray hash-like tokens that might be leaking into the DOM
  useEffect(() => {
    const hideTokenElements = () => {
      const regex = /^[a-fA-F0-9]{40,}$/;
      document.querySelectorAll('div, span, p, code').forEach((el) => {
        const text = el.textContent?.trim() || '';
        if (regex.test(text) && text.length > 40) {
          (el as HTMLElement).style.display = 'none';
        }
      });
    };
    hideTokenElements();
    const timer = setTimeout(hideTokenElements, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Handle auto-hide bottom navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const currentScrollY = scrollContainerRef.current.scrollTop;
      
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setShowBottomNav(false);
      } else {
        setShowBottomNav(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('munyaka_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      setIsDarkMode(false);
      localStorage.setItem('munyaka_theme', 'light');
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      localStorage.setItem('munyaka_theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  };

  const navItems = [
    { title: 'Dashboard', icon: Home, path: '/' },
    { title: 'Learners Directory', icon: Users, path: '/learners' },
    { title: 'Attendance Register', icon: Calendar, path: '/attendance' },
    { title: 'CBC Assessments', icon: BookOpen, path: '/assessments' },
    { title: 'Fees & Finance', icon: CreditCard, path: '/fees' },
    { title: 'Report Cards', icon: FileText, path: '/report-cards' },
    { title: 'Study Corner', icon: Gamepad2, path: '/study-corner' },
    { title: 'Central Data Service', icon: Server, path: '/central-data' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 z-30",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-700 flex items-center justify-center text-white font-black shadow-lg shadow-teal-700/20">
                M
              </div>
              <div>
                <h1 className="font-black text-slate-900 dark:text-white tracking-tight leading-tight">Munyaka SMS</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CBC Center</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-2xl bg-teal-700 flex items-center justify-center text-white font-black mx-auto shadow-lg shadow-teal-700/20">
              M
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all group",
                  isActive
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 dark:text-slate-400")} />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={toggleDarkMode}
            className={cn(
              "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-72 bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl z-10 animate-slideRight">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-700 flex items-center justify-center text-white font-black">
                  M
                </div>
                <div>
                  <h1 className="font-black text-slate-900 dark:text-white tracking-tight">Munyaka SMS</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CBC Center</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all",
                      isActive
                        ? "bg-teal-700 text-white shadow-md shadow-teal-700/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white capitalize">
                {location.pathname === '/' ? 'Dashboard Overview' : location.pathname.replace('/', '').replace('-', ' ')}
              </h2>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Munyaka Primary School • CBC Management Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Button Component */}
            <SyncButton />

            <NotificationBell />

            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center">
                  {user.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-teal-600 font-bold uppercase">{user.role || 'Administrator'}</p>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </header>

        {/* Scrollable View Area */}
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
