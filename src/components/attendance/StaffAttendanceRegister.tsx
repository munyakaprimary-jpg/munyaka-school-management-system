"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X, Clock, Lock, Download, Search, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { StaffAttendanceRecord } from '@/hooks/useStaffAttendance';
import { AttendanceStatus } from '@/types/attendance';

interface StaffAttendanceRegisterProps {
  masterRegister: Record<string, StaffAttendanceRecord>;
  onAdminMark: (staffId: string, session: 'morning' | 'afternoon', status: AttendanceStatus) => void;
}

export const StaffAttendanceRegister: React.FC<StaffAttendanceRegisterProps> = ({
  masterRegister,
  onAdminMark
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentDateStr = format(new Date(), 'yyyy-MM-dd');
  const staffList = Object.values(masterRegister);

  const filteredStaff = staffList.filter(s => 
    s.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csvHeader = "Staff Name,Role,Morning Check-In,Afternoon Check-Out,Date\n";
      const csvRows = filteredStaff.map(s => 
        `"${s.staffName}","${s.role}","${s.morning?.time || 'Not Marked'}","${s.afternoon?.time || 'Not Marked'}","${s.date}"`
      ).join("\n");

      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `munyaka_master_staff_register_${currentDateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 600);
  };

  const renderStatusBadge = (sessionObj?: { status: AttendanceStatus; time: string }) => {
    if (!sessionObj) return <span className="text-xs text-slate-400 italic">Not Marked</span>;

    const { status, time } = sessionObj;
    let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
    let label = "Present";

    if (status === 'absent') {
      badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";
      label = "Absent";
    } else if (status === 'late') {
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
      label = "Late";
    }

    return (
      <div className="flex flex-col items-center">
        <Badge variant="outline" className={`font-bold rounded-lg text-xs px-2.5 py-0.5 ${badgeStyle}`}>
          {label}
        </Badge>
        <span className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
          <Clock size={10} /> {time}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff members..."
            className="pl-11 h-12 rounded-2xl bg-white border-none shadow-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            className={`rounded-xl font-bold h-11 px-5 gap-2 transition-all ${
              isEditing ? "bg-indigo-600 text-white" : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            {isEditing ? <Check size={16} /> : <Clock size={16} />}
            {isEditing ? "Finish Editing" : "Override Register"}
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl border-slate-200 bg-white text-slate-700 font-bold h-11 px-5 gap-2 hover:bg-slate-50 shadow-sm"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Export Register
          </Button>
        </div>
      </div>

      {/* Master Attendance Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}>
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="text-slate-500 bg-slate-50/80 border-b">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Staff Credentials</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">Morning Check-In</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">Afternoon Check-Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => (
                  <tr key={staff.staffId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900 text-base">{staff.staffName}</p>
                      <p className="text-xs text-slate-400 font-medium">{staff.role}</p>
                    </td>

                    {/* Morning Session Column */}
                    <td className="px-8 py-5 border-l border-slate-100 text-center">
                      <div className="flex items-center justify-center gap-4">
                        {renderStatusBadge(staff.morning)}
                        {isEditing && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAdminMark(staff.staffId, 'morning', 'present')}
                              className="rounded-lg h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAdminMark(staff.staffId, 'morning', 'absent')}
                              className="rounded-lg h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Afternoon Session Column */}
                    <td className="px-8 py-5 border-l border-slate-100 text-center">
                      <div className="flex items-center justify-center gap-4">
                        {renderStatusBadge(staff.afternoon)}
                        {isEditing && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAdminMark(staff.staffId, 'afternoon', 'present')}
                              className="rounded-lg h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAdminMark(staff.staffId, 'afternoon', 'absent')}
                              className="rounded-lg h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};