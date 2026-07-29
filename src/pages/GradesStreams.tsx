"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { Layers, Plus, Users, User, Trash2, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { GRADES_DATA, Grade, Stream } from '@/lib/mock-data';

const GradesStreams = () => {
  const [grades, setGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });
  
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [isStreamOpen, setIsStreamOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Auth state
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ type: 'grade' | 'stream', gradeId: string, streamId?: string } | null>(null);

  const [newGradeName, setNewGradeName] = useState("");
  const [newGradeCategory, setNewGradeCategory] = useState<'Pre-Primary' | 'Primary' | 'Junior School'>("Primary");
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [newStreamName, setNewStreamName] = useState("");
  const [newStreamTeacher, setNewStreamTeacher] = useState("");
  const [newStreamStudents, setNewStreamStudents] = useState("");

  useEffect(() => {
    localStorage.setItem('munyaka_grades', JSON.stringify(grades));
  }, [grades]);

  // Logical sorting for grades
  const sortedGrades = useMemo(() => {
    return [...grades].sort((a, b) => {
      const categories = { 'Pre-Primary': 1, 'Primary': 2, 'Junior School': 3 };
      if (categories[a.category] !== categories[b.category]) {
        return categories[a.category] - categories[b.category];
      }
      
      const getNum = (name: string) => {
        const match = name.match(/\d+/);
        if (match) return parseInt(match[0]);
        if (name.toUpperCase().includes('PP1')) return 1;
        if (name.toUpperCase().includes('PP2')) return 2;
        return 0;
      };
      
      return getNum(a.name) - getNum(b.name);
    });
  }, [grades]);

  // Helper function to normalize grade names for duplicate detection (e.g., "Grade 1" vs "1" or "grade 1")
  const normalizeGradeKey = (name: string) => {
    return name.trim().toLowerCase().replace(/^grade\s*/i, '');
  };

  const handleAddGrade = () => {
    const trimmedName = newGradeName.trim();
    if (!trimmedName) {
      showError("Please enter a grade name.");
      return;
    }

    // Normalized duplicate check for Grades
    const normalizedKey = normalizeGradeKey(trimmedName);
    const exists = grades.some(g => normalizeGradeKey(g.name) === normalizedKey);
    
    if (exists) {
      showError(`A grade matching "${trimmedName}" already exists.`);
      return;
    }

    const formattedName = /^grade\s/i.test(trimmedName) || /^(pp\d)/i.test(trimmedName)
      ? trimmedName 
      : `Grade ${trimmedName}`;

    const newGrade: Grade = { 
      id: `g-${Date.now()}`, 
      name: formattedName, 
      category: newGradeCategory, 
      streams: [] 
    };
    
    setGrades([...grades, newGrade]);
    setIsGradeOpen(false);
    setNewGradeName("");
    showSuccess(`Successfully created ${formattedName}!`);
  };

  const handleAddStream = () => {
    const trimmedStreamName = newStreamName.trim();
    
    if (!selectedGradeId) {
      showError("Please select a grade level.");
      return;
    }
    if (!trimmedStreamName) {
      showError("Please enter a stream name.");
      return;
    }

    // Find parent grade and check for duplicate stream within it
    const parentGrade = grades.find(g => g.id === selectedGradeId);
    if (parentGrade) {
      const streamExists = parentGrade.streams.some(
        s => s.name.trim().toLowerCase() === trimmedStreamName.toLowerCase()
      );
      if (streamExists) {
        showError(`Stream "${trimmedStreamName}" already exists in ${parentGrade.name}.`);
        return;
      }
    }

    const studentsCount = parseInt(newStreamStudents) || 0;
    const updatedGrades = grades.map(grade => {
      if (grade.id === selectedGradeId) {
        const newStream: Stream = { 
          id: `s-${Date.now()}`, 
          name: trimmedStreamName, 
          teacher: newStreamTeacher.trim() || "Unassigned", 
          studentsCount 
        };
        return { ...grade, streams: [...grade.streams, newStream] };
      }
      return grade;
    });
    
    setGrades(updatedGrades);
    setIsStreamOpen(false);
    setSelectedGradeId("");
    setNewStreamName("");
    setNewStreamTeacher("");
    setNewStreamStudents("");
    showSuccess(`Successfully added ${trimmedStreamName} stream to ${parentGrade?.name}!`);
  };

  const requestDelete = (type: 'grade' | 'stream', gradeId: string, streamId?: string) => {
    setPendingDelete({ type, gradeId, streamId });
    setAuthPassword("");
    setAuthError("");
    setIsAuthOpen(true);
  };

  const handleVerifyAuth = async () => {
    if (!authPassword) {
      setAuthError("Password is required");
      return;
    }

    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 800));

    // Get the current set password from storage to match AuthContext security
    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';

    if (authPassword === currentAdminPass) {
      executeDelete();
      setIsAuthOpen(false);
      showSuccess(`${pendingDelete?.type === 'grade' ? 'Grade' : 'Stream'} deleted successfully.`);
    } else {
      setAuthError("Invalid admin password");
      showError("Authorization failed");
    }
    setIsVerifying(false);
  };

  const executeDelete = () => {
    if (!pendingDelete) return;

    if (pendingDelete.type === 'grade') {
      setGrades(grades.filter(g => g.id !== pendingDelete.gradeId));
    } else if (pendingDelete.type === 'stream' && pendingDelete.streamId) {
      setGrades(grades.map(g => 
        g.id === pendingDelete.gradeId 
          ? { ...g, streams: g.streams.filter(s => s.id !== pendingDelete.streamId) } 
          : g
      ));
    }
    setPendingDelete(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Grades & Streams</h1>
            <p className="text-muted-foreground">Configure school classes, streams, and assign class teachers.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => setIsStreamOpen(true)}>
            <Plus size={18} /> Add Stream
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => setIsGradeOpen(true)}>
            <Layers size={18} /> Add Grade Level
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {sortedGrades.map((grade) => (
          <Card key={grade.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-black text-slate-900">{grade.name}</CardTitle>
                  <Badge className="bg-indigo-50 text-indigo-700 font-bold">{grade.category}</Badge>
                </div>
                <CardDescription className="mt-1">
                  Total Streams: {grade.streams.length} • Total Learners: {grade.streams.reduce((acc, s) => acc + s.studentsCount, 0)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-indigo-600 font-bold rounded-xl hover:bg-indigo-50" onClick={() => { setSelectedGradeId(grade.id); setIsStreamOpen(true); }}>
                  <Plus size={16} className="mr-1" /> Add Stream
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => requestDelete('grade', grade.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grade.streams.map((stream) => (
                  <div key={stream.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all relative group/stream">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{stream.name} Stream</h4>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:text-red-500 opacity-0 group-hover/stream:opacity-100 transition-opacity" onClick={() => requestDelete('stream', grade.id, stream.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <User size={16} className="text-slate-400" />
                        <span className="font-medium">Teacher: <strong className="text-slate-800">{stream.teacher}</strong></span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Users size={16} className="text-slate-400" />
                        <span className="font-medium">Students: <strong className="text-slate-800">{stream.studentsCount} Learners</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
                {grade.streams.length === 0 && (
                  <div className="col-span-full py-6 text-center border border-dashed border-slate-200 rounded-3xl text-slate-400 text-sm font-medium">
                    No streams created yet for {grade.name}. Click "Add Stream" to add one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grade Modal */}
      <Modal
        isOpen={isGradeOpen}
        onClose={() => setIsGradeOpen(false)}
        title="Add Grade Level"
        description="Create a new academic grade level for the school."
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsGradeOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100" onClick={handleAddGrade}>Create Grade</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Grade Name</Label>
            <Input 
              value={newGradeName} 
              onChange={(e) => setNewGradeName(e.target.value)} 
              placeholder="e.g. Grade 9, PP1" 
              className="rounded-xl h-12" 
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={newGradeCategory} onValueChange={(val: any) => setNewGradeCategory(val)}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pre-Primary">Pre-Primary</SelectItem>
                <SelectItem value="Primary">Primary</SelectItem>
                <SelectItem value="Junior School">Junior School</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Stream Modal */}
      <Modal
        isOpen={isStreamOpen}
        onClose={() => setIsStreamOpen(false)}
        title="Add Stream"
        description="Create a new stream/class group under a grade level."
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsStreamOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100" onClick={handleAddStream}>Add Stream</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Grade Level</Label>
            <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Choose grade" />
              </SelectTrigger>
              <SelectContent>
                {sortedGrades.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Stream Name</Label>
            <Input value={newStreamName} onChange={(e) => setNewStreamName(e.target.value)} placeholder="e.g. Blue" className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label>Class Teacher (Optional)</Label>
            <Input value={newStreamTeacher} onChange={(e) => setNewStreamTeacher(e.target.value)} placeholder="e.g. Jane Mwangi" className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label>Initial Student Count</Label>
            <Input type="number" min="0" value={newStreamStudents} onChange={(e) => setNewStreamStudents(e.target.value)} placeholder="e.g. 40" className="rounded-xl h-12" />
          </div>
        </div>
      </Modal>

      {/* Auth Modal for Deletion */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Admin Verification"
        description={`Please enter the admin password to delete this ${pendingDelete?.type}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAuthOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button 
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8" 
              onClick={handleVerifyAuth}
              disabled={isVerifying}
            >
              {isVerifying ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Authorize Delete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={14} /> {authError}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admin Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                type="password" 
                value={authPassword} 
                onChange={(e) => { setAuthPassword(e.target.value); setAuthError(""); }} 
                placeholder="••••••••" 
                className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold"
                autoFocus
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GradesStreams;