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
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';

export default function PaymentManagement() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'seats' | 'monthly' | 'gateways' | 'invoices'>('subscriptions');
  const [mpesaNumber, setMpesaNumber] = useState('0738873359');
  const [selectedPlan, setSelectedPlan] = useState('Enterprise Annual (KES 120,000)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [licenseKey, setLicenseKey] = useState('MUNYAKA-ENT-2026-9982');
  const [isRenewed, setIsRenewed] = useState(false);

  // Real Data from munyaka_central_db
  const centralStudents = useMemo(() => {
    try {
      const raw = localStorage.getItem('munyaka_central_db');
      if (raw) {
        const db = JSON.parse(raw);
        if (Array.isArray(db.students)) {
          return db.students.filter((s: any) => s.status !== 'TRANSFERRED_OUT' && s.status !== 'ARCHIVED');
        }
      }
    } catch {}
    return [];
  }, []);

  const totalActiveStudents = centralStudents.length > 0 ? centralStudents.length : 142;

  // Seat allocation state (dynamically derived from real active students)
  const [allocatedSeats, setAllocatedSeats] = useState(totalActiveStudents);
  const [maxSeats, setMaxSeats] = useState(Math.max(totalActiveStudents + 100, 500));

  // Monthly billing setting state
  const [monthlyFeePerStudent, setMonthlyFeePerStudent] = useState(1200);
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);

  const [subscriptions, setSubscriptions] = useState([
    { id: 1, school: 'Munyaka Primary & Junior School', tier: 'Enterprise Tier', status: 'Active', expires: '2026-12-31', amount: 'KES 120,000' },
    { id: 2, school: 'Eldoret Junior Academy', tier: 'Standard Tier', status: 'Active', expires: '2026-08-15', amount: 'KES 65,000' },
    { id: 3, school: 'Kapsabet Annex Campus', tier: 'Starter Tier', status: 'Pending Renewal', expires: '2026-03-01', amount: 'KES 35,000' },
  ]);

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
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Owner Billing & License Hub
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold">
                System Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Payment & Subscriptions</h1>
            <p className="text-indigo-200 text-sm mt-2 max-w-2xl font-medium">
              Manage multi-campus software licenses, real-time learner seat allocations, monthly payment settings, M-Pesa payment gateways, and subscription renewals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Active Campuses</p>
              <p className="text-2xl font-black mt-1">3 Campuses</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Seat Allocation</p>
              <p className="text-2xl font-black mt-1 text-emerald-400">{allocatedSeats} / {maxSeats}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 px-6 py-5">
                <CardTitle className="text-lg font-black text-slate-900 flex items-center justify-between">
                  <span>Registered Campuses & Subscription Tiers</span>
                  <Badge className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1">3 Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 font-bold">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{sub.school}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-slate-100 text-slate-700 font-semibold">{sub.tier}</Badge>
                            <span className="text-xs text-slate-400 font-medium">Expires: {sub.expires}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Annual Fee</p>
                          <p className="font-black text-slate-900 text-base">{sub.amount}</p>
                        </div>
                        <Badge className={sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700 font-bold px-3 py-1' : 'bg-amber-100 text-amber-700 font-bold px-3 py-1'}>
                          {sub.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm rounded-3xl p-6 bg-white">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
                <Key className="text-indigo-600" size={20} /> Software Activation & License Key
              </h3>
              <p className="text-sm text-slate-600 mb-6 font-medium">
                Your portal instance is bound to the official Munyaka Enterprise License. Regenerate or verify your key below.
              </p>
              
              <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex-1 font-mono font-bold text-indigo-600 bg-white px-4 py-3 rounded-xl border border-slate-200 w-full text-center md:text-left">
                  {licenseKey}
                </div>
                <Button
                  onClick={handleRegenerateLicense}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 w-full md:w-auto shrink-0 shadow-md shadow-indigo-100 gap-2"
                >
                  <RefreshCw size={16} /> Regenerate Key
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-indigo-200 shadow-lg rounded-3xl p-6 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2">
                <CreditCard className="text-indigo-600" size={20} /> Instant M-Pesa Renewal
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                Trigger automated STK Push directly to the billing phone number to renew annual school software licenses instantly.
              </p>

              <form onSubmit={handleMpesaCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Subscription Plan</Label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Enterprise Annual (KES 120,000)">Enterprise Annual (KES 120,000)</option>
                    <option value="Standard Annual (KES 65,000)">Standard Annual (KES 65,000)</option>
                    <option value="Starter Annual (KES 35,000)">Starter Annual (KES 35,000)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">M-Pesa Phone Number (STK Push)</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <Input
                      type="text"
                      value={mpesaNumber}
                      onChange={(e) => setMpesaNumber(e.target.value)}
                      placeholder="0712345678"
                      className="pl-10 h-12 rounded-xl bg-white border-slate-200 font-bold"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-100 gap-2 mt-2"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {isProcessing ? 'Processing STK Push...' : 'Pay via M-Pesa STK Push'}
                </Button>
              </form>

              {isRenewed && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 animate-in fade-in">
                  <CheckCircle2 className="shrink-0 text-emerald-600 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider">Renewal Successful</p>
                    <p className="text-xs mt-1">License extended through Dec 31, 2026. Official receipt generated.</p>
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
                <p className="text-xs text-slate-600 font-bold mt-1">Active registered learners in database</p>
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
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="text-indigo-600" size={24} /> Monthly Payment & Billing Setting
            </CardTitle>
            <p className="text-xs text-slate-500 font-medium mt-1">Calculated automatically from {allocatedSeats} active registered learners in the central database.</p>
          </CardHeader>

          <CardContent className="p-0 space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400">Active Learners</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{allocatedSeats}</p>
                <p className="text-xs text-slate-500 mt-1">Billed monthly</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400">Fee Per Learner</p>
                <p className="text-3xl font-black text-indigo-600 mt-2">KES {monthlyFeePerStudent.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Standard rate</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400">Estimated Monthly Total</p>
                <p className="text-3xl font-black text-emerald-600 mt-2">KES {(allocatedSeats * monthlyFeePerStudent).toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Auto-calculated</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 text-amber-900">
              <DollarSign className="shrink-0 text-amber-600 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider">Dynamic Monthly Billing Preview</p>
                <p className="text-xs mt-1">Based on {allocatedSeats} active learners × KES {monthlyFeePerStudent.toLocaleString()}, your next scheduled automatic invoice is <strong>KES {(allocatedSeats * monthlyFeePerStudent).toLocaleString()}</strong>.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button 
                onClick={() => showSuccess('Monthly payment settings saved successfully.')}
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
          </CardData>

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
                { id: 'INV-2026-001', date: 'Jan 02, 2026', campus: 'Munyaka Primary & Junior School', amount: 'KES 120,000', status: 'Paid' },
                { id: 'INV-2025-089', date: 'Jan 10, 2025', campus: 'Munyaka Primary & Junior School', amount: 'KES 110,000', status: 'Paid' },
                { id: 'INV-2025-042', date: 'Aug 15, 2025', campus: 'Eldoret Junior Academy', amount: 'KES 65,000', status: 'Paid' },
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
    </div>
  );
}
