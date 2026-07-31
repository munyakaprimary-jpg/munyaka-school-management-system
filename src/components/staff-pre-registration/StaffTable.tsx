"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Copy, Send, Lock, Trash2 } from 'lucide-react';
import { PreRegisteredStaff, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import { cn } from "@/lib/utils";

interface StaffTableProps {
  staffList: PreRegisteredStaff[];
  onSendKey: (staff: PreRegisteredStaff) => void;
  onDeleteRequest: (staff: PreRegisteredStaff) => void;
}

const StaffTable: React.FC<StaffTableProps> = ({
  staffList,
  onSendKey,
  onDeleteRequest
}) => {
  return (
    <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Access Master Ledger</CardTitle>
          <p className="text-sm text-slate-500 font-medium">Pre-approved staff credentials and activation keys.</p>
        </div>
        <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold px-4 py-1.5 rounded-xl">
          {staffList.length} Active Records
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50/50 border-b">
              <tr>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Staff Credentials</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">System Role</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Registered Email</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Temp Access Key</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staffList.map((staff) => {
                const roleInfo = SYSTEM_ROLE_LABELS[staff.systemRole] || SYSTEM_ROLE_LABELS.subject_teacher;
                return (
                  <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{staff.fullName}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">ID: {staff.nationalId}</p>
                    </td>
                    <td className="px-8 py-5">
                      <Badge className={cn("rounded-xl font-bold border text-xs px-3 py-1", roleInfo.badgeBg, roleInfo.color)}>{roleInfo.label}</Badge>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">{staff.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer" onClick={() => navigator.clipboard.writeText(staff.tempAccessCode)}>
                        <code className="font-bold text-slate-800 text-xs">{staff.tempAccessCode}</code>
                        <Copy size={13} className="text-slate-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(staff.tempAccessCode); }} />
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <Badge className={cn("rounded-xl border-none font-bold text-xs px-3 py-1", staff.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{staff.status}</Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 px-3 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                          onClick={() => onSendKey(staff)}
                        >
                          <Send size={14} /> Send Key
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          onClick={() => onDeleteRequest(staff)}
                        >
                          <Lock size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          onClick={() => {}}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={32} className="text-slate-200" />
                      <p className="text-slate-500 font-bold">No records match the current criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffTable;