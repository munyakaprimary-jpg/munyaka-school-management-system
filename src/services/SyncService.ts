import { dbService } from './DatabaseService';

/**
 * Reads the configured LAN server URL from localStorage.
 * Mirrors the key used by SyncEngine.ts to ensure both services
 * always talk to the same server endpoint.
 */
const getServerUrl = (): string => {
  // Primary key (used by SyncEngine and LANServerConfig page)
  const primary = localStorage.getItem('lan_server_url');
  if (primary) return primary;

  // Legacy fallback — migrate old value on first read
  const legacy = localStorage.getItem('munyaka_lan_server_url');
  if (legacy) {
    localStorage.setItem('lan_server_url', legacy);
    localStorage.removeItem('munyaka_lan_server_url');
    return legacy;
  }

  return '';
};

class SyncService {
  private async getServerUrl(): Promise<string> {
    return getServerUrl();
  }

  /**
   * Push all pending local SQLite records to the configured LAN server.
   *
   * The server URL is resolved from localStorage on every call so that
   * changes made in the LANServerConfig page take effect immediately
   * without requiring a page reload or app restart.
   */
  async sync(): Promise<{ success: boolean; synced: number; failed: number; error?: string }> {
    const serverUrl = await this.getServerUrl();

    if (!serverUrl) {
      return { success: false, synced: 0, failed: 0, error: 'No LAN server URL configured' };
    }

    if (!navigator.onLine) {
      return { success: false, synced: 0, failed: 0, error: 'Device is offline' };
    }

    const pending = await dbService.getPendingQueue();

    if (pending.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${serverUrl}/api/sync`, {
          method: 'POST',
          body: JSON.stringify({
            device_id: item.device_id || `device-${Date.now()}`,
            records: [item.payload]
          }),
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          await dbService.updateStatus(item.id, 'SYNCED');
          synced++;
        } else {
          await dbService.updateRetryCount(item.id, item.retry_count + 1);
          failed++;
        }
      } catch (error) {
        console.error(`[SyncService] Failed to sync item ${item.id}:`, error);
        await dbService.updateRetryCount(item.id, item.retry_count + 1);
        failed++;
      }
    }

    return {
      success: failed === 0,
      synced,
      failed,
      error: failed > 0 ? `${failed} item(s) failed to sync` : undefined
    };
  }

  /**
   * Convenience wrapper: check if the server is reachable before syncing.
   */
  async syncIfOnline(): Promise<{ success: boolean; synced: number; failed: number; error?: string }> {
    const serverUrl = await this.getServerUrl();

    if (!serverUrl) {
      return { success: false, synced: 0, failed: 0, error: 'No server configured' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const healthResponse = await fetch(`${serverUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!healthResponse.ok) {
        return { success: false, synced: 0, failed: 0, error: `Server unreachable (HTTP ${healthResponse.status})` };
      }
    } catch {
      return { success: false, synced: 0, failed: 0, error: 'Cannot reach LAN server' };
    }

    return this.sync();
  }
}

export const syncService = new SyncService();
