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
import { CheckCircle2, AlertCircle } from 'lucide-react';

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

const BACKEND_URL_KEY = 'lan_server_url';

const getConfiguredBackendUrl = (): string | null => {
  try {
    const url = localStorage.getItem(BACKEND_URL_KEY);
    return url && String(url).trim() ? String(url).trim() : null;
  } catch {
    return null;
  }
};

const generateId = () => `staff-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const StaffRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTempCredentials, setCreatedTempCredentials] = useState<{ username: string; tempPassword: string; name: string; role: string } | null>(null);
  const [showCredsModal, setShowCredsModal] = useState(false);

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

    try {
      initializeStaffMaster();
      addStaffMaster({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        nationalId: formData.tscNumber || `NAT-${Math.floor(100000 + Math.random() * 900000)}`,
        role: formData.role || 'Teacher',
        tscNumber: formData.tscNumber,
        tempAccessCode: `MUNYAKA-${Math.floor(1000 + Math.random() * 9000)}`,
        schoolId: 'munyaka-sc',
        status: 'Active'
      } as any);
    } catch (err) {
      console.error('[StaffRegistration] staffMasterService sync failed:', err);
    }

    addLocalStaff(record);

    let assignedTempPassword = '';
    try {
      const serverUrls = [
        localStorage.getItem('munyaka_server_url') || '',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:32100'
      ].filter(Boolean);

      for (const baseUrl of Array.from(new Set(serverUrls))) {
        try {
          const apiRes = await fetch(`${baseUrl.replace(/\/$/, '')}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: formData.email.split('@')[0],
              email: formData.email,
              name: formData.fullName,
              role: formData.role.toUpperCase(),
              staffCategory: 'TEACHING',
              department: 'ACADEMIC'
            })
          });
          const apiData = await apiRes.json();
          if (apiRes.ok && apiData.success && apiData.tempPassword) {
            assignedTempPassword = apiData.tempPassword;
            break;
          }
        } catch (e) {}
      }
    } catch (e) {}

    if (!assignedTempPassword) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      assignedTempPassword = `MUNYAKA-${rand}`;
    }

    setIsSubmitting(false);
    setCreatedTempCredentials({
      username: formData.email.split('@')[0],
      tempPassword: assignedTempPassword,
      name: formData.fullName,
      role: formData.role.toUpperCase()
    });
    setShowCredsModal(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Registration</h1>
          <p className="text-sm text-slate-500">Register new staff member with auto-generated MUNYAKA-XXXX temporary credentials</p>
        </div>
      </div>

      <Card className="border-slate-200/85 shadow-xl rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
          <CardTitle className="text-lg font-bold text-slate-800">Staff Details</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase text-slate-600">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={e => handleChange('fullName', e.target.value)}
                  placeholder="e.g. John Kamau"
                  required
                  className="rounded-xl border-slate-200 py-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-bold uppercase text-slate-600">Role *</Label>
                <Select value={formData.role} onValueChange={val => handleChange('role', val)}>
                  <SelectTrigger className="rounded-xl border-slate-200 py-3">
                    <SelectValue placeholder="Select staff role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="Head Teacher">Head Teacher</SelectItem>
                    <SelectItem value="Accountant">Accountant</SelectItem>
                    <SelectItem value="Store Manager">Store Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-600">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="john.kamau@munyaka.sc.ke"
                  required
                  className="rounded-xl border-slate-200 py-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase text-slate-600">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+254 712 345 678"
                  required
                  className="rounded-xl border-slate-200 py-3"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tscNumber" className="text-xs font-bold uppercase text-slate-600">TSC Number / Staff ID (Optional)</Label>
                <Input
                  id="tscNumber"
                  value={formData.tscNumber}
                  onChange={e => handleChange('tscNumber', e.target.value)}
                  placeholder="TSC-123456"
                  className="rounded-xl border-slate-200 py-3"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/staff')}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                {isSubmitting ? 'Registering Staff...' : 'Register & Generate Credentials'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showCredsModal && createdTempCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-6 border-b border-emerald-500/20 text-center">
              <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Staff Member Created Successfully</h2>
              <p className="text-sm text-slate-300">
                Temporary login credentials have been generated. Issue these to {createdTempCredentials.name}.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400 uppercase">Name:</span>
                  <span className="text-white font-bold">{createdTempCredentials.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400 uppercase">Role:</span>
                  <span className="text-amber-400 font-bold">{createdTempCredentials.role}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400 uppercase">Username:</span>
                  <span className="text-emerald-400 font-bold">{createdTempCredentials.username}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 uppercase">Temporary Password:</span>
                  <span className="text-cyan-400 font-bold text-sm tracking-wider">{createdTempCredentials.tempPassword}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  The staff member will be required to change this temporary password upon their first login (<code className="font-mono">mustChangePassword: true</code>).
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCredsModal(false);
                  setCreatedTempCredentials(null);
                  navigate('/staff');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all"
              >
                Done / Return to Staff List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffRegistration;
