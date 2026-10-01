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
  ArrowUpRight,
  ArrowDownLeft,
  Undo2,
  Package,
  Minus,
  Plus as PlusIcon,
  Edit,
  MoreVertical,
  ArrowRight,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  Database,
  HardDrive
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { cn } from '@/lib/utils';
import AddICTAssetModal from '@/components/ict/AddICTAssetModal';
import { ICTAsset, ICTCategory, ICTStatus } from '@/types/ict';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { downloadCSV, downloadFile } from '@/utils/downloadHelper';

// --- Types ---
type LogStatus = 'Issued' | 'Returned' | 'Overdue' | 'Under Repair';

interface ICTLog {
  id: string;
  assetId: string;
  assetTag: string;
  deviceName: string;
  category: ICTCategory;
  borrower: string;
  description: string;
  dateIssued: string;
  expectedReturn: string;
  actualReturn?: string;
  status: LogStatus;
  conditionOnReturn?: string;
  quantityIssued: number;
  quantityReturned: number;
}

// --- Mock Data ---
const INITIAL_ASSETS: ICTAsset[] = [
  { id: "1", assetTag: "ICT-LP-01", name: "HP ProBook 450", category: "Laptops", serialNumber: "CND12345XYZ", status: "Active", location: "Computer Lab 1", assignedTo: "Jane Mwangi" },
  { id: "2", assetTag: "ICT-TB-05", name: "Samsung Galaxy Tab A8", category: "Tablets", serialNumber: "RF8S123456", status: "Active", location: "Mobile Cart A", assignedTo: "Grade 4 Blue" },
  { id: "3", assetTag: "ICT-PJ-01", name: "Epson EB-X41", category: "Projectors", serialNumber: "V11H843040", status: "In Maintenance", location: "Staff Room", assignedTo: "John Kamau" },
  { id: "4", assetTag: "ICT-NW-02", name: "TP-Link AX1800 Router", category: "Networking", serialNumber: "220C123456", status: "Active", location: "Server Room" },
  { id: "5", assetTag: "ICT-LP-02", name: "Dell Latitude 5420", category: "Laptops", serialNumber: "DL5420-001", status: "Active", location: "Computer Lab 1" },
  { id: "6", assetTag: "ICT-TB-10", name: "iPad 9th Gen", category: "Tablets", serialNumber: "IPAD9-010", status: "Active", location: "Mobile Cart B" },
];

const INITIAL_LOGS: ICTLog[] = [
  { id: "ISS-101", assetId: "1", assetTag: "ICT-LP-01", deviceName: "HP ProBook 450", category: "Laptops", borrower: "Jane Mwangi", description: "Classroom presentation", dateIssued: "2024-05-10", expectedReturn: "2024-05-12", status: "Returned", actualReturn: "2024-05-12", conditionOnReturn: "Good", quantityIssued: 1, quantityReturned: 1 },
  { id: "ISS-102", assetId: "3", assetTag: "ICT-PJ-01", deviceName: "Epson EB-X41", category: "Projectors", borrower: "John Kamau", description: "HDMI port loose", dateIssued: "2024-05-15", expectedReturn: "2024-05-20", status: "Under Repair", quantityIssued: 1, quantityReturned: 0 },
  { id: "ISS-103", assetId: "2", assetTag: "ICT-TB-05", deviceName: "Samsung Galaxy Tab A8", category: "Tablets", borrower: "Grade 4 Blue", description: "CBC Practical", dateIssued: "2024-05-22", expectedReturn: "2024-05-23", status: "Overdue", quantityIssued: 30, quantityReturned: 0 },
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
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logMode, setLogMode] = useState<'issue' | 'return'>('issue');

  // --- Unified Log Form State ---
  const [logForm, setLogForm] = useState({
    // Issue fields
    category: "Laptops" as ICTCategory,
    assetId: "",
    borrower: "",
    description: "",
    outDate: new Date().toISOString().split('T')[0],
    returnDate: "",
    quantityIssued: 1,
    // Return fields
    returnLogId: "",
    actualReturnDate: new Date().toISOString().split('T')[0],
    conditionOnReturn: "Good",
    returnNotes: "",
    quantityReturned: 1
  });

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('munyaka_ict_assets', JSON.stringify(assets));
    localStorage.setItem('munyaka_ict_logs', JSON.stringify(logs));
    notifyDataChanged('munyaka_ict_assets');
    notifyDataChanged('munyaka_ict_logs');
  }, [assets, logs]);

  // --- Derived Data ---
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch =
        a?.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        a?.assetTag?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        a?.serialNumber?.toLowerCase().includes(searchQuery?.toLowerCase());
      const matchesStatus = statusFilter === "all" || a?.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || a?.category === categoryFilter;
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

  // Active checkouts (Issued but not Returned)
  const activeCheckouts = useMemo(() => {
    return logs.filter(l => l.status === 'Issued' || l.status === 'Overdue');
  }, [logs]);

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

  // --- Export Functions ---
  const handleExportCSV = () => {
    // CSV for Issue/Return Logs
    const headers = [
      "Log ID",
      "Asset Tag",
      "Device Name",
      "Category",
      "Borrower",
      "Description",
      "Date Issued",
      "Expected Return",
      "Actual Return",
      "Status",
      "Condition on Return",
      "Quantity Issued",
      "Quantity Returned"
    ];

    const rows = logs.map(log => [
      log.id,
      log.assetTag,
      log.deviceName,
      log.category,
      log.borrower,
      log.description,
      log.dateIssued,
      log.expectedReturn,
      log.actualReturn || "—",
      log.status,
      log.conditionOnReturn || "—",
      log.quantityIssued,
      log.quantityReturned
    ]);

    const csvContent = [
      "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
      "ICT LAB - ISSUE & RETURN LOGS",
      `Generated: ${new Date().toLocaleString()}`,
      `Total Records: ${logs.length}`,
      "",
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    downloadCSV(csvContent, `ict_lab_issue_return_logs_${new Date().toISOString().split('T')[0]}.csv`);
    showSuccess(`Exported ${logs.length} issue/return records to CSV.`);
  };

  const handleExportJSON = () => {
    // Full JSON backup including assets and logs
    const backupData = {
      metadata: {
        school: "Munyaka Primary and Junior School",
        module: "ICT Lab Management",
        generatedAt: new Date().toISOString(),
        version: "1.0",
        totalAssets: assets.length,
        totalLogs: logs.length
      },
      assets: assets.map(asset => ({
        ...asset,
        // Calculate checked out quantity from logs
        checkedOutQty: logs
          .filter(l => l.assetId === asset.id && (l.status === 'Issued' || l.status === 'Overdue'))
          .reduce((sum, l) => sum + (l.quantityIssued - l.quantityReturned), 0),
        availableQty: Math.max(0, 1 - logs
          .filter(l => l.assetId === asset.id && (l.status === 'Issued' || l.status === 'Overdue'))
          .reduce((sum, l) => sum + (l.quantityIssued - l.quantityReturned), 0))
      })),
      logs: logs,
      summary: {
        totalDevices: assets.length,
        activeDevices: assets.filter(a => a.status === 'Active').length,
        devicesInRepair: assets.filter(a => a.status === 'In Maintenance' || a.status === 'Decommissioned').length,
        assignedDevices: assets.filter(a => !!a.assignedTo).length,
        activeCheckouts: logs.filter(l => l.status === 'Issued').length,
        overdueReturns: logs.filter(l => l.status === 'Overdue').length,
        underRepair: logs.filter(l => l.status === 'Under Repair').length,
        totalQuantityIssued: logs.reduce((sum, l) => sum + l.quantityIssued, 0),
        totalQuantityReturned: logs.reduce((sum, l) => sum + l.quantityReturned, 0),
        totalOutstanding: logs.reduce((sum, l) => sum + (l.quantityIssued - l.quantityReturned), 0)
      }
    };

    const jsonContent = JSON.stringify(backupData, null, 2);
    downloadFile(jsonContent, `ict_lab_full_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    showSuccess("Full ICT Lab backup exported to JSON (assets + logs + summary).");
  };

  // --- Handlers ---
  const handleAddAsset = (newAsset: ICTAsset) => {
    setAssets(prev => [newAsset, ...prev]);
    showSuccess(`Added ${newAsset?.name ?? 'Unknown'} to inventory.`);
  };

  const openLogModal = (mode: 'issue' | 'return') => {
    setLogMode(mode);
    // Reset form
    setLogForm({
      category: "Laptops",
      assetId: "",
      borrower: "",
      description: "",
      outDate: new Date().toISOString().split('T')[0],
      returnDate: "",
      quantityIssued: 1,
      returnLogId: "",
      actualReturnDate: new Date().toISOString().split('T')[0],
      conditionOnReturn: "Good",
      returnNotes: "",
      quantityReturned: 1
    });
    setIsLogModalOpen(true);
  };

  const handleLogSubmit = () => {
    if (logMode === 'issue') {
      handleIssueSubmit();
    } else {
      handleReturnSubmit();
    }
  };

  const handleIssueSubmit = () => {
    if (!logForm.category || !logForm.assetId || !logForm.borrower || !logForm.returnDate) {
      showError("Please fill in all required fields.");
      return;
    }

    if (!logForm.quantityIssued || logForm.quantityIssued < 1) {
      showError("Quantity issued must be at least 1.");
      return;
    }

    const asset = assets.find(a => a.id === logForm.assetId);
    if (!asset) return;

    const newLog: ICTLog = {
      id: `ISS-${Date.now().toString().slice(-4)}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      deviceName: asset.name,
      category: logForm.category,
      borrower: logForm.borrower,
      description: logForm.description,
      dateIssued: logForm.outDate,
      expectedReturn: logForm.returnDate,
      status: "Issued",
      quantityIssued: logForm.quantityIssued,
      quantityReturned: 0
    };

    setLogs([newLog, ...logs]);
    // Update asset status to show it's checked out
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'Active', assignedTo: logForm.borrower } : a));
    
    setIsLogModalOpen(false);
    showSuccess(`${logForm.quantityIssued} ${asset.name}(s) successfully checked out to ${logForm.borrower}.`);
  };

  const handleReturnSubmit = () => {
    if (!logForm.returnLogId) {
      showError("Please select a device to return.");
      return;
    }

    if (!logForm.quantityReturned || logForm.quantityReturned < 1) {
      showError("Quantity returned must be at least 1.");
      return;
    }

    const logToReturn = logs.find(l => l.id === logForm.returnLogId);
    if (!logToReturn) return;

    if (logForm.quantityReturned > (logToReturn.quantityIssued - logToReturn.quantityReturned)) {
      showError(`Cannot return more than ${logToReturn.quantityIssued - logToReturn.quantityReturned} outstanding units.`);
      return;
    }

    const asset = assets.find(a => a.id === logToReturn.assetId);

    const newQuantityReturned = logToReturn.quantityReturned + logForm.quantityReturned;
    const isFullyReturned = newQuantityReturned >= logToReturn.quantityIssued;

    // Update the log
    setLogs(prev => prev.map(log => 
      log.id === logForm.returnLogId 
        ? { 
            ...log, 
            status: isFullyReturned ? 'Returned' : 'Issued', 
            actualReturn: isFullyReturned ? logForm.actualReturnDate : log.actualReturn,
            conditionOnReturn: isFullyReturned ? logForm.conditionOnReturn : log.conditionOnReturn,
            quantityReturned: newQuantityReturned
          } 
        : log
    ));

    // Update asset back to available if fully returned
    if (asset && isFullyReturned) {
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'Active', assignedTo: undefined } : a));
    }

    setIsLogModalOpen(false);
    showSuccess(`${logForm.quantityReturned} ${logToReturn.deviceName}(s) returned successfully. Condition: ${logForm.conditionOnReturn}`);
  };

  const handleReturn = (id: string) => {
    // Pre-fill the return modal with this log
    const log = logs.find(l => l.id === id);
    if (log) {
      const outstanding = log.quantityIssued - log.quantityReturned;
      setLogForm(prev => ({
        ...prev,
        returnLogId: log.id,
        actualReturnDate: new Date().toISOString().split('T')[0],
        conditionOnReturn: "Good",
        quantityReturned: outstanding
      }));
      openLogModal('return');
    }
  };

  const handleIssueFromTable = (asset: ICTAsset) => {
    // Pre-fill the issue modal with this asset
    setLogForm(prev => ({
      ...prev,
      category: asset.category,
      assetId: asset.id,
      outDate: new Date().toISOString().split('T')[0],
      quantityIssued: 1
    }));
    openLogModal('issue');
  };

  const handleEditCheckout = (asset: ICTAsset) => {
    // Find the active log for this asset
    const activeLog = logs.find(l => l.assetId === asset.id && (l.status === 'Issued' || l.status === 'Overdue'));
    if (activeLog) {
      // Pre-fill return modal with the active log
      const outstanding = activeLog.quantityIssued - activeLog.quantityReturned;
      setLogForm(prev => ({
        ...prev,
        returnLogId: activeLog.id,
        actualReturnDate: new Date().toISOString().split('T')[0],
        conditionOnReturn: "Good",
        quantityReturned: outstanding
      }));
      openLogModal('return');
    }
  };

  const handleLogDamage = (asset: ICTAsset) => {
    const activeLog = logs.find(l => l.assetId === asset.id && (l.status === 'Issued' || l.status === 'Overdue'));
    if (activeLog) {
      const outstanding = activeLog.quantityIssued - activeLog.quantityReturned;
      setLogForm(prev => ({
        ...prev,
        returnLogId: activeLog.id,
        actualReturnDate: new Date().toISOString().split('T')[0],
        conditionOnReturn: "Damaged",
        quantityReturned: outstanding
      }));
      openLogModal('return');
    }
  };

  const handleLogLoss = (asset: ICTAsset) => {
    const activeLog = logs.find(l => l.assetId === asset.id && (l.status === 'Issued' || l.status === 'Overdue'));
    if (activeLog) {
      const outstanding = activeLog.quantityIssued - activeLog.quantityReturned;
      setLogForm(prev => ({
        ...prev,
        returnLogId: activeLog.id,
        actualReturnDate: new Date().toISOString().split('T')[0],
        conditionOnReturn: "Lost",
        quantityReturned: outstanding
      }));
      openLogModal('return');
    }
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

  const renderAssetActions = (asset: ICTAsset) => {
    const isAssigned = !!asset.assignedTo;
    const activeLog = logs.find(l => l.assetId === asset.id && (l.status === 'Issued' || l.status === 'Overdue'));

    if (isAssigned && activeLog) {
      // Checked out device - show return and dropdown
      return (
        <div className="flex items-center justify-end gap-2">
          <Button 
            size="sm" 
            onClick={() => handleEditCheckout(asset)}
            className="rounded-xl h-9 px-4 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all gap-1.5"
          >
            <Undo2 size={14} /> Process Return
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <MoreVertical size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-1 min-w-[180px]">
              <DropdownMenuItem 
                onClick={() => handleEditCheckout(asset)}
                className="rounded-lg gap-2 font-bold cursor-pointer text-indigo-600 hover:bg-indigo-50"
              >
                <Undo2 size={14} /> Process Return
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleLogDamage(asset)}
                className="rounded-lg gap-2 font-bold cursor-pointer text-amber-600 hover:bg-amber-50"
              >
                <ShieldAlert size={14} /> Log Damage
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleLogLoss(asset)}
                className="rounded-lg gap-2 font-bold cursor-pointer text-rose-600 hover:bg-rose-50"
              >
                <AlertCircle size={14} /> Log Loss
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                onClick={() => handleDelete(asset.id)}
                className="rounded-lg gap-2 font-bold cursor-pointer text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={14} /> Remove Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    } else {
      // Available device - show issue button
      return (
        <div className="flex items-center justify-end gap-2">
          <Button 
            size="sm" 
            onClick={() => handleIssueFromTable(asset)}
            className="rounded-xl h-9 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 gap-1.5"
          >
            <ArrowUpRight size={14} /> Issue / Assign
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => handleDelete(asset.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">ICT Lab Management</h1>
            <p className="text-muted-foreground font-medium">Unified tracking for digital literacy devices and infrastructure.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'inventory' ? (
            <Button 
              className="rounded-2xl gap-2 h-12 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-black"
              onClick={() => setIsAddAssetOpen(true)}
            >
              <Plus size={20} /> Add New Asset
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                className="rounded-2xl gap-2 h-12 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-black"
                onClick={() => openLogModal('issue')}
              >
                <ArrowUpRight size={20} /> Log Device Issue
              </Button>
              {/* Export Buttons - Prominently visible in Header Toolbar when on Logs tab */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Export Data:</span>
                <Button 
                  variant="outline"
                  onClick={handleExportCSV}
                  className="rounded-xl h-11 px-5 border-slate-200 bg-white text-sm font-bold gap-2 text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <FileSpreadsheet size={18} className="text-emerald-600" /> Export CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportJSON}
                  className="rounded-xl h-11 px-5 border-slate-200 bg-white text-sm font-bold gap-2 text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <Database size={18} className="text-indigo-600" /> Export JSON
                </Button>
              </div>
            </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {[
              { label: 'Total Devices', value: stats.total, icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Operational', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Needs Repair', value: stats.repair, icon: Wrench, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Assigned', value: stats.assigned, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((s, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[1.5rem] sm:rounded-[2rem] bg-white p-3 sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className={cn("p-2 sm:p-2.5 rounded-2xl shrink-0", s.bg)}>
                    <s.icon className={cn(s.color, "sm:w-5 sm:h-5")} size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider sm:tracking-widest whitespace-nowrap">{s.label}</p>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-none mt-1 whitespace-nowrap">{s.value}</h3>
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
                          {renderAssetActions(asset)}
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
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Qty Out / In</th>
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
                        <td className="px-8 py-5 text-center font-bold text-slate-700">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-amber-600">{log.quantityIssued}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-emerald-600">{log.quantityReturned}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {log.status !== 'Returned' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleReturn(log.id)}
                              className="rounded-xl h-9 px-4 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all gap-1.5"
                            >
                              <Undo2 size={14} /> Process Return
                            </Button>
                          )}
                          {log.status === 'Returned' && (
                            <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-400 font-bold text-[10px]">
                              Completed
                            </Badge>
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

      {/* Unified Issue / Return Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={logMode === 'issue' ? "Log Device Issue / Checkout" : "Process Device Return"}
        description={logMode === 'issue' 
          ? "Assign school hardware to a teacher or department for a specific period."
          : "Record returned assets and assess their current condition."}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => setIsLogModalOpen(false)} className="rounded-xl font-bold px-6 h-12">Cancel</Button>
            <Button 
              onClick={handleLogSubmit}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-12 text-white shadow-lg shadow-indigo-100 gap-2"
            >
              {logMode === 'issue' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
              {logMode === 'issue' ? "Confirm Checkout" : "Process Return"}
            </Button>
          </div>
        }
      >
        {logMode === 'issue' && (
          <TabsContent value="issue" className="space-y-4 pt-4 animate-in fade-in">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Device Category</Label>
              <Select value={logForm.category} onValueChange={(val) => setLogForm({...logForm, category: val as ICTCategory, assetId: ""})}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Laptops">Laptops</SelectItem>
                  <SelectItem value="Tablets">Tablets</SelectItem>
                  <SelectItem value="Projectors">Projectors</SelectItem>
                  <SelectItem value="Networking">Networking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Select Hardware Unit</Label>
              <Select value={logForm.assetId} onValueChange={(val) => setLogForm({...logForm, assetId: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Choose device..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {assets.filter(a => a.status === 'Active' && a.category === logForm.category).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.assetTag} — {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Borrower Name / Department</Label>
              <Input 
                value={logForm.borrower}
                onChange={e => setLogForm({...logForm, borrower: e.target.value})}
                placeholder="e.g. Mr. Kamau / Science Dept"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Purpose / Issue Description</Label>
              <Input 
                value={logForm.description}
                onChange={e => setLogForm({...logForm, description: e.target.value})}
                placeholder="e.g. For Grade 4 Practical"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Checkout Date</Label>
                <Input 
                  type="date"
                  value={logForm.outDate}
                  onChange={e => setLogForm({...logForm, outDate: e.target.value})}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Expected Return</Label>
                <Input 
                  type="date"
                  value={logForm.returnDate}
                  onChange={e => setLogForm({...logForm, returnDate: e.target.value})}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Quantity Issued</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setLogForm(prev => ({...prev, quantityIssued: Math.max(1, prev.quantityIssued - 1)}))}
                    className="h-12 w-12 rounded-xl border-slate-200"
                  >
                    <Minus size={16} />
                  </Button>
                  <Input 
                    type="number"
                    min="1"
                    value={logForm.quantityIssued}
                    onChange={e => setLogForm({...logForm, quantityIssued: Math.max(1, parseInt(e.target.value) || 1)})}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold text-center"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setLogForm(prev => ({...prev, quantityIssued: prev.quantityIssued + 1}))}
                    className="h-12 w-12 rounded-xl border-slate-200"
                  >
                    <PlusIcon size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {logMode === 'return' && (
          <TabsContent value="return" className="space-y-4 pt-4 animate-in fade-in">
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-4">
              <Package className="text-amber-600 shrink-0 mt-1" size={20} />
              <p className="text-xs text-amber-800/80 leading-relaxed font-medium">
                Select an active checkout below to process its return. The device will be marked available in the lab inventory.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Active Checkout to Return</Label>
              <Select value={logForm.returnLogId} onValueChange={(val) => setLogForm({...logForm, returnLogId: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Choose issued record..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {activeCheckouts.length > 0 ? (
                    activeCheckouts.map(log => (
                      <SelectItem key={log.id} value={log.id}>
                        {log.borrower}: {log.deviceName} ({log.assetTag}) — Qty Out: {log.quantityIssued} / In: {log.quantityReturned} — Due: {log.expectedReturn}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No active checkouts to return</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Actual Return Date</Label>
                <Input 
                  type="date"
                  value={logForm.actualReturnDate}
                  onChange={e => setLogForm({...logForm, actualReturnDate: e.target.value})}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Condition on Return</Label>
                <Select value={logForm.conditionOnReturn} onValueChange={setLogForm as unknown as (value: string) => void}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                    <SelectItem value="Lost">Lost / Unaccounted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Quantity Returned</Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    const log = logs.find(l => l.id === logForm.returnLogId);
                    const maxReturn = log ? log.quantityIssued - log.quantityReturned : 1;
                    setLogForm(prev => ({...prev, quantityReturned: Math.max(1, Math.min(maxReturn, prev.quantityReturned - 1))}));
                  }}
                  className="h-12 w-12 rounded-xl border-slate-200"
                >
                  <Minus size={16} />
                </Button>
                <Input 
                  type="number"
                  min="1"
                  value={logForm.quantityReturned}
                  onChange={e => {
                    const log = logs.find(l => l.id === logForm.returnLogId);
                    const maxReturn = log ? log.quantityIssued - log.quantityReturned : 1;
                    const val = Math.max(1, Math.min(maxReturn, parseInt(e.target.value) || 1));
                    setLogForm({...logForm, quantityReturned: val} as any);
                  }}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold text-center"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    const log = logs.find(l => l.id === logForm.returnLogId);
                    const maxReturn = log ? log.quantityIssued - log.quantityReturned : 1;
                    setLogForm(prev => ({...prev, quantityReturned: Math.min(maxReturn, prev.quantityReturned + 1)}));
                  }}
                  className="h-12 w-12 rounded-xl border-slate-200"
                >
                  <PlusIcon size={16} />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Return Notes / Remarks</Label>
              <Input 
                value={logForm.returnNotes}
                onChange={e => setLogForm({...logForm, returnNotes: e.target.value})}
                placeholder="e.g. Screen scratch, missing charger, etc."
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>
          </TabsContent>
        )}
      </Modal>
    </div>
  );
};

export default ICTLabManagement;