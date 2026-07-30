"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Send, Ban, Check, Trash2, Mail, KeyRound } from 'lucide-react';
import { PreRegisteredStaff, AccessStatus, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

interface PreRegTableProps {
  staff: PreRegisteredStaff[];
  onCopyAccessCode: (code: string, name: string) => void;
  onDispatchInvite: (staff: PreRegisteredStaff) => void;
  onToggleStatus: (id: string, currentStatus: AccessStatus) => void;
  onDeletePassword: (staff: PreRegisteredStaff) => void;
  onDeleteStaff: (id: string) => void;
}

export const PreRegTable: React.FC<PreRegTableProps> = ({
  staff,
  onCopyAccessCode,
  onDispatchInvite,
  onToggleStatus,
  onDeletePassword,
  onDeleteStaff
}) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <div className="min-w-[1100px]">
        <div className="p-0">
          <table className="w-full text-sm text-left min-w-[1100px]">
            <thead className="bg-slate-50/60 border-b sticky top-0 z-10">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Staff Credentials</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">System Role</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Registered Email</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Temp Access Key</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((staffMember) => {
                const roleInfo = SYSTEM_ROLE_LABELS[staffMember.systemRole] || SYSTEM_ROLE_LABELS.subject_teacher;
                return (
                  <tr key={staffMember.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">{staffMember.fullName}</p>
                      <p className="text-xs text-slate-400 font-medium">ID: {staffMember.nationalId}</p>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={cn("rounded-xl font-bold border text-xs px-3 py-1", roleInfo.badgeBg, roleInfo.color)}>
                        {roleInfo.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">{staffMember.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer" onClick={() => onCopyAccessCode(staffMember.tempAccessCode, staffMember.fullName)}>
                        <code className="font-black text-slate-800 text-xs">{staffMember.tempAccessCode}</code>
                        <Copy size={13} className="text-slate-400" />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Badge className={cn("rounded-xl border-none font-bold text-xs px-3 py-1", staffMember.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                        {staffMember.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5" onClick={() => onDispatchInvite(staffMember)}>
                          <Send size={14} /> Send Key
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 gap-1.5" onClick={() => onDeletePassword(staffMember)}>
                          <KeyRound size={14} /> Delete Password
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-amber-600" onClick={() => onToggleStatus(staffMember.id, staffMember.status)}>
                          {staffMember.status === 'Active' ? <Ban size={16} /> : <Check size={16} />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600" onClick={() => onDeleteStaff(staffMember.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};