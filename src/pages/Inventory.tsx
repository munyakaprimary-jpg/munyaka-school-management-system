"use client";

import React, { useState, useMemo } from 'react';
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
import { Search, Package, Box, RefreshCw, MoreVertical, UserCheck, Clock, Plus, Trash2, Save, X, Share2 } from 'lucide-react';
import { INVENTORY, ASSET_LOGS } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';
import IssueAssetModal from '@/components/inventory/IssueAssetModal';

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
  item: string;
  issuedTo: string;
  date: string;
  status: string;
  qty?: number;
}

const Inventory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  // Form state for new asset
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('');
  const [newAssetQty, setNewAssetQty] = useState('');
  const [newAssetStatus, setNewAssetStatus] = useState('Available');
  const [assetError, setAssetError] = useState('');

  // Local state for assets (mutable)
  const [assets, setAssets] = useState<AssetItem[]>(() => 
    INVENTORY.map(a => ({ ...a, id: a.id.toString() }))
  );

  const [assetLogs, setAssetLogs] = useState<AssetLog[]>(() => 
    ASSET_LOGS.map(l => ({ ...l }))
  );

  // Filter assets by search query
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const query = searchQuery.toLowerCase();
    return assets.filter(a => 
      a.item.toLowerCase().includes(query) || 
      a.category.toLowerCase().includes(query)
    );
  }, [assets, searchQuery]);

  // Handle Add Asset
  const handleAddAsset = () => {
    if (!newAssetName.trim()) return setAssetError('Please enter an asset name.');
    if (!newAssetCategory.trim()) return setAssetError('Please select a category.');
    if (!newAssetQty || parseInt(newAssetQty) < 0) return setAssetError('Please enter a valid quantity.');

    const statusColors: Record<string, string> = {
      'Available': 'text-emerald-600',
      'Low Stock': 'text-amber-600',
      'In Use': 'text-blue-600',
    };

    const newAsset: AssetItem = {
      id: `asset-${Date.now()}`,
      item: newAssetName.trim(),
      category: newAssetCategory,
      qty: parseInt(newAssetQty),
      status: newAssetStatus,
      color: statusColors[newAssetStatus] || 'text-slate-600',
    };

    setAssets(prev => [newAsset, ...prev]);
    setIsAddAssetOpen(false);
    setNewAssetName('');
    setNewAssetCategory('');
    setNewAssetQty('');
    setNewAssetStatus('Available');
    setAssetError('');
    showSuccess(`Asset "${newAsset.item}" added successfully!`);
  };

  // Handle Issue Asset
  const handleIssueAsset = (data: { assetId: string; issuedTo: string; qty: number; remarks?: string }) => {
    const targetAsset = assets.find(a => a.id === data.assetId);
    if (!targetAsset) return;

    // 1. Update Asset Stock
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

    // 2. Add to Logs
    const newLog: AssetLog = {
      id: `log-${Date.now()}`,
      item: targetAsset.item,
      issuedTo: data.issuedTo,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'In Use',
      qty: data.qty
    };
    setAssetLogs(prev => [newLog, ...prev]);

    showSuccess(`Successfully issued ${data.qty} ${targetAsset.item} to ${data.issuedTo}`);
  };

  // Handle Delete Asset
  const handleDeleteAsset = () => {
    if (!assetToDelete) return;
    setAssets(prev => prev.filter(a => a.id !== assetToDelete));
    setIsDeleteOpen(false);
    setAssetToDelete(null);
    showSuccess('Asset removed successfully.');
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-emerald-50 text-emerald-600 border-none';
      case 'Low Stock': return 'bg-amber-50 text-amber-600 border-none';
      case 'In Use': return 'bg-blue-50 text-blue-600 border-none';
      default: return 'bg-slate-100 text-slate-600 border-none';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tools & Resources</h1>
            <p className="text-muted-foreground">Manage school assets, CBC learning materials, and kits.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="rounded-2xl gap-2 h-11 px-6 border-slate-200 bg-white font-bold text-slate-600 shadow-sm"
            onClick={() => setIsIssueOpen(true)}
          >
            <Share2 size={18} /> Issue Tool
          </Button>
          <Button 
            className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700 font-bold"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search assets by name or category..." 
                className="pl-12 h-14 rounded-3xl border-none shadow-sm bg-white font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-14 px-6 rounded-3xl border-none shadow-sm bg-white gap-2 text-slate-600 font-bold" onClick={() => setSearchQuery('')}>
              <RefreshCw size={18} /> Sync Inventory
            </Button>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200"><Package size={40} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No assets found</h3>
              <p className="text-slate-400 max-w-xs mx-auto">{searchQuery ? 'No assets match your search query.' : 'Add your first asset to get started.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAssets.map((item) => (
                <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white group overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center ${item.color}`}><Box size={28} /></div>
                      <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:text-red-500" onClick={() => { setAssetToDelete(item.id); setIsDeleteOpen(true); }}><Trash2 size={18} /></Button>
                    </div>
                    <div className="space-y-1 mb-6">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{item.item}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                    </div>
                    <div className="flex items-end justify-between pt-6 border-t border-slate-50">
                      <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Stock</p><p className="text-2xl font-black text-slate-900">{item.qty}</p></div>
                      <Badge className={getStatusBadge(item.status)}>{item.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b">
                    <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Asset Item</th>
                    <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Issued To</th>
                    <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Date Issued</th>
                    <th className="px-8 py-5 text-right font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assetLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900">{log.item}</p>
                        {log.qty && <p className="text-[10px] font-bold text-slate-400 uppercase">Quantity: {log.qty}</p>}
                      </td>
                      <td className="px-8 py-6"><div className="flex items-center gap-2"><UserCheck size={14} className="text-slate-400" /><span className="font-medium text-slate-700">{log.issuedTo}</span></div></td>
                      <td className="px-8 py-6"><div className="flex items-center gap-2 text-slate-500"><Clock size={14} /><span>{log.date}</span></div></td>
                      <td className="px-8 py-6 text-right"><Badge className={log.status === 'In Use' ? "bg-blue-50 text-blue-700 border-none" : "bg-emerald-50 text-emerald-700 border-none"}>{log.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Issuance Modal */}
      <IssueAssetModal 
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        onIssue={handleIssueAsset}
        assets={assets}
      />

      {/* Add Asset Modal */}
      <Modal isOpen={isAddAssetOpen} onClose={() => setIsAddAssetOpen(false)} title="Add New Asset" description="Register a new school asset or resource." footer={<div className="flex gap-3 justify-end w-full"><Button type="button" variant="ghost" onClick={() => setIsAddAssetOpen(false)} className="rounded-xl font-bold h-11 px-6">Cancel</Button><Button type="button" onClick={handleAddAsset} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold h-11 px-8 shadow-lg shadow-emerald-100 gap-2 text-white"><Save size={18} /> Add Asset</Button></div>}>
        <form onSubmit={(e) => { e.preventDefault(); handleAddAsset(); }} className="space-y-5">
          {assetError && <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5 text-rose-600 text-xs font-bold"><X size={16} /> {assetError}</div>}
          <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Asset Name</Label><Input value={newAssetName} onChange={(e) => { setNewAssetName(e.target.value); setAssetError(''); }} placeholder="e.g. Jembes (Small)" className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800 focus:bg-white" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</Label><Select value={newAssetCategory} onValueChange={(val) => { setNewAssetCategory(val); setAssetError(''); }}><SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800"><SelectValue placeholder="Select category..." /></SelectTrigger><SelectContent><SelectItem value="Agriculture">Agriculture</SelectItem><SelectItem value="Science & Tech">Science & Tech</SelectItem><SelectItem value="Creative Arts">Creative Arts</SelectItem><SelectItem value="Library">Library</SelectItem><SelectItem value="Sports">Sports</SelectItem><SelectItem value="Infrastructure">Infrastructure</SelectItem></SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Quantity</Label><Input type="number" min="0" value={newAssetQty} onChange={(e) => { setNewAssetQty(e.target.value); setAssetError(''); }} placeholder="e.g. 50" className="rounded-xl h-12 bg-slate-50 border-slate-100 font-black text-lg focus:bg-white" /></div><div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Status</Label><Select value={newAssetStatus} onValueChange={setNewAssetStatus}><SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Low Stock">Low Stock</SelectItem><SelectItem value="In Use">In Use</SelectItem></SelectContent></Select></div></div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Asset?" footer={<div className="flex gap-3 justify-end w-full"><Button variant="ghost" className="rounded-xl font-bold h-11 px-6" onClick={() => setIsDeleteOpen(false)}>Cancel</Button><Button className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold h-11 px-6 text-white" onClick={handleDeleteAsset}>Delete</Button></div>}><div className="flex flex-col items-center text-center space-y-4"><div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center"><Trash2 size={32} /></div><p className="text-slate-500">Are you sure you want to delete this asset? This action cannot be undone.</p></div></Modal>
    </div>
  );
};

export default Inventory;