import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  CreditCard, 
  FileText, 
  Download, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Search, 
  Plus, 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  Building,
  ArrowUpRight
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const BursarPortalView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const bursarName = user?.name || 'Bursar';
  const bursarId = user?.id || 'BUR-001';

  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ fileName: string; timestamp: string; size: number } | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const [transactions, setTransactions] = useState([
    { id: 'TX-101', studentName: 'Brian Kiptoo', admissionNumber: 'ADM-2024-001', grade: 'Grade 4', term: 'Term 1 2025', amountPaid: 14500, balance: 2500, method: 'M-PESA (QG8912KL)', date: '2025-02-14' },
    { id: 'TX-102', studentName: 'Mary Atieno', admissionNumber: 'ADM-2024-045', grade: 'Grade 5', term: 'Term 1 2025', amountPaid: 17000, balance: 0, method: 'Bank Deposit', date: '2025-02-13' },
    { id: 'TX-103', studentName: 'John Kamau', admissionNumber: 'ADM-2024-089', grade: 'Grade 6', term: 'Term 1 2025', amountPaid: 10000, balance: 7000, method: 'Cash', date: '2025-02-12' }
  ]);

  const totalCollected = transactions.reduce((acc, t) => acc + t.amountPaid, 0);
  const totalOutstanding = transactions.reduce((acc, t) => acc + t.balance, 0);

  const handleExportFinancialBatch = () => {
    setIsExporting(true);
    try {
      const payload = {
        meta: {
          exportType: 'BURSAR_FINANCIAL_BATCH',
          bursarId,
          bursarName,
          timestamp: new Date().toISOString(),
          recordCounts: {
            totalTransactions: transactions.length,
            totalCollected,
            totalOutstanding
          }
        },
        transactions
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bursar_Financial_Batch_${bursarId}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleString();
      setLastExport({
        fileName: link.download,
        timestamp: nowStr,
        size: blob.size
      });

      toast({
        title: "Financial Batch Exported Successfully",
        description: `Saved ${link.download} (${Math.round(blob.size / 1024)} KB) for Admin Harmonization.`
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate financial batch package.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getShareText = () => {
    return `💰 *Munyaka Fees & Finance Ledger Report*
👨‍💼 Bursar: ${bursarName} (ID: ${bursarId})
💵 Total Collected (Term 1): KES ${totalCollected.toLocaleString()}
⚠️ Outstanding Balances: KES ${totalOutstanding.toLocaleString()}
📋 Total Transactions Logged: ${transactions.length}
🕒 Exported: ${new Date().toLocaleString()}
✅ Verified for Admin Harmonization Hub offline import.`;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(getShareText());
    setCopiedShare(true);
    toast({
      title: "Summary Copied to Clipboard",
      description: "Paste this financial summary into admin chat channels."
    });
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none hidden lg:block" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-emerald-200">
              <Wallet size={14} /> Bursar & Accounts Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight">Fee Tracking & Financial Ledger Dashboard</h1>
            <p className="text-emerald-100 text-sm max-w-2xl font-medium">
              Manage fee collections, receipt generation, student ledger balances, and generate offline financial batches for admin harmonization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportFinancialBatch}
              disabled={isExporting}
              className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold px-6 py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Download size={18} className="text-emerald-600" />
              {isExporting ? 'Packaging Batch...' : 'Export Financial Batch (.JSON)'}
            </Button>
          </div>
        </div>
      </div>

      {/* Identity & Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Bursar</p>
          <p className="text-base font-extrabold text-slate-900">{bursarName}</p>
          <p className="text-xs font-mono text-emerald-600">ID: {bursarId}</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collections</p>
          <p className="text-base font-extrabold text-emerald-700">KES {totalCollected.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Term 1 verified receipts</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balances</p>
          <p className="text-base font-extrabold text-amber-600">KES {totalOutstanding.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Pending fee arrears</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transactions Logged</p>
          <p className="text-base font-extrabold text-slate-900">{transactions.length} Entries</p>
          <p className="text-xs text-slate-500">Offline state synced</p>
        </Card>
      </div>

      {/* Main Ledger Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Recent Fee Transactions & Receipts</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Mapped to institutional fee structures and admission numbers.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Search student, adm no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{tx.studentName}</span>
                        <Badge className="bg-slate-200 text-slate-800 text-[10px] font-mono border-0">{tx.admissionNumber}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{tx.grade} | {tx.term} | Method: <span className="font-semibold text-slate-700">{tx.method}</span></p>
                      <p className="text-[11px] text-slate-400">Date: {tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-700 text-sm">KES {tx.amountPaid.toLocaleString()}</p>
                      <p className="text-xs text-amber-600 font-medium">Balance: KES {tx.balance.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Export & Share */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText size={18} className="text-emerald-700" /> Financial Batch Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {lastExport && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Batch Downloaded
                  </div>
                  <p className="font-mono text-[11px] text-emerald-700">{lastExport.fileName} ({Math.round(lastExport.size / 1024)} KB)</p>
                  <p className="text-[10px] text-slate-500">{lastExport.timestamp}</p>
                </div>
              )}

              <Button
                onClick={handleExportFinancialBatch}
                disabled={isExporting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <Download size={18} />
                {isExporting ? 'Generating Batch...' : 'Export Financial Batch'}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Share2 size={18} className="text-emerald-700" /> Share Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5 overflow-x-auto shadow-inner">
                <p className="text-emerald-400 font-bold"># Fees Ledger Summary</p>
                <p>Total Collected: KES {totalCollected.toLocaleString()}</p>
                <p>Outstanding: KES {totalOutstanding.toLocaleString()}</p>
                <p className="text-cyan-400">Status: Ready for Harmonization</p>
              </div>

              <Button
                onClick={handleCopyShare}
                variant="outline"
                className="w-full border-slate-200 hover:bg-slate-50 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-slate-700 text-xs"
              >
                {copiedShare ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {copiedShare ? 'Copied to Clipboard!' : 'Copy WhatsApp Summary Text'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BursarPortalView;
