"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Layers, Plus, Users, User, Trash2, X } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { GRADES_DATA, Grade, Stream } from '@/lib/mock-data';

const GradesStreams = () => {
  const [grades, setGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [isStreamOpen, setIsStreamOpen] = useState(false);

  const [newGradeName, setNewGradeName] = useState("");
  const [newGradeCategory, setNewGradeCategory] = useState<'Pre-Primary' | 'Primary' | 'Junior School'>("Primary");

  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [newStreamName, setNewStreamName] = useState("");
  const [newStreamTeacher, setNewStreamTeacher] = useState("");
  const [newStreamStudents, setNewStreamStudents] = useState("");

  useEffect(() => {
    localStorage.setItem('munyaka_grades', JSON.stringify(grades));
  }, [grades]);

  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName.trim()) return;

    const newGrade: Grade = {
      id: `g-${Date.now()}`,
      name: newGradeName,
      category: newGradeCategory,
      streams: []
    };

    setGrades([...grades, newGrade]);
    setIsGradeOpen(false);
    setNewGradeName("");
    showSuccess(`Created ${newGradeName}!`);
  };

  const handleAddStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradeId || !newStreamName.trim()) return;

    const studentsCount = parseInt(newStreamStudents) || 0;

    const updatedGrades = grades.map(grade => {
      if (grade.id === selectedGradeId) {
        const newStream: Stream = {
          id: `s-${Date.now()}`,
          name: newStreamName,
          teacher: newStreamTeacher || "Unassigned",
          studentsCount
        };
        return {
          ...grade,
          streams: [...grade.streams, newStream]
        };
      }
      return grade;
    });

    setGrades(updatedGrades);
    setIsStreamOpen(false);
    setSelectedGradeId("");
    setNewStreamName("");
    setNewStreamTeacher("");
    setNewStreamStudents("");
    showSuccess(`Added ${newStreamName} stream!`);
  };

  const handleDeleteStream = (gradeId: string, streamId: string) => {
    const updatedGrades = grades.map(grade => {
      if (grade.id === gradeId) {
        return {
          ...grade,
          streams: grade.streams.filter(s => s.id !== streamId)
        };
      }
      return grade;
    });
    setGrades(updatedGrades);
    showSuccess("Stream removed.");
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Grades & Streams</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure school classes and assigned teachers.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200 gap-1.5 h-9 px-3 text-xs"
            onClick={() => setIsStreamOpen(true)}
          >
            <Plus size={15} /> Add Stream
          </Button>
          <Button 
            className="rounded-xl shadow-sm bg-indigo-600 hover:bg-indigo-700 gap-1.5 h-9 px-4 text-xs font-semibold"
            onClick={() => setIsGradeOpen(true)}
          >
            <Layers size={15} /> Add Grade
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {grades.map((grade) => (
          <Card key={grade.id} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b bg-slate-50/50 flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-slate-900">{grade.name}</CardTitle>
                  <Badge className="bg-indigo-50 text-indigo-700 font-bold text-[10px] px-2 py-0.5">
                    {grade.category}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Streams: {grade.streams.length} • Learners: {grade.streams.reduce((acc, s) => acc + s.studentsCount, 0)}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-600 font-bold rounded-lg text-xs h-8 px-2.5 hover:bg-indigo-50"
                onClick={() => {
                  setSelectedGradeId(grade.id);
                  setIsStreamOpen(true);
                }}
              >
                <Plus size={14} className="mr-1" /> Stream
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {grade.streams.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs italic">
                  No streams added. Click "Add Stream" to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grade.streams.map((stream) => (
                    <div 
                      key={stream.id} 
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{stream.name} Stream</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Class Stream</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-lg text-slate-300 hover:text-red-500 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteStream(grade.id, stream.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User size={13} className="text-slate-400" />
                          <span>Teacher: <strong className="text-slate-800">{stream.teacher}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users size={13} className="text-slate-400" />
                          <span>Students: <strong className="text-slate-800">{stream.studentsCount}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5 relative">
          <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full h-8 w-8 text-slate-400" onClick={() => setIsGradeOpen(false)}>
            <X size={16} />
          </Button>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Grade Level</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGrade} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Grade Name</Label>
              <Input value={newGradeName} onChange={(e) => setNewGradeName(e.target.value)} placeholder="e.g. Grade 9" required className="rounded-xl h-10 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category</Label>
              <Select value={newGradeCategory} onValueChange={(val: any) => setNewGradeCategory(val)}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pre-Primary">Pre-Primary</SelectItem>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Junior School">Junior School</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" className="rounded-xl h-9 text-xs" onClick={() => setIsGradeOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl h-9 text-xs bg-indigo-600 hover:bg-indigo-700">Create Grade</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradesStreams;