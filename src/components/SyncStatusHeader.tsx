import { useEffect, useState } from 'react';
import { dbService } from '../services/DatabaseService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function SyncStatusHeader() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateCount = async () => {
      const count = await dbService.getPendingCount();
      setPendingCount(count);
    };
    updateCount();
    
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { syncService } = await import('../services/SyncService');
      await syncService.sync();
      const count = await dbService.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (pendingCount === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background p-3 shadow-md">
      <Badge variant={pendingCount > 10 ? 'destructive' : 'secondary'}>
        {pendingCount} pending
      </Badge>
      <Button
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
        Sync Now
      </Button>
    </div>
  );
}