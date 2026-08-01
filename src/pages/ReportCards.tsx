"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/ui/BackButton";
import { Search, X } from "lucide-react";
import { Plus, Upload } from "lucide-react";
import { Artifact } from "@/types/portfolio";
import { INITIAL_ARTIFACTS } from "@/lib/portfolio-data";
import { PortfolioFilters } from "@/components/portfolio/PortfolioFilters";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { UploadArtifactModal } from "@/components/portfolio/UploadArtifactModal";
import { ArtifactViewerModal } from "@/components/portfolio/ArtifactViewerModal";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { GRADES_DATA, Grade } from '@/lib/mock-data';
import { STUDENTS } from '@/lib/mock-data';
import { FileSpreadsheet, Download, Loader2, Plus as PlusIcon } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const ReportCards = () => {
  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStream, setSelectedStream] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");
  
  // Data States
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // Dynamic Stored Grades State (matches Grades & Streams key 'munyaka_grades')
  const [storedGrades, setStoredGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });

  // Re-read localStorage whenever the page gains focus or storage changes
  useEffect(() => {
    const handleStorageUpdate = () => {
      const saved = localStorage.getItem('munyaka_grades');
      if (saved) {
        try {
          setStoredGrades(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse grades from storage", e);
        }
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
    };
  }, []);

  // Compute available streams dynamically from storedGrades according to selected grade
  const availableStreams = useMemo(() => {
    if (!storedGrades || storedGrades.length === 0) return [];

    if (selectedGrade === 'all') {
      const streamNames = new Set<string>();
      storedGrades.forEach(g => {
        g.streams?.forEach(s => streamNames.add(s.name));
      });
      return Array.from(streamNames).sort().map(name => ({ name }));
    }

    const gradeObj = storedGrades.find(g => 
      g.name === `Grade ${selectedGrade}` || 
      g.name === selectedGrade || 
      g.name.replace(/[^0-9]/g, '') === selectedGrade
    );

    return gradeObj && Array.isArray(gradeObj.streams) 
      ? gradeObj.streams.map(s => ({ name: s.name }))
      : [];
  }, [storedGrades, selectedGrade]);

  // Reset stream selection to "all" when grade changes
  useEffect(() => {
    setSelectedStream("all");
  }, [selectedGrade]);

  // Extract unique streams for the filter dropdown
  const uniqueStreams = useMemo(() => {
    const streams = new Set<string>();
    GRADES_DATA.forEach(g => g.streams?.forEach(s => streams.add(s.name)));
    return Array.from(streams).sort();
  }, []);

  // Filtered Artifacts with Grade, Stream, Learner Search Box, and Area logic
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(art => {
      // Search term matching: Learner Name, Assessment ID, or Artifact Title
      const matchesSearch = 
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        art.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (art.student && art.student.toLowerCase().includes(searchTerm.toLowerCase()));

      // Grade matching
      let matchesGrade = true;
      if (selectedGrade !== "all") {
        const studentObj = STUDENTS.find(s => s.name.toLowerCase() === art.student.toLowerCase());
        const stdGradeNum = studentObj?.grade?.replace(/[^0-9]/g, '');
        const selGradeNum = selectedGrade.replace(/[^0-9]/g, '');
        matchesGrade = (studentObj && stdGradeNum === selGradeNum) || 
                      (selectedGrade === "all" && art.grade === selectedGrade);
      }

      // Stream matching
      let matchesStream = true;
      if (selectedStream !== "all") {
        const streamObj = availableStreams.find(s => s.name.toLowerCase() === selectedStream.toLowerCase());
        matchesStream = streamObj ? studentObj?.stream.toLowerCase() === streamObj.name.toLowerCase() : false;
      }

      // Learning Area matching
      const matchesArea = selectedArea === "all" || art.learningArea.toLowerCase() === selectedArea.toLowerCase();

      return matchesSearch && matchesGrade && matchesStream && matchesArea;
    });
  }, [artifacts, searchTerm, selectedGrade, selectedStream, selectedArea, availableStreams]);

  const handleUploadArtifact = (newArtifact: Artifact) => {
    setArtifacts([newArtifact, ...artifacts]);
    showSuccess(`Uploaded artifact "${newArtifact.title}" for ${newArtifact.student}!`);
  };

  const handleDeleteArtifact = (id: string, artifactTitle: string) => {
    setArtifacts(prev => prev.filter(a => a.id !== id));
    if (selectedArtifact?.id === id) setSelectedArtifact(null);
    showSuccess(`Removed "${artifactTitle}"`);
  };

  const handleDownloadCurrent = () => {
    if (!selectedCardId) return;
    
    // Find the selected card in the artifacts array
    const selectedCard = artifacts.find(a => a.id === selectedCardId);
    if (!selectedCard) return;
    
    // Open modal with selected card
    setSelectedArtifact(selectedCard);
    setIsReportCardModalOpen(true);
  };

  // Export CSV Handler
  const handleDownloadCSV = () => {
    if (filteredArtifacts.length === 0) {
      showSuccess("No artifacts found for the current filters.");
      return;
    }

    setIsExporting(true);
    
    setTimeout(() => {
      const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
      const row2 = "P.O. BOX 5239-30100,ELDORET";
      const row3 = "MOTTO: KNOWLEDGE POWER";
      
      const activeGrade = selectedGrade !== "all" ? `Grade ${selectedGrade}` : "All Grades";
      const activeStream = selectedStream !== "all" ? selectedStream : "All Streams";
      const activeTerm = "Term 1";
      
      const row4 = `GRADE ${activeGrade}, STREAM ${activeStream}, YEAR ${new Date().getFullYear()}, TERM ${activeTerm}`;
      const headers = ["Student", "Title", "Type", "Learning Area", "Grade", "Date", "Description"];
      const rows = filteredArtifacts.map(s => [
        `"${s.student.replace(/"/g, '""')}"`,
        `"${s.title.replace(/"/g, '""')}"`,
        `"${s.type.replace(/"/g, '""')}"`,
        `"${s.learningArea.replace(/"/g, '""')}"`,
        `"${s.grade.replace(/"/g, '""')}"`,
        `"${s.date.replace(/"/g, '""')}"`,
        `"${(s.description || '').replace(/"/g, '""')}"`
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
      const fileName = selectedGrade !== "all" || selectedStream !== "all" 
        ? `artifacts_${selectedGrade}_${selectedStream}_${activeTerm.toLowerCase()}.csv` 
        : `all_artifacts_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
      showSuccess(`Exported ${filteredArtifacts.length} artifacts to CSV`);
    }, 800);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGrade("all");
    setSelectedStream("all");
    setSelectedArea("all");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learner Portfolio</h1>
            <p className="text-muted-foreground">Upload and manage student artifacts directly from your computer storage.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-2xl gap-2 h-11 px-6 bg-slate-200 hover:bg-slate-300 text-slate-600 font-medium"
            onClick={clearFilters}
          >
            <Search size={18} /> Clear Filters
          </Button>
          <Button 
            className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleDownloadCSV}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
            Download CSV
          </Button>
          <Button 
            className="rounded-2xl gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
            onClick={handleDownloadCurrent}
          >
            <PlusIcon size={18} /> Download Current
          </Button>
        </div>
      </div>

      {/* Grade, Stream, Learner Search Box & Area Filters */}
      <PortfolioFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        selectedStream={selectedStream}
        setSelectedStream={setSelectedStream}
        selectedArea={selectedArea}
        setSelectedArea={setSelectedArea}
        uniqueStreams={uniqueStreams}
        onClearFilters={clearFilters}
      />

      {/* Artifact Grid */}
      {filteredArtifacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtifacts.map((art) => (
            <PortfolioCard 
              key={art.id}
              art={art}
              onSelect={setSelectedArtifact}
              onDelete={handleDeleteArtifact}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
            <Upload size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No artifacts found</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">No learner artifacts match your Grade, Stream, or Search filter.</p>
          <Button 
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
            onClick={() => setIsUploadOpen(true)}
          >
            Upload First Artifact
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <UploadArtifactModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadArtifact}
      />

      {/* Media & Document Viewer Modal */}
      <ArtifactViewerModal 
        artifact={selectedArtifact}
        onClose={() => { setSelectedArtifact(null); setIsReportCardModalOpen(false); }}
      />
    </div>
  );
};

export default ReportCards;