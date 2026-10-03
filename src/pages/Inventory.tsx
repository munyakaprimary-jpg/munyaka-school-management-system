"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import BackButton from "@/components/ui/BackButton";
import { Search, Package, Box, RefreshCw, UserCheck, Clock, Calendar, Plus, Trash2, Save, X, ArrowUpRight, ArrowDownLeft, LayoutGrid, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import IssueAssetModal from '@/components/inventory/IssueAssetModal';
import ReceiveAssetModal from '@/components/inventory/ReceiveAssetModal';
import { localData } from '@/services/localDataService';
import { cn } from '@/lib/utils';

export interface AssetItem {
  id: string;
  item: string;
  category: string;
  qty: number;
  status: string;
  color: string;
}

interface AssetLog {
  id: string | number;
  assetId?: string; // Links back to the master asset
  item: string;
  issuedTo: string;
  date: string; // Date issued
  dateReturned?: string; // Date returned
  status: string;
  qty: number;
}

const Inventory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modal States
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  // Form state for new asset
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('');
  const [newAssetQty, setNewAssetQty] = useState('');
  const [newAssetStatus, setNewAssetStatus] = useState('Available');
  const [assetError, setAssetError] = useState('');

  // Initial State from Local Storage (Empty by default)
  const [assets, setAssets] = useState<AssetItem[]>(() => {
    const saved = localStorage.getItem('munyaka_inventory');
    return saved ? JSON.parse(saved) : [];
  });

  const [assetLogs, setAssetLogs] = useState<AssetLog[]>(() => {
    const saved = localStorage.getItem('munyaka_asset_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to Local Storage on change
  useEffect(() => {
    localStorage.setItem('munyaka_inventory', JSON.stringify(assets));
    notifyDataChanged('munyaka_inventory');
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('munyaka_asset_logs', JSON.stringify(assetLogs));
    notifyDataChanged('munyaka_asset_logs');
  }, [assetLogs]);

  // Sync Stock Function — Offline-only via localData.inventory
  const handleSyncStock = async () => {
    setIsSyncing(true);
    try {
      const all = (localData as any).inventory?.getAll?.() || [];
      if (all.length > 0) {
            setAssets(all as AssetItem[]);
            showSuccess(`Stock loaded from local storage (${all.length} assets).`);
      } else {
        showSuccess('No saved stock yet — add an asset to get started.');
      }
    } catch (err: any) {
      console.error("Error syncing stock:", err);
      showError("Failed to load stock from local storage.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Derived Filtered Data
  const filteredAssets = useMemo(() => {
      if (!String(searchQuery || '').trim()) return assets;
      const query = String(searchQuery || '').toLowerCase();
    return assets.filter(a => 
      a.item.toLowerCase().includes(query) || 
      a.category.toLowerCase().includes(query)
    );
  }, [assets, searchQuery]);

  const activeLoans = useMemo(() => {
    return assetLogs
      .filter(log => log.status === 'In Use')
      .map(log => ({
        id: log.id,
        item: log.item,
        issuedTo: log.issuedTo,
        qty: log.qty
      }));
  }, [assetLogs]);

  // Handlers
  const handleAddAsset = () => {
    if (!String(newAssetName || '').trim()) return setAssetError('Please enter an asset name.');
        if (!String(newAssetCategory || '').trim()) return setAssetError('Please select a category.');
        if (!newAssetQty || parseInt(newAssetQty) < 0) return setAssetError('Please enter a valid quantity.');
    
        const newAsset: AssetItem = {
          id: `asset-${Date.now()}`,
          item: String(newAssetName || '').trim(),
      category: newAssetCategory,
      qty: parseInt(newAssetQty),
      status: newAssetStatus,
      color: 'text-indigo-600',
    };

    setAssets(prev => [newAsset, ...prev]);
    setIsAddAssetOpen(false);
    setNewAssetName('');
    setNewAssetCategory('');
    setNewAssetQty('');
    setAssetError('');
    showSuccess(`Asset "${newAsset.item}" registered successfully.`);
  };

  const handleIssueAsset = (data: { assetId: string; issuedTo: string; qty: number; remarks?: string }) => {
    const targetAsset = assets.find(a => a.id === data.assetId);
    if (!targetAsset) return;

    // Update Master Stock
    setAssets(prev => prev.map(asset => {
      if (asset.id === data.assetId) {
        const newQty = asset.qty - data.qty;
        return {
          ...asset,
          qty: newQty,
          status: newQty === 0 ? 'In Use' : (newQty < 5 ? 'Low Stock' : asset.status)
        };
      }
      return asset;
    }));

    // Log the issuance
    const newLog: AssetLog = {
      id: `log-${Date.now()}`,
      assetId: data.assetId,
      item: targetAsset.item,
      issuedTo: data.issuedTo,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dateReturned: undefined,
      status: 'In Use',
      qty: data.qty
    };
    setAssetLogs(prev => [newLog, ...prev]);

    showSuccess(`Issued ${data.qty} ${targetAsset.item}(s) to ${data.issuedTo}`);
  };

  const handleReceiveAsset = (data: { logId: string | number; qtyReturned: number; condition: string; notes?: string; returnDate?: string }) => {
    const targetLog = assetLogs.find(l => l.id.toString() === data.logId.toString());
    if (!targetLog) return;

    const formattedReturnDate = data.returnDate 
      ? new Date(data.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Update Master Stock (if reusable)
    const isReusable = data.condition === 'Good Condition' || data.condition === 'Needs Repair';
    if (isReusable && targetLog.assetId) {
      setAssets(prev => prev.map(asset => {
        if (asset.id === targetLog.assetId) {
          return {
            ...asset,
            qty: asset.qty + data.qtyReturned,
            status: 'Available'
          };
        }
        return asset;
      }));
    }

    // Update the Log Entry
    setAssetLogs(prev => prev.map(log => {
      if (log.id.toString() === data.logId.toString()) {
        const remaining = log.qty - data.qtyReturned;
        return {
          ...log,
          qty: remaining,
          dateReturned: formattedReturnDate,
          status: remaining <= 0 ? 'Returned' : 'In Use'
        };
      }
      return log;
    }));

    showSuccess(`Received ${data.qtyReturned} ${targetLog.item}(s). Condition: ${data.condition}`);
  };

  const handleDeleteAsset = () => {
    if (!assetToDelete) return;
    setAssets(prev => prev.filter(a => a.id !== assetToDelete));
    setIsDeleteOpen(false);
    setAssetToDelete(null);
    showSuccess('Asset record removed.');
  };

  return (
      <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-36">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 action-bar w-full max-w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <BackButton parentPath="/" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 whitespace-normal break-words">Tools & Resources</h1>
            <p className="text-muted-foreground break-words hyphens-auto">Comprehensive inventory and asset lifecycle management.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="rounded-2xl gap-2 h-11 px-6 border-slate-200 bg-white font-bold text-slate-600 shadow-sm w-full sm:w-auto"
            onClick={() => setIsIssueOpen(true)}
            disabled={assets.length === 0}
          >
            <ArrowUpRight size={18} /> Issue Tool
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl gap-2 h-11 px-6 border-slate-200 bg-white font-bold text-slate-600 shadow-sm w-full sm:w-auto"
            onClick={() => setIsReceiveOpen(true)}
            disabled={activeLoans.length === 0}
          >
            <ArrowDownLeft size={18} /> Receive Tool
          </Button>
          <Button
            className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-bold w-full sm:w-auto"
            onClick={() => setIsAddAssetOpen(true)}
          >
            <Plus size={18} /> Add New Asset
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="stock" className="rounded-xl px-8 h-full font-bold text-xs">Asset Stock</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-8 h-full font-bold text-xs">Issuance History</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-1 lg:col-span-3 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search assets by name or category..." 
                className="pl-12 h-14 rounded-3xl border-none shadow-sm bg-white font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="h-14 px-6 rounded-3xl border-none shadow-sm bg-white gap-2 text-slate-600 font-bold" 
              onClick={handleSyncStock}
              disabled={isSyncing}
            >
              <RefreshCw size={18} className={cn(isSyncing && "animate-spin text-indigo-600")} />
              {isSyncing ? "Syncing..." : "Sync Stock"}
            </Button>
          </div>

          {filteredAssets.length > 0 ? (
            <div className="pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredAssets.map((item) => (
                  <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white group overflow-hidden">
                    <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{item.item}</h3>
                            <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full tracking-wider shrink-0">{item.category}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 -mr-1 -mt-1 shrink-0" onClick={() => { setAssetToDelete(item.id); setIsDeleteOpen(true); }}><Trash2 size={14} /></Button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Stock:</span>
                            <span className="font-black text-slate-900">{item.qty}</span>
                          </div>
                          <span className="text-slate-200">•</span>
                          <span className={cn("font-bold uppercase text-[10px]",
                            item.status === 'Available' ? "text-emerald-600" :
                            item.status === 'Low Stock' ? "text-amber-600" : "text-blue-600")}>
                            {item.status}
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveTab('logs')}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0"
                        >
                          View History →
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                <LayoutGrid size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No assets found</h3>
              <p className="text-slate-400 max-w-xs mx-auto mb-6">Either your search yielded no results or you haven't registered any assets yet.</p>
              <Button 
                variant="ghost" 
                onClick={() => setIsAddAssetOpen(true)}
                className="font-black text-indigo-600 hover:bg-transparent"
              >
                Register your first asset →
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b">
                      <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Asset & Qty</th>
                      <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Recipient</th>
                      <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Date Issued</th>
                      <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Date Returned</th>
                      <th className="px-8 py-5 text-right font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assetLogs.length > 0 ? (
                      assetLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="font-bold text-slate-900">{log.item}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Quantity: {log.qty}</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <UserCheck size={14} className="text-slate-400" />
                              <span className="font-medium text-slate-700">{log.issuedTo}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Clock size={14} />
                              <span>{log.date}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            {log.dateReturned ? (
                              <div className="flex items-center gap-2 text-slate-700 font-bold">
                                <Calendar size={14} className="text-emerald-500" />
                                <span>{log.dateReturned}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-400 font-bold text-[10px]">
                                Pending Return
                              </Badge>
                            )}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Badge className={cn("rounded-lg border-none font-bold", log.status === 'In Use' ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700")}>
                              {log.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">
                          No issuance records found in the school ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <IssueAssetModal 
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        onIssue={handleIssueAsset}
        assets={assets}
      />

      <ReceiveAssetModal 
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        onReceive={handleReceiveAsset}
        activeLoans={activeLoans}
      />

      <Modal isOpen={isAddAssetOpen} onClose={() => setIsAddAssetOpen(false)} title="Register New Asset" footer={<div className="flex gap-3 justify-end w-full"><Button variant="ghost" onClick={() => setIsAddAssetOpen(false)} className="rounded-xl font-bold h-11 px-6">Cancel</Button><Button onClick={handleAddAsset} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-8 shadow-lg shadow-indigo-100 gap-2 text-white"><Save size={18} /> Add Asset</Button></div>}>
        <div className="space-y-4">
          {assetError && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs">{assetError}</div>}
          <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Asset Name</Label><Input value={newAssetName} onChange={e => setNewAssetName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</Label>
            <Select onValueChange={setNewAssetCategory}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Select category..." /></SelectTrigger><SelectContent><SelectItem value="Agriculture">Agriculture</SelectItem><SelectItem value="Science & Tech">Science & Tech</SelectItem><SelectItem value="Creative Arts">Creative Arts</SelectItem><SelectItem value="Sports">Sports</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Initial Qty</Label><Input type="number" value={newAssetQty} onChange={e => setNewAssetQty(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Deletion" footer={<div className="flex gap-2 justify-end w-full"><Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteAsset}>Delete Asset</Button></div>}>
        <p className="text-slate-500 text-sm">Are you sure you want to remove this asset? All associated stock will be deleted.</p>
      </Modal>
    </div>
  );
};

export default Inventory;