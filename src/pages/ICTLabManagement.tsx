"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from '@/components/ui/BackButton';
import { 
  Laptop, 
  Search, 
  Plus, 
  Settings2, 
  UserPlus, 
  Wrench, 
  Monitor, 
  Smartphone, 
  Projector, 
  Wifi, 
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import AddICTAssetModal from '@/components/ict/AddICTAssetModal';
import { ICTAsset, ICTCategory, ICTStatus } from '@/types/ict';

const MOCK_ASSETS: ICTAsset[] = [
  { id: "1", assetTag: "ICT-LP-01", name: "HP ProBook 450", category: "Laptops", serialNumber: "CND12345XYZ", status: "Active", location: "Computer Lab 1", assignedTo: "Jane Mwangi" },
  { id: "2", assetTag: "ICT-TB-05", name: "Samsung Galaxy Tab A8", category: "Tablets", serialNumber: "RF8S123456", status: "Active", location: "Mobile Cart A", assignedTo: "Grade 4 Blue" },
  { id: "3", assetTag: "ICT-PJ-01", name: "Epson EB-X41", category: "Projectors", serialNumber: "V11H843040", status: "In Maintenance", location: "Staff Room", assignedTo: "John Kamau" },
  { id: "4", assetTag: "ICT-NW-02", name: "TP-Link AX1800 Router", category: "Networking", serialNumber: "220C123456", status: "Active", location: "Server Room" },
];

const ICTLabManagement = () => {
  const [assets, setAssets] = useState<ICTAsset[]>(() => {
    const saved = localStorage.getItem('munyaka_ict_assets');
    return saved ? JSON.parse(saved) : MOCK_ASSETS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('munyaka_ict_assets', JSON.stringify(assets));
  }, [assets]);

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

  const stats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'Active').length,
    repair: assets.filter(a => a.status === 'In Maintenance').length,
    assigned: assets.filter(a => !!a.assignedTo).length
  };

  const handleAddAsset = (newAsset: ICTAsset) => {
    setAssets(prev => [newAsset, ...prev]);
    showSuccess(`Added ${newAsset.name} to inventory.`);
  };

  const handleAction = (msg: string) => showSuccess(msg);

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
        <Button 
          className="rounded-2xl gap-2 h-12 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-black"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus size={20} /> Add New Asset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Devices', value: stats.total, icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Operational', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Needs Repair', value: stats.repair, icon: Wrench, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Assigned', value: stats.assigned, icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
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
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => (
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
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl h-9 px-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                            onClick={() => handleAction(`Issuing ${asset.name}...`)}
                          >
                            <UserPlus size={14} /> Assign
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl h-9 px-3 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 gap-1.5"
                            onClick={() => handleAction(`Logging repair for ${asset.name}...`)}
                          >
                            <Wrench size={14} /> Repair
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <LayoutGrid size={40} className="text-slate-200" />
                        <p className="text-slate-500 font-bold">No ICT assets found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddICTAssetModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onAdd={handleAddAsset} 
      />
    </div>
  );
};

export default ICTLabManagement;