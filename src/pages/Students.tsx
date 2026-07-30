"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STUDENTS as initialStudents } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';

// Modular Components
import { StudentHeader } from '@/components/students/StudentHeader';
import { StudentFilters } from '@/components/students/StudentFilters';
import { StudentTable } from '@/components/students/StudentTable';
import { RegisterStudentModal } from '@/components/students/RegisterStudentModal';
import { DeleteAuthModal } from '@/components/students/DeleteAuthModal';

const Students = () => {
  const [studentsList, setStudentsList] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStream, setFilterStream] = useState("all");
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  // Admin Auth Deletion State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  // Registration Form State
  const [regGrade, setRegGrade] = useState("4");
  const [regStream, setRegStream] = useState("Blue");

  // Dynamically load grades and streams from saved settings
  const [gradesList, setGradesList] = useState<any[]>([]);
  const [uniqueStreams, setUniqueStreams] = useState<string[]>([]);

  // Load grades and streams from saved settings on mount
  useEffect(() => {
    const savedGradesJson = localStorage.getItem('munyaka_grades');
    if (savedGradesJson) {
      try {
        const savedGrades = JSON.parse(savedGradesJson);
        setGradesList(savedGrades);
        
        // Extract all unique stream names across all grades
        const streamsSet = new Set<string>();
        savedGrades.forEach((grade: any) => {
          if (grade.streams) {
            grade.streams.forEach((stream: any) => {
              streamsSet.add(stream.name);
            });
          }
        });
        setUniqueStreams(Array.from(streamsSet).sort());
      } catch (e) {
        console.error("Error loading grades from storage:", e);
      }
    }
  }, []);

  // Get unique streams for the filter dropdown (recomputed when grades change)
  useEffect(() => {
    if (!gradesList) return;
    
    const streamsSet = new Set<string>();
    gradesList.forEach((grade: any) => {
      if (grade.streams) {
        grade.streams.forEach((stream: any) => {
          streamsSet.add(stream.name);
        });
      }
    });
    setUniqueStreams(Array.from(streamsSet).sort());
  }, [gradesList]);

  // Get filtered students based on current filters
  const filteredStudents = useMemo(() => {
    return studentsList.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.assessment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = filterGrade === "all" || s.grade === filterGrade;
      const matchesStream = filterStream === "all" || s.stream === filterStream;
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [studentsList, searchTerm, filterGrade, filterStream]);

  const handleRegisterStudent = (data: {
    fullName: string;
    assessmentNo: string;
    regGrade: string;
    regStream: string;
    guardianName: string;
    phone: string;
    address: string;
  }) => {
    if (!data.fullName.trim() || !data.assessmentNo.trim()) return;
    const newStudent = { 
      id: (studentsList.length + 1).toString(), 
      name: data.fullName.trim(), 
      assessment: data.assessmentNo.trim().toUpperCase(), 
      grade: data.regGrade, 
      stream: data.regStream, 
      gender: "M", 
      dob: "2014-01-01", 
      guardian: data.guardianName.trim(), 
      phone: data.phone.trim(), 
      email: "g@email.com", 
      health: "None", 
      needs: "None" 
    };
    setStudentsList([newStudent, ...studentsList]);
    setIsRegisterOpen(false);
    showSuccess(`Student ${newStudent.name} registered!`);
  };

  const requestDeleteStudent = (student: { id: string; name: string }) => {
    setStudentToDelete(student);
    setAuthError("");
    setIsAuthOpen(true);
  };

  const handleVerifyAuth = async () => {
    if (!authError && !studentToDelete) return;
    
    // Get password from the modal's internal state
    // We'll need to handle this differently - let the modal handle the password
    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';
    
    // The modal will call onConfirm with the password, so we handle it there
  };

  const handleAuthConfirm = async (password: string) => {
    if (!password) {
      setAuthError("Password is required");
      return;
    }

    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 600));

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';

    if (password === currentAdminPass) {
      if (studentToDelete) {
        setStudentsList(prev => prev.filter(s => s.id !== studentToDelete.id));
        showSuccess(`Student "${studentToDelete.name}" deleted successfully.`);
      }
      setIsAuthOpen(false);
      setStudentToDelete(null);
      setAuthError("");
    } else {
      setAuthError("Invalid admin password");
      showError("Authorization failed");
    }
    setIsVerifying(false);
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      showSuccess("No learners found for the current filters.");
      return;
    }

    setIsExporting(true);
    
    setTimeout(() => {
      const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
      const row2 = "P.O. BOX 5239-30100,ELDORET";
      const row3 = "MOTTO: KNOWLEDGE POWER";
      
      const activeGrade = filterGrade !== "all" ? `Grade ${filterGrade}` : "All Grades";
      const activeStream = filterStream !== "all" ? filterStream : "All Streams";
      const activeTerm = "Term 1";

      const row4 = `GRADE ${activeGrade}, STREAM ${activeStream}, YEAR ${new Date().getFullYear()}, TERM ${activeTerm}`;

      const headers = ["Name", "Assessment No", "Grade", "Stream", "Guardian", "Phone"];
      const rows = filteredStudents.map(s => [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.assessment.replace(/"/g, '""')}"`,
        `"Grade ${s.grade}"`,
        `"${s.stream.replace(/"/g, '""')}"`,
        `"${s.guardian.replace(/"/g, '""')}"`,
        `"${s.phone.replace(/"/g, '""')}"`
      ]);

      const csvContent = [
        row1,
        row2,
        row3,
        row4,
        "",
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      const fileName = filterGrade !== "all" || filterStream !== "all" 
        ? `learners_${filterGrade !== "all" ? 'grade_' + filterGrade : ''}${filterStream !== "all" ? '_stream_' + filterStream : ''}.csv`
        : `all_learners_${new Date().toISOString().split('T')[0]}.csv`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
      showSuccess(`Exported ${filteredStudents.length} learners to CSV`);
    }, 800);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterGrade("all");
    setFilterStream("all");
  };

  // Populate grade filter options from saved grades
  useEffect(() => {
    if (!gradesList) return;
    
    // Extract unique grade names (including "Grade X" format)
    const gradeOptions = gradesList.map((grade: any) => grade.name);
    // Set default selection to first grade if none selected
    if (!filterGrade || !gradeOptions.includes(filterGrade)) {
      setFilterGrade(gradeOptions[0] || "Grade 1");
    }
  }, [gradesList, filterGrade]);

  // Keep regGrade in sync with selected filterGrade for new registrations
  useEffect(() => {
    if (filterGrade !== "all" && regGrade === "4") {
      setRegGrade(filterGrade);
    }
  }, [filterGrade, regGrade]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <StudentHeader 
        onExport={handleExportCSV} 
        onAddClick={() => setIsRegisterOpen(true)} 
        isExporting={isExporting} 
      />

      <StudentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterGrade={filterGrade}
        setFilterGrade={setFilterGrade}
        filterStream={filterStream}
        setFilterStream={setFilterStream}
        gradesList={gradesList}
        uniqueStreams={uniqueStreams}
        onClearFilters={clearFilters}
      />

      <StudentTable
        students={filteredStudents}
        onViewProfile={(id) => navigate(`/students/${id}`)}
        onDelete={requestDeleteStudent}
      />

      <RegisterStudentModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegisterStudent}
        regGrade={regGrade}
        setRegGrade={setRegGrade}
        regStream={regStream}
        setRegStream={setRegStream}
      />

      <DeleteAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onConfirm={handleAuthConfirm}
        studentName={studentToDelete?.name || null}
        isVerifying={isVerifying}
        authError={authError}
      />
    </div>
  );
};

export default Students;