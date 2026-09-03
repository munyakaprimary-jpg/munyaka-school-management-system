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
import { apiPost } from '@/services/SyncEngine';

// ─── Local-first staff storage ───────────────────────────────────────────────
const STAFF_LOCAL_KEY = 'offline_queue_staff';

export interface StaffRecord {
  id: string;
  role: string;
  fullName: string;
  phone: string;
  email: string;
  tscNumber: string;
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
    const payload = {
      id: staffId,
      role: formData.role,
      name: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      tsc_number: formData.tscNumber || null,
      created_at: new Date().toISOString(),
      status: 'pending_sync',
    };

    // ── 1. Local-first: persist to local storage immediately ──────────────────
    addLocalStaff({
      id: staffId,
      role: formData.role,
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      tscNumber: formData.tscNumber,
      createdAt: new Date().toISOString(),
    });

    // ── 2. Background sync: attempt to push to server; queue if offline ───────
    const { offline } = await apiPost('/api/teachers', payload, { type: 'teacher' });

    // ── 3. Graceful UI feedback ───────────────────────────────────────────────
    if (offline) {
      toast({
        title: "Staff saved locally",
        description: `${formData.fullName} saved — will sync when connection is restored.`,
      });
    } else {
      toast({
        title: "Staff registered",
        description: `${formData.fullName} has been added successfully.`,
      });
    }

    setIsSubmitting(false);
    navigate('/staff');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
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
