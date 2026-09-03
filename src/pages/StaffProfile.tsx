"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackButton from '@/components/ui/BackButton';
import {
  Mail,
  Phone,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { STAFF } from '@/lib/mock-data';
import { useAuth } from '@/context/AuthContext';
import { showSuccess, showError } from '@/utils/toast';

// Unified staff member shape — compatible with both the directory (full_name)
// and the mock data (name).
interface StaffMemberProfile {
  id: string;
  id_no: string;
  staff_id?: string;
  tsc_no?: string;
  tsc_number?: string;
  designation?: string;
  full_name: string;
  name?: string;
  role: string;
  subjects: string[];
  phone: string;
  email: string;
  status: 'Active' | 'Pre-Registered' | 'Suspended' | string;
  joined: string;
  created_at?: string;
  joined_date?: string;
  department: string;
}

// Return the display name regardless of which key the record uses.
const getDisplayName = (m: StaffMemberProfile) => m.full_name || m.name || 'Unknown';
const getDisplayId = (m: StaffMemberProfile) => m.id_no || m.id || 'N/A';
const getRole = (m: StaffMemberProfile) => m.role || m.designation || 'Teacher';
const getPhone = (m: StaffMemberProfile) => m.phone || 'N/A';
const getEmail = (m: StaffMemberProfile) => m.email || 'N/A';
const getJoined = (m: StaffMemberProfile) => m.joined || m.created_at || m.joined_date || 'Recently Added';
const getDepartment = (m: StaffMemberProfile) => m.department || 'General Staff';
const getStatus = (m: StaffMemberProfile) => m.status || 'Active';
const getSubjects = (m: StaffMemberProfile) => m.subjects || [];
const getTscNo = (m: StaffMemberProfile) => m.tsc_no || m.tsc_number || 'N/A';
const getQualifications = (m: any) =>
  m?.qualifications || m?.qualification || m?.credentials || 'Not Provided';
const getAssignedGrade = (m: any) =>
  m?.assignedGrade || m?.assigned_grade || m?.class?.grade || null;
const getAssignedStream = (m: any) =>
  m?.assignedStream || m?.assigned_stream || m?.class?.stream || null;
const getAssignedClass = (m: any) => {
  const g = getAssignedGrade(m);
  const s = getAssignedStream(m);
  if (g && s) return `${g} - ${s}`;
  if (g) return g;
  return null;
};
const getLearnerCount = (m: any) =>
  m?.learnerCount ?? m?.studentCount ?? m?.total_learners ?? null;
const getEmergencyContact = (m: any) =>
  m?.emergency_contact?.phone || m?.emergencyContact?.phone || m?.emergency_phone || null;
const getDocuments = (m: any): Array<{ label: string; status: string; date: string }> => {
  const docs = m?.documents || m?.compliance_docs || null;
  if (Array.isArray(docs) && docs.length > 0) return docs;
  // No documents on file — return a single placeholder so the card still
  // renders something rather than going blank.
  return [];
};

const StaffProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [member, setMember] = useState<StaffMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── View-mode detection ───────────────────────────────────────────
  // isSelfView  : the signed-in user is the staff member on this page.
  // isAdminView : an admin/owner is viewing somebody else's profile.
  const memberEmail = (member?.email || '').trim().toLowerCase();
  const userEmail = (user?.email || '').trim().toLowerCase();
  const memberStaffId = (member?.staff_id || '').trim().toLowerCase();
  const userStaffId = (user?.staff_id || '').trim().toLowerCase();
  const memberId = (member?.id || '').trim();

  const isSelfView = !!user && !!member && (
    (userEmail && memberEmail && userEmail === memberEmail) ||
    (userStaffId && memberStaffId && userStaffId === memberStaffId) ||
    (user.id && memberId && user.id === memberId)
  );

  const isAdminView = !!user && (
    user.role === 'admin' || user.role === 'owner'
  ) && !isSelfView;

  // ── Modal / dialog state ─────────────────────────────────────────
  const [adminResetOpen, setAdminResetOpen] = useState(false);
  const [selfChangeOpen, setSelfChangeOpen] = useState(false);
  const [generatedTemp, setGeneratedTemp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
  
    // ── Admin: generate & set temporary password ─────────────────────
    const handleAdminReset = () => {
      const temp = `MUNYAKA-${Math.floor(1000 + Math.random() * 9000)}`;
  
      // Update the users storage with the new temp password.
      const usersJson = localStorage.getItem('munyaka_users');
      if (usersJson) {
        const users = JSON.parse(usersJson);
        const emailKey = (member?.email || '').trim().toLowerCase();
        const staffIdKey = (member?.staff_id || '').trim().toLowerCase();
  
        const target = users[emailKey] || users[staffIdKey];
        if (target) {
          target.password = temp;
          if (!target.alternativePasswords) target.alternativePasswords = [];
          if (!target.alternativePasswords.includes(temp)) {
            target.alternativePasswords.push(temp);
          }
          localStorage.setItem('munyaka_users', JSON.stringify(users));
        }
      }
  
      setGeneratedTemp(temp);
      showSuccess('Temporary password generated and saved.');
    };
  
    const handleCopyTemp = () => {
      if (!generatedTemp) return;
      navigator.clipboard.writeText(generatedTemp).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
  
    // ── Self: change own password ────────────────────────────────────
    const handleSelfChangePassword = async () => {
      setPwError('');
  
      if (!oldPassword.trim()) {
        setPwError('Please enter your current password.');
        return;
      }
      if (!newPassword.trim()) {
        setPwError('Please enter a new password.');
        return;
      }
      if (newPassword.length < 4) {
        setPwError('New password must be at least 4 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPwError('New password and confirmation do not match.');
        return;
      }
  
      setPwSaving(true);
      // Update in users storage directly.
      const usersJson = localStorage.getItem('munyaka_users');
      if (usersJson) {
        const users = JSON.parse(usersJson);
        const emailKey = (member?.email || '').trim().toLowerCase();
        const staffIdKey = (member?.staff_id || '').trim().toLowerCase();
        const target = users[emailKey] || users[staffIdKey];
  
        if (target) {
          const isValid =
            target.password === oldPassword ||
            (target.alternativePasswords || []).includes(oldPassword);
  
          if (!isValid) {
            setPwError('Current password is incorrect.');
            setPwSaving(false);
            return;
          }
  
          target.password = newPassword;
          if (!target.alternativePasswords) target.alternativePasswords = [];
          if (!target.alternativePasswords.includes(newPassword)) {
            target.alternativePasswords.push(newPassword);
          }
          localStorage.setItem('munyaka_users', JSON.stringify(users));
          showSuccess('Password changed successfully.');
          setSelfChangeOpen(false);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPwError('');
        } else {
          showError('Account record not found. Please contact your administrator.');
        }
      }
      setPwSaving(false);
    };

  useEffect(() => {
      setLoading(true);
  
      // Strip any PR- prefix from the URL param — the unified directory uses
      // primary IDs, not the auto-generated reference key.
      const targetId = (id || '').replace(/^PR-/, '');
  
      // Generic matcher — accepts the record if ANY of the standard ID fields
            // (primary id, ref, staff_id, access_key, id_no, tsc_no, tsc_number,
            // nationalId, tempAccessCode, or autoKey) match the target.
            const matches = (s: any) =>
              s.id === id ||
              s.id === targetId ||
              s.ref === id ||
              s.staff_id === id ||
              s.staff_id === targetId ||
              s.access_key === id ||
              s.id_no === id ||
              s.id_no === targetId ||
              s.nationalId === id ||
              s.nationalId === targetId ||
              s.tsc_no === id ||
              s.tsc_number === id ||
              s.tempAccessCode === id ||
              s.autoKey === id;
      
            // Read & parse a localStorage entry safely. Returns [] on miss/error.
            const readKey = (key: string): any[] => {
              try {
                const raw = localStorage.getItem(key);
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                // Some sources store as { success, data }, some as bare arrays.
                const list = Array.isArray(parsed) ? parsed : (parsed?.data ?? []);
                return Array.isArray(list) ? list : [];
              } catch {
                return [];
              }
            };
      
            // ── Unified source list: every place a staff record could live. ──
            // 1. munyaka_staff_directory — unified directory (Staff.tsx writes here)
            // 2. teachers             — generic key
            // 3. staff                — generic key
            // 4. staff_list           — generic key
            // 5. staffDirectory       — generic camelCase key
            // 6. staffList            — generic camelCase key
            // 7. munyaka_staff_prereg — pre-registration ledger
            const sourceKeys = [
              'munyaka_staff_directory',
              'teachers',
              'staff',
              'staff_list',
              'staffDirectory',
              'staffList',
              'munyaka_staff_prereg',
            ];
      
            let found: any | undefined;
      
            for (const key of sourceKeys) {
              const list = readKey(key);
              if (!list.length) continue;
      
              // Match in this source.
              found = list.find(matches);
      
              // If a record was found in the pre-reg ledger (which uses a different
              // shape), normalize it into the unified StaffMemberProfile shape so
              // the rest of the component renders consistent data.
              if (found && key === 'munyaka_staff_prereg') {
                found = {
                  id: found.id,
                  id_no: found.nationalId || '',
                  tsc_no: found.tscNumber,
                  tsc_number: found.tscNumber,
                  designation: found.systemRole || found.role || '',
                  full_name: found.fullName || found.name || '',
                  name: found.fullName || found.name || '',
                  role: (found.systemRole || found.role || '').replace(/_/g, ' ').toUpperCase() || 'Teacher',
                  subjects: found.assignedSubjects || [found.department || 'General'],
                  phone: found.phone || '',
                  email: found.email || '',
                  status: found.status || 'Pre-Registered',
                  joined: found.datePreRegistered || found.created_at || '',
                  department: found.department || 'School Administration',
                };
              }
      
              if (found) break;
            }
      
            // If no local record matched, try the static mock seed.
            if (!found) {
              const mapped = STAFF.find(matches);
              if (mapped) {
                found = { ...mapped, full_name: mapped.name || '' };
              }
            }
      
            if (found) {
              setMember(found as StaffMemberProfile);
            }
      
            setLoading(false);
          }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BackButton to="/staff" />
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <AlertCircle size={48} />
          <p className="text-lg font-bold text-slate-600">Staff member not found</p>
          <p className="text-sm text-slate-400">No record matches ID <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600">{id}</code>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3">
        <BackButton to="/staff" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{getDisplayName(member)}</h1>
          <p className="text-muted-foreground">Personnel record and academic assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden text-center p-10">
                                <div className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-6 text-3xl font-black shadow-xl shadow-indigo-100">
                                  {getDisplayName(member).split(' ').map(n => n[0]).join('') || '?'}
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">{getDisplayName(member)}</h2>
                                <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">{getRole(member)}</p>
                                <p className="text-xs text-slate-400 font-medium mb-6">{getDepartment(member)}</p>
                                <div className="flex justify-center gap-2 mb-8 flex-wrap">
                                  <Badge className={getStatus(member) === 'Active' ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-500"}>
                                    {getStatus(member)}
                                  </Badge>
                                  <Badge variant="outline" className="border-slate-200">ID: {getDisplayId(member)}</Badge>
                                </div>
                      <div className="space-y-4 text-left border-t pt-8">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Calendar size={16} className="text-slate-400" />
                          <span>Joined: {getJoined(member)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Phone size={16} className="text-slate-400" />
                          <span>{getPhone(member)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Mail size={16} className="text-slate-400" />
                          <span>{getEmail(member)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Briefcase size={16} className="text-slate-400" />
                          <span>TSC: {getTscNo(member)}</span>
                        </div>
                      </div>
                    </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-indigo-900 text-white p-8 overflow-hidden relative">
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                                  <ShieldCheck size={140} />
                                </div>
                                <CardTitle className="text-lg mb-4">Account Security</CardTitle>
                                <p className="text-sm text-indigo-200 mb-6">
                                  {getRole(member)} account · manage credentials and access.
                                </p>
          
                                {/* ── Admin viewing another staff member → Reset Credentials ── */}
                                {isAdminView && (
                                  <Button
                                    onClick={() => {
                                      setGeneratedTemp(null);
                                      setCopied(false);
                                      setAdminResetOpen(true);
                                    }}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl gap-2 font-bold"
                                  >
                                    <KeyRound size={15} /> Reset Credentials
                                  </Button>
                                )}
          
                                {/* ── Staff viewing their own profile → Change Password ── */}
                                {isSelfView && (
                                  <Button
                                    onClick={() => {
                                      setOldPassword('');
                                      setNewPassword('');
                                      setConfirmPassword('');
                                      setPwError('');
                                      setShowPw(false);
                                      setSelfChangeOpen(true);
                                    }}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl gap-2 font-bold"
                                  >
                                    <KeyRound size={15} /> Change Password
                                  </Button>
                                )}
          
                                {/* ── No recognised session → default admin view ── */}
                                {!isAdminView && !isSelfView && (
                                  <Button
                                    onClick={() => {
                                      setGeneratedTemp(null);
                                      setCopied(false);
                                      setAdminResetOpen(true);
                                    }}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl gap-2 font-bold"
                                  >
                                    <KeyRound size={15} /> Reset Credentials
                                  </Button>
                                )}
                              </Card>
          
                              {/* ── Admin Reset Credentials Modal ─────────────────────────────── */}
                              {adminResetOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
                                  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                                    <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                          <KeyRound size={18} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                          Reset Credentials
                                        </h3>
                                      </div>
                                      <button
                                        onClick={() => setAdminResetOpen(false)}
                                        className="p-1 text-slate-400 hover:text-slate-600"
                                        type="button"
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                      <p className="text-sm text-slate-600">
                                        Generate a new temporary password for{' '}
                                        <span className="font-bold text-slate-900">
                                          {getDisplayName(member)}
                                        </span>
                                        ? The user will need to use this temporary password
                                        the next time they sign in.
                                      </p>
          
                                      {!generatedTemp ? (
                                        <div className="flex gap-3 pt-2">
                                          <Button
                                            variant="ghost"
                                            className="flex-1 rounded-xl h-11 font-bold"
                                            onClick={() => setAdminResetOpen(false)}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 gap-2"
                                            onClick={handleAdminReset}
                                          >
                                            <KeyRound size={15} /> Generate Password
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="space-y-3 pt-2">
                                          <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                              New Temporary Password
                                            </Label>
                                            <div className="flex items-center gap-2">
                                              <Input
                                                readOnly
                                                value={generatedTemp}
                                                className="rounded-xl h-11 bg-slate-50 border-none font-mono font-bold tracking-wider text-indigo-600"
                                              />
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleCopyTemp}
                                                className="h-11 w-11 rounded-xl shrink-0"
                                                title="Copy to clipboard"
                                              >
                                                {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                                              </Button>
                                            </div>
                                            <p className="text-xs text-amber-600 font-medium pt-1">
                                              ⚠ Share this password securely. It will not be shown again.
                                            </p>
                                          </div>
                                          <Button
                                            className="w-full rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold"
                                            onClick={() => setAdminResetOpen(false)}
                                          >
                                            Done
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
          
                              {/* ── Self Change Password Modal ────────────────────────────────── */}
                              {selfChangeOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
                                  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                                    <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                          <KeyRound size={18} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                          Change Password
                                        </h3>
                                      </div>
                                      <button
                                        onClick={() => setSelfChangeOpen(false)}
                                        className="p-1 text-slate-400 hover:text-slate-600"
                                        type="button"
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                      {pwError && (
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
                                          <AlertCircle size={14} /> {pwError}
                                        </div>
                                      )}
          
                                      <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                          Current Password
                                        </Label>
                                        <div className="relative">
                                          <Input
                                            type={showPw ? 'text' : 'password'}
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="Enter your current password"
                                            className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-12"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setShowPw(s => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                          >
                                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                          </button>
                                        </div>
                                      </div>
          
                                      <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                          New Password
                                        </Label>
                                        <Input
                                          type={showPw ? 'text' : 'password'}
                                          value={newPassword}
                                          onChange={(e) => setNewPassword(e.target.value)}
                                          placeholder="At least 4 characters"
                                          className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                                        />
                                      </div>
          
                                      <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                          Confirm New Password
                                        </Label>
                                        <Input
                                          type={showPw ? 'text' : 'password'}
                                          value={confirmPassword}
                                          onChange={(e) => setConfirmPassword(e.target.value)}
                                          placeholder="Re-enter new password"
                                          className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                                        />
                                      </div>
          
                                      <div className="flex gap-3 pt-2">
                                        <Button
                                          variant="ghost"
                                          className="flex-1 rounded-xl h-11 font-bold"
                                          onClick={() => setSelfChangeOpen(false)}
                                          disabled={pwSaving}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 gap-2"
                                          onClick={handleSelfChangePassword}
                                          disabled={pwSaving}
                                        >
                                          {pwSaving ? 'Saving…' : 'Save Password'}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="px-8 pt-8 border-b pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Teaching Assignments</CardTitle>
              <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">Edit Load</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                  <div className="flex items-center gap-3 mb-4 text-indigo-600">
                                    <Briefcase size={20} />
                                    <h4 className="font-bold">Primary Learning Areas</h4>
                                  </div>
                                  {getSubjects(member).length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {getSubjects(member).map((s, i) => (
                                        <Badge key={`${s}-${i}`} className="bg-white text-slate-700 border-none shadow-sm">{s}</Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-400 font-medium italic">No learning areas assigned yet.</p>
                                  )}
                                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                  <div className="flex items-center gap-3 mb-4 text-emerald-600">
                                    <GraduationCap size={20} />
                                    <h4 className="font-bold">Assigned Class</h4>
                                  </div>
                                  {getAssignedClass(member) ? (
                                    <>
                                      <p className="text-sm font-bold text-slate-900">{getAssignedClass(member)}</p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        Total Learners: {getLearnerCount(member) ?? 'N/A'}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-slate-400 font-medium italic">Not yet assigned to a class.</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                
                          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                            <CardHeader className="px-8 pt-8 border-b pb-4">
                              <CardTitle className="text-lg">Compliance & Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-4">
                              {getDocuments(member).length > 0 ? (
                                getDocuments(member).map((doc, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 group hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <FileText size={18} className="text-slate-400" />
                                      <div>
                                        <p className="text-sm font-bold text-slate-700">{doc.label}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{doc.date}</p>
                                      </div>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none">
                                      {doc.status}
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-slate-400 font-medium italic">No compliance documents on file.</p>
                              )}
                            </CardContent>
                          </Card>
                
                          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                            <CardHeader className="px-8 pt-8 border-b pb-4">
                              <CardTitle className="text-lg">Qualifications</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                              <p className="text-sm text-slate-700 whitespace-pre-line">{getQualifications(member)}</p>
                            </CardContent>
                          </Card>
                
                          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                            <CardHeader className="px-8 pt-8 border-b pb-4">
                              <CardTitle className="text-lg">Emergency Contact</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                              <p className="text-sm text-slate-700">{getEmergencyContact(member) ?? 'Not Provided'}</p>
                            </CardContent>
                          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;