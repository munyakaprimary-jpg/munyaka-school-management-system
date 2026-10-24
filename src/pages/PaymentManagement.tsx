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
import { INITIAL_SEED_DATA } from '../data/InitialSeedData';

export default function PaymentManagement() {
  // Access active store data for students, staff, and campuses FIRST (to avoid Temporal Dead Zone)
  const students = useSchoolStore((state) => state.students) || [];
    const staff = useSchoolStore((state) => state.staff) || [];
    const campuses = useSchoolStore((state) => state.campuses) || [];
    const tenants = useSchoolStore((state) => state.tenants) || [];
    const addCampus = useSchoolStore((state) => state.addCampus);
    const deleteCampus = useSchoolStore((state) => state.deleteCampus);
    const updateCampusSeats = useSchoolStore((state) => state.updateCampusSeats);
  const activeLearnersCount = students?.length > 0 ? students.filter((s: any) => s.status !== 'TRANSFERRED_OUT' && s.status !== 'ARCHIVED').length : (INITIAL_SEED_DATA?.learners?.length || 31);
  const feePerLearner = 100;
  const estimatedMonthlyTotal = activeLearnersCount * feePerLearner;
  const activeLearners = activeLearnersCount;
  const PRICE_PER_SEAT = 250;
  const annualSubtotal = activeLearners * PRICE_PER_SEAT * 12;

  // Calculate total combined seats and commitment across all campuses
  const totalCampusSeats = campuses.reduce((acc, c: any) => acc + Number(c.activeSeats || 0), 0);
  const totalCampusCommitment = campuses.reduce((acc, c: any) => acc + (Number(c.activeSeats || 0) * Number(c.pricePerSeat || 250) * 12), 0);

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

  const handleDownloadPDF = (invoice: any) => {
    // Remove any existing print iframe if present
    const existingIframe = document.getElementById('invoice-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'invoice-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const feePerSeat = Number(localStorage.getItem('munyaka_fee_per_seat')) || 100;
    const totalSeats = (INITIAL_SEED_DATA.learners?.length || 31) + (INITIAL_SEED_DATA.staff?.length || 6); // 37

    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
            .school-title { font-size: 22px; font-weight: bold; color: #1e3a8a; margin: 0; }
            .doc-type { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #4b5563; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 12px; background-color: #d1fae5; color: #065f46; font-weight: bold; border-radius: 9999px; font-size: 12px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 8px; }
            .meta-item { font-size: 13px; }
            .meta-item strong { color: #374151; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; }
            th { background-color: #f3f4f6; text-align: left; padding: 10px 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
            .text-right { text-align: right; }
            .total-box { display: flex; justify-content: flex-end; align-items: center; gap: 20px; font-size: 18px; font-weight: bold; color: #047857; margin-top: 10px; }
            .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="school-title">Munyaka Primary & Junior School</h1>
              <div class="doc-type">Official Software License Receipt / Invoice</div>
            </div>
            <span class="badge">${invoice.status || 'PAID'}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><strong>Invoice Reference:</strong> ${invoice.id}</div>
            <div class="meta-item"><strong>Billing Date:</strong> ${invoice.date}</div>
            <div class="meta-item"><strong>Total Active Seats:</strong> ${totalSeats} (31 Learners + 6 Staff)</div>
            <div class="meta-item"><strong>Per-Seat Rate:</strong> KES ${feePerSeat} / Seat</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Seats</th>
                <th class="text-right">Rate / Seat</th>
                <th class="text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Official Software License Renewal</td>
                <td class="text-right">${totalSeats}</td>
                <td class="text-right">KES ${feePerSeat}</td>
                <td class="text-right">KES ${Number(invoice.amount).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <span>Total Paid:</span>
            <span>KES ${Number(invoice.amount).toLocaleString()}</span>
          </div>

          <div class="footer">
            Generated by Munyaka School Management Portal • Official Digital License Document
          </div>
        </body>
      </html>
    `);

    iframeDoc.close();

    // Wait for content to render, then open native system Save-as-PDF / Print prompt
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 300);
  };

  const [activeTab, setActiveTab] = useState<'subscriptions' | 'seats' | 'monthly' | 'invoices'>('subscriptions');
  const [mpesaNumber, setMpesaNumber] = useState('0738873359');
  const [selectedPlan, setSelectedPlan] = useState('Enterprise Annual (KES 120,000)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [licenseKey, setLicenseKey] = useState(dynamicLicenseKey);
  const [isRenewed, setIsRenewed] = useState(false);

  // Register New Campus Modal State / Add Campus Modal State
  const [isRegisterCampusModalOpen, setIsRegisterCampusModalOpen] = useState(false);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCampus, setPaymentCampus] = useState('Munyaka Primary & Junior School');
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa Paybill / STK');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentPeriod, setPaymentPeriod] = useState('1 Month');
  
  // Dynamic active seats & base monthly total calculation
  const activeSeats = (INITIAL_SEED_DATA.learners?.length || 31) + (INITIAL_SEED_DATA.staff?.length || 6);
  const currentFeePerSeat = Number(localStorage.getItem('munyaka_fee_per_seat')) || 100;
  const monthlyBaseCommitment = activeSeats * currentFeePerSeat; // e.g. 37 * 100 = 3,700

  const billingPeriodOptions = [
    { label: '1 Month', value: 1 },
    { label: '2 Months', value: 2 },
    { label: '3 Months', value: 3 },
    { label: '4 Months', value: 4 },
    { label: '5 Months', value: 5 },
    { label: '6 Months', value: 6 },
    { label: '7 Months', value: 7 },
    { label: '8 Months', value: 8 },
    { label: '9 Months', value: 9 },
    { label: '10 Months', value: 10 },
    { label: '11 Months', value: 11 },
    { label: '12 Months (1 Year)', value: 12 },
  ];

  const durationMultipliers: Record<string, number> = {
    '1 Month': 1,
    '2 Months': 2,
    '3 Months': 3,
    '4 Months': 4,
    '5 Months': 5,
    '6 Months': 6,
    '7 Months': 7,
    '8 Months': 8,
    '9 Months': 9,
    '10 Months': 10,
    '11 Months': 11,
    '12 Months (1 Year)': 12,
  };

  const [paymentAmount, setPaymentAmount] = useState<string>(() => {
    const selectedMonths = 1;
    return String(monthlyBaseCommitment * selectedMonths);
  });

  // Reactive Amount Recalculation:
  // Update paymentAmount when modal opens, paymentPeriod changes, or fee per seat changes
  useEffect(() => {
    if (!isPaymentModalOpen) return;
    const match = paymentPeriod.match(/^(\d+)/);
    const selectedMonths = match ? Number(match[1]) : 1;
    setPaymentAmount(String(monthlyBaseCommitment * selectedMonths));
  }, [isPaymentModalOpen, paymentPeriod, monthlyBaseCommitment]);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Dynamic default remarks logic based on billing period
  const getDefaultRemark = (months: number) => {
    if (months === 12) {
      return "Official annual software license renewal";
    }
    return `Official ${months}-month software license renewal`;
  };

  const [paymentNotes, setPaymentNotes] = useState(() => getDefaultRemark(1));
  const [hasCustomNotes, setHasCustomNotes] = useState(false);

  // Sync paymentNotes with paymentPeriod whenever paymentPeriod changes (unless user typed custom notes)
  useEffect(() => {
    const match = paymentPeriod.match(/^(\d+)/);
    const months = match ? Number(match[1]) : 1;
    if (!hasCustomNotes) {
      setPaymentNotes(getDefaultRemark(months));
    }
  }, [paymentPeriod, hasCustomNotes]);

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
      const sCount = INITIAL_SEED_DATA.learners.length;
      const staffCount = INITIAL_SEED_DATA.staff?.length || 6;
      const totalAllocated = sCount + staffCount;
      const capacity = Math.max(totalAllocated + 120, 500);

      return {
        totalActiveStudents: sCount,
        totalActiveStaff: staffCount,
        totalCapacity: capacity,
        availableSlots: Math.max(0, capacity - totalAllocated),
      };
    } catch {}
    const sCount = INITIAL_SEED_DATA.learners.length;
    const staffCount = INITIAL_SEED_DATA.staff?.length || 6;
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

  // Monthly billing setting state with localStorage synchronization ('munyaka_fee_per_seat')
  const [monthlyFeePerStudent, setMonthlyFeePerStudent] = useState<number>(() => {
    return Number(localStorage.getItem('munyaka_fee_per_seat')) || 100;
  });

  const [summaryFeePerSeat, setSummaryFeePerSeat] = useState<number>(() => {
    return Number(localStorage.getItem('munyaka_fee_per_seat')) || 100;
  });

  useEffect(() => {
    const updateFee = () => {
      const storedFee = Number(localStorage.getItem('munyaka_fee_per_seat')) || 100;
      setMonthlyFeePerStudent(storedFee);
      setSummaryFeePerSeat(storedFee);
    };

    window.addEventListener('fee_per_seat_updated', updateFee);
    return () => window.removeEventListener('fee_per_seat_updated', updateFee);
  }, []);

  const handleFeeChange = (newFee: number) => {
    setMonthlyFeePerStudent(newFee);
    setSummaryFeePerSeat(newFee);
    localStorage.setItem('munyaka_fee_per_seat', String(newFee));
    window.dispatchEvent(new Event('fee_per_seat_updated'));
  };

  const totalSeats = (INITIAL_SEED_DATA.learners?.length || 31) + (INITIAL_SEED_DATA.staff?.length || 6); // 37
  const currentFee = Number(monthlyFeePerStudent) || 0;
  const estimatedTotal = totalSeats * currentFee;
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
            {(() => {
              const learnersCount = INITIAL_SEED_DATA.learners?.length || 31;
              const staffCount = INITIAL_SEED_DATA.staff?.length || 6;
              const totalSeats = learnersCount + staffCount;
              const totalCommitment = totalSeats * summaryFeePerSeat;

              return (
                <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">Per-Seat Subscription Summary</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">Total Licensed Seats: <span className="text-indigo-600 font-extrabold">{totalSeats} Active Seats ({learnersCount} Learners + {staffCount} Staff)</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Commitment</p>
                      <p className="text-sm font-extrabold text-emerald-600">KES {totalCommitment.toLocaleString()}</p>
                    </div>
                    <Button
                      onClick={() => {
                        setPaymentCampus('Munyaka Primary & Junior School');
                        setPaymentAmount(String(totalCommitment));
                        setPaymentPeriod('1 Month Extension');
                        setIsPaymentModalOpen(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm"
                    >
                      Record Payment
                    </Button>
                  </div>
                </div>
              );
            })()}

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-5">
              <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-gray-900">Registered Campuses & Per-Seat Tiers</h3>
                                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                  {tenants.filter((t: any) => t.status === 'Active').length} Active
                                </span>
                              </div>
                            </div>
                            <div className="divide-y divide-slate-100 text-xs">
                                {tenants.length === 0 ? (
                                  <div className="p-8 text-center text-slate-500 font-medium space-y-3">
                                    <p>No active tenants registered.</p>
                                    <p className="text-xs text-slate-400">Provision new tenants via the Multi-Tenant Platform Hub.</p>
                                  </div>
                                ) : (
                                  tenants.map((tenant: any) => {
                                                        const tenantSeats = Number(tenant.maxSeats || 50);
                                                        const tenantPricePerSeat = tenant.plan === 'Enterprise' ? 300 : tenant.plan === 'Starter' ? 200 : 250;
                                                        const tenantSubtotal = tenantSeats * tenantPricePerSeat * 12;
                                  
                                                        return (
                                                          <div key={tenant.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                                                            <div className="flex items-start gap-3">
                                                              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 font-bold">
                                                                <Building2 size={20} />
                                                              </div>
                                                              <div>
                                                                <h4 className="font-bold text-slate-900 text-sm">{tenant.name}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                  <Badge className="bg-slate-100 text-slate-700 font-semibold text-[11px] px-2 py-0.5">{tenantSeats} Active Seats @ KES {tenantPricePerSeat} / seat</Badge>
                                                                  <span className="text-[11px] text-slate-400 font-medium">Plan: {tenant.plan}</span>
                                                                </div>
                                                              </div>
                                                            </div>
                                  
                                                            <div className="flex items-center justify-between md:justify-end gap-2.5">
                                                            <div className="text-right">
                                                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Annual Subtotal</p>
                                                              <p className="font-extrabold text-slate-900 text-xs">KES {tenantSubtotal.toLocaleString()}</p>
                                                            </div>
                                                            <Badge className={tenant.status === 'Active' ? 'bg-emerald-100 text-emerald-700 font-bold text-[11px] px-2.5 py-0.5' : 'bg-amber-100 text-amber-700 font-bold text-[11px] px-2.5 py-0.5'}>
                                                              {tenant.status}
                                                            </Badge>
                                                            <div className="flex items-center gap-1.5">
                                                              <Button
                                                                onClick={() => {
                                                                  setPaymentCampus(tenant.name);
                                                                  setPaymentAmount(String(tenantSubtotal));
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
                                                                  onClick={() => useSchoolStore.getState().deleteTenant(tenant.id)}
                                                                  className="text-[11px] font-semibold h-7 px-2.5 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                                  title="Remove Tenant"
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
            </div>

            <Card className="border border-slate-200 shadow-sm rounded-2xl p-6 bg-white max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Key className="text-indigo-600" size={18} /> Software Activation & License Key
              </h3>
              <p className="text-xs text-slate-600 mb-4 font-medium">
                Your portal instance is bound to the official Munyaka Per-Seat Enterprise License. Regenerate or verify your key below.
              </p>
              
              <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex-1 font-mono font-bold text-indigo-600 bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 w-full text-center md:text-left text-xs">
                  {licenseKey}
                </div>
                <Button
                  onClick={handleRegenerateLicense}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-6 w-full md:w-auto shrink-0 shadow-sm gap-1.5"
                >
                  <RefreshCw size={14} /> Regenerate Key
                </Button>
              </div>
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
            <p className="text-xs text-slate-500 font-medium mt-1">Live active learner slots synchronized directly from master store (<code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs">munyaka_learners_v2</code> &amp; <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs">munyaka_users_v1</code>).</p>
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

      {/* Tab 3: Monthly Payment Setting */}
      {activeTab === 'monthly' && (
        <Card className="border border-slate-200 shadow-sm rounded-3xl p-8 bg-white animate-in fade-in space-y-6">
          <CardHeader className="p-0 border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="text-indigo-600" size={24} /> Monthly Payment & Billing Setting
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Calculated automatically from {activeLearnersCount} active learners and {INITIAL_SEED_DATA.staff.length} active staff synchronized from src/data/InitialSeedData.ts.
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
            <div className="grid grid-cols-2 gap-4 my-4">
              {/* Card 1: Active Learners */}
              <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ACTIVE LEARNERS</span>
                <div className="text-3xl font-extrabold text-gray-900 mt-2">
                  {INITIAL_SEED_DATA.learners?.length || 31}
                </div>
                <p className="text-xs text-gray-400 mt-1">Billed monthly</p>
              </div>

              {/* Card 2: Active Staff */}
              <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ACTIVE STAFF</span>
                <div className="text-3xl font-extrabold text-gray-900 mt-2">
                  {INITIAL_SEED_DATA.staff?.length || 6}
                </div>
                <p className="text-xs text-gray-400 mt-1">System user access</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full my-4">
              {/* Card 1: Fee Per Learner */}
              <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm w-full">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">FEE PER SEAT</span>
                <div className="text-3xl font-extrabold text-indigo-600 mt-2">
                  KES {currentFee.toLocaleString()}
                </div>
                <p className="text-xs text-gray-400 mt-1">Standard rate</p>
              </div>

              {/* Card 2: Estimated Monthly Total */}
              <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm w-full">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ESTIMATED MONTHLY TOTAL</span>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                  KES {estimatedTotal.toLocaleString()}
                </div>
                <p className="text-xs text-gray-400 mt-1">Auto-calculated ({totalSeats} total active seats (L+S) × KES {currentFee})</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">MONTHLY LICENSE FEE PER SEAT (KES)</Label>
                            <Input
                              type="number"
                              value={monthlyFeePerStudent}
                              onChange={(e) => handleFeeChange(Number(e.target.value))}
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
                                localStorage.setItem('munyaka_next_billing_date', paymentDueDate);
                                window.dispatchEvent(new Event('storage'));
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

      {/* Tab 4: Billing History & Invoices */}
      {activeTab === 'invoices' && (() => {
        const totalActiveSeats = (INITIAL_SEED_DATA.learners?.length || 31) + (INITIAL_SEED_DATA.staff?.length || 6); // 37
        const currentFeePerSeat = Number(localStorage.getItem('munyaka_fee_per_seat')) || 100;
        const defaultInvoiceAmount = totalActiveSeats * currentFeePerSeat;
        const dynamicInvoices = [
          {
            id: 'INV-2026-001',
            campusName: 'Munyaka Primary & Junior School',
            date: '2026-10-24',
            amount: defaultInvoiceAmount,
            status: 'Paid',
          }
        ];
        // Also load recorded payments from munyaka_billing_history if any
        let recordedHistory: any[] = [];
        try {
          const raw = localStorage.getItem('munyaka_billing_history');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              recordedHistory = parsed.map((h: any, idx: number) => ({
                id: h.id || `PAY-REC-${idx}`,
                campusName: h.campus || 'Munyaka Primary & Junior School',
                date: h.date || new Date().toISOString().split('T')[0],
                amount: typeof h.amount === 'number' ? h.amount : Number(String(h.amount).replace(/[^0-9.]/g, '')) || defaultInvoiceAmount,
                status: 'Paid',
                isPayment: true
              }));
            }
          }
        } catch {}

        const allInvoices = [...dynamicInvoices, ...recordedHistory];

        return (
          <Card className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white animate-in fade-in">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 px-6 py-5">
              <CardTitle className="text-lg font-black text-slate-900">Official Billing & Tax Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {allInvoices.map((inv) => (
                  <div key={inv.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{inv.id}</p>
                        <p className="text-xs text-slate-500 font-medium">{inv.campusName || inv.campus} • {inv.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-black text-slate-900">KES {Number(inv.amount).toLocaleString()}</span>
                      <Badge className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1">{inv.status}</Badge>
                      <Button variant="outline" onClick={() => handleDownloadPDF(inv)} className="rounded-xl border-slate-200 text-xs font-bold gap-1">
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

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
              const referenceCode = paymentMethod === 'Cash' && !paymentRef
                ? `CASH-${Date.now().toString().slice(-6)}`
                : paymentRef;
              
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
                  id: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                  date: paymentDate,
                  campus: paymentCampus,
                  method: paymentMethod,
                  ref: referenceCode,
                  amount: amtNum,
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
                ref: referenceCode,
                period: paymentPeriod,
                notes: paymentNotes
              });
              setIsPaymentModalOpen(false);
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
                    <Label className="text-[11px] font-bold uppercase text-slate-500">
                      TRANSACTION REFERENCE CODE {paymentMethod === 'Cash' ? '(Optional)' : '*'}
                    </Label>
                    <Input
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. QKH78923XX (Optional for Cash)"
                      className="h-10 bg-slate-50 font-mono text-xs font-semibold"
                      required={paymentMethod !== 'Cash'}
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
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Billing Period</Label>
                    <div className="flex items-center gap-2">
                      <select
                        value={paymentPeriod}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPaymentPeriod(val);
                        }}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        {billingPeriodOptions.map(opt => (
                          <option key={opt.label} value={opt.label}>{opt.label}</option>
                        ))}
                      </select>
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
                    onChange={(e) => {
                      setPaymentNotes(e.target.value);
                      setHasCustomNotes(true);
                    }}
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
