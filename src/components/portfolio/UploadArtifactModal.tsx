"use client";

import React, { useState, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Upload, Paperclip, CheckCircle2 } from 'lucide-react';
import { GRADES_DATA } from '@/lib/mock-data';
import type { Student as LearnerRecord } from '@/services/persistentStore';
import { getStudents } from '@/services/persistentStore';
import { Artifact } from '@/types/portfolio';
import { showError } from '@/utils/toast';

interface UploadArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (artifact: Artifact) => void;
}

export const UploadArtifactModal: React.FC<UploadArtifactModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStream, setFilterStream] = useState("all");
  
  const [selectedStudent, setSelectedStudent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<'Image' | 'Audio' | 'Document' | 'Video'>("Image");
  const [learningArea, setLearningArea] = useState("Creative Arts");
  const [grade, setGrade] = useState<'EE' | 'ME' | 'AE' | 'BE'>("EE");
  const [description, setDescription] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [learners, setLearners] = useState<LearnerRecord[]>(() => getStudents());

  const uniqueStreams = useMemo(() => {
    const streams = new Set<string>();
    GRADES_DATA.forEach(g => g.streams.forEach(s => streams.add(typeof s === 'string' ? s : s.name)));
    learners.forEach(s => { if (s.stream) streams.add(String(s.stream)); });
    return Array.from(streams).sort();
  }, [learners]);

  const filteredStudents = useMemo(() => {
    return learners.filter(s => {
      const matchesGrade = filterGrade === "all" || s.grade === filterGrade || s.grade === filterGrade.replace(/[^0-9]/g, '');
      const matchesStream = filterStream === "all" || String(s.stream ?? "").toLowerCase() === filterStream.toLowerCase();
      return matchesGrade && matchesStream;
    });
  }, [filterGrade, filterStream, learners]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFilePreviewUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    if (file.type.startsWith('image/')) setType('Image');
    else if (file.type.startsWith('audio/')) setType('Audio');
    else if (file.type.startsWith('video/')) setType('Video');
    else setType('Document');

    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(nameWithoutExt);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(title || '').trim()) {
          showError("Please enter an artifact title.");
          return;
        }
    
        const newArtifact: Artifact = {
          id: `art-${Date.now()}`,
          student: selectedStudent,
          title: String(title || '').trim(),
          type,
          learningArea,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          grade,
          description: String(description || '').trim() || "Uploaded from computer storage.",
      fileName: selectedFile ? selectedFile.name : undefined,
      fileUrl: filePreviewUrl || undefined,
      fileSize: selectedFile ? formatFileSize(selectedFile.size) : undefined
    };

    onUpload(newArtifact);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("Image");
    setGrade("EE");
    setFilterGrade("all");
    setFilterStream("all");
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Upload Learner Artifact"
      description="Select a file from your computer storage (Downloads, Documents, Photos, Videos)."
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={() => { resetForm(); onClose(); }} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2">
            <Upload size={16} /> Save Artifact
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Picker Input Area */}
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Browse Computer Storage / Downloads</Label>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" 
            className="hidden" 
            id="computer-file-input"
          />
          <label 
            htmlFor="computer-file-input" 
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group"
          >
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Paperclip className="text-indigo-600" size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {selectedFile ? selectedFile.name : "Click to select a file from your Downloads or Device"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {selectedFile ? `${formatFileSize(selectedFile.size)} • ${selectedFile.type || 'File'}` : "Supports Photos, Audio, Video clips, PDF & Documents"}
            </p>
          </label>

          {filePreviewUrl && type === 'Image' && (
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 mt-2">
              <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
              <Badge className="absolute bottom-2 right-2 bg-emerald-600 text-white font-bold gap-1 text-[10px]">
                <CheckCircle2 size={12} /> Image Ready
              </Badge>
            </div>
          )}
        </div>

        {/* Learner Filtering Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter Grade</Label>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-800 text-xs">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {GRADES_DATA.map(g => (
                  <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '') || g.name}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter Stream</Label>
            <Select value={filterStream} onValueChange={setFilterStream}>
              <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-slate-800 text-xs">
                <SelectValue placeholder="All Streams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {uniqueStreams.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Learner</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
              <SelectValue placeholder="Choose student..." />
            </SelectTrigger>
            <SelectContent>
              {filteredStudents.length > 0 ? (
                filteredStudents.map(s => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name} (Grade {s.grade} - {s.stream})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No students match class filter</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Artifact Title</Label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. Clay Modeling: Farm Animals" 
            className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Artifact Type</Label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Image">Image / Photo</SelectItem>
                <SelectItem value="Audio">Audio Recording</SelectItem>
                <SelectItem value="Document">PDF / Report Document</SelectItem>
                <SelectItem value="Video">Video Recording</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Learning Area</Label>
            <Select value={learningArea} onValueChange={setLearningArea}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Creative Arts">Creative Arts</SelectItem>
                <SelectItem value="English">English Language</SelectItem>
                <SelectItem value="Kiswahili">Kiswahili</SelectItem>
                <SelectItem value="Science">Science & Tech</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Performance Rating</Label>
          <Select value={grade} onValueChange={(val: any) => setGrade(val)}>
            <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EE">EE - Exceeding Expectation</SelectItem>
              <SelectItem value="ME">ME - Meeting Expectation</SelectItem>
              <SelectItem value="AE">AE - Approaching Expectation</SelectItem>
              <SelectItem value="BE">BE - Below Expectation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Observations / Remarks</Label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Describe the learner's evidence or teacher remarks..." 
            className="rounded-xl bg-slate-50 border-none min-h-[80px]"
          />
        </div>
      </form>
    </Modal>
  );
};