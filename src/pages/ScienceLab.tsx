"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import Modal from '@/components/ui/Modal';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  Wrench, 
  Monitor, 
  Calendar, 
  AlertTriangle, 
  Trash2, 
  Edit, 
  Eye, 
  Download, 
  Upload, 
  RotateCcw, 
  Shield, 
  TestTube, 
  Microscope, 
  Scale, 
  ClipboardList, 
  FileText, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Package,
  Minus,
  Plus as PlusIcon,
  MoreVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { showSuccess, showError } from '@/utils/toast';
import { downloadCSV, downloadFile } from '@/utils/downloadHelper';
import { 
  ChemicalItem, 
  EquipmentItem, 
  LabBooking, 
  BreakageLog,
  HazardLevel,
  BookingStatus,
  BreakageStatus
} from '@/types/scienceLab';
import { CHEMICALS, EQUIPMENT, LAB_BOOKINGS, BREAKAGE_LOGS } from '@/data/scienceLabData';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const ScienceLab = () => {
  const [activeTab, setActiveTab] = useState<'chemicals' | 'equipment' | 'bookings' | 'breakages'>('chemicals');
  
  // Chemicals State
  const [chemicals, setChemicals] = useState<ChemicalItem[]>(CHEMICALS);
  const [chemicalSearch, setChemicalSearch] = useState("");
  const [hazardFilter, setHazardFilter] = useState<string>("all");
  const [isAddChemicalOpen, setIsAddChemicalOpen] = useState(false);
  const [editingChemical, setEditingChemical] = useState<ChemicalItem | null>(null);
  
  // Equipment State
  const [equipment, setEquipment] = useState<EquipmentItem[]>(EQUIPMENT);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  
  // Bookings State
  const [bookings, setBookings] = useState<LabBooking[]>(LAB_BOOKINGS);
  const [bookingSearch, setBookingSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<LabBooking | null>(null);
  
  // Breakages State
  const [breakages, setBreakages] = useState<BreakageLog[]>(BREAKAGE_LOGS);
  const [breakageSearch, setBreakageSearch] = useState("");
  const [breakageStatusFilter, setBreakageStatusFilter] = useState<string>("all");
  const [isAddBreakageOpen, setIsAddBreakageOpen] = useState(false);
  const [editingBreakage, setEditingBreakage] = useState<BreakageLog | null>(null);

  // Form States
  const [chemicalForm, setChemicalForm] = useState({
    name: "", formula: "", quantity: "", unit: "L", location: "", 
    expiryDate: "", hazardLevel: "Low" as HazardLevel, minThreshold: ""
  });
  
  const [equipmentForm, setEquipmentForm] = useState({
    name: "", category: "", totalQty: "", functionalQty: "", damagedQty: "", location: ""
  });
  
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split('T')[0], timeSlot: "08:00-09:30", teacher: "",
    gradeClass: "", topic: "", itemsRequested: "", status: "Pending" as BookingStatus
  });
  
  const [breakageForm, setBreakageForm] = useState({
    date: new Date().toISOString().split('T')[0], studentName: "", admNo: "",
    gradeClass: "", itemBroken: "", qty: "1", cost: "", status: "Pending" as BreakageStatus
  });

  // Persistence
  useEffect(() => { localStorage.setItem('munyaka_science_chemicals', JSON.stringify(chemicals)); }, [chemicals]);
  useEffect(() => { localStorage.setItem('munyaka_science_equipment', JSON.stringify(equipment)); }, [equipment]);
  useEffect(() => { localStorage.setItem('munyaka_science_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('munyaka_science_breakages', JSON.stringify(breakages)); }, [breakages]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedChemicals = localStorage.getItem('munyaka_science_chemicals');
    if (savedChemicals) setChemicals(JSON.parse(savedChemicals));
    
    const savedEquipment = localStorage.getItem('munyaka_science_equipment');
    if (savedEquipment) setEquipment(JSON.parse(savedEquipment));
    
    const savedBookings = localStorage.getItem('munyaka_science_bookings');
    if (savedBookings) setBookings(JSON.parse(savedBookings));
    
    const savedBreakages = localStorage.getItem('munyaka_science_breakages');
    if (savedBreakages) setBreakages(JSON.parse(savedBreakages));
  }, []);

  // Filtered Data
  const filteredChemicals = useMemo(() => chemicals.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(chemicalSearch.toLowerCase()) ||
                         c.formula.toLowerCase().includes(chemicalSearch.toLowerCase());
    const matchesHazard = hazardFilter === "all" || c.hazardLevel === hazardFilter;
    return matchesSearch && matchesHazard;
  }), [chemicals, chemicalSearch, hazardFilter]);

  const filteredEquipment = useMemo(() => equipment.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
                         e.category.toLowerCase().includes(equipmentSearch.toLowerCase());
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [equipment, equipmentSearch, categoryFilter]);

  const filteredBookings = useMemo(() => bookings.filter(b => {
    const matchesSearch = b.topic.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                         b.teacher.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                         b.gradeClass.toLowerCase().includes(bookingSearch.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [bookings, bookingSearch, statusFilter]);

  const filteredBreakages = useMemo(() => breakages.filter(b => {
    const matchesSearch = b.studentName.toLowerCase().includes(breakageSearch.toLowerCase()) ||
                         b.itemBroken.toLowerCase().includes(breakageSearch.toLowerCase()) ||
                         b.admNo.toLowerCase().includes(breakageSearch.toLowerCase());
    const matchesStatus = breakageStatusFilter === "all" || b.status === breakageStatusFilter;
    return matchesSearch && matchesStatus;
  }), [breakages, breakageSearch, breakageStatusFilter]);

  // Stats
  const chemicalStats = {
    total: chemicals.length,
    highHazard: chemicals.filter(c => c.hazardLevel === "High").length,
    lowStock: chemicals.filter(c => c.quantity <= c.minThreshold).length,
    expiringSoon: chemicals.filter(c => {
      const daysUntilExpiry = (new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
    }).length
  };

  const equipmentStats = {
    total: equipment.length,
    functional: equipment.reduce((sum, e) => sum + e.functionalQty, 0),
    damaged: equipment.reduce((sum, e) => sum + e.damagedQty, 0),
    categories: new Set(equipment.map(e => e.category)).size
  };

  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "Pending").length,
    approved: bookings.filter(b => b.status === "Approved").length,
    completed: bookings.filter(b => b.status === "Completed").length
  };

  const breakageStats = {
    total: breakages.length,
    pending: breakages.filter(b => b.status === "Pending").length,
    paid: breakages.filter(b => b.status === "Paid").length,
    waived: breakages.filter(b => b.status === "Waived").length,
    totalCost: breakages.reduce((sum, b) => sum + b.cost, 0)
  };

  // Handlers
  const handleAddChemical = () => {
    if (!chemicalForm.name || !chemicalForm.quantity || !chemicalForm.expiryDate) {
      showError("Please fill in all required fields.");
      return;
    }
    const newChemical: ChemicalItem = {
      id: `CHM-${Date.now().toString().slice(-4)}`,
      ...chemicalForm,
      quantity: parseFloat(chemicalForm.quantity),
      minThreshold: parseFloat(chemicalForm.minThreshold) || 0
    };
    setChemicals([newChemical, ...chemicals]);
    setIsAddChemicalOpen(false);
    resetChemicalForm();
    showSuccess(`Chemical "${newChemical.name}" added successfully.`);
  };

  const handleEditChemical = (chemical: ChemicalItem) => {
    setEditingChemical(chemical);
    setChemicalForm({
      name: chemical.name, formula: chemical.formula, quantity: chemical.quantity.toString(),
      unit: chemical.unit, location: chemical.location, expiryDate: chemical.expiryDate,
      hazardLevel: chemical.hazardLevel, minThreshold: chemical.minThreshold.toString()
    });
    setIsAddChemicalOpen(true);
  };

  const handleSaveChemicalEdit = () => {
    if (!editingChemical) return;
    setChemicals(prev => prev.map(c => c.id === editingChemical.id ? { ...c, ...chemicalForm, quantity: parseFloat(chemicalForm.quantity), minThreshold: parseFloat(chemicalForm.minThreshold) || 0 } : c));
    setEditingChemical(null);
    setIsAddChemicalOpen(false);
    resetChemicalForm();
    showSuccess("Chemical updated successfully.");
  };

  const handleDeleteChemical = (id: string) => {
    setChemicals(prev => prev.filter(c => c.id !== id));
    showSuccess("Chemical removed.");
  };

  const resetChemicalForm = () => {
    setChemicalForm({ name: "", formula: "", quantity: "", unit: "L", location: "", expiryDate: "", hazardLevel: "Low", minThreshold: "" });
  };

  const handleAddEquipment = () => {
    if (!equipmentForm.name || !equipmentForm.category || !equipmentForm.totalQty) {
      showError("Please fill in all required fields.");
      return;
    }
    const newEquipment: EquipmentItem = {
      id: `EQP-${Date.now().toString().slice(-4)}`,
      ...equipmentForm,
      totalQty: parseInt(equipmentForm.totalQty),
      functionalQty: parseInt(equipmentForm.functionalQty) || 0,
      damagedQty: parseInt(equipmentForm.damagedQty) || 0
    };
    setEquipment([newEquipment, ...equipment]);
    setIsAddEquipmentOpen(false);
    resetEquipmentForm();
    showSuccess(`Equipment "${newEquipment.name}" added successfully.`);
  };

  const handleEditEquipment = (item: EquipmentItem) => {
    setEditingEquipment(item);
    setEquipmentForm({
      name: item.name, category: item.category, totalQty: item.totalQty.toString(),
      functionalQty: item.functionalQty.toString(), damagedQty: item.damagedQty.toString(),
      location: item.location
    });
    setIsAddEquipmentOpen(true);
  };

  const handleSaveEquipmentEdit = () => {
    if (!editingEquipment) return;
    setEquipment(prev => prev.map(e => e.id === editingEquipment.id ? { ...e, ...equipmentForm, totalQty: parseInt(equipmentForm.totalQty), functionalQty: parseInt(equipmentForm.functionalQty) || 0, damagedQty: parseInt(equipmentForm.damagedQty) || 0 } : e));
    setEditingEquipment(null);
    setIsAddEquipmentOpen(false);
    resetEquipmentForm();
    showSuccess("Equipment updated successfully.");
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipment(prev => prev.filter(e => e.id !== id));
    showSuccess("Equipment removed.");
  };

  const resetEquipmentForm = () => {
    setEquipmentForm({ name: "", category: "", totalQty: "", functionalQty: "", damagedQty: "", location: "" });
  };

  const handleAddBooking = () => {
    if (!bookingForm.teacher || !bookingForm.gradeClass || !bookingForm.topic) {
      showError("Please fill in all required fields.");
      return;
    }
    const newBooking: LabBooking = {
      id: `LBK-${Date.now().toString().slice(-4)}`,
      ...bookingForm,
      itemsRequested: bookingForm.itemsRequested.split(',').map(i => i.trim()).filter(Boolean)
    };
    setBookings([newBooking, ...bookings]);
    setIsAddBookingOpen(false);
    resetBookingForm();
    showSuccess(`Lab booking for "${newBooking.topic}" created.`);
  };

  const handleEditBooking = (booking: LabBooking) => {
    setEditingBooking(booking);
    setBookingForm({
      date: booking.date, timeSlot: booking.timeSlot, teacher: booking.teacher,
      gradeClass: booking.gradeClass, topic: booking.topic,
      itemsRequested: booking.itemsRequested.join(', '), status: booking.status
    });
    setIsAddBookingOpen(true);
  };

  const handleSaveBookingEdit = () => {
    if (!editingBooking) return;
    setBookings(prev => prev.map(b => b.id === editingBooking.id ? { ...b, ...bookingForm, itemsRequested: bookingForm.itemsRequested.split(',').map(i => i.trim()).filter(Boolean) } : b));
    setEditingBooking(null);
    setIsAddBookingOpen(false);
    resetBookingForm();
    showSuccess("Booking updated successfully.");
  };

  const handleDeleteBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    showSuccess("Booking removed.");
  };

  const resetBookingForm = () => {
    setBookingForm({ date: new Date().toISOString().split('T')[0], timeSlot: "08:00-09:30", teacher: "", gradeClass: "", topic: "", itemsRequested: "", status: "Pending" });
  };

  const handleAddBreakage = () => {
    if (!breakageForm.studentName || !breakageForm.admNo || !breakageForm.itemBroken || !breakageForm.cost) {
      showError("Please fill in all required fields.");
      return;
    }
    const newBreakage: BreakageLog = {
      id: `BRK-${Date.now().toString().slice(-4)}`,
      ...breakageForm,
      qty: parseInt(breakageForm.qty) || 1,
      cost: parseFloat(breakageForm.cost) || 0
    };
    setBreakages([newBreakage, ...breakages]);
    setIsAddBreakageOpen(false);
    resetBreakageForm();
    showSuccess(`Breakage logged for ${newBreakage.studentName}.`);
  };

  const handleEditBreakage = (breakage: BreakageLog) => {
    setEditingBreakage(breakage);
    setBreakageForm({
      date: breakage.date, studentName: breakage.studentName, admNo: breakage.admNo,
      gradeClass: breakage.gradeClass, itemBroken: breakage.itemBroken,
      qty: breakage.qty.toString(), cost: breakage.cost.toString(), status: breakage.status
    });
    setIsAddBreakageOpen(true);
  };

  const handleSaveBreakageEdit = () => {
    if (!editingBreakage) return;
    setBreakages(prev => prev.map(b => b.id === editingBreakage.id ? { ...b, ...breakageForm, qty: parseInt(breakageForm.qty) || 1, cost: parseFloat(breakageForm.cost) || 0 } : b));
    setEditingBreakage(null);
    setIsAddBreakageOpen(false);
    resetBreakageForm();
    showSuccess("Breakage record updated.");
  };

  const handleDeleteBreakage = (id: string) => {
    setBreakages(prev => prev.filter(b => b.id !== id));
    showSuccess("Breakage record removed.");
  };

  const resetBreakageForm = () => {
    setBreakageForm({ date: new Date().toISOString().split('T')[0], studentName: "", admNo: "", gradeClass: "", itemBroken: "", qty: "1", cost: "", status: "Pending" });
  };

  // Export Functions
  const handleExportChemicals = () => {
    const headers = ["ID", "Name", "Formula", "Quantity", "Unit", "Location", "Expiry Date", "Hazard Level", "Min Threshold"];
    const rows = chemicals.map(c => [c.id, c.name, c.formula, c.quantity, c.unit, c.location, c.expiryDate, c.hazardLevel, c.minThreshold]);
    const csv = ["MUNYAKA SCIENCE LAB - CHEMICALS INVENTORY", `Generated: ${new Date().toLocaleString()}`, `Total: ${chemicals.length}`, "", headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csv, `science_lab_chemicals_${new Date().toISOString().split('T')[0]}.csv`);
    showSuccess("Chemicals exported to CSV.");
  };

  const handleExportEquipment = () => {
    const headers = ["ID", "Name", "Category", "Total Qty", "Functional", "Damaged", "Location"];
    const rows = equipment.map(e => [e.id, e.name, e.category, e.totalQty, e.functionalQty, e.damagedQty, e.location]);
    const csv = ["MUNYAKA SCIENCE LAB - EQUIPMENT INVENTORY", `Generated: ${new Date().toLocaleString()}`, `Total: ${equipment.length}`, "", headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csv, `science_lab_equipment_${new Date().toISOString().split('T')[0]}.csv`);
    showSuccess("Equipment exported to CSV.");
  };

  const handleExportBookings = () => {
    const headers = ["ID", "Date", "Time Slot", "Teacher", "Grade/Class", "Topic", "Items Requested", "Status"];
    const rows = bookings.map(b => [b.id, b.date, b.timeSlot, b.teacher, b.gradeClass, b.topic, b.itemsRequested.join('; '), b.status]);
    const csv = ["MUNYAKA SCIENCE LAB - BOOKINGS", `Generated: ${new Date().toLocaleString()}`, `Total: ${bookings.length}`, "", headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csv, `science_lab_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    showSuccess("Bookings exported to CSV.");
  };

  const handleExportBreakages = () => {
    const headers = ["ID", "Date", "Student Name", "Adm No", "Grade/Class", "Item Broken", "Qty", "Cost", "Status"];
    const rows = breakages.map(b => [b.id, b.date, b.studentName, b.admNo, b.gradeClass, b.itemBroken, b.qty, b.cost, b.status]);
    const csv = ["MUNYAKA SCIENCE LAB - BREAKAGE LOGS", `Generated: ${new Date().toLocaleString()}`, `Total: ${breakages.length}`, "", headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csv, `science_lab_breakages_${new Date().toISOString().split('T')[0]}.csv`);
    showSuccess("Breakages exported to CSV.");
  };

  const handleExportAll = () => {
    const backup = {
      metadata: { school: "Munyaka Primary and Junior School", module: "Science Lab", generatedAt: new Date().toISOString() },
      chemicals, equipment, bookings, breakages
    };
    downloadFile(JSON.stringify(backup, null, 2), `science_lab_full_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    showSuccess("Full Science Lab backup exported to JSON.");
  };

  const getHazardBadge = (level: HazardLevel) => {
    const configs = {
      High: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" },
      Medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
      Low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" }
    };
    const config = configs[level];
    return <Badge variant="outline" className={cn("rounded-lg font-bold text-xs", config.bg, config.text, config.border)}>{level}</Badge>;
  };

  const getStatusBadge = (status: string, type: 'booking' | 'breakage') => {
    if (type === 'booking') {
      const configs = {
        Pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
        Approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
        Completed: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" }
      };
      const config = configs[status as BookingStatus] || configs.Pending;
      return <Badge variant="outline" className={cn("rounded-lg font-bold text-xs", config.bg, config.text, config.border)}>{status}</Badge>;
    } else {
      const configs = {
        Pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
        Paid: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
        Waived: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" }
      };
      const config = configs[status as BreakageStatus] || configs.Pending;
      return <Badge variant="outline" className={cn("rounded-lg font-bold text-xs", config.bg, config.text, config.border)}>{status}</Badge>;
    }
  };

  const renderChemicalActions = (chemical: ChemicalItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100"><MoreVertical size={18} /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl p-1 min-w-[160px]">
        <DropdownMenuItem onClick={() => handleEditChemical(chemical)} className="rounded-lg gap-2 font-bold cursor-pointer text-indigo-600 hover:bg-indigo-50"><Edit size={14} /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeleteChemical(chemical.id)} className="rounded-lg gap-2 font-bold cursor-pointer text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderEquipmentActions = (item: EquipmentItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100"><MoreVertical size={18} /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl p-1 min-w-[160px]">
        <DropdownMenuItem onClick={() => handleEditEquipment(item)} className="rounded-lg gap-2 font-bold cursor-pointer text-indigo-600 hover:bg-indigo-50"><Edit size={14} /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeleteEquipment(item.id)} className="rounded-lg gap-2 font-bold cursor-pointer text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderBookingActions = (booking: LabBooking) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100"><MoreVertical size={18} /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl p-1 min-w-[160px]">
        <DropdownMenuItem onClick={() => handleEditBooking(booking)} className="rounded-lg gap-2 font-bold cursor-pointer text-indigo-600 hover:bg-indigo-50"><Edit size={14} /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeleteBooking(booking.id)} className="rounded-lg gap-2 font-bold cursor-pointer text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderBreakageActions = (breakage: BreakageLog) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100"><MoreVertical size={18} /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl p-1 min-w-[160px]">
        <DropdownMenuItem onClick={() => handleEditBreakage(breakage)} className="rounded-lg gap-2 font-bold cursor-pointer text-indigo-600 hover:bg-indigo-50"><Edit size={14} /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeleteBreakage(breakage.id)} className="rounded-lg gap-2 font-bold cursor-pointer text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Science Lab Management</h1>
            <p className="text-muted-foreground font-medium">Chemicals, equipment, lab bookings, and breakage tracking.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportAll} className="rounded-2xl gap-2 h-11 px-5 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
            <Download size={18} className="text-emerald-600" /> Export All (JSON)
          </Button>
          {activeTab === 'chemicals' && (
            <>
              <Button onClick={handleExportChemicals} className="rounded-2xl gap-2 h-11 px-5 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                <Download size={18} className="text-emerald-600" /> Export CSV
              </Button>
              <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-black" onClick={() => { setEditingChemical(null); resetChemicalForm(); setIsAddChemicalOpen(true); }}>
                <Plus size={18} /> Add Chemical
              </Button>
            </>
          )}
          {activeTab === 'equipment' && (
            <>
              <Button onClick={handleExportEquipment} className="rounded-2xl gap-2 h-11 px-5 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                <Download size={18} className="text-emerald-600" /> Export CSV
              </Button>
              <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-black" onClick={() => { setEditingEquipment(null); resetEquipmentForm(); setIsAddEquipmentOpen(true); }}>
                <Plus size={18} /> Add Equipment
              </Button>
            </>
          )}
          {activeTab === 'bookings' && (
            <>
              <Button onClick={handleExportBookings} className="rounded-2xl gap-2 h-11 px-5 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                <Download size={18} className="text-emerald-600" /> Export CSV
              </Button>
              <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-black" onClick={() => { setEditingBooking(null); resetBookingForm(); setIsAddBookingOpen(true); }}>
                <Plus size={18} /> New Booking
              </Button>
            </>
          )}
          {activeTab === 'breakages' && (
            <>
              <Button onClick={handleExportBreakages} className="rounded-2xl gap-2 h-11 px-5 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                <Download size={18} className="text-emerald-600" /> Export CSV
              </Button>
              <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-black" onClick={() => { setEditingBreakage(null); resetBreakageForm(); setIsAddBreakageOpen(true); }}>
                <Plus size={18} /> Log Breakage
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8 flex w-fit">
          <TabsTrigger value="chemicals" className="rounded-xl px-6 h-full font-bold text-xs gap-2"><FlaskConical size={16} /> Chemicals</TabsTrigger>
          <TabsTrigger value="equipment" className="rounded-xl px-6 h-full font-bold text-xs gap-2"><Microscope size={16} /> Equipment</TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-xl px-6 h-full font-bold text-xs gap-2"><Calendar size={16} /> Bookings</TabsTrigger>
          <TabsTrigger value="breakages" className="rounded-xl px-6 h-full font-bold text-xs gap-2"><AlertTriangle size={16} /> Breakages</TabsTrigger>
        </TabsList>

        {/* CHEMICALS TAB */}
        <TabsContent value="chemicals" className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Chemicals', value: chemicalStats.total, icon: FlaskConical, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'High Hazard', value: chemicalStats.highHazard, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Low Stock', value: chemicalStats.lowStock, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Expiring ≤90d', value: chemicalStats.expiringSoon, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((s, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", s.bg)}><s.icon className={s.color} size={24} /></div>
                  <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{s.value}</h3></div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><Input placeholder="Search by name or formula..." className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium" value={chemicalSearch} onChange={e => setChemicalSearch(e.target.value)} /></div>
              <Select value={hazardFilter} onValueChange={setHazardFilter}><SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue placeholder="All Hazard Levels" /></SelectTrigger><SelectContent><SelectItem value="all">All Levels</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Chemical</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Formula</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Qty / Unit</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Location</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Expiry</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Hazard</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Min Threshold</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredChemicals.map((chemical) => (
                      <tr key={chemical.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5"><p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{chemical.name}</p></td>
                        <td className="px-8 py-5 font-mono text-slate-600">{chemical.formula}</td>
                        <td className="px-8 py-5 text-center font-bold text-slate-700">{chemical.quantity} {chemical.unit}</td>
                        <td className="px-8 py-5 text-slate-600">{chemical.location}</td>
                        <td className="px-8 py-5 text-center font-medium text-slate-600">{chemical.expiryDate}</td>
                        <td className="px-8 py-5 text-center">{getHazardBadge(chemical.hazardLevel)}</td>
                        <td className="px-8 py-5 text-center font-bold text-amber-600">{chemical.minThreshold} {chemical.unit}</td>
                        <td className="px-8 py-5 text-right">{renderChemicalActions(chemical)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EQUIPMENT TAB */}
        <TabsContent value="equipment" className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Items', value: equipmentStats.total, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Functional', value: equipmentStats.functional, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Damaged', value: equipmentStats.damaged, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Categories', value: equipmentStats.categories, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((s, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6"><div className="flex items-center gap-4"><div className={cn("p-3 rounded-2xl", s.bg)}><s.icon className={s.color} size={24} /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{s.value}</h3></div></div></Card>
            ))}
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><Input placeholder="Search by name or category..." className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium" value={equipmentSearch} onChange={e => setEquipmentSearch(e.target.value)} /></div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent>{["All Categories", ...new Set(equipment.map(e => e.category))].map(c => <SelectItem key={c} value={c === "All Categories" ? "all" : c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="text-slate-500 border-b bg-slate-50/50"><tr><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Equipment</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Category</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Total Qty</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Functional</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Damaged</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Location</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEquipment.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group"><td className="px-8 py-5"><p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</p></td><td className="px-8 py-5"><Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold text-xs">{item.category}</Badge></td><td className="px-8 py-5 text-center font-bold text-slate-700">{item.totalQty}</td><td className="px-8 py-5 text-center font-bold text-emerald-600">{item.functionalQty}</td><td className="px-8 py-5 text-center font-bold text-rose-600">{item.damagedQty}</td><td className="px-8 py-5 text-slate-600">{item.location}</td><td className="px-8 py-5 text-right">{renderEquipmentActions(item)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings" className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings', value: bookingStats.total, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Pending', value: bookingStats.pending, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Approved', value: bookingStats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Completed', value: bookingStats.completed, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((s, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6"><div className="flex items-center gap-4"><div className={cn("p-3 rounded-2xl", s.bg)}><s.icon className={s.color} size={24} /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{s.value}</h3></div></div></Card>
            ))}
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><Input placeholder="Search by topic, teacher, or class..." className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium" value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent></Select>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="text-slate-500 border-b bg-slate-50/50"><tr><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Booking ID</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date / Time</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Teacher</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Grade / Class</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Topic</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Items Requested</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group"><td className="px-8 py-5 font-black text-slate-400 text-[10px]">{booking.id}</td><td className="px-8 py-5"><p className="font-bold text-slate-600">{booking.date}</p><p className="text-xs text-slate-400">{booking.timeSlot}</p></td><td className="px-8 py-5 font-bold text-slate-700">{booking.teacher}</td><td className="px-8 py-5 font-bold text-slate-700">{booking.gradeClass}</td><td className="px-8 py-5 font-medium text-slate-800">{booking.topic}</td><td className="px-8 py-5 text-slate-500 text-sm max-w-[200px] truncate">{booking.itemsRequested.join(', ')}</td><td className="px-8 py-5 text-center">{getStatusBadge(booking.status, 'booking')}</td><td className="px-8 py-5 text-right">{renderBookingActions(booking)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BREAKAGES TAB */}
        <TabsContent value="breakages" className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Incidents', value: breakageStats.total, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Pending', value: breakageStats.pending, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Paid', value: breakageStats.paid, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Cost (KES)', value: breakageStats.totalCost.toLocaleString(), icon: Scale, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((s, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6"><div className="flex items-center gap-4"><div className={cn("p-3 rounded-2xl", s.bg)}><s.icon className={s.color} size={24} /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p><h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{s.value}</h3></div></div></Card>
            ))}
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><Input placeholder="Search by student, item, or adm no..." className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium" value={breakageSearch} onChange={e => setBreakageSearch(e.target.value)} /></div>
              <Select value={breakageStatusFilter} onValueChange={setBreakageStatusFilter}><SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Waived">Waived</SelectItem></SelectContent></Select>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="text-slate-500 border-b bg-slate-50/50"><tr><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Log ID</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student / Adm No</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Grade / Class</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Item Broken</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Qty</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Cost (KES)</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th><th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBreakages.map((breakage) => (
                      <tr key={breakage.id} className="hover:bg-slate-50/50 transition-colors group"><td className="px-8 py-5 font-black text-slate-400 text-[10px]">{breakage.id}</td><td className="px-8 py-5 font-medium text-slate-600">{breakage.date}</td><td className="px-8 py-5"><p className="font-bold text-slate-900">{breakage.studentName}</p><p className="text-xs font-mono text-slate-500">{breakage.admNo}</p></td><td className="px-8 py-5 font-bold text-slate-700">{breakage.gradeClass}</td><td className="px-8 py-5 font-medium text-slate-800">{breakage.itemBroken}</td><td className="px-8 py-5 text-center font-bold text-slate-700">{breakage.qty}</td><td className="px-8 py-5 text-right font-bold text-rose-600">{breakage.cost.toLocaleString()}</td><td className="px-8 py-5 text-center">{getStatusBadge(breakage.status, 'breakage')}</td><td className="px-8 py-5 text-right">{renderBreakageActions(breakage)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      {/* Add/Edit Chemical Modal */}
      {(isAddChemicalOpen || editingChemical) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-bold text-slate-900">{editingChemical ? "Edit Chemical" : "Add New Chemical"}</h3><button onClick={() => { setIsAddChemicalOpen(false); setEditingChemical(null); resetChemicalForm(); }} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Chemical Name</Label><Input value={chemicalForm.name} onChange={e => setChemicalForm({...chemicalForm, name: e.target.value})} placeholder="e.g. Hydrochloric Acid" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Formula</Label><Input value={chemicalForm.formula} onChange={e => setChemicalForm({...chemicalForm, formula: e.target.value})} placeholder="e.g. HCl" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Quantity</Label><Input type="number" step="0.1" value={chemicalForm.quantity} onChange={e => setChemicalForm({...chemicalForm, quantity: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Unit</Label><Select value={chemicalForm.unit} onValueChange={val => setChemicalForm({...chemicalForm, unit: val})}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="L">Liters (L)</SelectItem><SelectItem value="mL">Milliliters (mL)</SelectItem><SelectItem value="kg">Kilograms (kg)</SelectItem><SelectItem value="g">Grams (g)</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Min Threshold</Label><Input type="number" step="0.1" value={chemicalForm.minThreshold} onChange={e => setChemicalForm({...chemicalForm, minThreshold: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div></div>
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Location</Label><Input value={chemicalForm.location} onChange={e => setChemicalForm({...chemicalForm, location: e.target.value})} placeholder="e.g. Chemical Cabinet A1" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Expiry Date</Label><Input type="date" value={chemicalForm.expiryDate} onChange={e => setChemicalForm({...chemicalForm, expiryDate: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Hazard Level</Label><Select value={chemicalForm.hazardLevel} onValueChange={val => setChemicalForm({...chemicalForm, hazardLevel: val as HazardLevel})}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select></div></div>
              <div className="flex gap-3 pt-4 border-t"><Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold" onClick={() => { setIsAddChemicalOpen(false); setEditingChemical(null); resetChemicalForm(); }}>Cancel</Button><Button className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100" onClick={editingChemical ? handleSaveChemicalEdit : handleAddChemical}>{editingChemical ? "Save Changes" : "Add Chemical"}</Button></div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Equipment Modal */}
      {(isAddEquipmentOpen || editingEquipment) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-bold text-slate-900">{editingEquipment ? "Edit Equipment" : "Add New Equipment"}</h3><button onClick={() => { setIsAddEquipmentOpen(false); setEditingEquipment(null); resetEquipmentForm(); }} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Equipment Name</Label><Input value={equipmentForm.name} onChange={e => setEquipmentForm({...equipmentForm, name: e.target.value})} placeholder="e.g. Bunsen Burner" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</Label><Input value={equipmentForm.category} onChange={e => setEquipmentForm({...equipmentForm, category: e.target.value})} placeholder="e.g. Heating, Measuring, Glassware" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Total Qty</Label><Input type="number" value={equipmentForm.totalQty} onChange={e => setEquipmentForm({...equipmentForm, totalQty: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Functional</Label><Input type="number" value={equipmentForm.functionalQty} onChange={e => setEquipmentForm({...equipmentForm, functionalQty: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Damaged</Label><Input type="number" value={equipmentForm.damagedQty} onChange={e => setEquipmentForm({...equipmentForm, damagedQty: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div></div>
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Location</Label><Input value={equipmentForm.location} onChange={e => setEquipmentForm({...equipmentForm, location: e.target.value})} placeholder="e.g. Lab Bench Row 1" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="flex gap-3 pt-4 border-t"><Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold" onClick={() => { setIsAddEquipmentOpen(false); setEditingEquipment(null); resetEquipmentForm(); }}>Cancel</Button><Button className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100" onClick={editingEquipment ? handleSaveEquipmentEdit : handleAddEquipment}>{editingEquipment ? "Save Changes" : "Add Equipment"}</Button></div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Booking Modal */}
      {(isAddBookingOpen || editingBooking) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-bold text-slate-900">{editingBooking ? "Edit Booking" : "New Lab Booking"}</h3><button onClick={() => { setIsAddBookingOpen(false); setEditingBooking(null); resetBookingForm(); }} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Date</Label><Input type="date" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Time Slot</Label><Select value={bookingForm.timeSlot} onValueChange={val => setBookingForm({...bookingForm, timeSlot: val})}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="08:00-09:30">08:00-09:30</SelectItem><SelectItem value="09:30-11:00">09:30-11:00</SelectItem><SelectItem value="11:00-12:30">11:00-12:30</SelectItem><SelectItem value="12:30-14:00">12:30-14:00</SelectItem><SelectItem value="14:00-15:30">14:00-15:30</SelectItem></SelectContent></Select></div></div>
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Teacher</Label><Input value={bookingForm.teacher} onChange={e => setBookingForm({...bookingForm, teacher: e.target.value})} placeholder="e.g. Mr. Peter Omondi" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade / Class</Label><Input value={bookingForm.gradeClass} onChange={e => setBookingForm({...bookingForm, gradeClass: e.target.value})} placeholder="e.g. Grade 7 Alpha" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Status</Label><Select value={bookingForm.status} onValueChange={val => setBookingForm({...bookingForm, status: val as BookingStatus})}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent></Select></div></div>
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Topic / Experiment</Label><Input value={bookingForm.topic} onChange={e => setBookingForm({...bookingForm, topic: e.target.value})} placeholder="e.g. Acid-Base Titration" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Items Requested (comma separated)</Label><Input value={bookingForm.itemsRequested} onChange={e => setBookingForm({...bookingForm, itemsRequested: e.target.value})} placeholder="e.g. Hydrochloric Acid, Sodium Hydroxide, Burette" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="flex gap-3 pt-4 border-t"><Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold" onClick={() => { setIsAddBookingOpen(false); setEditingBooking(null); resetBookingForm(); }}>Cancel</Button><Button className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100" onClick={editingBooking ? handleSaveBookingEdit : handleAddBooking}>{editingBooking ? "Save Changes" : "Create Booking"}</Button></div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Breakage Modal */}
      {(isAddBreakageOpen || editingBreakage) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-bold text-slate-900">{editingBreakage ? "Edit Breakage Record" : "Log New Breakage"}</h3><button onClick={() => { setIsAddBreakageOpen(false); setEditingBreakage(null); resetBreakageForm(); }} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Date</Label><Input type="date" value={breakageForm.date} onChange={e => setBreakageForm({...breakageForm, date: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Student Name</Label><Input value={breakageForm.studentName} onChange={e => setBreakageForm({...breakageForm, studentName: e.target.value})} placeholder="e.g. Brian Kiptoo" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Adm No</Label><Input value={breakageForm.admNo} onChange={e => setBreakageForm({...breakageForm, admNo: e.target.value})} placeholder="e.g. A827361" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade / Class</Label><Input value={breakageForm.gradeClass} onChange={e => setBreakageForm({...breakageForm, gradeClass: e.target.value})} placeholder="e.g. Grade 7 Alpha" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div></div>
              <div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Item Broken</Label><Input value={breakageForm.itemBroken} onChange={e => setBreakageForm({...breakageForm, itemBroken: e.target.value})} placeholder="e.g. Test Tube (15mL)" className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div>
              <div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Quantity</Label><Input type="number" value={breakageForm.qty} onChange={e => setBreakageForm({...breakageForm, qty: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Cost (KES)</Label><Input type="number" value={breakageForm.cost} onChange={e => setBreakageForm({...breakageForm, cost: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" /></div><div className="space-y-2"><Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Status</Label><Select value={breakageForm.status} onValueChange={val => setBreakageForm({...breakageForm, status: val as BreakageStatus})}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Waived">Waived</SelectItem></SelectContent></Select></div></div>
              <div className="flex gap-3 pt-4 border-t"><Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold" onClick={() => { setIsAddBreakageOpen(false); setEditingBreakage(null); resetBreakageForm(); }}>Cancel</Button><Button className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100" onClick={editingBreakage ? handleSaveBreakageEdit : handleAddBreakage}>{editingBreakage ? "Save Changes" : "Log Breakage"}</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScienceLab;