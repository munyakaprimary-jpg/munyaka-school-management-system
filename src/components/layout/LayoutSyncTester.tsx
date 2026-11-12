import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LayoutSyncTester() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const updateCount = () => {
      try {
        const stored = localStorage.getItem('munyaka_learners');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const unsynced = parsed.filter((l: any) => l.synced === false).length;
            setPendingCount(unsynced);
            return;
          }
        }
      } catch (e) {}
      setPendingCount(0);
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('munyaka_learners_updated', updateCount);
    window.addEventListener('munyaka-data-updated', updateCount);

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('munyaka_learners_updated', updateCount);
      window.removeEventListener('munyaka-data-updated', updateCount);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const stored = localStorage.getItem('munyaka_learners');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const syncedList = parsed.map((l: any) => ({ ...l, synced: true }));
          localStorage.setItem('munyaka_learners', JSON.stringify(syncedList));
          localStorage.setItem('munyaka_learners_directory', JSON.stringify(syncedList));
        }
      }
      await new Promise(r => setTimeout(r, 600));
      setPendingCount(0);
      window.dispatchEvent(new Event('munyaka_learners_updated'));
      window.dispatchEvent(new Event('munyaka-data-updated'));
    } catch (e) {
      console.error("Sync error", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl text-xs font-semibold transition-all shadow-sm"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>Sync ({pendingCount})</span>
      </button>
    </div>
  );
}
