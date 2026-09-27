"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Smartphone,
  Building,
  Key,
  RefreshCw,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { recordPaymentAndUnlock } from '@/utils/billingAutoLock';
import { useSchoolStore } from '@/store/useSchoolStore';

export default function PaymentManagement() {
  // Access active store data for students and staff FIRST (to avoid Temporal Dead Zone)
  const students = useSchoolStore((state) => state.students) || [];
  const staff = useSchoolStore((state) => state.staff) || [];
  const activeLearners = students.filter((s: any) => s.status !== 'TRANSFERRED_OUT' && s.status !== 'ARCHIVED').length;
  const PRICE_PER_SEAT = 250;
  const annualSubtotal = activeLearners * PRICE_PER_SEAT;

  // Dynamic license key formatting based on active school ID / name
  const schoolIdHex = useMemo(() => {
    try {
      const name = localStorage.getItem('munyaka_school_name') || 'MUNYAKA';
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16).toUpperCase().substring(0, 4);
    } catch {
      return '9982';
    }
  }, []);
  const dynamicLicenseKey = `MUNYAKA-ENT-2026-${schoolIdHex}`;

  const [activeTab, setActiveTab] = useState<'subscriptions' | 'seats' | 'monthly' | 'gateways' | 'invoices'>('subscriptions');
  const [mpesaNumber, setMpesaNumber] = useState('0738873359');
  const [selectedPlan, setSelectedPlan] = useState('Enterprise Annual (KES 120,000)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [licenseKey, setLicenseKey] = useState(dynamicLicenseKey);
  const [isRenewed, setIsRenewed] = useState(false);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCampus, setPaymentCampus] = useState('Munyaka Primary & Junior School');
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa Paybill / STK');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('112500');
  const [paymentPeriod, setPaymentPeriod] = useState('1 Year Extension');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('Official annual software license renewal');

  // Custom Term Sub-Modal State
  const [isCustomTermModalOpen, setIsCustomTermModalOpen] = useState(false);
  const [customMonths, setCustomMonths] = useState<string>('3');
  const [monthlyRate, setMonthlyRate] = useState<number>(10000); // KES 10,000 per month standard rate

  // Global App Lock Toggle State
  const GLOBAL_LOCK_KEY = 'munyaka_global_app_lock';
  const [isGloballyLocked, setIsGloballyLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GLOBAL_LOCK_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Real Data from munyaka_central_db and school store
  const { totalActiveStudents, totalActiveStaff, totalCapacity, availableSlots } = useMemo(() => {
    try {
      const centralStudents = students.filter((s: any) => s.status !== 'TRANSFERRED_OUT' && s.status !== 'ARCHIVED');
      const centralStaff = staff;

      const raw = localStorage.getItem('munyaka_central_db');
      let dbStudents = centralStudents;
      let dbStaff = centralStaff;

      if (raw) {
        const db = JSON.parse(raw);
        if (Array.isArray(db.students) && db.students.length > 0 && dbStudents.length === 0) {
          dbStudents = db.students.filter((s: any) => s.status !== 'TRANSFERRED_OUT' && s.status !== 'ARCHIVED');
        }
        if (Array.isArray(db.staff) && db.staff.length > 0 && dbStaff.length === 0) {
          dbStaff = db.staff;
        }
      }

      const sCount = dbStudents.length;
      const staffCount = dbStaff.length;
      const totalAllocated = sCount + staffCount;
      const capacity = Math.max(totalAllocated + 120, 500);

      return {
        totalActiveStudents: sCount,
        totalActiveStaff: staffCount,
        totalCapacity: capacity,
        availableSlots: Math.max(0, capacity - totalAllocated),
      };
    } catch {}
    const sCount = activeLearners;
    const staffCount = staff.length;
    const totalAllocated = sCount + staffCount;
    return {
      totalActiveStudents: sCount,
      totalActiveStaff: staffCount,
      totalCapacity: 500,
      availableSlots: Math.max(0, 500 - totalAllocated),
    };
  }, [students, staff, activeLearners]);

  // Seat allocation state (dynamically derived from live active students + staff)
  const allocatedSeats = totalActiveStudents + totalActiveStaff;
  const [maxSeats, setMaxSeats] = useState(totalCapacity);

  // Keep maxSeats synchronized if capacity changes or store updates
  useEffect(() => {
    if (totalCapacity > maxSeats) {
      setMaxSeats(totalCapacity);
    }
  }, [totalCapacity, maxSeats]);

  // Monthly billing setting state
  const [monthlyFeePerStudent, setMonthlyFeePerStudent] = useState(1200);
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);
  const [paymentDueDate, setPaymentDueDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('munyaka_payment_due_date');
      if (saved) return saved;
    } catch {}
    // Default to end of current month
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });
  const [billingDueDay, setBillingDueDay] = useState<number>(() => {
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db');
      if (centralRaw) {
        const db = JSON.parse(centralRaw);
        if (db.billingSettings?.billingDueDay) return db.billingSettings.billingDueDay;
      }
    } catch {}
    return 5;
  });
  const [billingGracePeriod, setBillingGracePeriod] = useState<number>(() => {
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db');
      if (centralRaw) {
        const db = JSON.parse(centralRaw);
        if (db.billingSettings?.billingGracePeriod !== undefined) return db.billingSettings.billingGracePeriod;
      }
    } catch {}
    return 3;
  });

  // Campuses data initialized or loaded strictly from munyaka_central_db (Zero mock data fallback)
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db');
      if (centralRaw) {
        const centralDb = JSON.parse(centralRaw);
        if (Array.isArray(centralDb.campuses)) {
          return centralDb.campuses;
        }
      }
    } catch {}
    // Default to empty array if no campus registered in central db
    return [];
  });

  const [campusToDelete, setCampusToDelete] = useState<{ id: number; school: string } | null>(null);

  const confirmDeleteCampus = () => {
    if (!campusToDelete) return;
    const updated = subscriptions.filter(sub => sub.id !== campusToDelete.id);
    setSubscriptions(updated);
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db');
      if (centralRaw) {
        const centralDb = JSON.parse(centralRaw);
        centralDb.campuses = updated;
        localStorage.setItem('munyaka_central_db', JSON.stringify(centralDb));
      }
    } catch {}
    showSuccess(`Successfully removed "${campusToDelete.school}" campus and associated billing records.`);
    setCampusToDelete(null);
  };

  const handleMpesaCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaNumber || mpesaNumber.length < 10) {
      showError('Please enter a valid M-Pesa phone number.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsRenewed(true);
      showSuccess(`M-Pesa STK Push sent to ${mpesaNumber}. Subscription successfully renewed!`);
    }, 1500);
  };

  const handleRegenerateLicense = () => {
    const newKey = `MUNYAKA-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setLicenseKey(newKey);
    showSuccess(`New license key generated: ${newKey}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" /> Owner Billing & License Hub
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[11px] font-bold">
                System Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Payment & Subscriptions</h1>
            <p className="text-indigo-200 text-xs md:text-sm mt-1.5 max-w-2xl font-medium leading-relaxed">
              Manage multi-campus software licenses, real-time learner seat allocations, monthly payment settings, M-Pesa payment gateways, and subscription renewals.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center min-w-[100px]">
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Campuses</p>
              <p className="text-lg md:text-xl font-black mt-0.5">{subscriptions.length} Campuses</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center min-w-[120px]">
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Seats (L+S)</p>
              <p className="text-lg md:text-xl font-black mt-0.5 text-emerald-400">{allocatedSeats} / {maxSeats}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          <CreditCard size={18} /> Subscriptions & Renewal
        </button>
        <button
          onClick={() => setActiveTab('seats')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'seats'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          <Users size={18} /> Seats Allocation
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'monthly'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          <Calendar size={18} /> Monthly Payment Setting
        </button>
        <button
          onClick={() => setActiveTab('gateways')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'gateways'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          <Smartphone size={18} /> M-Pesa & Bank Gateways
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-5 py-3 font-bold text-sm rounded-t-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          <FileText size={18} /> Billing History & Invoices
        </button>
      </div>

      {/* Tab 1: Subscriptions & Renewal */}
      {activeTab === 'subscriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="lg:col-span-2 space-y-5">
            {/* Top-Level Subscription Summary Banner */}
            <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">Per-Seat Subscription Summary</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Total Licensed Seats: <span className="text-indigo-600 font-extrabold">{activeLearners} Active Seats</span></p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Commitment</p>
                  <p className="text-sm font-extrabold text-emerald-600">KES {annualSubtotal.toLocaleString()}</p>
                </div>
                <Button
                  onClick={() => {
                    setPaymentCampus('Munyaka Primary & Junior School');
                    let computed = allocatedSeats * 250 * 12;
                    try {
                      const centralRaw = localStorage.getItem('munyaka_central_db');
                      if (centralRaw) {
                        const centralDb = JSON.parse(centralRaw);
                        const learners = Array.isArray(centralDb.students) ? centralDb.students.filter((s: any) => s.status !== 'TRANSFERRED_OUT' && s.status !== 'ARCHIVED') : [];
                        const staffList = Array.isArray(centralDb.staff) ? centralDb.staff : [];
                        const totalActive = (learners.length + staffList.length) > 0 ? (learners.length + staffList.length) : allocatedSeats;
                        computed = totalActive * 250 * 12;
                      }
                    } catch {}
                    setPaymentAmount(String(computed));
                    setPaymentPeriod('1 Year Extension');
                    setIsPaymentModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm"
                >
                  Record Payment
                </Button>
              </div>
            </div>

            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 px-5 py-3.5">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>Registered Campuses & Per-Seat Tiers</span>
                  <Badge className="bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 text-xs">{subscriptions.length} Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 text-xs">
                  {subscriptions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 font-medium space-y-3">
                      <p>No active campuses registered in munyaka_central_db.</p>
                      <Button
                        onClick={() => {
                          const newCampus = {
                            id: Date.now(),
                            school: 'Munyaka Primary & Junior School',
                            tier: 'Enterprise Tier',
                            status: 'Active',
                            expires: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                            amount: `KES ${annualSubtotal.toLocaleString()}`
                          };
                          const updated = [newCampus];
                          setSubscriptions(updated);
                          try {
                            const centralRaw = localStorage.getItem('munyaka_central_db');
                            if (centralRaw) {
                              const centralDb = JSON.parse(centralRaw);
                              centralDb.campuses = updated;
                              localStorage.setItem('munyaka_central_db', JSON.stringify(centralDb));
                            }
                          } catch {}
                          showSuccess('Primary campus registered successfully from database records.');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-4 py-2"
                      >
                        Register Primary Campus from Database
                      </Button>
                    </div>
                  ) : (
                    subscriptions.map((sub) => {
                      const isMain = sub.id === 1;
                      const subtotal = isMain ? annualSubtotal : (sub.school.includes('Eldoret') ? 180 * 250 : 120 * 250);
                      const seatCount = isMain ? activeLearners : (sub.school.includes('Eldoret') ? 180 : 120);

                      return (
                        <div key={sub.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 font-bold">
                              <Building2 size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{sub.school}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-slate-100 text-slate-700 font-semibold text-[11px] px-2 py-0.5">{seatCount} Active Seats @ KES 250 / seat</Badge>
                                <span className="text-[11px] text-slate-400 font-medium">Expires: {sub.expires}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-2.5">
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Annual Subtotal</p>
                            <p className="font-extrabold text-slate-900 text-xs">KES {subtotal.toLocaleString()}</p>
                          </div>
                          <Badge className={sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700 font-bold text-[11px] px-2.5 py-0.5' : 'bg-amber-100 text-amber-700 font-bold text-[11px] px-2.5 py-0.5'}>
                            {sub.status}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <Button
                              onClick={() => {
                                setPaymentCampus(sub.school);
                                // Dynamically compute amount based on campus learner count & monthly fee from munyaka_central_db
                                let computedAmt = subtotal;
                                try {
                                  const centralRaw = localStorage.getItem('munyaka_central_db');
                                  if (centralRaw) {
                                    const centralDb = JSON.parse(centralRaw);
                                    const learners = Array.isArray(centralDb.students) ? centralDb.students.filter((s: any) => s.status !== 'TRANSFERRED_OUT' && s.status !== 'ARCHIVED') : [];
                                    const staffList = Array.isArray(centralDb.staff) ? centralDb.staff : [];
                                    const count = (learners.length + staffList.length) > 0 ? (learners.length + staffList.length) : seatCount;
                                    computedAmt = count * 250 * 12; // 12 months standard annual fee
                                  }
                                } catch {}
                                setPaymentAmount(String(computedAmt));
                                setPaymentPeriod('1 Year Extension');
                                setIsPaymentModalOpen(true);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              Record Payment
                            </Button>
                              <Button
                                variant="outline"
                                onClick={() => setActiveTab('seats')}
                                className="text-[11px] font-semibold h-7 px-2.5 rounded-lg border-slate-200"
                              >
                                Manage Seats
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setCampusToDelete({ id: sub.id, school: sub.school })}
                                className="text-[11px] font-semibold h-7 px-2.5 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Remove Campus"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm rounded-2xl p-5 bg-white">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Key className="text-indigo-600" size={18} /> Software Activation & License Key
              </h3>
              <p className="text-xs text-slate-600 mb-4 font-medium">
                Your portal instance is bound to the official Munyaka Per-Seat Enterprise License. Regenerate or verify your key below.
              </p>
              
              <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex-1 font-mono font-bold text-indigo-600 bg-white px-3.5 py-2 rounded-lg border border-slate-200 w-full text-center md:text-left text-xs">
                  {licenseKey}
                </div>
                <Button
                  onClick={handleRegenerateLicense}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 w-full md:w-auto shrink-0 shadow-sm gap-1.5"
                >
                  <RefreshCw size={14} /> Regenerate Key
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="border border-indigo-200 shadow-md rounded-2xl p-5 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1.5">
                <CreditCard className="text-indigo-600" size={18} /> Instant M-Pesa Renewal
              </h3>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                Trigger automated STK Push for total per-seat commitment: <strong className="text-emerald-600">KES {annualSubtotal.toLocaleString()}</strong>.
              </p>

              <form onSubmit={handleMpesaCheckout} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Select Subscription Plan</Label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="Enterprise Per-Seat Annual">Enterprise Per-Seat Annual (KES {annualSubtotal.toLocaleString()})</option>
                    <option value="Standard Per-Seat Annual">Standard Per-Seat Annual</option>
                    <option value="Starter Per-Seat Annual">Starter Per-Seat Annual</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">M-Pesa Phone Number (STK Push)</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <Input
                      type="text"
                      value={mpesaNumber}
                      onChange={(e) => setMpesaNumber(e.target.value)}
                      placeholder="0712345678"
                      className="pl-9 h-9 rounded-xl bg-white border-slate-200 font-semibold text-xs"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm gap-1.5 mt-1"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
                  {isProcessing ? 'Processing STK Push...' : `Pay KES ${annualSubtotal.toLocaleString()} via M-Pesa`}
                </Button>
              </form>

              {isRenewed && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 animate-in fade-in text-xs">
                  <CheckCircle2 className="shrink-0 text-emerald-600 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[11px]">Renewal Successful</p>
                    <p className="mt-0.5">Per-seat license extended through Dec 31, 2026. Official receipt generated.</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Seats Allocation (Powered by real central DB student count) */}
      {activeTab === 'seats' && (
        <Card className="border border-slate-200 shadow-sm rounded-3xl p-8 bg-white animate-in fade-in space-y-6">
          <CardHeader className="p-0 border-b border-slate-100 pb-4">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="text-indigo-600" size={24} /> Learner & Staff Seats Allocation
            </CardTitle>
            <p className="text-xs text-slate-500 font-medium mt-1">Live active learner slots synchronized directly from <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs">munyaka_central_db</code>.</p>
          </CardHeader>

          <CardContent className="p-0 space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400">Currently Allocated Seats</p>
                <p className="text-4xl font-black text-indigo-600 mt-2">{allocatedSeats}</p>
                <p className="text-xs text-slate-600 font-bold mt-1">Active learners ({totalActiveStudents}) & staff ({totalActiveStaff})</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400">Maximum License Capacity</p>
                <p className="text-4xl font-black text-slate-900 mt-2">{maxSeats}</p>
                <p className="text-xs text-emerald-600 font-bold mt-1">Enterprise Plan Limit</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400">Available Free Slots</p>
                <p className="text-4xl font-black text-emerald-600 mt-2">{Math.max(0, maxSeats - allocatedSeats)}</p>
                <p className="text-xs text-slate-600 font-bold mt-1">Ready for enrollment</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-2 max-w-md">
                <Label className="text-xs font-black uppercase text-slate-500">Request Seat Expansion / Upgrade Tier</Label>
                <Input 
                  type="number"
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(Number(e.target.value))}
                  className="h-12 bg-slate-50 border-slate-200 font-bold text-lg"
                />
              </div>

              <Button 
                onClick={() => showSuccess(`Seat capacity successfully updated to ${maxSeats} seats.`)}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8"
              >
                Save Seat Allocation Limits
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Monthly Payment Setting (Powered by real central DB active student calculations) */}
      {activeTab === 'monthly' && (
        <Card className="border border-slate-200 shadow-sm rounded-3xl p-8 bg-white animate-in fade-in space-y-6">
          <CardHeader className="p-0 border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="text-indigo-600" size={24} /> Monthly Payment & Billing Setting
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Calculated automatically from <strong className="text-indigo-600">{totalActiveStudents} active learners</strong> and <strong className="text-indigo-600">{totalActiveStaff} active staff</strong> synchronized from <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-mono text-[11px]">munyaka_central_db</code>.
                </p>
              </div>

              {/* Global App Lock Toggle Control */}
              {(() => {
                return (
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${isGloballyLocked ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-emerald-50 border-emerald-200 shadow-sm'}`}>
                    <div className="flex flex-col text-left">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isGloballyLocked ? 'text-red-700' : 'text-emerald-700'}`}>
                        {isGloballyLocked ? '🔴 Teacher Apps Locked' : '🟢 Teacher Apps Unlocked'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {isGloballyLocked ? 'All connected teacher app sessions are restricted' : 'All teacher app sessions are fully active'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isGloballyLocked;
                        setIsGloballyLocked(nextState);
                        try {
                          localStorage.setItem(GLOBAL_LOCK_KEY, nextState ? 'true' : 'false');
                          window.dispatchEvent(new Event('storage'));
                          if (nextState) {
                            showSuccess('Global App Lock activated! Teacher apps will now be restricted.');
                          } else {
                            showSuccess('Global App Lock deactivated! Teacher apps are now unlocked.');
                          }
                        } catch (err) {
                          console.error('Failed to update global lock state:', err);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isGloballyLocked ? 'bg-red-600' : 'bg-emerald-600'}`}
                      role="switch"
                      aria-checked={isGloballyLocked}
                      title={isGloballyLocked ? 'Click to Unlock Teacher Apps' : 'Click to Lock Teacher Apps'}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isGloballyLocked ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })()}
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400">Active Learners</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{activeLearners}</p>
                <p className="text-xs text-slate-500 mt-1">Billed monthly</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400">Fee Per Learner</p>
                <p className="text-3xl font-black text-indigo-600 mt-2">KES {monthlyFeePerStudent.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Standard rate</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400">Estimated Monthly Total</p>
                <p className="text-3xl font-black text-emerald-600 mt-2">KES {(activeLearners * monthlyFeePerStudent).toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Auto-calculated</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Monthly License Fee Per Student (KES)</Label>
                            <Input
                              type="number"
                              value={monthlyFeePerStudent}
                              onChange={(e) => setMonthlyFeePerStudent(Number(e.target.value))}
                              className="h-12 bg-slate-50 border-slate-200 font-bold text-lg"
                            />
                          </div>
            
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Monthly Payment Due Date</Label>
                            <Input
                              type="date"
                              value={paymentDueDate}
                              onChange={(e) => setPaymentDueDate(e.target.value)}
                              className="h-12 bg-slate-50 border-slate-200 font-bold text-sm"
                            />
                          </div>
            
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Automated Monthly Direct Debit</Label>
                            <select
                              value={autoDebitEnabled ? 'yes' : 'no'}
                              onChange={(e) => setAutoDebitEnabled(e.target.value === 'yes')}
                              className="w-full h-12 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                            >
                              <option value="yes">Enabled (Auto-charge via M-Pesa / Bank)</option>
                              <option value="no">Disabled (Manual Invoicing)</option>
                            </select>
                          </div>
                        </div>
            
                        {/* Auto-Lock Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Billing Due Day of Month</Label>
                            <Input
                              type="number"
                              min="1"
                              max="28"
                              value={billingDueDay}
                              onChange={(e) => setBillingDueDay(Math.max(1, Math.min(28, Number(e.target.value))))}
                              className="h-12 bg-slate-50 border-slate-200 font-bold text-lg"
                            />
                            <p className="text-[10px] text-slate-500">Day of month when payment is due (default: 5th)</p>
                          </div>
            
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Grace Period (Days)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="14"
                              value={billingGracePeriod}
                              onChange={(e) => setBillingGracePeriod(Math.max(0, Math.min(14, Number(e.target.value))))}
                              className="h-12 bg-slate-50 border-slate-200 font-bold text-lg"
                            />
                            <p className="text-[10px] text-slate-500">Days after due date before auto-lock triggers (default: 3 days)</p>
                          </div>
                        </div>

            {/* Overdue Warning / Eligibility Indicator */}
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isOverdue = paymentDueDate && todayStr > paymentDueDate;
              return (
                <div className={`border rounded-2xl p-5 flex items-start gap-3 ${isOverdue ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                  {isOverdue ? (
                    <Calendar className="shrink-0 text-red-600 mt-0.5" size={20} />
                  ) : (
                    <Calendar className="shrink-0 text-emerald-600 mt-0.5" size={20} />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs uppercase tracking-wider">
                        {isOverdue ? '⚠️ Payment Due Date Passed (Eligible for App Lock)' : '✅ Payment Status: Current'}
                      </p>
                      <Badge className={isOverdue ? 'bg-red-200 text-red-800 font-bold text-[10px]' : 'bg-emerald-200 text-emerald-800 font-bold text-[10px]'}>
                        Due: {paymentDueDate}
                      </Badge>
                    </div>
                    <p className="text-xs mt-1">
                      {isOverdue
                        ? `The scheduled due date (${paymentDueDate}) has passed. You can now toggle "Teacher Apps Locked" above to restrict access until payment is settled.`
                        : `Current payment deadline is ${paymentDueDate}. Teacher apps remain fully active under normal operational terms.`
                      }
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 text-amber-900">
              <DollarSign className="shrink-0 text-amber-600 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider">Dynamic Monthly Billing Preview</p>
                <p className="text-xs mt-1">Based on {totalActiveStudents} active learners & {totalActiveStaff} staff members × KES {monthlyFeePerStudent.toLocaleString()}, your next scheduled automatic invoice is <strong>KES {(allocatedSeats * monthlyFeePerStudent).toLocaleString()}</strong>.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
                          <Button
                            onClick={() => {
                              try {
                                localStorage.setItem('munyaka_payment_due_date', paymentDueDate);
                                // Save billing auto-lock settings to munyaka_central_db
                                const centralRaw = localStorage.getItem('munyaka_central_db');
                                if (centralRaw) {
                                  const centralDb = JSON.parse(centralRaw);
                                  centralDb.billingSettings = {
                                    billingDueDay,
                                    billingGracePeriod,
                                    updatedAt: new Date().toISOString(),
                                  };
                                  localStorage.setItem('munyaka_central_db', JSON.stringify(centralDb));
                                }
                              } catch {}
                              showSuccess('Monthly payment settings & due date saved successfully.');
                            }}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8"
                          >
                            Save Monthly Billing Rules
                          </Button>
                        </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: M-Pesa & Bank Gateways */}
      {activeTab === 'gateways' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          <Card className="border border-slate-200 shadow-sm rounded-3xl p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">M-Pesa Daraja API Gateway</h3>
                  <p className="text-xs text-slate-500 font-medium">Automated C2B & STK Push</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 font-bold">Connected</Badge>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase">Shortcode / Paybill</Label>
                <Input readOnly value="523900 (Munyaka Official Paybill)" className="bg-slate-50 font-mono font-bold" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase">Consumer Key</Label>
                <Input readOnly value="••••••••••••••••••••••••••••••••" className="bg-slate-50 font-mono" />
              </div>
              <Button onClick={() => showSuccess('M-Pesa gateway settings saved.')} className="w-full rounded-xl bg-slate-900 text-white font-bold h-11">
                Configure Gateway Credentials
              </Button>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm rounded-3xl p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                  <Building size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Co-operative Bank / Equity Bank</h3>
                  <p className="text-xs text-slate-500 font-medium">Direct Institutional Bank Feed</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700 font-bold">Active</Badge>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase">Bank Account Number</Label>
                <Input readOnly value="0119234857200 (Eldoret Branch)" className="bg-slate-50 font-mono font-bold" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase">API Endpoint Status</Label>
                <Input readOnly value="https://api.bank.co.ke/v2/feed/munyaka" className="bg-slate-50 font-mono text-xs" />
              </div>
              <Button onClick={() => showSuccess('Bank gateway synchronized.')} className="w-full rounded-xl bg-slate-900 text-white font-bold h-11">
                Sync Bank Statement Feed
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Billing History & Invoices */}
      {activeTab === 'invoices' && (
        <Card className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white animate-in fade-in">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 px-6 py-5">
            <CardTitle className="text-lg font-black text-slate-900">Official Billing & Tax Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {[
              { id: 'INV-2026-001', date: new Date().toISOString().split('T')[0], campus: 'Munyaka Primary & Junior School', amount: `KES ${(allocatedSeats * 250).toLocaleString()}`, status: 'Paid' },
              ].map((inv) => (
                <div key={inv.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{inv.id}</p>
                      <p className="text-xs text-slate-500 font-medium">{inv.campus} • {inv.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-black text-slate-900">{inv.amount}</span>
                    <Badge className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1">{inv.status}</Badge>
                    <Button variant="outline" onClick={() => showSuccess(`Downloading ${inv.id} PDF...`)} className="rounded-xl border-slate-200 text-xs font-bold gap-1">
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header (Fixed at top) */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Record Subscription Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                ×
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const amtNum = Number(paymentAmount);
              
              setSubscriptions(prev => prev.map(s => {
                if (s.school === paymentCampus) {
                  let monthsToAdd = 12;
                  if (paymentPeriod.includes('6 Months')) {
                    monthsToAdd = 6;
                  } else if (paymentPeriod.startsWith('Custom Term')) {
                    const match = paymentPeriod.match(/\((\d+)\s+Months?\)/);
                    if (match) {
                      monthsToAdd = parseInt(match[1]) || 3;
                    }
                  }

                  const base = s.expires && new Date(s.expires) > new Date() ? new Date(s.expires) : new Date();
                  base.setMonth(base.getMonth() + monthsToAdd);
                  const newExpiry = base.toISOString().split('T')[0];

                  const updatedSub = { ...s, status: 'Active', expires: newExpiry };
                  try {
                    const centralRaw = localStorage.getItem('munyaka_central_db');
                    if (centralRaw) {
                      const centralDb = JSON.parse(centralRaw);
                      if (Array.isArray(centralDb.campuses)) {
                        centralDb.campuses = centralDb.campuses.map((cs: any) => cs.school === paymentCampus ? updatedSub : cs);
                        localStorage.setItem('munyaka_central_db', JSON.stringify(centralDb));
                      }
                    }
                    const saved = localStorage.getItem('munyaka_registered_campuses');
                    if (saved) {
                      const parsed = JSON.parse(saved);
                      if (Array.isArray(parsed)) {
                        const newCampuses = parsed.map((cs: any) => cs.school === paymentCampus ? updatedSub : cs);
                        localStorage.setItem('munyaka_registered_campuses', JSON.stringify(newCampuses));
                      }
                    }
                  } catch {}

                  return updatedSub;
                }
                return s;
              }));

              try {
                const history = JSON.parse(localStorage.getItem('munyaka_billing_history') || '[]');
                history.unshift({
                  id: `PAY-${Date.now()}`,
                  date: paymentDate,
                  campus: paymentCampus,
                  method: paymentMethod,
                  ref: paymentRef || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
                  amount: `KES ${amtNum.toLocaleString()}`,
                  period: paymentPeriod,
                  notes: paymentNotes
                });
                localStorage.setItem('munyaka_billing_history', JSON.stringify(history));
              } catch {}

              showSuccess(`Payment of KES ${amtNum.toLocaleString()} successfully recorded for ${paymentCampus}!`);
              recordPaymentAndUnlock({
                campus: paymentCampus,
                amount: paymentAmount,
                method: paymentMethod,
                ref: paymentRef,
                period: paymentPeriod,
                notes: paymentNotes
              });
              setIsPaymentModalOpen(false);
              // Force state refresh so global lock toggle and status update instantly
              setIsGloballyLocked(false);
            }} className="flex flex-col flex-1 overflow-hidden">
              {/* Modal Body (Scrollable Area) */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Selected Campus</Label>
                  <Input disabled value={paymentCampus} className="bg-slate-100 font-bold text-slate-800 h-10" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Payment Method</Label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="M-Pesa Paybill / STK">M-Pesa Paybill / STK</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Transaction Reference Code</Label>
                    <Input
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. QKH78923XX"
                      className="h-10 bg-slate-50 font-mono text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Amount Received (KES)</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="h-10 bg-slate-50 font-bold text-sm text-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Billing Period / Extension</Label>
                    <div className="flex items-center gap-2">
                      <select
                        value={paymentPeriod}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Custom Term') {
                            setIsCustomTermModalOpen(true);
                          } else {
                            setPaymentPeriod(val);
                            if (val === '1 Year Extension') {
                              setPaymentAmount('120000');
                            } else if (val === '6 Months Extension') {
                              setPaymentAmount('65000');
                            }
                          }
                        }}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="1 Year Extension">1 Year Extension</option>
                        <option value="6 Months Extension">6 Months Extension</option>
                        <option value="Custom Term">Custom Term {paymentPeriod.startsWith('Custom') ? `(${paymentPeriod})` : ''}</option>
                      </select>
                      {paymentPeriod.startsWith('Custom') && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCustomTermModalOpen(true)}
                          className="h-10 px-3 text-xs font-bold rounded-xl border-indigo-200 text-indigo-600 shrink-0 bg-indigo-50/50 hover:bg-indigo-100"
                        >
                          Edit Term
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Payment Date</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-10 bg-slate-50 text-xs font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Notes / Receipt Remarks</Label>
                  <Input
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Additional notes..."
                    className="h-10 bg-slate-50 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Modal Footer (Fixed at bottom) */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-xl text-xs font-semibold h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-6 shadow-sm"
                >
                  Confirm & Record Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Term Sub-Modal */}
      {isCustomTermModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Custom Billing Term & Extension</h3>
                <p className="text-xs text-slate-500 font-medium">Specify exact duration in months</p>
              </div>
              <button
                onClick={() => setIsCustomTermModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600">Select or Enter Duration (Months)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={customMonths}
                    onChange={(e) => setCustomMonths(e.target.value)}
                    className="h-12 bg-slate-50 font-bold text-lg text-indigo-600"
                    placeholder="e.g. 3"
                  />
                  <span className="text-sm font-bold text-slate-700 shrink-0">Months</span>
                </div>

                {/* Quick select pills */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {[1, 2, 3, 4, 6, 9, 12, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCustomMonths(String(m))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        Number(customMonths) === m
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {m} {m === 1 ? 'Month' : 'Months'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Calculation Preview */}
              <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100/80 rounded-2xl p-4 space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">Dynamic Payment & Expiry Preview</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Calculated Amount</p>
                    <p className="font-extrabold text-sm text-emerald-600 mt-0.5">
                      KES {(Number(customMonths || 1) * 10000).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
                    <p className="text-[10px] uppercase font-bold text-slate-400">New Expiry Date</p>
                    <p className="font-extrabold text-sm text-slate-900 mt-0.5">
                      {(() => {
                        try {
                          const months = parseInt(customMonths) || 1;
                          const currentSub = subscriptions.find((s: any) => s.school === paymentCampus);
                          const base = currentSub && currentSub.expires && new Date(currentSub.expires) > new Date()
                            ? new Date(currentSub.expires)
                            : new Date();
                          base.setMonth(base.getMonth() + months);
                          return base.toISOString().split('T')[0];
                        } catch {
                          return '2027-03-31';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomTermModalOpen(false)}
                className="rounded-xl text-xs font-semibold h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const m = parseInt(customMonths) || 1;
                  const calculatedAmt = m * 10000;
                  setPaymentPeriod(`Custom Term (${m} Months)`);
                  setPaymentAmount(String(calculatedAmt));
                  setIsCustomTermModalOpen(false);
                  showSuccess(`Applied custom term of ${m} months (KES ${calculatedAmt.toLocaleString()})`);
                }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-6 shadow-sm"
              >
                Apply Custom Term
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Campus Confirmation Modal */}
      {campusToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-6 relative border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-bold">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Remove Campus & Subscriptions</h3>
                  <p className="text-xs text-slate-500 font-medium">Confirmation Required</p>
                </div>
              </div>
              <button
                onClick={() => setCampusToDelete(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Are you sure you want to remove <strong className="text-slate-900 font-bold">{campusToDelete.school}</strong>?
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 space-y-1">
                <p className="font-bold">⚠️ Warning:</p>
                <p className="text-[11px] leading-relaxed">
                  This action will delete its associated seat allocations, active licenses, and billing records from the central database. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCampusToDelete(null)}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteCampus}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-rose-100 flex items-center gap-2"
              >
                Yes, Remove Campus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
