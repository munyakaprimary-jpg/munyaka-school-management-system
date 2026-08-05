"use client";

import React, { useState, useEffect } from 'react';
import { syncEngine, SyncStatus } from '@/services/sync-engine';
import { 
  CloudCheck, 
  CloudOff, 
  Cloud, 
  Loader2, 
  AlertCircle,
  Wifi,
  WifiOff,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const SyncStatusHeader: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = syncEngine.onStatusChange((newStatus, count) => {
      setStatus(newStatus);
      setPendingCount(count);
      setIsOnline(newStatus !== 'offline');
    });

    // Initial status
    syncEngine.getStatus();
    
    return unsubscribe;
  }, []);

  const getStatusConfig = () => {
    if (status === 'syncing') {
      return {
        icon: <Loader2 className="animate-spin" size={compact ? 14 : 16} />,
        label: 'Syncing...',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        pulse: true
      };
    }
    
    if (!isOnline || status === 'offline') {
      return {
        icon: <WifiOff size={compact ? 14 : 16} />,
        label: 'Offline',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        pulse: false
      };
    }

    if (pendingCount > 0) {
      return {
        icon: <CloudOff size={compact ? 14 : 16} />,
        label: `${pendingCount} Saved offline`,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        pulse: false
      };
    }

    return {
      icon: <CloudCheck size={compact ? 14 : 16} />,
      label: 'All synced',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      pulse: false
    };
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300",
        config.bg, config.border, config.color
      )}>
        <span className="flex items-center justify-center">{config.icon}</span>
        <span className="text-xs font-bold whitespace-nowrap">{config.label}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm transition-all duration-300",
      config.bg, config.border, config.color
    )}>
      <div className={cn(
        "p-2 rounded-xl flex items-center justify-center",
        config.pulse && "animate-pulse"
      )}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{config.label}</p>
        <p className="text-xs opacity-70">
          {status === 'syncing' ? 'Uploading pending records...' : 
           status === 'offline' ? 'Changes saved locally' :
           pendingCount > 0 ? 'Will sync when online' : 'Last sync: Just now'}
        </p>
      </div>
      {pendingCount > 0 && status !== 'syncing' && (
        <button
          onClick={() => syncEngine.forceSync()}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
        >
          Sync Now
        </button>
      )}
    </div>
  );
};

export default SyncStatusHeader;