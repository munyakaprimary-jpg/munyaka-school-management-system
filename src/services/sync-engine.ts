import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor/http';
import { Network } from '@capacitor/network';
import { offlineDB, SyncQueueItem, TeacherActionPayload } from '@/lib/offline-db';
import { showSuccess } from '@/utils/toast';

const ADMIN_SYNC_ENDPOINT = 'http://192.168.1.100:3000/api/sync'; // Will be configurable
const SYNC_INTERVAL = 10000; // 10 seconds
const BATCH_SIZE = 50;

type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline';

class SyncEngine {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private networkListener: any = null;
  private currentStatus: SyncStatus = 'idle';
  private statusListeners: Set<(status: SyncStatus, pendingCount: number) => void> = new Set();
  private isSyncing = false;
  private adminEndpoint = ADMIN_SYNC_ENDPOINT;

  async initialize(): Promise<void> {
    await offlineDB.initialize();
    await this.setupNetworkListener();
    this.startPeriodicSync();
    await this.updateStatus();
  }

  private async setupNetworkListener(): Promise<void> {
    try {
      const status = await Network.getStatus();
      this.currentStatus = status.connected ? 'online' : 'offline';
      this.notifyListeners();

      this.networkListener = Network.addListener('networkStatusChange', (status) => {
        this.currentStatus = status.connected ? 'online' : 'offline';
        this.notifyListeners();
        if (status.connected) {
          this.triggerSync();
        }
      });
    } catch (error) {
      console.warn('Network listener not available:', error);
      this.currentStatus = 'online'; // Assume online for web
    }
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.currentStatus === 'online' && !this.isSyncing) {
        this.triggerSync();
      }
    }, SYNC_INTERVAL);
  }

  async triggerSync(): Promise<void> {
    if (this.isSyncing || this.currentStatus !== 'online') return;

    this.isSyncing = true;
    this.setStatus('syncing');

    try {
      const pendingItems = await offlineDB.getPendingItems(BATCH_SIZE);
      
      if (pendingItems.length === 0) {
        this.setStatus('online');
        this.isSyncing = false;
        return;
      }

      const ids = pendingItems.map(item => item.id!);
      await offlineDB.markAsSyncing(ids);

      const payloads = pendingItems.map(item => ({
        id: item.id,
        type: item.payload_type,
        data: JSON.parse(item.payload)
      }));

      const response = await Http.post({
        url: this.adminEndpoint,
        headers: {
          'Content-Type': 'application/json',
        },
        data: { items: payloads },
        timeout: 30000,
      });

      if (response.status === 200) {
        const result = response.data as { status: string; syncedIds: number[] };
        if (result.status === 'success' && result.syncedIds.length > 0) {
          await offlineDB.markAsSynced(result.syncedIds);
          showSuccess(`Sync Complete: Uploaded ${result.syncedIds.length} records to Admin host`);
        }
        // Handle any failed items
        const failedIds = ids.filter(id => !result.syncedIds.includes(id));
        if (failedIds.length > 0) {
          await offlineDB.markAsFailed(failedIds);
        }
      } else {
        await offlineDB.markAsFailed(ids);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      const pendingItems = await offlineDB.getPendingItems(BATCH_SIZE);
      const ids = pendingItems.map(item => item.id!);
      await offlineDB.markAsFailed(ids);
    } finally {
      this.isSyncing = false;
      await this.updateStatus();
    }
  }

  private async updateStatus(): Promise<void> {
    const count = await offlineDB.getPendingCount();
    this.notifyListeners(count);
  }

  private setStatus(status: SyncStatus): void {
    this.currentStatus = status;
    this.notifyListeners();
  }

  private notifyListeners(pendingCount?: number): void {
    const count = pendingCount !== undefined ? pendingCount : 
      (this.currentStatus === 'syncing' ? -1 : 0); // Will be updated by updateStatus
    this.statusListeners.forEach(listener => listener(this.currentStatus, count));
  }

  onStatusChange(listener: (status: SyncStatus, pendingCount: number) => void): () => void {
    this.statusListeners.add(listener);
    // Immediately notify with current state
    offlineDB.getPendingCount().then(count => listener(this.currentStatus, count));
    return () => this.statusListeners.delete(listener);
  }

  setAdminEndpoint(endpoint: string): void {
    this.adminEndpoint = endpoint;
  }

  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  async forceSync(): Promise<void> {
    await this.triggerSync();
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.networkListener) {
      this.networkListener.remove();
      this.networkListener = null;
    }
    this.statusListeners.clear();
  }
}

export const syncEngine = new SyncEngine();