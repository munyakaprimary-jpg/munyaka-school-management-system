import { useCallback, useEffect, useState } from 'react';
import { offlineDB, TeacherActionPayload } from '@/lib/offline-db';
import { syncEngine } from '@/services/sync-engine';
import { showSuccess, showError } from '@/utils/toast';

export const useOfflineSync = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'online' | 'offline'>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        await offlineDB.initialize();
        await syncEngine.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize offline sync:', error);
        showError('Offline sync unavailable');
      }
    };
    init();

    const unsubscribe = syncEngine.onStatusChange((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
    });

    return () => unsubscribe();
  }, []);

  const saveActionOffline = useCallback(async (
    actionType: TeacherActionPayload['action'],
    data: any
  ): Promise<boolean> => {
    if (!isInitialized) {
      showError('Offline database not ready');
      return false;
    }

    const payload: TeacherActionPayload = {
      action: actionType,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        device_id: getDeviceId(),
        teacher_id: getCurrentTeacherId()
      },
      timestamp: new Date().toISOString(),
      device_id: getDeviceId(),
      teacher_id: getCurrentTeacherId()
    };

    try {
      await offlineDB.addToSyncQueue(actionType, payload);
      
      // Also save to local cache for immediate UI updates
      switch (actionType) {
        case 'attendance':
          await offlineDB.saveAttendanceLocally(payload.data);
          break;
        case 'marks':
          await offlineDB.saveMarksLocally(payload.data);
          break;
        case 'staff_checkin':
          await offlineDB.saveStaffCheckinLocally(payload.data);
          break;
      }

      // Trigger immediate sync if online
      if (syncStatus === 'online') {
        syncEngine.triggerSync();
      }

      showSuccess(`${actionType} saved offline, will sync when online`);
      return true;
    } catch (error) {
      console.error('Failed to save offline:', error);
      showError('Failed to save offline');
      return false;
    }
  }, [isInitialized, syncStatus]);

  const forceSync = useCallback(async () => {
    await syncEngine.forceSync();
  }, []);

  return {
    isInitialized,
    syncStatus,
    pendingCount,
    saveActionOffline,
    forceSync,
    isOnline: syncStatus !== 'offline'
  };
};

// Helper functions - in real app these would come from auth context
function getDeviceId(): string {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

function getCurrentTeacherId(): string {
  // This would come from your auth context
  return localStorage.getItem('teacher_id') || 'teacher_unknown';
}