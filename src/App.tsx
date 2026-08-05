import React, { useEffect } from 'react';
import { dbService } from './services/DatabaseService';
import { syncService } from './services/SyncService';
import { SyncStatusHeader } from './components/SyncStatusHeader';
import { Toaster } from 'sonner';
import AttendanceScreen from './screens/AttendanceScreen';
import MarksScreen from './screens/MarksScreen';
import CheckinScreen from './screens/CheckinScreen';

function App() {
  useEffect(() => {
    const init = async () => {
      await dbService.initialize();
      syncService.startBackgroundSync(7000);
    };
    init();

    return () => {
      syncService.stopBackgroundSync();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <SyncStatusHeader />
      <main className="p-4">
        {/* Your existing screens */}
        <AttendanceScreen />
        <MarksScreen />
        <CheckinScreen />
      </main>
    </div>
  );
}

export default App;