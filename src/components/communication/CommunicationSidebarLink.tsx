import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { readOutbox } from './EmailJSConfig';

/**
 * Standalone sidebar link for the Communication entry.
 * 
 * Re-renders itself every `REFRESH_INTERVAL_MS` ms so the outbox
 * badge stays accurate even when a background sync drains the queue
 * asynchronously. We could have used a custom event bus, but a simple
 * polling tick is sufficient for a single-tab app and avoids cross-
 * tab sync complexity.
 */
const REFRESH_INTERVAL_MS = 4_000;

const CommunicationSidebarLink: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState<number>(() => readOutbox().length);

  useEffect(() => {
    const refresh = () => setPendingCount(readOutbox().length);
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);

    // Also refresh immediately when the route changes so navigating
    // to /communication after composing shows the freshest state.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'communication_outbox') refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(id);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
    };
  }, [location.pathname]);

  const isActive = location.pathname === '/communication';

  return (
    <Link
      to="/communication"
      className={cn(
        'flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 min-h-[48px] touch-active group',
        isActive
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50'
          : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
      )}
    >
      <MessageSquare
        size={20}
        className={cn(
          'shrink-0',
          isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
        )}
      />
      {!collapsed && (
        <>
          <span className="truncate">Communication</span>
          {pendingCount > 0 && (
            <span
              className={cn(
                'ml-auto inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[10px] font-black',
                isActive
                  ? 'bg-white text-indigo-700'
                  : 'bg-amber-100 text-amber-700'
              )}
              aria-label={`${pendingCount} pending messages`}
            >
              {pendingCount}
            </span>
          )}
        </>
      )}
      {collapsed && pendingCount > 0 && (
        <span
          className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black bg-amber-500 text-white ring-2 ring-white"
          aria-label={`${pendingCount} pending messages`}
        >
          {pendingCount}
        </span>
      )}
    </Link>
  );
};

export default CommunicationSidebarLink;