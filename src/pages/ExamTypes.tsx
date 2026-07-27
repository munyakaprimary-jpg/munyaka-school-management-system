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
import { Award, Plus, Trash2, ClipboardList, CheckCircle2, AlertTriangle } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface ExamType {
  id: string;
  name: string;
  code: string;
  weight: number; // percentage weight in final report
  category: 'Formative' | 'Summative' | 'Other';
  description?: string;
}

const DEFAULT_EXAM_TYPES: ExamType[] = [
  { id: "et-1", name: "Formative Assessment", code: "FORMATIVE", weight: 40, category: "Formative", description: "Continuous assessment tests and classroom activities" },
  { id: "et-2", name: "Summative Assessment", code: "SUMMATIVE", weight: 60, category: "Summative", description: "End of term comprehensive evaluation" },
  { id: "et-3", name: "Opener Exam", code: "OPENER", weight: 0, category: "Other", description: "Beginning of term diagnostic test" },
  { id: "et-4", name: "Mid-Term Exam", code: "MIDTERM", weight: 0, category: "Other", description: "Mid-term progress evaluation" }
];

const ExamTypes = () => {
  const [examTypes, setExamTypes] = useState<ExamType[]>(() => {
    const saved = localStorage.getItem('munyaka_exam_types');
    return saved ? JSON.parse(saved) : DEFAULT_EXAM_TYPES;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [weight, setWeight] = useState("40");
  const [category, setCategory] = useState<'Formative' | 'Summative' | 'Other'>("Formative");
  const [description, setDescription] = useState("");

  useEffect(() => {
    localStorage.setItem('munyaka_exam_types', JSON.stringify(examTypes));
  }, [examTypes]);

  const handleAddExamType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const newExam: ExamType = {
      id: `et-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      weight: parseInt(weight) || 0,
      category,
      description: description.trim() || undefined
    };

    setExamTypes([...examTypes, newExam]);
    setIsOpen(false);
    setName("");
    setCode("");
    setWeight("0");
    setCategory("Formative");
    setDescription("");
    showSuccess(`Successfully created exam type "${newExam.name}"!`);
  };

  const triggerDeleteConfirm = (id: string, examName: string) => {
    setExamToDelete({ id, name: examName });
    setIsDeleteOpen(true);
  };

  const confirmDeleteExamType = () => {
    if (!examToDelete) return;
    const updated = examTypes.filter(et => et.id !== examToDelete.id);
    setExamTypes(updated);
    setIsDeleteOpen(false);
    showSuccess(`Removed "${examToDelete.name}" successfully.`);
    setExamToDelete(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exam Types</h1>
          <p className="text-muted-foreground">Configure and manage assessed exam types and their grading weights.</p>
        </div>
        <Button 
          className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setIsOpen(true)}
        >
          <Plus size={18} /> Add Exam Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examTypes.map((exam) => (
          <Card key={exam.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group relative">
            <CardContent className="p-8 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <Badge className={
                    exam.category === 'Formative' 
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold" 
                      : exam.category === 'Summative'
                      ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-bold"
                  }>
                    {exam.category}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors h-9 w-9"
                    onClick={() => triggerDeleteConfirm(exam.id, exam.name)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                  {exam.name}
                </h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Code: {exam.code}</p>
                
                {exam.description && (
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {exam.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Weight</span>
                <Badge variant="outline" className="rounded-lg font-black text-slate-700 border-slate-200 bg-slate-50 px-2.5 py-1">
                  {exam.weight}% Weight
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Exam Type Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Exam Type</DialogTitle>
            <DialogDescription>
              Create a new assessment type for grading and report cards.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddExamType} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Exam Type Name</Label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. End Term Exam, Continuous Assessment"
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unique Code</Label>
                <Input 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. ENDTERM"
                  required
                  className="rounded-xl h-12 uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Formative">Formative</SelectItem>
                    <SelectItem value="Summative">Summative</SelectItem>
                    <SelectItem value="Other">Other / Diagnostic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Report Card Weight (%)</Label>
              <Input 
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 60"
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Final comprehensive exam at the end of term"
                className="rounded-xl h-12"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              >
                Add Exam Type
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900">Delete Exam Type?</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2">
              Are you sure you want to delete <strong className="text-slate-800">"{examToDelete?.name}"</strong>? This action cannot be undone and may affect existing marksheet configurations.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 justify-center pt-6">
            <Button 
              type="button" 
              variant="ghost" 
              className="rounded-xl font-bold flex-1"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex-1"
              onClick={confirmDeleteExamType}
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamTypes;