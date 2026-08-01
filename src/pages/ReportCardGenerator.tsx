"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface RecordCardData {
  fullName: string;
  studentId: string;
  grade: string;
  stream: string;
  guardianName: string;
  contact: string;
  photoUrl?: string;
}

const ReportCardGenerator = () => {
  const [formData, setFormData] = useState<RecordCardData>({
    fullName: '',
    studentId: '',
    grade: '',
    stream: '',
    guardianName: '',
    contact: '',
    photoUrl: '',
  });

  const [preview, setPreview] = useState<RecordCardData | null>(null);

  // Dynamic Stored Grades State (matches Grades & Streams key 'munyaka_grades')
  const [storedGrades, setStoredGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  });

  // Listen for changes in localStorage to keep streams synced in real time
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

  // Compute available streams dynamically based on selected grade
  const availableStreams = useMemo(() => {
    if (!storedGrades || storedGrades.length === 0) return [];

    if (!formData.grade || formData.grade === 'all') {
      const streamNames = new Set<string>();
      storedGrades.forEach((g: Grade) => {
        g.streams?.forEach((s) => streamNames.add(s.name));
      });
      return Array.from(streamNames).sort().map(name => ({ name }));
    }

    const gradeObj = storedGrades.find((g: Grade) => 
      g.name === `Grade ${formData.grade}` || 
      g.name === formData.grade || 
      g.name.replace(/[^0-9]/g, '') === formData.grade
    );

    return gradeObj && Array.isArray(gradeObj.streams) 
      ? gradeObj.streams.map((s) => ({ name: s.name }))
      : [];
    };

  // Reset stream selection when grade changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, stream: '' }));
  }, [formData.grade]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGenerate = () => {
    if (!formData.fullName || !formData.studentId || !formData.grade || !formData.stream || !formData.guardianName || !formData.contact) {
      alert('Please fill in all required fields');
      return;
    }
    setPreview(formData);
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      studentId: '',
      grade: '',
      stream: '',
      guardianName: '',
      contact: '',
      photoUrl: '',
    });
    setPreview(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Record Card Generator</h1>
          <p className="text-muted-foreground">Create customizable record cards for students, staff, or any entity.</p>
        </div>
        <Button 
          onClick={handleReset}
          className="rounded-2xl gap-2 h-11 px-6 bg-slate-200 hover:bg-slate-300 text-slate-600 font-medium"
        >
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-6 border-b">
            <CardTitle>Card Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
                className="rounded-xl h-12 bg-slate-50 border-none"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student/ID Number</Label>
              <Input 
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="e.g. A827361"
                className="rounded-xl h-12 bg-slate-50 border-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select 
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                >
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const gradeOrder = [
                        "playgroup",
                        "pp1",
                        "pp2",
                        "grade 1",
                        "grade 2",
                        "grade 3",
                        "grade 4",
                        "grade 5",
                        "grade 5",
                        "grade 6",
                        "grade 7",
                        "grade 8",
                        "grade 9"
                      ];
                      const getRank = (name: string) => {
                        const normalized = name.toLowerCase().trim();
                        const index = gradeOrder.findIndex(g => normalized.includes(g));
                        return index !== -1 ? index : 999;
                      };
                      const sortedGrades = [...storedGrades].sort((a, b) => {
                        const nameA = typeof a === 'string' ? a : a.name || a.grade_name || '';
                        const nameB = typeof b === 'string' ? b : b.name || b.grade_name || '';
                        return getRank(nameA) - getRank(nameB);
                      });
                      return sortedGrades.map(g => (
                        <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '') || g.name}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stream">Stream</Label>
                  <Select 
                    id="stream"
                    name="stream"
                    value={formData.stream}
                    onChange={handleChange}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStreams.length > 0 ? (
                        availableStreams.map((s) => (
                          <SelectItem key={s.name} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="none">
                          No streams found in Grades & Streams
                        </SelectItem>
                      </SelectItem>
                    </Select>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input 
                id="guardianName"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
                placeholder="Enter guardian name"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact (Phone/Email)</Label>
              <Input 
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Enter phone number or email"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photoUrl">Photo URL (Optional)</Label>
              <Input 
                id="photoUrl"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleChange}
                placeholder="Enter image URL"
                className="rounded-xl h-12 bg-slate-50 border-none"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleGenerate}
                className="rounded-2xl px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100"
              >
                Generate Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {preview && (
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-6 border-b">
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                {preview.photoUrl ? (
                  <img 
                    src={preview.photoUrl} 
                    alt="Photo" 
                    className="w-24 h-24 rounded-full border-2 border-indigo-200 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                    {preview.fullName.charAt(0)}
                  </div>
                )}
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">{preview.fullName}</h2>
                  <p className="text-sm text-slate-500">ID: {preview.studentId}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                    <span className="font-medium">Grade:</span> <span>{preview.grade}</span>
                  </div>
                  <div>
                    <span className="font-medium">Stream:</span> <span>{preview.stream}</span>
                  </div>
                  <div>
                    <span className="font-medium">Guardian:</span> <span>{preview.guardianName}</span>
                  </div>
                  <div>
                    <span className="font-medium">Contact:</span> <span>{preview.contact}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportCardGenerator;