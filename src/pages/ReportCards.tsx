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
        matchesGrade = (studentObj && stdGradeNum === selectedGradeNum) || 
                      (selectedGrade === "all" && art.grade === selectedGrade);
      } else {
        matchesGrade = false;
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

  // Reset filters when grade changes
  useEffect(() => {
    setStream("all");
    setSelectedArea("all");
  }, [grade]);

  // Download Handler
  const handleDownloadCurrent = () => {
    if (!selectedCardId) return;
    
    // Find the selected card in the artifacts array
    const selectedCard = artifacts.find(a => a.id === selectedCardId);
    if (!selectedCard) return;
    
    // Open modal with selected card
    setSelectedCardId(selectedCardId);
    setIsReportCardModalOpen(true);
  };

  // Export CSV Handler (unchanged)
  const handleDownloadCSV = () => {
    if (filteredStudents.length === 0) {
      showSuccess("No learners found for the current filters.");
      return;
    }

    setIsExporting(true);
    
    setTimeout(() => {
      const row1 = "MUNYAKA PRIMARY AND JUNIOR SCHOOL";
      const row2 = "P.O. BOX 5239-30100,ELDORET";
      const row3 = "MOTTO: KNOWLEDGE POWER";
      
      const activeGrade = selectedGrade !== "all" ? `Grade ${selectedGrade}` : "All Grades";
      const activeStream = selectedStream !== "all" ? selectedStream : "All Streams";
      const activeTerm = term === "term1" ? "Term 1" : term === "term2" ? "Term 2" : "Term 3";
      
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
        ? `learners_${filterGrade}_${filterStream}_${term.toLowerCase()}.csv` 
        : `all_learners_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
      showSuccess(`Exported ${filteredStudents.length} learners to CSV`);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
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
            onClick={() => setSearchQuery('')}
          >
            <Search size={18} /> Clear Search
          </Button>
          <Button 
            className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleDownloadCSV}
          >
            <FileSpreadsheet size={16} /> Download CSV
          </Button>
          <Button 
            className="rounded-2xl gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
            onClick={handleDownloadCurrent}
          >
            <Plus size={18} /> Download Current
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
        onClearFilters={() => {
          setSearchTerm("");
          setSelectedGrade("all");
          setSelectedStream("all");
          setSelectedArea("all");
        }}
      />

      {/* Artifact Grid */}
      {filteredArtifacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtifacts.map((art) => (
            <PortfolioCard 
              key={art.id}
              art={art}
              onSelect={() => setSelectedCardId(art.id)}
              onDelete={handleDeleteArtifact}
            />
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadArtifactModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUpload={handleUploadArtifact}
      />

      {/* Media & Document Viewer Modal */}
      <ArtifactViewerModal 
        artifact={selectedArtifact} 
        onClose={() => setIsReportCardModalOpen(false)} 
      />
    </div>
  );
};

export default ReportCards;