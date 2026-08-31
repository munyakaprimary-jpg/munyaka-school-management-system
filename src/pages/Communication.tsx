import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import {
  MessageSquare,
  Mail,
  Send,
  History,
  UserCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { MESSAGES as initialMessages } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';
import { useNotifications } from '@/components/ui/notification-provider';
import {
  enqueueMessage,
  registerOnlineSyncListener,
  readOutbox,
  syncOutbox,
} from '@/components/communication/OutboxSyncService';
import { QueuedMessage } from '@/components/communication/EmailJSConfig';
import { cn } from '@/lib/utils';

const REFRESH_TICK_MS = 3_000;

const Communication = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // STRICT ACCESS CONTROL: Only super_admin can access the Dyad communication interface
  if (user?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  // ── Existing message log state ──
  const [messagesList, setMessagesList] = useState(initialMessages);
  const [isOpen, setIsOpen] = useState(false);
  const [msgType, setMsgType] = useState<'SMS' | 'Email'>('Email');
  const [recipient, setRecipient] = useState("All Parents");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // ── Offline-first outbox state ──
  const [outbox, setOutbox] = useState<QueuedMessage[]>(() => readOutbox());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('outbox');

  // ─────────────────────────────────────────────
  // Compose-and-queue flow
  // ─────────────────────────────────────────────

  /**
   * Build the email-message payload and persist it to localStorage.
   * The dashboard re-reads from localStorage so the outbox list
   * updates immediately. We also dispatch a custom event so other
   * open tabs (e.g. the sidebar link badge) refresh in lockstep.
   */
  const queueOutboundEmail = useCallback(() => {
    if (!subject.trim() && !body.trim()) {
      // No-op: caller should validate before invoking this.
      return;
    }

    enqueueMessage({
      to_email: recipient,                    // "All Parents" / "Grade 4 Blue" / etc.
      sender_name: user?.name || 'Munyaka School',
      subject: subject.trim() || '(No subject)',
      message_body: body.trim() || '(Empty body)',
    });

    // Force a re-read so the new row appears immediately.
    const next = readOutbox();
    setOutbox(next);
    window.dispatchEvent(new Event('storage'));   // wakes the badge tick

    showSuccess(
      isOnline
        ? 'Message queued. Will dispatch immediately via EmailJS.'
        : 'Saved to outbox. Will auto-send when internet is restored.'
    );

    // Clear the composer fields so the next draft starts fresh.
    setSubject('');
    setBody('');
  }, [recipient, subject, body, user?.name, isOnline]);

  // ─────────────────────────────────────────────
  // Manual sync trigger
  // ─────────────────────────────────────────────

  const handleManualSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncOutbox();
      // Always re-read from localStorage after a sync so the UI
      // reflects whatever the background send removed.
      setOutbox(readOutbox());
      window.dispatchEvent(new Event('storage'));

      if (result.sent > 0) {
        showSuccess(`Outbox synced: ${result.sent} message${result.sent === 1 ? '' : 's'} dispatched.`);
        addNotification({
          title: 'Outbox sync complete',
          message: `${result.sent} email${result.sent === 1 ? '' : 's'} sent via EmailJS.`,
          type: 'message',
        });
      } else if (result.failed > 0) {
        showSuccess(`Sync attempted: ${result.failed} message${result.failed === 1 ? '' : 's'} still queued.`);
      } else {
        showSuccess('Outbox is already empty. Nothing to send.');
      }
    } catch (e) {
      console.error('[Communication] manual sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, addNotification]);

  // ─────────────────────────────────────────────
  // Lifecycle: online/offline + auto-sync on reconnect
  // ─────────────────────────────────────────────

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      // Auto-drain the queue the moment connectivity returns.
      // Fire-and-forget — the manual-sync handler shows the toast
      // summary so we don't double-notify here.
      syncOutbox()
        .then((res) => {
          setOutbox(readOutbox());
          window.dispatchEvent(new Event('storage'));
          if (res.sent > 0) {
            showSuccess(`Back online. ${res.sent} queued message${res.sent === 1 ? '' : 's'} dispatched.`);
          }
        })
        .catch((e) => console.error('[Communication] online-sync error:', e));
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── Background sync listener (also handles storage-driven refresh) ──
  useEffect(() => {
    // Register the global "online" listener (defensive — the
    // useEffect above also handles this, but registering once via
    // the service is cleaner and re-uses the same code path).
    const unregister = registerOnlineSyncListener((result) => {
      if (result.sent > 0 || result.failed > 0) {
        setOutbox(readOutbox());
        window.dispatchEvent(new Event('storage'));
      }
    });

    // Cross-tab sync: if another tab updates the outbox, refresh
    // the dashboard so the count stays accurate.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'communication_outbox') setOutbox(readOutbox());
    };
    window.addEventListener('storage', onStorage);

    // Polling tick: even if no events fire, the UI keeps fresh.
    const tick = setInterval(() => {
      const next = readOutbox();
      setOutbox((prev) => {
        if (prev.length !== next.length) return next;
        return prev;
      });
    }, REFRESH_TICK_MS);

    return () => {
      unregister();
      window.removeEventListener('storage', onStorage);
      clearInterval(tick);
    };
  }, []);

  // ─────────────────────────────────────────────
  // Single-message removal (admin override)
  // ─────────────────────────────────────────────

  const handleDeleteQueued = useCallback((id: string) => {
    try {
      const next = readOutbox().filter((m) => m.id !== id);
      localStorage.setItem('communication_outbox', JSON.stringify(next));
      setOutbox(next);
      window.dispatchEvent(new Event('storage'));
      showSuccess('Queued message removed.');
    } catch (e) {
      console.error('[Communication] delete queued error:', e);
    }
  }, []);

  // ─────────────────────────────────────────────
  // Derived UI values
  // ─────────────────────────────────────────────

  const outboxCount = outbox.length;
  const failedCount = useMemo(
    () => outbox.filter((m) => (m.retryCount ?? 0) > 0).length,
    [outbox]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Communication Center</h1>
            {/* Connectivity indicator (Online / Offline) */}
            <Badge
              className={cn(
                'border-none font-bold text-[10px] uppercase tracking-widest gap-1.5 px-2.5 py-1',
                isOnline
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              )}
            >
              {isOnline ? (
                <>
                  <Wifi size={11} /> Online
                </>
              ) : (
                <>
                  <WifiOff size={11} /> Offline
                </>
              )}
            </Badge>
            {outboxCount > 0 && (
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-[10px] uppercase tracking-widest gap-1.5 px-2.5 py-1">
                <Clock size={11} /> {outboxCount} in Outbox
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Broadcast messages and track parent outreach. Offline-first: messages are queued locally and dispatched automatically when connectivity returns.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleManualSync}
            disabled={isSyncing || outboxCount === 0}
            className="rounded-2xl border-slate-200 gap-2"
            data-testid="communication-sync-outbox-btn"
          >
            {isSyncing ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            Sync Outbox Now
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-slate-200 gap-2"
            onClick={() => setActiveTab('logs')}
          >
            <History size={18} /> Logs
          </Button>
          <Button
            className="rounded-2xl shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            onClick={() => {
              setMsgType('Email');
              setIsOpen(true);
            }}
          >
            <Plus size={18} /> New Message
          </Button>
        </div>
      </div>

      {/* ── Tabs: Outbox Dashboard | Logs | New Compose ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8 grid grid-cols-2 max-w-md">
          <TabsTrigger value="outbox" className="rounded-xl px-6 h-full font-bold text-xs gap-2">
            <Mail size={14} /> Outbox
            {outboxCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[10px] px-1.5 py-0 ml-1">
                {outboxCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-6 h-full font-bold text-xs gap-2">
            <History size={14} /> Sent Logs
          </TabsTrigger>
        </TabsList>

        {/* ──────────────────────────────────────── */}
        {/* OUTBOX DASHBOARD                          */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="outbox" className="space-y-6">
          {/* Connectivity + sync summary card */}
          <Card
            className={cn(
              'border shadow-sm rounded-3xl overflow-hidden',
              isOnline ? 'bg-emerald-50/30 border-emerald-100' : 'bg-amber-50/40 border-amber-200'
            )}
          >
            <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-3 rounded-2xl',
                    isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  )}
                >
                  {isOnline ? <Wifi size={22} /> : <WifiOff size={22} />}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-700">
                    {isOnline ? 'Internet Connected' : 'Working Offline'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isOnline
                      ? 'EmailJS service is reachable. Queued messages will dispatch on sync.'
                      : 'Outbox is active. Messages will auto-send when connection is restored.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {failedCount > 0 && (
                  <Badge className="bg-rose-50 text-rose-700 border-none font-bold text-[10px] gap-1">
                    <AlertCircle size={11} /> {failedCount} retry
                  </Badge>
                )}
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing || outboxCount === 0}
                  size="sm"
                  className="rounded-xl gap-1.5 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isSyncing ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {isSyncing ? 'Syncing…' : 'Sync Outbox'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Message Composer (inline) */}
          <Card className="border-none shadow-sm rounded-3xl bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Send size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Message Composer</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Composed messages are queued locally and dispatched when online.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>To (Recipient List)</Label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Parents">All Parents</SelectItem>
                      <SelectItem value="Grade 4 Blue">Grade 4 — Blue</SelectItem>
                      <SelectItem value="Grade 5 Blue">Grade 5 — Blue</SelectItem>
                      <SelectItem value="Grade 6 Blue">Grade 6 — Blue</SelectItem>
                      <SelectItem value="Grade 7 Blue">Grade 7 — Blue</SelectItem>
                      <SelectItem value="All Teachers">All Teachers</SelectItem>
                      <SelectItem value="All Staff">All Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Mid-Term Examination Notice"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Message Body</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type the broadcast content here…"
                  rows={4}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <Mail size={12} />
                  EmailJS templates are configured at the top of this file.
                </p>
                <Button
                  onClick={queueOutboundEmail}
                  disabled={!subject.trim() && !body.trim()}
                  className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-100"
                >
                  <Plus size={16} /> Queue to Outbox
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Outbox List */}
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                  <Clock size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Pending Outbox</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Locally queued emails awaiting dispatch. Removed automatically after EmailJS confirms a successful send.
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  'font-bold text-xs gap-1.5 px-3 py-1.5 border-none',
                  outboxCount === 0
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-amber-100 text-amber-700'
                )}
              >
                {outboxCount === 0 ? 'No pending messages' : `${outboxCount} pending`}
              </Badge>
            </div>

            {outboxCount === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-base font-black text-slate-700">Outbox is clear</p>
                  <p className="text-sm text-slate-400 font-medium max-w-md">
                    All composed messages have been delivered via EmailJS. Queue a new
                    message above to dispatch it.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {outbox.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 flex items-start gap-4 hover:bg-slate-50/40 transition-colors"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                        m.status === 'sending'
                          ? 'bg-blue-100 text-blue-600 animate-pulse'
                          : (m.retryCount ?? 0) > 0
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-amber-100 text-amber-600'
                      )}
                    >
                      {m.status === 'sending' ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (m.retryCount ?? 0) > 0 ? (
                        <AlertCircle size={18} />
                      ) : (
                        <Clock size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-slate-900 truncate">
                          {m.subject}
                        </p>
                        <Badge
                          className={cn(
                            'border-none font-bold text-[9px] uppercase tracking-widest',
                            m.status === 'sending'
                              ? 'bg-blue-50 text-blue-700'
                              : (m.retryCount ?? 0) > 0
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          )}
                        >
                          {m.status === 'sending'
                            ? 'Sending…'
                            : (m.retryCount ?? 0) > 0
                            ? `Retry #${m.retryCount}`
                            : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        To:{' '}
                        <span className="text-slate-700 font-bold">{m.to_email}</span>
                        {' • '}
                        From:{' '}
                        <span className="text-slate-700 font-bold">{m.sender_name}</span>
                        {' • '}
                        Queued{' '}
                        <span className="text-slate-700 font-bold">
                          {new Date(m.timestamp).toLocaleString()}
                        </span>
                      </p>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">
                        “{m.message_body}”
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteQueued(m.id)}
                      className="rounded-xl h-9 w-9 text-slate-300 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                      title="Discard queued message"
                      aria-label="Discard queued message"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ──────────────────────────────────────── */}
        {/* SENT LOGS                                  */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="logs" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b">
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Recipient</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Subject</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Type</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {messagesList.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 font-bold">{msg.recipient}</td>
                      <td className="px-8 py-6 font-medium">{msg.subject}</td>
                      <td className="px-8 py-6">
                        <Badge variant="outline">{msg.type}</Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Badge>
                          <UserCheck size={12} className="mr-1.5" /> {msg.status}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-slate-500 text-right text-xs">{msg.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Original Compose Modal (retained for legacy parity) ── */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`New ${msgType === 'Email' ? 'Email' : 'SMS'} — Quick Composer`}
        description="Use the in-page composer above for offline-first queued delivery via EmailJS."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">
              Close
            </Button>
            <Button
              onClick={() => {
                queueOutboundEmail();
                setIsOpen(false);
              }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
            >
              <Send size={16} className="mr-2" /> Queue Message
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Communication Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={msgType === 'Email' ? 'default' : 'outline'}
                className="rounded-xl h-11 font-bold"
                onClick={() => setMsgType('Email')}
              >
                <Mail size={16} className="mr-2" /> Email
              </Button>
              <Button
                type="button"
                variant={msgType === 'SMS' ? 'default' : 'outline'}
                className="rounded-xl h-11 font-bold"
                onClick={() => setMsgType('SMS')}
              >
                <MessageSquare size={16} className="mr-2" /> SMS
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Recipient</Label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Parents">All Parents</SelectItem>
                <SelectItem value="Grade 4 Blue">Grade 4 — Blue</SelectItem>
                <SelectItem value="Grade 5 Blue">Grade 5 — Blue</SelectItem>
                <SelectItem value="Grade 6 Blue">Grade 6 — Blue</SelectItem>
                <SelectItem value="Grade 7 Blue">Grade 7 — Blue</SelectItem>
                <SelectItem value="All Teachers">All Teachers</SelectItem>
                <SelectItem value="All Staff">All Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mid-Term Examination Notice"
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Message Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type content here…"
              rows={4}
              className="rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Communication;