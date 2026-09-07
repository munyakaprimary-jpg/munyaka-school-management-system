"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/ui/BackButton';
import { addStaffMaster, initializeStaffMaster } from '@/services/staffMasterService';

// ─── Local-first staff storage ───────────────────────────────────────────────
const STAFF_LOCAL_KEY = 'staff_local';

export interface StaffRecord {
  id: string;
  fullName: string;
  role: string;
  phone: string;
  email: string;
  tscNumber?: string;
  createdAt: string;
}

type StaffFormInput = Omit<StaffRecord, 'id' | 'createdAt'>;

export const getLocalStaff = (): StaffRecord[] => {
  try {
    const raw = localStorage.getItem(STAFF_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalStaff = (staff: StaffRecord[]) => {
  localStorage.setItem(STAFF_LOCAL_KEY, JSON.stringify(staff));
};

export const addLocalStaff = (record: StaffRecord) => {
  const list = getLocalStaff();
  list.push(record);
  saveLocalStaff(list);
};

// ─── Optional backend sync (only if a URL is configured) ─────────────────────
const BACKEND_URL_KEY = 'lan_server_url';

const getConfiguredBackendUrl = (): string | null => {
  try {
    const url = localStorage.getItem(BACKEND_URL_KEY);
    return url && String(url).trim() ? String(url).trim() : null;
  } catch {
    return null;
  }
};

const tryBackendSync = async (endpoint: string, payload: unknown): Promise<boolean> => {
  const baseUrl = getConfiguredBackendUrl();
  if (!baseUrl) return false; // no backend configured — pure local-first
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);
    return response.ok;
  } catch {
    // Swallow network errors silently — local record is already saved
    return false;
  }
};

// ─── ID generator ────────────────────────────────────────────────────────────
const generateId = () => `staff-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const StaffRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<StaffFormInput>({
    role: '',
    fullName: '',
    phone: '',
    email: '',
    tscNumber: '',
  });

  const handleChange = (field: keyof StaffFormInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const staffId = generateId();
    const record: StaffRecord = {
      id: staffId,
      fullName: formData.fullName,
      role: formData.role,
      phone: formData.phone,
      email: formData.email,
      tscNumber: formData.tscNumber || undefined,
      createdAt: new Date().toISOString(),
    };

    // ── 1. CRITICAL: write to staffMasterService FIRST — this is the single
    //    source of truth used by Staff Directory and Access Master Ledger.
    //    initializeStaffMaster() is idempotent so it's safe to call every time.
    try {
      initializeStaffMaster();
      addStaffMaster({
        name: formData.fullName.trim(),
        nationalId: `ID-${Date.now()}`,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        tscNumber: formData.tscNumber?.trim() || undefined,
        role: formData.role.toUpperCase().trim(),
        systemRole: 'subject_teacher',
        department: 'School Administration',
        status: 'Pre-Registered',
      });
    } catch (err) {
      console.error('[StaffRegistration] staffMasterService sync failed:', err);
      // Fall through: still write to local storage and navigate
    }

    // ── 2. Local backup: also write to staff_local for legacy consumers ─────
    addLocalStaff(record);

    // ── 3. Broadcast so all open listeners refresh immediately ─────────────────
    window.dispatchEvent(new Event('staff-changed'));

    // ── 4. Optional backend sync (silent — no error UI on failure) ───────────
    const synced = await tryBackendSync('/api/teachers', {
      id: staffId,
      full_name: record.fullName,
      role: record.role.toUpperCase(),
      phone: record.phone,
      email: record.email,
      tsc_number: record.tscNumber || null,
      id_number: `ID-${Date.now()}`,
      created_at: record.createdAt,
    });

    // ── 5. UI feedback ───────────────────────────────────────────────────────
    toast({
      title: synced ? "Staff registered" : "Staff saved locally",
      description: synced
        ? `${record.fullName} has been added successfully.`
        : `${record.fullName} saved — will sync when the server is reachable.`,
    });

    setIsSubmitting(false);
    navigate('/staff');
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3">
        <BackButton to="/staff" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Registration</h1>
          <p className="text-muted-foreground">Onboard new teachers and administrative personnel.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b">
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Role / Designation</Label>
              <Select
                required
                value={formData.role}
                onValueChange={(val) => handleChange('role', val)}
              >
                <SelectTrigger className="rounded-xl h-12 bg-slate-50/50 border-slate-100">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Class Teacher">Class Teacher</SelectItem>
                  <SelectItem value="Senior Teacher">Senior Teacher</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Support Staff">Support Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Jane Mwangi"
                required
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="rounded-xl h-12 bg-slate-50/50 border-slate-100"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b">
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="e.g. +254 700 000 000"
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="rounded-xl h-12 bg-slate-50/50 border-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. jane@munyaka.sc.ke"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="rounded-xl h-12 bg-slate-50/50 border-slate-100"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>TSC Number (Optional)</Label>
              <Input
                placeholder="e.g. TSC-123456"
                value={formData.tscNumber}
                onChange={(e) => handleChange('tscNumber', e.target.value)}
                className="rounded-xl h-12 bg-slate-50/50 border-slate-100"
              />
            </div>
          </CardContent>
          <div className="p-8 pt-0 flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="rounded-2xl px-10 h-14 bg-indigo-600 shadow-xl shadow-indigo-100"
            >
              {isSubmitting ? "Saving…" : "Register Staff Member"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default StaffRegistration;
