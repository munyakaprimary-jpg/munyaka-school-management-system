import React, { useState } from 'react';
import { db } from '../../config/firebase';
import { writeBatch, doc } from 'firebase/firestore';

export const CloudSyncCard: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>('');
  const [lastSyncStats, setLastSyncStats] = useState<{ total: number; timestamp: string } | null>(null);

  const handleSyncAllModules = async () => {
    setIsSyncing(true);
    setSyncProgress('Preparing offline collections...');

    const moduleMap = [
      { key: 'munyaka_library_inventory', collectionName: 'library' },
      { key: 'munyaka_science_lab_inventory', collectionName: 'science_lab' },
      { key: 'munyaka_fees_finance', collectionName: 'finance' },
      { key: 'munyaka_students', collectionName: 'students' },
      { key: 'munyaka_staff', collectionName: 'staff' },
    ];

    let totalSynced = 0;

    try {
      for (const item of moduleMap) {
        setSyncProgress(`Syncing ${item.collectionName.replace('_', ' ').toUpperCase()} module...`);
        const rawData = localStorage.getItem(item.key);
        
        if (rawData) {
          const parsedData = JSON.parse(rawData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            const batch = writeBatch(db);
            
            parsedData.forEach((record: any, index: number) => {
              const docId = record.id || record.admNo || `doc_${index}_${Date.now()}`;
              const docRef = doc(db, item.collectionName, String(docId));
              batch.set(docRef, {
                ...record,
                updatedAt: new Date().toISOString(),
                syncedBy: 'Portal Admin',
              }, { merge: true });
              totalSynced++;
            });

            await batch.commit();
          }
        }
      }

      setLastSyncStats({
        total: totalSynced,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setSyncProgress(`Successfully synced ${totalSynced} items across all modules!`);
    } catch (error) {
      console.error('Cloud Sync Error:', error);
      setSyncProgress('Sync failed. Please check your internet connection or Firestore rules.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">☁️ Cloud Database Sync</h2>
          <p className="text-xs text-gray-500">
            Push all local workstation data (Library, Science Lab, Fees & Finance) directly to Firestore.
          </p>
        </div>
        {lastSyncStats && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Synced {lastSyncStats.total} Records at {lastSyncStats.timestamp}
          </span>
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={handleSyncAllModules}
          disabled={isSyncing}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center space-x-2 ${
            isSyncing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
          }`}
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Syncing All Modules...</span>
            </>
          ) : (
            <>
              <span>☁️</span>
              <span>Sync All Modules to Cloud</span>
            </>
          )}
        </button>
      </div>

      {syncProgress && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center space-x-2">
          <span>🔄</span>
          <span>{syncProgress}</span>
        </div>
      )}
    </div>
  );
};

export default CloudSyncCard;
