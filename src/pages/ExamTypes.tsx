import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Award, 
  FileText, 
  CheckCircle2, 
  Layers, 
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";

interface ExamType {
  id: string;
  name: string;
  code: string;
  weight: number;
  category: string;
  description?: string;
}

const INITIAL_EXAM_TYPES: ExamType[] = [
  { id: "et-1", name: "Formative Assessment", code: "FORMATIVE", weight: 40, category: "Formative", description: "Continuous assessment tests and classroom activities" },
  { id: "et-2", name: "Summative Assessment", code: "SUMMATIVE", weight: 60, category: "Summative", description: "End of term comprehensive evaluation" },
  { id: "et-3", name: "Opener Exam", code: "OPENER", weight: 0, category: "Other", description: "Beginning of term diagnostic test" },
  { id: "et-4", name: "Mid-Term Exam", code: "MIDTERM", weight: 0, category: "Other", description: "Mid-term progress evaluation" }
];

export default function ExamTypes() {
  const [examTypes, setExamTypes] = useState<ExamType[]>(() => {
    try {
      const saved = localStorage.getItem("munyaka_exam_types");
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return INITIAL_EXAM_TYPES;
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<{ id: string; name: string } | null>(null);

  const [newExam, setNewExam] = useState({
    name: "",
    code: "",
    weight: 0,
    category: "Formative",
    description: ""
  });

  const saveToStorage = (updated: ExamType[]) => {
    setExamTypes(updated);
    try {
      localStorage.setItem("munyaka_exam_types", JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newExam.name.trim();
    if (!trimmedName) {
      showError("Exam type name is required.");
      return;
    }

    const trimmedCode = (newExam.code.trim() || trimmedName.toUpperCase().replace(/\s+/g, "_"));

    if (examTypes.some(et => et.code.toLowerCase() === trimmedCode.toLowerCase())) {
      showError(`Exam type code "${trimmedCode}" already exists.`);
      return;
    }

    const created: ExamType = {
      id: `et-${Date.now()}`,
      name: trimmedName,
      code: trimmedCode,
      weight: Number(newExam.weight) || 0,
      category: newExam.category,
      description: newExam.description.trim()
    };

    const updated = [...examTypes, created];
    saveToStorage(updated);
    showSuccess(`Successfully created exam type "${created.name}"!`);
    setIsAddOpen(false);
    setNewExam({ name: "", code: "", weight: 0, category: "Formative", description: "" });
  };

  const handleDelete = () => {
    if (!examToDelete) return;
    const updated = examTypes.filter(et => et.id !== examToDelete.id);
    saveToStorage(updated);
    showSuccess(`Removed "${examToDelete.name}" successfully.`);
    setIsDeleteOpen(false);
    setExamToDelete(null);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold">
              CBC Evaluation Setup
            </span>
            <span className="text-xs text-slate-400 font-medium">• {examTypes.length} Configured Types</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Exam & Assessment Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure examination types, weights, and grading categories for report cards.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          <Plus size={18} className="mr-2" /> Add Exam Type
        </Button>
      </div>

      {/* Grid of Exam Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examTypes.map((exam) => (
          <div
            key={exam.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Award size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                    {exam.code}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setExamToDelete({ id: exam.id, name: exam.name }); setIsDeleteOpen(true); }}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                {exam.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                {exam.description || "No description provided for this evaluation category."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Category: <span className="text-slate-900 dark:text-white">{exam.category}</span></span>
              <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                Weight: {exam.weight}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Exam Type Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Create Exam Type</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add a new assessment type or grading category for the school term.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExam} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Exam Name *</Label>
              <Input
                value={newExam.name}
                onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                placeholder="e.g. End of Term Examination"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Code / Short Tag</Label>
              <Input
                value={newExam.code}
                onChange={(e) => setNewExam({ ...newExam, code: e.target.value })}
                placeholder="e.g. EOT_EXAM (auto-generated if empty)"
                className="rounded-xl font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Category</Label>
                <select
                  value={newExam.category}
                  onChange={(e) => setNewExam({ ...newExam, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white dark:bg-slate-900"
                >
                  <option value="Formative">Formative</option>
                  <option value="Summative">Summative</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Weight (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newExam.weight}
                  onChange={(e) => setNewExam({ ...newExam, weight: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Description</Label>
              <Textarea
                value={newExam.description}
                onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                placeholder="Brief description of this assessment..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                Create Exam Type
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete <strong className="text-slate-800">"{examToDelete?.name}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button onClick={handleDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
