"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Trash2, AlertTriangle, X } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface ExamType {
  id: string;
  name: string;
  code: string;
  weight: number;
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
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Exam Types</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure assessement types and grading weights.</p>
        </div>
        <Button 
          className="rounded-xl gap-1.5 h-9 px-4 text-xs font-semibold shadow-sm bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setIsOpen(true)}
        >
          <Plus size={15} /> Add Exam Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {examTypes.map((exam) => (
          <Card key={exam.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white overflow-hidden group">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <Badge className={
                    exam.category === 'Formative' 
                      ? "bg-emerald-50 text-emerald-700 border-none font-bold text-[10px] px-2 py-0.5" 
                      : exam.category === 'Summative'
                      ? "bg-indigo-50 text-indigo-700 border-none font-bold text-[10px] px-2 py-0.5"
                      : "bg-slate-100 text-slate-700 border-none font-bold text-[10px] px-2 py-0.5"
                  }>
                    {exam.category}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors h-7 w-7"
                    onClick={() => triggerDeleteConfirm(exam.id, exam.name)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <h4 className="text-base font-bold text-slate-900 leading-snug mb-0.5 group-hover:text-indigo-600 transition-colors">
                  {exam.name}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Code: {exam.code}</p>
                
                {exam.description && (
                  <p className="text-xs text-slate-500 leading-normal mb-3">
                    {exam.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-50 flex justify-between items-center mt-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Weight</span>
                <Badge variant="outline" className="rounded-md font-bold text-xs text-slate-700 border-slate-200 bg-slate-50 px-2 py-0.5">
                  {exam.weight}% Weight
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Exam Type Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={() => setIsOpen(false)}
          >
            <X size={16} />
          </Button>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Exam Type</DialogTitle>
            <DialogDescription className="text-xs">
              Create a new assessment type for grading and report cards.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddExamType} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Exam Type Name</Label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. End Term Exam"
                required
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Unique Code</Label>
                <Input 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. ENDTERM"
                  required
                  className="rounded-xl h-10 text-xs uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Formative">Formative</SelectItem>
                    <SelectItem value="Summative">Summative</SelectItem>
                    <SelectItem value="Other">Other / Diagnostic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Report Card Weight (%)</Label>
              <Input 
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 60"
                required
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description (Optional)</Label>
              <Input 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Final comprehensive evaluation"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl h-9 text-xs font-semibold"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl h-9 px-5 text-xs bg-indigo-600 hover:bg-indigo-700 font-semibold"
              >
                Add Exam Type
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={() => setIsDeleteOpen(false)}
          >
            <X size={16} />
          </Button>
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle size={24} />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Delete Exam Type?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete <strong className="text-slate-800">"{examToDelete?.name}"</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 justify-center pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              className="rounded-xl h-9 text-xs font-semibold flex-1"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              className="rounded-xl h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold flex-1"
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