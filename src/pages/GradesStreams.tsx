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
import { Layers, Plus, Users, User, Trash2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { GRADES_DATA, Grade, Stream } from '@/lib/mock-data';

const GradesStreams = () => {
  const [grades, setGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [isStreamOpen, setIsStreamOpen] = useState(false);

  // Form states - Add Grade
  const [newGradeName, setNewGradeName] = useState("");
  const [newGradeCategory, setNewGradeCategory] = useState<'Pre-Primary' | 'Primary' | 'Junior School'>("Primary");

  // Form states - Add Stream
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
    showSuccess(`Successfully created ${newGradeName}!`);
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
    showSuccess(`Successfully added ${newStreamName} stream!`);
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
    showSuccess("Stream removed successfully.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Grades & Streams</h1>
          <p className="text-muted-foreground">Configure school classes, streams, and assign class teachers.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-2xl border-slate-200 gap-2"
            onClick={() => setIsStreamOpen(true)}
          >
            <Plus size={18} /> Add Stream
          </Button>
          <Button 
            className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={() => setIsGradeOpen(true)}
          >
            <Layers size={18} /> Add Grade Level
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {grades.map((grade) => (
          <Card key={grade.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-black text-slate-900">{grade.name}</CardTitle>
                  <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold">
                    {grade.category}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  Total Streams: {grade.streams.length} • Total Learners: {grade.streams.reduce((acc, s) => acc + s.studentsCount, 0)}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-600 font-bold rounded-xl hover:bg-indigo-50"
                onClick={() => {
                  setSelectedGradeId(grade.id);
                  setIsStreamOpen(true);
                }}
              >
                <Plus size={16} className="mr-1" /> Add Stream
              </Button>
            </CardHeader>
            <CardContent className="p-8">
              {grade.streams.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic">
                  No streams added to this grade yet. Click "Add Stream" to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grade.streams.map((stream) => (
                    <div 
                      key={stream.id} 
                      className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all relative group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{stream.name} Stream</h4>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Class Stream</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteStream(grade.id, stream.id)}
                        >
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
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Grade Dialog */}
      <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Grade Level</DialogTitle>
            <DialogDescription>
              Create a new academic grade level for the school.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddGrade} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Grade Name</Label>
              <Input 
                value={newGradeName}
                onChange={(e) => setNewGradeName(e.target.value)}
                placeholder="e.g. Grade 9, PP1"
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={newGradeCategory} 
                onValueChange={(val: any) => setNewGradeCategory(val)}
              >
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

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold"
                onClick={() => setIsGradeOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              >
                Create Grade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Stream Dialog */}
      <Dialog open={isStreamOpen} onOpenChange={setIsStreamOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Stream</DialogTitle>
            <DialogDescription>
              Create a new stream/class group under a grade level.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStream} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Grade Level</Label>
              <Select value={selectedGradeId} onValueChange={setSelectedGradeId} required>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Choose grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stream Name</Label>
              <Input 
                value={newStreamName}
                onChange={(e) => setNewStreamName(e.target.value)}
                placeholder="e.g. Blue, Yellow, West"
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Class Teacher</Label>
              <Input 
                value={newStreamTeacher}
                onChange={(e) => setNewStreamTeacher(e.target.value)}
                placeholder="e.g. Jane Mwangi"
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Initial Student Count</Label>
              <Input 
                type="number"
                value={newStreamStudents}
                onChange={(e) => setNewStreamStudents(e.target.value)}
                placeholder="e.g. 40"
                className="rounded-xl h-12"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold"
                onClick={() => setIsStreamOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              >
                Add Stream
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradesStreams;