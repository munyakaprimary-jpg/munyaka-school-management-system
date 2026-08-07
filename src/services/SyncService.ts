import { dbService } from './DatabaseService';

class SyncService {
  async sync(): Promise<void> {
    const pending = await dbService.getPendingQueue();
    for (const item of pending) {
      try {
        const response = await fetch('http://172.27.204.196:3000/api/sync', {
          method: 'POST',
          body: JSON.stringify(item.payload),
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          await dbService.updateStatus(item.id, 'SYNCED');
        } else {
          // Handle error by incrementing retry count
          await dbService.updateRetryCount(item.id, item.retry_count + 1);
        }
      } catch (error) {
        // Log error and increment retry count
        console.error('Sync failed for item', item.id, error);
        await dbService.updateRetryCount(item.id, item.retry_count + 1);
      }
    }
  }
}

// Export instance
export const syncService = new SyncService();