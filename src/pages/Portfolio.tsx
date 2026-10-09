"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import BackButton from '@/components/ui/BackButton';
import { Plus, Upload } from 'lucide-react';
import { Artifact } from '@/types/portfolio';
import { INITIAL_ARTIFACTS } from '@/lib/portfolio-data';
import { PortfolioFilters } from '@/components/portfolio/PortfolioFilters';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { UploadArtifactModal } from '@/components/portfolio/UploadArtifactModal';
import { ArtifactViewerModal } from '@/components/portfolio/ArtifactViewerModal';
import { GRADES_DATA } from '@/lib/mock-data';
import { getStudents } from '@/services/persistentStore';
import { showSuccess } from '@/utils/toast';

const Portfolio = () => {
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStream, setSelectedStream] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // Learners are populated via the app's registration flow.
  const learners = useMemo(() => getStudents(), []);

  // Extract unique streams
  const uniqueStreams = useMemo(() => {
    const streams = new Set<string>();
    GRADES_DATA.forEach(g => g.streams.forEach(s => streams.add(typeof s === 'string' ? s : s.name)));
    learners.forEach(s => { if (s.stream) streams.add(String(s.stream)); });
    return Array.from(streams).sort();
  }, [learners]);

  // Filtered Artifacts with Grade, Stream, Learner Search Box, and Area logic
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(art => {
      // Find matching learner object to get grade and stream information
      const studentObj = learners.find(s => String(s.name ?? "").toLowerCase() === art.student.toLowerCase());

      // Search term matching: Learner Name, Assessment ID, or Artifact Title
      const matchesSearch =
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (studentObj && String(studentObj.assessment ?? "").toLowerCase().includes(searchTerm.toLowerCase()));

      // Grade matching
      let matchesGrade = true;
      if (selectedGrade !== "all") {
        if (studentObj) {
          const stdGradeNum = studentObj.grade.replace(/[^0-9]/g, '');
          const selGradeNum = selectedGrade.replace(/[^0-9]/g, '');
          matchesGrade = stdGradeNum === selGradeNum || studentObj.grade === selectedGrade;
        } else {
          matchesGrade = false;
        }
      }

      // Stream matching
      let matchesStream = true;
      if (selectedStream !== "all") {
        if (studentObj) {
          matchesStream = studentObj.stream.toLowerCase() === selectedStream.toLowerCase();
        } else {
          matchesStream = false;
        }
      }

      // Learning Area matching
      const matchesArea = selectedArea === "all" || art.learningArea.toLowerCase() === selectedArea.toLowerCase();

      return matchesSearch && matchesGrade && matchesStream && matchesArea;
    });
  }, [artifacts, searchTerm, selectedGrade, selectedStream, selectedArea]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedGrade("all");
    setSelectedStream("all");
    setSelectedArea("all");
  };

  const handleUploadArtifact = (newArtifact: Artifact) => {
    setArtifacts([newArtifact, ...artifacts]);
    showSuccess(`Uploaded artifact "${newArtifact.title}" for ${newArtifact.student}!`);
  };

  const handleDeleteArtifact = (id: string, artifactTitle: string) => {
    setArtifacts(prev => prev.filter(a => a.id !== id));
    if (selectedArtifact?.id === id) setSelectedArtifact(null);
    showSuccess(`Removed "${artifactTitle}"`);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learner Portfolio</h1>
            <p className="text-muted-foreground">Upload and manage student artifacts directly from your computer storage.</p>
          </div>
        </div>
        <Button 
          className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-bold"
          onClick={() => setIsUploadOpen(true)}
        >
          <Plus size={18} /> Upload Artifact
        </Button>
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
        onClearFilters={handleClearFilters}
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
        onClose={() => setSelectedArtifact(null)}
      />
    </div>
  );
};

export default Portfolio;