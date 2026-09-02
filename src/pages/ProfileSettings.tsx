"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Save,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  User,
  Bell,
  CreditCard,
  Lock,
  Mail,
  Phone,
  Building2,
  Key,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';

// ─── Storage keys ───────────────────────────────────────────────────────────────

const BILLING_CONTACT_KEY = 'munyaka_billing_contact';

interface BillingContact {
  email: string;
  phone: string;
}

const NOTIFICATION_PREFS_KEY = 'munyaka_notification_prefs';

interface NotificationPrefs {
  emailAlerts: boolean;
  smsAlerts: boolean;
  billingReminders: boolean;
  weeklyReports: boolean;
  newTransactionAlerts: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const loadBillingContact = (): BillingContact => {
  try {
    const raw = localStorage.getItem(BILLING_CONTACT_KEY);
    if (raw) return JSON.parse(raw) as BillingContact;
  } catch { /* fall through */ }
  return { email: 'jamesndiki@gmail.com', phone: '+254740583662' };
};

const saveBillingContact = (contact: BillingContact) => {
  localStorage.setItem(BILLING_CONTACT_KEY, JSON.stringify(contact));
  notifyDataChanged('munyaka_billing_contact');
};

const loadNotificationPrefs = (): NotificationPrefs => {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (raw) return JSON.parse(raw) as NotificationPrefs;
  } catch { /* fall through */ }
  return {
    emailAlerts: true,
    smsAlerts: true,
    billingReminders: true,
    weeklyReports: false,
    newTransactionAlerts: true,
  };
};

const saveNotificationPrefs = (prefs: NotificationPrefs) => {
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  notifyDataChanged('munyaka_notification_prefs');
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProfileSettings: React.FC = () => {
  const { user, updateProfile, updatePassword } = useAuth();

  // ── Profile form ───────────────────────────────────────────────────────────
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [schoolName, setSchoolName] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('munyaka_school_profile') || '{}')?.name ||
        'Munyaka Primary and Junior School'
      );
    } catch {
      return 'Munyaka Primary and Junior School';
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  // ── Billing contact form ───────────────────────────────────────────────────
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  // ── Notification preferences ────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() =>
    loadNotificationPrefs(),
  );
  const [isSavingNotif, setIsSavingNotif] = useState(false);

  // ── Password modal ─────────────────────────────────────────────────────────
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPassUpdating, setIsPassUpdating] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Load billing contact from localStorage ──────────────────────────────────
  useEffect(() => {
    const contact = loadBillingContact();
    setBillingEmail(contact.email);
    setBillingPhone(contact.phone);
  }, []);

  // Sync auth user into form when it changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
    }
  }, [user]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    updateProfile({ name, email, phone });
    // Also persist school name
    try {
      const existing = JSON.parse(localStorage.getItem('munyaka_school_profile') || '{}');
      localStorage.setItem(
        'munyaka_school_profile',
        JSON.stringify({ ...existing, name: schoolName }),
      );
      notifyDataChanged('munyaka_school_profile');
    } catch { /* ignore */ }
    setIsSaving(false);
    showSuccess('Profile updated successfully.');
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingEmail || !billingPhone) {
      showError('Please fill in both billing email and phone number.');
      return;
    }
    setIsSavingBilling(true);
    await new Promise((r) => setTimeout(r, 400));
    saveBillingContact({ email: billingEmail, phone: billingPhone });
    setIsSavingBilling(false);
    showSuccess('Billing contact updated.');
  };

  const handleSaveNotifications = async (updated: NotificationPrefs) => {
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
    showSuccess('Notification preferences saved.');
  };

  const toggleNotif = (key: keyof NotificationPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      showError('Password must be at least 4 characters.');
      return;
    }
    setIsPassUpdating(true);
    const success = await updatePassword(oldPassword, newPassword);
    setIsPassUpdating(false);
    if (success) {
      setIsPassOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  };

  const notifItems: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    {
      key: 'emailAlerts',
      label: 'Email Alerts',
      desc: 'Receive billing and account notifications by email.',
    },
    {
      key: 'smsAlerts',
      label: 'SMS Alerts',
      desc: 'Receive critical alerts and reminders via SMS.',
    },
    {
      key: 'billingReminders',
      label: 'Billing Reminders',
      desc: 'Get notified 7 days before a billing cycle ends.',
    },
    {
      key: 'weeklyReports',
      label: 'Weekly Financial Reports',
      desc: 'Receive a weekly summary of revenue and outstanding fees.',
    },
    {
      key: 'newTransactionAlerts',
      label: 'New Transaction Alerts',
      desc: 'Get notified whenever a new fee payment is recorded.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Profile Settings
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage your account details, billing contacts, and notification preferences.
          </p>
        </div>
        <Button
          onClick={() => setIsPassOpen(true)}
          variant="outline"
          className="rounded-xl gap-2"
        >
          <Key size={15} />
          Change Password
        </Button>
      </div>

      {/* ── Personal Profile ─────────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 p-6 border-b">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <User size={18} className="text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Personal Information</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Your name, email, and phone number as shown on receipts and invoices.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="owner-name">Full Name</Label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="owner-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                    placeholder="School Owner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-email">Email Address</Label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="owner-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                    placeholder="owner@munyaka.sc.ke"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-phone">Phone Number</Label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="owner-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-name">School Name</Label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="school-name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="pl-9 rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                    placeholder="Munyaka Primary and Junior School"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold gap-2"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Billing Contact Details ─────────────────────────────────────────── */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 p-6 border-b">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Billing Contact Details</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              The email and phone shown on all billing invoices and receipts.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveBilling} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="billing-email">Billing Email</Label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="billing-email"
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="pl-9 rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                    placeholder="jamesndiki@gmail.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing-phone">Billing Phone</Label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="billing-phone"
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    className="pl-9 rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                    placeholder="+254740583662"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSavingBilling}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold gap-2"
              >
                {isSavingBilling ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                Save Billing Details
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Notification Preferences ─────────────────────────────────────────── */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 p-6 border-b">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Notification Preferences</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Control how and when you receive alerts and reports.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {notifItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                {notifPrefs[item.key] ? (
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-slate-300 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={notifPrefs[item.key]}
                onCheckedChange={() => toggleNotif(item.key)}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Account Status ─────────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6 bg-gradient-to-br from-slate-50 to-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Shield size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">
              Account Status: <span className="text-emerald-600">Active</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner role · {user?.email || '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Change Password Dialog ─────────────────────────────────────────── */}
      <Dialog open={isPassOpen} onOpenChange={setIsPassOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your owner account password. Use a strong password with at least 4 characters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="old-pass">Current Password</Label>
              <div className="relative">
                <Input
                  id="old-pass"
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-pass">New Password</Label>
              <div className="relative">
                <Input
                  id="new-pass"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-pass"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPassOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPassUpdating || !oldPassword || !newPassword || !confirmPassword}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                {isPassUpdating ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProfileSettings;
