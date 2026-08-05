import { HttpService } from '@capacitor/http';
import { dbService } from './DatabaseService';
import { toast } from 'sonner';
import { EventEmitter } from 'events';

class SyncService extends EventEmitter {
  private syncInterval: any = null;
  private isSyncing = false;
  private adminHost: string = 'http://192.168.1.100:3000'; // Default, should be configurable

  constructor() {
    super();
  }

  setAdminHost(ip: string) {
    this.adminHost = `http://${ip}:3000`;
  }

  getAdminHost(): string {
    return this.adminHost;
  }

  startBackgroundSync(intervalMs: number = 7000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      const online = await dbService.isOnline();
      if (online && !this.isSyncing) {
        await this.syncPendingItems();
      }
    }, intervalMs);

    // Also trigger on network status change
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        setTimeout(() => this.syncPendingItems(), 1000);
      });
    }
  }

  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncPendingItems(): Promise<void> {
    if (this.isSyncing) return;

    const pendingCount = await dbService.getPendingCount();
    if (pendingCount === 0) return;

    this.isSyncing = true;
    this.emit('sync-start');

    try {
      const items = await dbService.getPendingQueue(50);
      if (items.length === 0) return;

      const batch = items.map(item => ({
        id: item.id,
        payload_type: item.payload_type,
        payload: JSON.parse(item.payload),
      }));

      const response = await HttpService.post({
        url: `${this.adminHost}/api/sync`,
        headers: { 'Content-Type': 'application/json' },
        body: batch,
        timeout: 15000,
      });

      if (response.status === 200 && response.data?.status === 'success') {
        const syncedIds: number[] = response.data.syncedIds;
        await dbService.deleteSyncedItems(syncedIds);

        if (syncedIds.length > 0) {
          toast.success(`Sync Complete: Uploaded ${syncedIds.length} records to Admin host`);
          this.emit('sync-complete', { count: syncedIds.length });
        }
      } else {
        console.error('Sync failed:', response);
        this.emit('sync-error', response);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      this.emit('sync-error', error);
    } finally {
      this.isSyncing = false;
      this.emit('sync-end');
    }
  }

  async forceSync(): Promise<void> {
    await this.syncPendingItems();
  }

  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();