import React, { useState, useEffect } from 'react';

export interface StaffDirectoryProps {
  staffList?: any[];
}

export function StaffDirectory({ staffList: externalStaffList = [] }: StaffDirectoryProps) {
  const [staffList, setStaffList] = useState<any[]>(() => {
    try {
      // Check primary key, backup key, and global storage fallback
      const primary = localStorage.getItem('munyaka_staff');
      if (primary) {
        const parsed = JSON.parse(primary);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }

      const backup = localStorage.getItem('munyaka_staff_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        if (Array.isArray(parsedBackup) && parsedBackup.length > 0) return parsedBackup;
      }

      const directory = localStorage.getItem('munyaka_staff_directory');
      if (directory) {
        const parsedDir = JSON.parse(directory);
        if (Array.isArray(parsedDir) && parsedDir.length > 0) return parsedDir;
      }
    } catch (e) {
      console.error('Error loading staff table data:', e);
    }
    return externalStaffList.length > 0 ? externalStaffList : [];
  });

  // Safe Event Listeners that ignore empty payloads
  useEffect(() => {
    const handleUpdate = (e: any) => {
      const data = e?.detail || JSON.parse(localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_backup') || localStorage.getItem('munyaka_staff_directory') || '[]');
      if (Array.isArray(data) && data.length > 0) {
        setStaffList(data);
      }
    };
    window.addEventListener('staff-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('staff-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
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
