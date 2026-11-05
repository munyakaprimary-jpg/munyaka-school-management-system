import React, { useState, useEffect } from 'react';

export interface StaffDirectoryProps {
  staffList?: any[];
}

export function StaffDirectory({ staffList: externalStaffList = [] }: StaffDirectoryProps) {
  const [staffList, setStaffList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('munyaka_staff');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading staff:', e);
    }
    return externalStaffList.length > 0 ? externalStaffList : [];
  });

  useEffect(() => {
    const handleSync = (e: any) => {
      const data = e?.detail || JSON.parse(localStorage.getItem('munyaka_staff') || '[]');
      if (Array.isArray(data)) {
        setStaffList(data);
      }
    };

    window.addEventListener('staff-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('staff-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Staff Directory</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-3">Staff Member</th>
              <th className="p-3">Assigned Classes</th>
              <th className="p-3">Status</th>
              <th className="p-3">Access Code</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff, idx) => (
              <tr key={staff.id || idx} className="border-b">
                <td className="p-3">{staff.fullName || staff.name || '—'}</td>
                <td className="p-3 whitespace-nowrap text-sm">
                  {staff.assignedClasses && staff.assignedClasses.length > 0
                    ? Array.isArray(staff.assignedClasses)
                      ? staff.assignedClasses.join(', ')
                      : staff.assignedClasses
                    : '—'}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    • {staff.status || 'Active'}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap font-mono text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md border text-indigo-700 font-bold">
                    {staff.accessCode || staff.code || staff.teacherCode || staff.tempAccessCode || staff.id || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
