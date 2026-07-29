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
import { showSuccess } from '@/utils/toast';

const Portfolio = () => {
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(art => {
      const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           art.student.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = selectedArea === "all" || art.learningArea.toLowerCase() === selectedArea.toLowerCase();
      return matchesSearch && matchesArea;
    });
  }, [artifacts, searchTerm, selectedArea]);

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
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

      {/* Filters */}
      <PortfolioFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedArea={selectedArea}
        setSelectedArea={setSelectedArea}
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
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">No learner artifacts match your filter or search query.</p>
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