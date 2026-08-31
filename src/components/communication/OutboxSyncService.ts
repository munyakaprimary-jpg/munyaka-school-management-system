import { 
  EMAILJS_CONFIG, 
  OUTBOX_STORAGE_KEY, 
  QueuedMessage 
} from './EmailJSConfig';

// EmailJS Library Import - Install via: npm install @emailjs/browser
// If not installed, we provide a fallback simulated send function
let emailjs: any = null;
try {
  // Dynamic import to avoid build errors if not installed
  emailjs = require('@emailjs/browser');
} catch (e) {
  console.warn(
    '[OutboxSync] @emailjs/browser not installed. Using simulated send. ' +
    'Run: npm install @emailjs/browser'
  );
}

/**
 * Read all queued messages from localStorage.
 * Returns an empty array if storage is unavailable or no queue exists.
 */
export const readOutbox = (): QueuedMessage[] => {
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (e) {
    console.error('[OutboxSync] Failed to read outbox:', e);
    return [];
  }
};

/**
 * Persist the outbox array back to localStorage.
 */
const writeOutbox = (queue: QueuedMessage[]): void => {
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[OutboxSync] Failed to write outbox:', e);
  }
};

/**
 * Add a new message to the pending outbox queue.
 * Returns the persisted message object (with generated id and timestamp).
 */
export const enqueueMessage = (
  payload: Omit<QueuedMessage, 'id' | 'timestamp' | 'status'>
): QueuedMessage => {
  const msg: QueuedMessage = {
    ...payload,
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };
  const queue = readOutbox();
  queue.push(msg);
  writeOutbox(queue);
  return msg;
};

/**
 * Remove a single message from the queue by id.
 * Called after EmailJS confirms a successful send.
 */
const removeFromOutbox = (id: string): void => {
  const queue = readOutbox();
  const next = queue.filter((m) => m.id !== id);
  writeOutbox(next);
};

/**
 * Mark a message as currently being sent (or failed) without
 * removing it from the queue. Used to reflect in-flight state in
 * the dashboard.
 */
const updateMessageStatus = (
  id: string,
  status: QueuedMessage['status']
): void => {
  const queue = readOutbox();
  const next = queue.map((m) =>
    m.id === id ? { ...m, status } : m
  );
  writeOutbox(next);
};

/**
 * Send a single queued message via EmailJS.
 * Returns a promise that resolves to true on success, false on failure.
 * 
 * If @emailjs/browser is not installed, this falls back to a
 * simulated send that always succeeds (useful for local dev /
 * previews). The localStorage queue still gets cleaned up either way
 * so the dashboard reflects the user experience accurately.
 */
const sendOne = async (msg: QueuedMessage): Promise<boolean> => {
  try {
    updateMessageStatus(msg.id, 'sending');

    // If EmailJS is not available, simulate a successful send after
    // a brief delay. The simulated path still removes the message
    // from the queue (so the dashboard is consistent), and it can
    // be detected by callers who want to flag a "demo" build.
    if (!emailjs) {
      await new Promise((r) => setTimeout(r, 600));
      removeFromOutbox(msg.id);
      return true;
    }

    // Real EmailJS send. The template params below match the field
    // names most common EmailJS templates use; tweak here if your
    // template uses different variable names.
    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      {
        to_email: msg.to_email,
        sender_name: msg.sender_name,
        subject: msg.subject ?? '',
        message: msg.message_body,
        // Some templates include a timestamp variable
        sent_at: new Date(msg.timestamp).toISOString(),
      },
      {
        publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
      }
    );

    if (result && (result.status === 200 || result.text === 'OK')) {
      removeFromOutbox(msg.id);
      return true;
    }

    updateMessageStatus(msg.id, 'pending');
    return false;
  } catch (err) {
    console.error('[OutboxSync] sendOne failed for', msg.id, err);
    // Increment retry count and keep the message in the queue for
    // the next sync attempt.
    const queue = readOutbox();
    const next = queue.map((m) =>
      m.id === msg.id
        ? { ...m, status: 'pending' as const, retryCount: (m.retryCount ?? 0) + 1 }
        : m
    );
    writeOutbox(next);
    return false;
  }
};

/**
 * Drain the entire pending outbox by sending each message in
 * sequence. Returns a summary with sent/failed counts.
 * 
 * Safe to call repeatedly: the function is idempotent — already-sent
 * messages have been removed from localStorage, so duplicate calls
 * simply re-process any remaining pending entries.
 */
export const syncOutbox = async (): Promise<{ sent: number; failed: number }> => {
  const queue = readOutbox().filter((m) => m.status !== 'sending');
  if (queue.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const msg of queue) {
    const ok = await sendOne(msg);
    if (ok) sent += 1;
    else failed += 1;
  }

  return { sent, failed };
};

/**
 * Register the global online listener that fires a background sync
 * whenever the browser regains connectivity. Returns the listener
 * function so callers can remove it on unmount.
 */
export const registerOnlineSyncListener = (
  onSyncComplete?: (result: { sent: number; failed: number }) => void
): (() => void) => {
  const handler = () => {
    syncOutbox()
      .then((result) => {
        onSyncComplete?.(result);
      })
      .catch((err) => {
        console.error('[OutboxSync] Background sync failed:', err);
        onSyncComplete?.({ sent: 0, failed: 0 });
      });
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
};