import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Monitor, UserCheck, Clock, AlertTriangle, UserX, ChevronRight, MapPin, Search, Calendar, Download, Loader2 } from 'lucide-react';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import BackButton from '@/components/ui/BackButton';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useFileDownload } from '@/utils/fileDownloader';

const StaffAttendancePage = () => {
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const { masterRegister } = useStaffAttendance(location);
  const [searchTerm, setSearchTerm] = useState("");

  // ====== Unified file-download state for CSV export ======
  const attendanceExport = useFileDownload();

  const staffList = Object.values(masterRegister);

  // Compute stats based on today's register
  const presentCount = staffList.filter(s => s.morning?.status === 'present').length;
  const departedCount = staffList.filter(s => s.afternoon?.status === 'departed' || s.morning?.status === 'departed').length;
  const earlyDepartureCount = staffList.filter(s => s.morning?.status === 'early_departure').length;
  const notCheckedInCount = staffList.filter(s => !s.morning || s.morning.status === 'absent').length;

  const filteredStaff = staffList.filter(staff => 
    (staff.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    staff.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ====== UNIFIED DOWNLOAD HANDLER: CSV export ======
  const handleExport = async () => {
    if (filteredStaff.length === 0) {
      showError("No staff records available to export.");
      return;
    }

    const currentDateStr = format(new Date(), "PP");
    
    const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
    const row2 = "P.O. BOX 5239-30100, ELDORET";
    const row3 = "MOTTO: KNOWLEDGE POWER";
    const row4 = `STAFF ATTENDANCE REGISTER - DATE: ${currentDateStr}`;

    const headers = ["Staff Name", "Role", "Morning Check-In", "Morning Time", "Afternoon Check-Out", "Afternoon Time", "Status"];

    const rows = filteredStaff.map(staff => {
      const morningStatus = staff.morning?.status 
        ? (staff.morning.status === 'present' ? 'Present' : staff.morning.status === 'absent' ? 'Absent' : 'Early Departure') 
        : 'Not Marked';
      const morningTime = staff.morning?.time || '—';
      const afternoonStatus = staff.afternoon?.status 
        ? (staff.afternoon.status === 'departed' ? 'Departed' : staff.afternoon.status) 
        : 'Not Marked';
      const afternoonTime = staff.afternoon?.time || '—';
      const overallStatus = staff.morning?.status === 'present' && staff.afternoon?.status === 'departed' 
        ? 'Complete' 
        : staff.morning?.status === 'present' ? 'Checked In' : 'Absent';

      return [
        `"${staff.name?.replace(/"/g, '""') || 'Unknown'}"`,
        `"${staff.role?.replace(/"/g, '""') || 'Staff'}"`,
        `"${morningStatus}"`,
        `"${morningTime}"`,
        `"${afternoonStatus}"`,
        `"${afternoonTime}"`,
        `"${overallStatus}"`
      ];
    });

    const csvContent = [row1, row2, row3, row4, "", headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    await attendanceExport.download({
      filename: `staff_attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`,
      data: csvContent,
      mimeType: 'text/csv;charset=utf-8;',
      fileType: 'csv',
      pendingMessage: 'Downloading staff attendance register...',
      successMessage: 'Staff attendance downloaded successfully.',
      errorMessage: 'Download failed. Please check app permissions.',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar flex-wrap">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Attendance Register</h1>
            <p className="text-muted-foreground">Track staff attendance with geolocation and timestamps.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={attendanceExport.isDownloading}
            className="rounded-xl border-slate-200 bg-white text-slate-700 font-bold gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-60"
          >
            {attendanceExport.isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Location Status Card */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Current Location Status</h3>
              <p className="text-sm text-slate-500">Geofence verification required for attendance marking</p>
            </div>
          </div>
          <div className="text-right">
            {location ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-none">
                <UserCheck size={14} className="mr-1" /> Within School Geofence
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-700 border-none">
                <AlertTriangle size={14} className="mr-1" /> Location Not Available
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Present</p>
              <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{presentCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Departed</p>
              <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{departedCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Early Departure</p>
              <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{earlyDepartureCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <UserX size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Not Checked In</p>
              <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{notCheckedInCount}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search staff by name or role..." 
              className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Staff Attendance Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}>
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-slate-500 border-b bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 sticky left-0 bg-slate-50/50 z-10">Staff Details</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">Morning Check-In</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">Afternoon Check-Out</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStaff.map((staff) => (
                  <tr key={staff.staffId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                      <p className="font-bold text-slate-900 text-base">{staff.staffName}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{staff.role}</p>
                    </td>

                    {/* Morning Session Column */}
                    <td className="px-8 py-5 border-l border-slate-100 text-center">
                      <div className="flex items-center justify-center gap-4">
                        {staff.morning ? (
                          <>
                            <Badge className={cn("rounded-lg border-none font-bold text-[10px] uppercase", 
                              staff.morning.status === 'present' ? "bg-emerald-50 text-emerald-700" : 
                              staff.morning.status === 'absent' ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700")}>
                              {staff.morning.status === 'present' ? 'Present' : staff.morning.status === 'absent' ? 'Absent' : 'Early Departure'}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock size={10} /> {staff.morning.time}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not Marked</span>
                        )}
                      </div>
                    </td>

                    {/* Afternoon Session Column */}
                    <td className="px-8 py-5 border-l border-slate-100 text-center">
                      <div className="flex items-center justify-center gap-4">
                        {staff.afternoon ? (
                          <>
                            <Badge className={cn("rounded-lg border-none font-bold text-[10px] uppercase", 
                              staff.afternoon.status === 'departed' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                              {staff.afternoon.status === 'departed' ? 'Departed' : staff.afternoon.status}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock size={10} /> {staff.afternoon.time}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not Marked</span>
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

export default StaffAttendancePage;