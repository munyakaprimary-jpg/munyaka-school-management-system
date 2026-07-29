"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { Search, Plus, Image as ImageIcon, FileText, Music, Video, Calendar, User, Upload, Eye, Trash2, Paperclip, CheckCircle2, File } from 'lucide-react';
import { STUDENTS } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';

interface Artifact {
  id: string;
  student: string;
  title: string;
  type: 'Image' | 'Audio' | 'Document' | 'Video';
  learningArea: string;
  date: string;
  grade: 'EE' | 'ME' | 'AE' | 'BE';
  description?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: string;
}

const INITIAL_ARTIFACTS: Artifact[] = [
  { id: "1", student: "Brian Kiptoo", title: "Clay Modeling: Animals", type: "Image", learningArea: "Creative Arts", date: "Oct 12, 2023", grade: "EE", description: "Created an intricate lion sculpture using local clay and natural dyes.", fileName: "clay_sculpture_lion.jpg", fileSize: "1.2 MB" },
  { id: "2", student: "Mary Atieno", title: "Oral Narrative Audio", type: "Audio", learningArea: "English", date: "Oct 15, 2023", grade: "ME", description: "Recited a 2-minute original story with clear diction and expressions.", fileName: "oral_narrative_recording.mp3", fileSize: "3.4 MB" },
  { id: "3", student: "Emmanuel Maina", title: "Recycling Project Report", type: "Document", learningArea: "Science", date: "Oct 18, 2023", grade: "EE", description: "Documented step-by-step process of making a toy car from plastic bottles.", fileName: "recycling_project.pdf", fileSize: "850 KB" },
  { id: "4", student: "Sheila Chepkoech", title: "Traditional Dance Performance", type: "Video", learningArea: "Creative Arts", date: "Nov 02, 2023", grade: "EE", description: "Demonstrated folk dance rhythm and costume coordination.", fileName: "folk_dance_clip.mp4", fileSize: "14.8 MB" },
];

const Portfolio = () => {
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  
  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(STUDENTS[0]?.name || "");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<'Image' | 'Audio' | 'Document' | 'Video'>("Image");
  const [learningArea, setLearningArea] = useState("Creative Arts");
  const [grade, setGrade] = useState<'EE' | 'ME' | 'AE' | 'BE'>("EE");
  const [description, setDescription] = useState("");

  // Computer Storage File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // View Details Modal State
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // Filtered Artifacts
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(art => {
      const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           art.student.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = selectedArea === "all" || art.learningArea.toLowerCase() === selectedArea.toLowerCase();
      return matchesSearch && matchesArea;
    });
  }, [artifacts, searchTerm, selectedArea]);

  // Handle local file selection from computer storage
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Auto-detect artifact type based on MIME type / extension
    if (file.type.startsWith('image/')) {
      setType('Image');
      setFilePreviewUrl(URL.createObjectURL(file));
    } else if (file.type.startsWith('audio/')) {
      setType('Audio');
      setFilePreviewUrl(null);
    } else if (file.type.startsWith('video/')) {
      setType('Video');
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setType('Document');
      setFilePreviewUrl(null);
    }

    // Auto-fill title if title is empty
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(nameWithoutExt);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showError("Please enter an artifact title.");
      return;
    }

    const newArtifact: Artifact = {
      id: `art-${Date.now()}`,
      student: selectedStudent,
      title: title.trim(),
      type,
      learningArea,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      grade,
      description: description.trim() || "Uploaded from computer storage.",
      fileName: selectedFile ? selectedFile.name : undefined,
      fileUrl: filePreviewUrl || undefined,
      fileSize: selectedFile ? formatFileSize(selectedFile.size) : undefined
    };

    setArtifacts([newArtifact, ...artifacts]);
    setIsUploadOpen(false);
    
    // Reset Form
    setTitle("");
    setDescription("");
    setType("Image");
    setGrade("EE");
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    showSuccess(`Uploaded artifact "${newArtifact.title}" for ${selectedStudent}!`);
  };

  const handleDelete = (id: string, artifactTitle: string) => {
    setArtifacts(prev => prev.filter(a => a.id !== id));
    if (selectedArtifact?.id === id) setSelectedArtifact(null);
    showSuccess(`Removed "${artifactTitle}"`);
  };

  const getTypeIcon = (artifactType: Artifact['type']) => {
    switch (artifactType) {
      case 'Image': return <ImageIcon size={32} className="text-indigo-500" />;
      case 'Audio': return <Music size={32} className="text-purple-500" />;
      case 'Video': return <Video size={32} className="text-rose-500" />;
      default: return <FileText size={32} className="text-emerald-500" />;
    }
  };

  const getGradeBadge = (gradeLevel: Artifact['grade']) => {
    switch (gradeLevel) {
      case 'EE': return "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50";
      case 'ME': return "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50";
      case 'AE': return "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50";
      default: return "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by student name or artifact title..." 
            className="pl-11 rounded-2xl h-12 bg-white border-none shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="rounded-2xl h-12 bg-white border-none shadow-sm px-4 text-sm font-bold text-slate-700 outline-none cursor-pointer"
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
        >
          <option value="all">All Learning Areas</option>
          <option value="Creative Arts">Creative Arts</option>
          <option value="English">English</option>
          <option value="Science">Science</option>
          <option value="Kiswahili">Kiswahili</option>
          <option value="Mathematics">Mathematics</option>
        </select>
      </div>

      {filteredArtifacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtifacts.map((art) => (
            <Card key={art.id} className="group border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white flex flex-col justify-between">
              <div>
                <div className="aspect-video bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                  {art.fileUrl && art.type === 'Image' ? (
                    <img src={art.fileUrl} alt={art.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {getTypeIcon(art.type)}
                      {art.fileName && (
                        <span className="text-[11px] font-bold text-slate-400 max-w-[180px] truncate">
                          {art.fileName}
                        </span>
                      )}
                    </div>
                  )}
                  <Badge variant="outline" className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] uppercase font-black tracking-wider border-none shadow-sm">
                    {art.type}
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      {art.learningArea}
                    </Badge>
                    <Badge className={getGradeBadge(art.grade)}>{art.grade}</Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-bold flex items-center gap-1.5 mt-2">
                    <User size={14} className="text-slate-400" /> {art.student}
                  </p>
                </CardContent>
              </div>

              <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-slate-50 mt-4">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Calendar size={12} /> {art.date}
                </span>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl h-8 px-3"
                    onClick={() => setSelectedArtifact(art)}
                  >
                    <Eye size={14} className="mr-1" /> View Details
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl h-8 w-8"
                    onClick={() => handleDelete(art.id, art.title)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
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

      {/* Upload Modal with File Chooser */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setSelectedFile(null);
          setFilePreviewUrl(null);
        }}
        title="Upload Learner Artifact"
        description="Select a file from your computer storage (Downloads, Documents, Photos, Videos)."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => { setIsUploadOpen(false); setSelectedFile(null); setFilePreviewUrl(null); }} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button onClick={handleUpload} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2">
              <Upload size={16} /> Save Artifact
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpload} className="space-y-4">
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

            {/* Local Image Preview if image selected */}
            {filePreviewUrl && type === 'Image' && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 mt-2">
                <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                <Badge className="absolute bottom-2 right-2 bg-emerald-600 text-white font-bold gap-1 text-[10px]">
                  <CheckCircle2 size={12} /> Image Ready
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Learner</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue placeholder="Choose student..." />
              </SelectTrigger>
              <SelectContent>
                {STUDENTS.map(s => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name} (Grade {s.grade} - {s.stream})
                  </SelectItem>
                ))}
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

      {/* View Details Modal */}
      <Modal
        isOpen={!!selectedArtifact}
        onClose={() => setSelectedArtifact(null)}
        title={selectedArtifact?.title || "Artifact Evidence"}
        description={`Learner: ${selectedArtifact?.student}`}
        footer={
          <Button variant="ghost" onClick={() => setSelectedArtifact(null)} className="rounded-xl font-bold">
            Close
          </Button>
        }
      >
        {selectedArtifact && (
          <div className="space-y-5">
            <div className="aspect-video bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 overflow-hidden relative">
              {selectedArtifact.fileUrl && selectedArtifact.type === 'Image' ? (
                <img src={selectedArtifact.fileUrl} alt={selectedArtifact.title} className="w-full h-full object-contain" />
              ) : selectedArtifact.fileUrl && selectedArtifact.type === 'Video' ? (
                <video src={selectedArtifact.fileUrl} controls className="w-full h-full" />
              ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                  {getTypeIcon(selectedArtifact.type)}
                  {selectedArtifact.fileName && (
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <File size={16} /> {selectedArtifact.fileName}
                    </p>
                  )}
                  {selectedArtifact.fileSize && (
                    <p className="text-xs text-slate-400 font-medium">{selectedArtifact.fileSize}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Learning Area</p>
                <p className="text-sm font-bold text-slate-900">{selectedArtifact.learningArea}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rating</p>
                <Badge className={getGradeBadge(selectedArtifact.grade)}>{selectedArtifact.grade}</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date Added</p>
                <p className="text-xs font-bold text-slate-700">{selectedArtifact.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Format / Type</p>
                <p className="text-xs font-bold text-slate-700">{selectedArtifact.type}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Teacher Remarks</p>
              <p className="text-sm text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 italic">
                "{selectedArtifact.description}"
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Portfolio;