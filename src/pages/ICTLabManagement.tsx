"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from '@/components/ui/BackButton';
import Modal from '@/components/ui/Modal';
import { 
  Laptop, 
  Search, 
  Plus, 
  Wrench, 
  Monitor, 
  Smartphone, 
  Projector, 
  Wifi, 
  Trash2,
  CheckCircle2,
  Clock,
  LayoutGrid,
  ClipboardList,
  RotateCcw,
  AlertCircle,
  UserCheck,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import AddICTAssetModal from '@/components/ict/AddICTAssetModal';
import { ICTAsset, ICTCategory, ICTStatus } from '@/types/ict';

// --- Types ---
type LogStatus = 'Issued' | 'Returned' | 'Overdue' | 'Under Repair';

interface ICTLog {
  id: string;
  assetId: string;
  assetTag: string;
  deviceName: string;
  borrower: string;
  description: string;
  dateIssued: string;
  expectedReturn: string;
  actualReturn?: string;
  status: LogStatus;
}

// --- Mock Data ---
const INITIAL_ASSETS: ICTAsset[] = [
  { id: "1", assetTag: "ICT-LP-01", name: "HP ProBook 450", category: "Laptops", serialNumber: "CND12345XYZ", status: "Active", location: "Computer Lab 1", assignedTo: "Jane Mwangi" },
  { id: "2", assetTag: "ICT-TB-05", name: "Samsung Galaxy Tab A8", category: "Tablets", serialNumber: "RF8S123456", status: "Active", location: "Mobile Cart A", assignedTo: "Grade 4 Blue" },
  { id: "3", assetTag: "ICT-PJ-01", name: "Epson EB-X41", category: "Projectors", serialNumber: "V11H843040", status: "In Maintenance", location: "Staff Room", assignedTo: "John Kamau" },
  { id: "4", assetTag: "ICT-NW-02", name: "TP-Link AX1800 Router", category: "Networking", serialNumber: "220C123456", status: "Active", location: "Server Room" },
];

const INITIAL_LOGS: ICTLog[] = [
  { id: "ISS-101", assetId: "1", assetTag: "ICT-LP-01", deviceName: "HP ProBook 450", borrower: "Jane Mwangi", description: "Classroom presentation", dateIssued: "2024-05-10", expectedReturn: "2024-05-12", status: "Returned", actualReturn: "2024-05-12" },
  { id: "ISS-102", assetId: "3", assetTag: "ICT-PJ-01", deviceName: "Epson EB-X41", borrower: "John Kamau", description: "HDMI port loose", dateIssued: "2024-05-15", expectedReturn: "2024-05-20", status: "Under Repair" },
  { id: "ISS-103", assetId: "2", assetTag: "ICT-TB-05", deviceName: "Samsung Galaxy Tab A8", borrower: "Grade 4 Blue", description: "CBC Practical", dateIssued: "2024-05-22", expectedReturn: "2024-05-23", status: "Overdue" },
];

const ICTLabManagement = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState("inventory");
  const [assets, setAssets] = useState<ICTAsset[]>(() => {
    const saved = localStorage.getItem('munyaka_ict_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });
  const [logs, setLogs] = useState<ICTLog[]>(() => {
    const saved = localStorage.getItem('munyaka_ict_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // --- New Checkout Form State ---
  const [issueForm, setIssueForm] = useState({
    assetId: "",
    borrower: "",
    description: "",
    outDate: new Date().toISOString().split('T')[0],
    returnDate: ""
  });

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('munyaka_ict_assets', JSON.stringify(assets));
    localStorage.setItem('munyaka_ict_logs', JSON.stringify(logs));
  }, [assets, logs]);

  // --- Derived Data ---
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [assets, searchQuery, statusFilter, categoryFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      l.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.borrower.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [logs, searchQuery]);

  const stats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'Active').length,
    repair: assets.filter(a => a.status === 'In Maintenance' || a.status === 'Decommissioned').length,
    assigned: assets.filter(a => !!a.assignedTo).length
  };

  const logStats = {
    activeCheckouts: logs.filter(l => l.status === 'Issued').length,
    overdue: logs.filter(l => l.status === 'Overdue').length,
    repair: logs.filter(l => l.status === 'Under Repair').length
  };

  // --- Handlers ---
  const handleAddAsset = (newAsset: ICTAsset) => {
    setAssets(prev => [newAsset, ...prev]);
    showSuccess(`Added ${newAsset.name} to inventory.`);
  };

  const handleLogIssue = () => {
    if (!issueForm.assetId || !issueForm.borrower || !issueForm.returnDate) {
      showError("Please fill in all required fields.");
      return;
    }

    const asset = assets.find(a => a.id === issueForm.assetId);
    if (!asset) return;

    const newLog: ICTLog = {
      id: `ISS-${Date.now().toString().slice(-4)}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      deviceName: asset.name,
      borrower: issueForm.borrower,
      description: issueForm.description,
      dateIssued: issueForm.outDate,
      expectedReturn: issueForm.returnDate,
      status: "Issued"
    };

    setLogs([newLog, ...logs]);
    setIsIssueModalOpen(false);
    setIssueForm({ assetId: "", borrower: "", description: "", outDate: new Date().toISOString().split('T')[0], returnDate: "" });
    showSuccess(`Device ${asset.assetTag} successfully checked out to ${issueForm.borrower}.`);
  };

  const handleReturn = (id: string) => {
    setLogs(prev => prev.map(log => 
      log.id === id 
        ? { ...log, status: 'Returned', actualReturn: new Date().toISOString().split('T')[0] } 
        : log
    ));
    showSuccess("Device marked as returned and updated in log.");
  };

  const handleDelete = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    showSuccess("Asset record removed.");
  };

  const getCategoryIcon = (cat: ICTCategory) => {
    switch(cat) {
      case 'Laptops': return <Laptop size={18} />;
      case 'Tablets': return <Smartphone size={18} />;
      case 'Projectors': return <Projector size={18} />;
      case 'Networking': return <Wifi size={18} />;
      default: return <Monitor size={18} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">ICT Lab Management</h1>
            <p className="text-muted-foreground font-medium">Unified tracking for digital literacy devices and infrastructure.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'inventory' ? (
            <Button 
              className="rounded-2xl gap-2 h-12 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-black"
              onClick={() => setIsAddAssetOpen(true)}
            >
              <Plus size={20} /> Add New Asset
            </Button>
          ) : (
            <Button 
              className="rounded-2xl gap-2 h-12 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-black"
              onClick={() => setIsIssueModalOpen(true)}
            >
              <ArrowUpRight size={20} /> Log Device Issue
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8 flex w-fit">
          <TabsTrigger value="inventory" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <LayoutGrid size={16} /> Asset Inventory
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <ClipboardList size={16} /> Issues & Returns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Devices', value: stats.total, icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Operational', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Needs Repair', value: stats.repair, icon: Wrench, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Assigned', value: stats.assigned, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((s, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", s.bg)}>
                    <s.icon className={s.color} size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                    <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{s.value}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Filters Bar */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search by tag, model, or serial..." 
                  className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="In Maintenance">In Maintenance</SelectItem>
                  <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Laptops">Laptops</SelectItem>
                  <SelectItem value="Tablets">Tablets</SelectItem>
                  <SelectItem value="Projectors">Projectors</SelectItem>
                  <SelectItem value="Networking">Networking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Asset Table */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">ID & Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Category</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Serial No.</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Assigned To</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{asset.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tag: {asset.assetTag}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 font-bold text-slate-600">
                            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400">{getCategoryIcon(asset.category)}</div>
                            {asset.category}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <code className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{asset.serialNumber}</code>
                        </td>
                        <td className="px-8 py-5">
                          <Badge className={cn("rounded-lg border-none font-bold text-[10px] uppercase", 
                            asset.status === 'Active' ? "bg-emerald-50 text-emerald-700" : 
                            asset.status === 'In Maintenance' ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-400")}>
                            {asset.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-5">
                          {asset.assignedTo ? (
                            <div className="flex items-center gap-2 font-bold text-indigo-600">
                              <CheckCircle2 size={14} /> {asset.assignedTo}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-300 hover:text-red-500" onClick={() => handleDelete(asset.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-8">
          {/* Summary Counters for Logs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm rounded-3xl bg-amber-50 p-6 flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm"><RotateCcw size={24} /></div>
              <div><p className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Active Checkouts</p><h3 className="text-2xl font-black text-amber-900">{logStats.activeCheckouts}</h3></div>
            </Card>
            <Card className="border-none shadow-sm rounded-3xl bg-rose-50 p-6 flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl text-rose-600 shadow-sm"><AlertCircle size={24} /></div>
              <div><p className="text-[10px] font-black uppercase text-rose-700 tracking-widest">Overdue Returns</p><h3 className="text-2xl font-black text-rose-900">{logStats.overdue}</h3></div>
            </Card>
            <Card className="border-none shadow-sm rounded-3xl bg-indigo-50 p-6 flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm"><Wrench size={24} /></div>
              <div><p className="text-[10px] font-black uppercase text-indigo-700 tracking-widest">Under Repair</p><h3 className="text-2xl font-black text-indigo-900">{logStats.repair}</h3></div>
            </Card>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Filter checkouts by borrower or device..." 
              className="pl-11 h-14 rounded-3xl border-none shadow-sm bg-white font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Logs Table */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Log ID</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Asset & Device</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Borrower / Purpose</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Dates (Out / Due)</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 font-black text-slate-400 text-[10px]">{log.id}</td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-900">{log.deviceName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase">{log.assetTag}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-700">{log.borrower}</p>
                          <p className="text-xs text-slate-400 italic line-clamp-1">{log.description}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Calendar size={12} className="text-slate-300" /> {log.dateIssued}</p>
                            <p className={cn("text-xs font-bold flex items-center gap-1.5", log.status === 'Overdue' ? "text-rose-600" : "text-slate-400")}>
                              <Clock size={12} className="text-slate-300" /> {log.status === 'Returned' ? `Ret: ${log.actualReturn}` : `Due: ${log.expectedReturn}`}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <Badge className={cn("rounded-lg border-none font-bold text-[10px] uppercase", 
                            log.status === 'Returned' ? "bg-emerald-50 text-emerald-700" : 
                            log.status === 'Issued' ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700")}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {log.status !== 'Returned' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleReturn(log.id)}
                              className="rounded-xl h-9 px-4 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all gap-1.5"
                            >
                              <RotateCcw size={14} /> Mark Returned
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- Modals --- */}
      <AddICTAssetModal isOpen={isAddAssetOpen} onClose={() => setIsAddAssetOpen(false)} onAdd={handleAddAsset} />

      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Log Device Issue / Checkout"
        description="Assign school hardware to a teacher or department for a specific period."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => setIsIssueModalOpen(false)} className="rounded-xl font-bold px-6 h-12">Cancel</Button>
            <Button 
              onClick={handleLogIssue}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-12 text-white shadow-lg shadow-indigo-100 gap-2"
            >
              <CheckCircle2 size={18} /> Confirm Checkout
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Select Hardware Unit</Label>
            <Select value={issueForm.assetId} onValueChange={(val) => setIssueForm({...issueForm, assetId: val})}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Choose device..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {assets.filter(a => a.status === 'Active').map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.assetTag} — {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Borrower Name / Department</Label>
            <Input 
              value={issueForm.borrower}
              onChange={e => setIssueForm({...issueForm, borrower: e.target.value})}
              placeholder="e.g. Mr. Kamau / Science Dept"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Purpose / Issue Description</Label>
            <Input 
              value={issueForm.description}
              onChange={e => setIssueForm({...issueForm, description: e.target.value})}
              placeholder="e.g. For Grade 4 Practical"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Checkout Date</Label>
              <Input 
                type="date"
                value={issueForm.outDate}
                onChange={e => setIssueForm({...issueForm, outDate: e.target.value})}
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Expected Return</Label>
              <Input 
                type="date"
                value={issueForm.returnDate}
                onChange={e => setIssueForm({...issueForm, returnDate: e.target.value})}
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ICTLabManagement;