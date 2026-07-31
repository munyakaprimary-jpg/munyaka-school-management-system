"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import BackButton from '@/components/ui/BackButton';
import { 
  School,
  Save,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
  Plus,
  Trash2,
  Info,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Lock,
  Navigation,
  Clock,
  History,
  AlertTriangle,
  Monitor,
  UserCog,
  Search,
  UploadCloud,
  CheckCircle2,
  Shield,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { setGeofenceConfig } from '@/lib/geofence';
import { cn } from '@/lib/utils';

// Types for Permissions
type Action = 'read' | 'create' | 'edit' | 'delete';
type PermissionState = Record<string, Record<Action, boolean>>;

const MODULES = [
  { id: 'sys_config', title: 'System Configuration & Security', desc: 'RBAC, Audit Logs, System Backups' },
  { id: 'academic_grading', title: 'Academic & CBC Grading Setup', desc: 'Assessments, Report Cards, Grade Bounds' },
  { id: 'student_records', title: 'Student & Guardian Records', desc: 'Enrollment, Bio Data, Attendance' },
  { id: 'finance_fees', title: 'Fee Management & Finance', desc: 'Billing, Invoices, Payment Collections' },
  { id: 'staff_mgmt', title: 'Staff Management & Geofence', desc: 'Staff Profiles, Compound GPS Tracking' }
];

const ROLES = [
  { id: 'super_admin', label: 'System Administrator' },
  { id: 'head_teacher', label: 'Principal / Head' },
  { id: 'bursar', label: 'Bursar / Accountant' },
  { id: 'teacher', label: 'Class Teacher' },
  { id: 'parent', label: 'Parent / Guardian' },
  { id: 'student', label: 'Learner' }
];

const Settings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { location: geoLoc, isLoading: geoLoading } = useGeolocation();
  
  // Accordion State
  const [expandedRole, setExpandedRole] = useState<string | null>('super_admin');

  // Permissions State: Record<roleId, Record<moduleId, Record<action, boolean>>>
  const [permissions, setPermissions] = useState<Record<string, PermissionState>>(() => {
    const initialState: Record<string, PermissionState> = {};
    ROLES.forEach(role => {
      initialState[role.id] = {};
      MODULES.forEach(mod => {
        initialState[role.id][mod.id] = {
          read: role.id === 'super_admin',
          create: role.id === 'super_admin',
          edit: role.id === 'super_admin',
          delete: role.id === 'super_admin'
        };
      });
    });
    return initialState;
  });

  const [generalConfig, setGeneralConfig] = useState({
    schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
    phone: "+254 712 345 678",
    email: "info@munyaka.sc.ke",
    maintenanceMode: false
  });

  const togglePermission = (roleId: string, modId: string, action: Action) => {
    setPermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [modId]: {
          ...prev[roleId][modId],
          [action]: !prev[roleId][modId][action]
        }
      }
    }));
  };

  const toggleAllForRole = (roleId: string, checked: boolean) => {
    setPermissions(prev => {
      const updatedRole = { ...prev[roleId] };
      MODULES.forEach(mod => {
        updatedRole[mod.id] = { read: checked, create: checked, edit: checked, delete: checked };
      });
      return { ...prev, [roleId]: updatedRole };
    });
  };

  const handleSaveRole = async (roleId: string) => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    showSuccess(`Permissions for ${ROLES.find(r => r.id === roleId)?.label} saved.`);
    setIsSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">System Configuration</h1>
            <p className="text-muted-foreground">Administer institutional policies and security parameters.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8">
          <TabsTrigger value="general" className="rounded-xl px-8 h-full font-bold text-xs">General</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-8 h-full font-bold text-xs">Academic Setup</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-xl px-8 h-full font-bold text-xs">Users & Roles</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-8 h-full font-bold text-xs">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <UserCog size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">RBAC Permission Matrix</h2>
              <p className="text-sm text-slate-500">Configure module-level access rights for each system role.</p>
            </div>
          </div>

          <div className="space-y-4">
            {ROLES.map((role) => {
              const isOpen = expandedRole === role.id;
              const rolePerms = permissions[role.id];
              
              // Check if all are checked for Select All toggle
              const allChecked = Object.values(rolePerms).every(m => m.read && m.create && m.edit && m.delete);

              return (
                <div key={role.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden transition-all duration-300">
                  {/* Accordion Header */}
                  <button
                    onClick={() => setExpandedRole(isOpen ? null : role.id)}
                    className={cn(
                      "w-full px-8 py-6 flex items-center justify-between transition-colors",
                      isOpen ? "bg-indigo-600 text-white" : "bg-white hover:bg-slate-50 text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isOpen ? "bg-white/20" : "bg-indigo-50 text-indigo-600"
                      )}>
                        <Shield size={20} />
                      </div>
                      <span className="text-lg font-bold tracking-tight">{role.label}</span>
                    </div>
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} className="text-slate-400" />}
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                      {/* Global Toggle */}
                      <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-indigo-600" size={20} />
                          <div>
                            <p className="font-bold text-slate-900">Full Administrative Access</p>
                            <p className="text-xs text-slate-500">Grant all CRUD permissions for this role across every module.</p>
                          </div>
                        </div>
                        <Switch 
                          checked={allChecked} 
                          onCheckedChange={(checked) => toggleAllForRole(role.id, checked)}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </div>

                      {/* CRUD Matrix */}
                      <div className="overflow-hidden border border-slate-100 rounded-3xl">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Module & Description</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Read</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Create</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Edit</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {MODULES.map((mod) => (
                              <tr key={mod.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-5">
                                  <p className="font-bold text-slate-900">{mod.title}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{mod.desc}</p>
                                </td>
                                {(['read', 'create', 'edit', 'delete'] as Action[]).map((action) => (
                                  <td key={action} className="px-4 py-5 text-center">
                                    <Checkbox
                                      checked={rolePerms[mod.id][action]}
                                      onCheckedChange={() => togglePermission(role.id, mod.id, action)}
                                      className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <Button 
                          variant="ghost" 
                          className="rounded-xl font-bold gap-2 text-slate-500 hover:text-slate-900"
                          onClick={() => {/* Reset Logic */}}
                        >
                          <RotateCcw size={16} /> Reset to Default
                        </Button>
                        <Button 
                          onClick={() => handleSaveRole(role.id)}
                          disabled={isSaving}
                          className="rounded-2xl px-10 h-12 font-black shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
                        >
                          {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                          Save Role Permissions
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Maintain other tabs content for context */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <CardTitle>Institutional Profile</CardTitle>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="space-y-2"><Label>School Name</Label><Input value={generalConfig.schoolName} className="rounded-xl h-12" /></div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;