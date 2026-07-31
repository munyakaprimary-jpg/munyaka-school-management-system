"use client";

import React, { useState, useEffect } from 'react';
import AttendanceHeader from './AttendanceHeader';
import AttendanceToolbar from './AttendanceToolbar';
import AttendanceTable from './AttendanceTable';
import { EditAttendanceModal } from './EditAttendanceModal';
import { useAuth } from '@/context/AuthContext';
import { showSuccess, showError } from '@/utils/toast';

const STORAGE_KEY = 'munyaka_attendance_records';

const Attendance = () => {
  const [markedStudents, setMarkedStudents] = useState<any>( {});
  const [selectedGrade, setSelectedGrade] = useState("grade4");
  const [isExporting, setIsExporting] = useState(false);
  
  // Edit attendance modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAuthPassword, setEditAuthPassword] = useState("");
  const [editAuthError, setEditAuthError] = useState("");
  const [isEditVerifying, setIsEditVerifying] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);
  const [editSession, setEditSession] = useState<'morning' | 'afternoon'>('morning');
  const [editStatus, setEditStatus] = useState<'P' | 'A' | 'L'>('P');
  const [editTime, setEditTime] = useState("");

  const { user } = useAuth();

  // Load saved attendance from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setMarkedStudents(parsed);
        }
      } catch (e) {
        console.error("Error loading saved attendance:", e);
      }
    }
  }, []);

  // Persist attendance to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(markedStudents).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(markedStudents));
    }
  }, [markedStudents]);

  const students = [
    { id: 1, name: "Brian Kiptoo", assessment: "A827361" },
    { id: 2, name: "Mary Atieno", assessment: "A827362" },
    { id: 3, name: "Emmanuel Maina", assessment: "A827363" },
    { id: 4, name: "Sheila Chepkoech", assessment: "A827364" },
    { id: 5, name: "David Mutua", assessment: "A827365" },
  ];

  const markAttendance = (id: number, session: 'morning' | 'afternoon', status: string) => {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    setMarkedStudents(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [session]: { status, time: timestamp }
      }
    }));
  };

  const handleExportCSV = () => {
    setIsExporting(true);

    setTimeout(() => {
      // Official document headers
      const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
      const row2 = "P.O. BOX 5239-30100, ELDORET";
      const row3 = "MOTTO: KNOWLEDGE POWER";
      
      const gradeLabel = selectedGrade === "grade4" ? "Grade 4 - Blue" : "Grade 5 - Green";
      const currentDateStr = new Date().toLocaleDateString();
      const row4 = `CLASS ATTENDANCE REGISTER - ${gradeLabel.toUpperCase()} - DATE: ${currentDateStr}`;

      const headers = ["Learner Name", "Assessment ID", "Morning Session", "Morning Time", "Afternoon Session", "Afternoon Time"];

      const rows = students.map(student => {
        const record = markedStudents[student.id] || {};
        
        const getStatusLabel = (status?: string) => {
          if (status === 'P') return "Present";
          if (status === 'A') return "Absent";
          if (status === 'L') return "Late";
          return "Not Marked";
        };

        return [
          `"${student.name.replace(/"/g, '""')}"`,
          `"${student.assessment.replace(/"/g, '""')}"`,
          `"${getStatusLabel(record.morning?.status)}"`,
          `"${record.morning?.time || '—'}"`,
          `"${getStatusLabel(record.afternoon?.status)}"`,
          `"${record.afternoon?.time || '—'}"`
        ];
      });

      const csvContent = [
        row1,
        row2,
        row3,
        row4,
        "",
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      // Auto‑download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_${gradeLabel.replace(/\s+/g, '_').replace(/-/g, '')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      showSuccess(`Attendance register exported successfully!`);
    }, 1000);
  };

  const handleSave = () => {
    showSuccess("Attendance register saved successfully!");
  };

  const handleEditSubmit = () => {
    if (editStudentId === null) return;
    // Update the attendance record with edited values
    setMarkedStudents(prev => ({
      ...prev,
      [editStudentId]: {
        ...prev[editStudentId],
        [editSession]: { status: editStatus, time: editTime }
      }
    }));
    // Close modal and reset form
    setIsEditModalOpen(false);
    setEditAuthPassword("");
    setEditAuthError("");
    setIsEditVerifying(false);
    setEditStudentId(null);
    setEditSession('morning');
    setEditStatus('P');
    setEditTime("");
    showSuccess("Attendance record updated successfully!");
  };

  const handleEditVerify = async () => {
    if (!editAuthPassword.trim()) {
      setEditAuthError("Password is required");
      return;
    }

    setIsEditVerifying(true);
    setEditAuthError("");
    
    // Simulate async verification
    await new Promise(r => setTimeout(r, 600));

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';

    if (editAuthPassword === currentAdminPass) {
      setIsEditVerifying(false);
      // Password correct, proceed to show edit form (we'll rely on conditional rendering)
    } else {
      setEditAuthError("Invalid admin password");
      showError("Authorization failed");
      setEditAuthPassword("");
    }
    setIsEditVerifying(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <AttendanceHeader 
        morningPresent={students.filter(s => markedStudents[s.id]?.morning?.status === 'P').length}
        afternoonPresent={students.filter(s => markedStudents[s.id]?.afternoon?.status === 'P').length}
        totalStudents={students.length}
      />

      <AttendanceToolbar isExporting={isExporting} handleExport={handleExportCSV} />

      <AttendanceTable
        students={students}
        markedStudents={markedStudents}
        selectedGrade={selectedGrade}
        getStatusBadge={getStatusBadge}
        markAttendance={markAttendance}
      />

      <div className="flex justify-end">
        <Button size="lg" className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
          Save Register
        </Button>
      </div>

      {/* Edit Attendance Modal */}
      <EditAttendanceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        studentId={editStudentId}
        verifyPassword={editAuthPassword}
        setVerifyPassword={setEditAuthPassword}
        error={editAuthError}
        setError={setEditAuthError}
        isVerifying={isEditVerifying}
        setIsVerifying={setIsEditVerifying}
        onVerify={handleEditVerify}
      />
    </div>
  );
};

export default Attendance;