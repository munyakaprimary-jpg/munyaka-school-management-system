"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import BackButton from "@/components/ui/BackButton";
import { Plus, Trash2, AlertTriangle, Search, Filter, CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "@/config/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

interface ExamType {
  id: string;
  title: string;
  term: string;
  academicYear: number;
  maxMarks: number;
  status: "Active" | "Closed";
  createdAt?: any;
  updatedAt?: any;
}

const TERMS = ["Term 1", "Term 2", "Term 3"];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

const ExamTypes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerm, setFilterTerm] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<{ id: string; title: string } | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [academicYear, setAcademicYear] = useState(CURRENT_YEAR);
  const [maxMarks, setMaxMarks] = useState(100);
  const [status, setStatus] = useState<"Active" | "Closed">("Active");

  // Firestore live listener
  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(collection(db, "exam_types"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const types: ExamType[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || data.name || "",
            term: data.term || "Term 1",
            academicYear: data.academicYear || data.year || CURRENT_YEAR,
            maxMarks: data.maxMarks || data.totalMarksBaseline || 100,
            status: data.status || "Active",
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setExamTypes(types);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to exam_types:", err);
        setError("Failed to load exam types. Please check your connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtered exam types
  const filteredExamTypes = useMemo(() => {
    return examTypes.filter((exam) => {
      const matchesSearch =
        !searchTerm ||
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(exam.academicYear).includes(searchTerm);

      const matchesTerm = filterTerm === "all" || exam.term === filterTerm;
      const matchesStatus = filterStatus === "all" || exam.status === filterStatus;

      return matchesSearch && matchesTerm && matchesStatus;
    });
  }, [examTypes, searchTerm, filterTerm, filterStatus]);

  const handleAddExamType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!isAdmin) {
      showError("Only administrators can create exam types.");
      return;
    }

    try {
      await addDoc(collection(db, "exam_types"), {
        title: title.trim(),
        term,
        academicYear,
        maxMarks: parseInt(String(maxMarks)) || 100,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsOpen(false);
      setTitle("");
      setTerm("Term 1");
      setAcademicYear(CURRENT_YEAR);
      setMaxMarks(100);
      setStatus("Active");
      showSuccess(`Successfully created exam type "${title.trim()}"!`);
    } catch (err) {
      console.error("Error creating exam type:", err);
      showError("Failed to create exam type. Please try again.");
    }
  };

  const confirmDeleteExamType = async () => {
    if (!examToDelete) return;

    if (!isAdmin) {
      showError("Only administrators can delete exam types.");
      setIsDeleteOpen(false);
      setExamToDelete(null);
      return;
    }

    try {
      await deleteDoc(doc(db, "exam_types", examToDelete.id));
      setIsDeleteOpen(false);
      showSuccess(`Removed "${examToDelete.title}" successfully.`);
      setExamToDelete(null);
    } catch (err) {
      console.error("Error deleting exam type:", err);
      showError("Failed to delete exam type. Please try again.");
    }
  };

  const handleSelectForMarksEntry = (exam: ExamType) => {
    // Store the selected exam type for marks entry
    localStorage.setItem(
      "munyaka_active_exam_type",
      JSON.stringify({
        id: exam.id,
        title: exam.title,
        term: exam.term,
        academicYear: exam.academicYear,
        maxMarks: exam.maxMarks,
      })
    );
    // Also set the active term for the marks entry page
    localStorage.setItem("munyaka_active_term", exam.term);
    navigate("/assessments");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterTerm("all");
    setFilterStatus("all");
  };

  const hasActiveFilters = searchTerm || filterTerm !== "all" || filterStatus !== "all";

  if (loading) {
    return (
      <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exam Types</h1>
            <p className="text-muted-foreground">Loading exam types...</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exam Types</h1>
            <p className="text-muted-foreground">Configure and manage assessed exam types.</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700">{error}</p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exam Types</h1>
            <p className="text-muted-foreground">
              Configure and manage assessed exam types and their grading baselines.
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button
            className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setIsOpen(true)}
          >
            <Plus size={18} /> Add Exam Type
          </Button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-none shadow-sm rounded-[1.5rem] bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by title, term, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 rounded-xl border-slate-200"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger className="w-[180px] h-11 rounded-xl border-slate-200">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {TERMS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px] h-11 rounded-xl border-slate-200">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50"
                  onClick={clearFilters}
                  title="Clear filters"
                >
                  <XCircle size={18} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Types Grid */}
      {filteredExamTypes.length === 0 ? (
        <Card className="border-none shadow-sm rounded-[1.5rem] bg-white">
          <CardContent className="p-12 text-center">
            <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {examTypes.length === 0 ? "No exam types found" : "No matching exam types"}
            </h3>
            <p className="text-slate-500 mb-6">
              {examTypes.length === 0
                ? "Get started by creating your first exam type."
                : "Try adjusting your search or filters."}
            </p>
            {isAdmin && examTypes.length === 0 && (
              <Button
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
                onClick={() => setIsOpen(true)}
              >
                <Plus size={18} className="mr-2" /> Create Exam Type
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExamTypes.map((exam) => (
            <Card
              key={exam.id}
              className="border-none shadow-sm hover:shadow-md transition-all rounded-[1.5rem] bg-white group relative"
            >
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <Badge
                      className={
                        exam.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 font-bold"
                          : "bg-slate-100 text-slate-700 font-bold"
                      }
                    >
                      {exam.status}
                    </Badge>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 h-9 w-9"
                        onClick={() => {
                          setExamToDelete({ id: exam.id, title: exam.title });
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {exam.title}
                  </h4>
                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-slate-700">Term:</span>
                      {exam.term}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-slate-700">Year:</span>
                      {exam.academicYear}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-slate-700">Max Marks:</span>
                      {exam.maxMarks}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 flex flex-col gap-2 mt-auto">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">Max Marks</span>
                    <Badge variant="outline" className="rounded-lg font-black text-slate-700 border-slate-200 bg-slate-50 px-2.5 py-1">
                      {exam.maxMarks}
                    </Badge>
                  </div>
                  {exam.status === "Active" && (
                    <Button
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-sm gap-2"
                      onClick={() => handleSelectForMarksEntry(exam)}
                    >
                      <CheckCircle2 size={16} /> Select for Marks Entry
                    </Button>
                  )}
                  {exam.status === "Closed" && (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl text-slate-500 border-slate-200 hover:bg-slate-50"
                      disabled
                    >
                      <XCircle size={16} className="mr-2" /> Closed — Not Available
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Exam Type Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Exam Type"
        description="Create a new assessment type for grading."
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              onClick={handleAddExamType}
              disabled={!title.trim()}
            >
              Add Exam Type
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Exam Type Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Term 1 Opener Exam, Mid-Term Assessment, End of Term Exam"
              className="rounded-xl h-12"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={String(academicYear)} onValueChange={(v) => setAcademicYear(parseInt(v))}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={String(y)} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Marks</Label>
              <Input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
                placeholder="100"
                min="1"
                max="1000"
                className="rounded-xl h-12"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(val: string) => setStatus(val as "Active" | "Closed")}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Exam Type?"
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold flex-1" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex-1"
              onClick={confirmDeleteExamType}
            >
              Yes, Delete
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
          <p className="text-slate-500">
            Are you sure you want to delete <strong className="text-slate-800">"{examToDelete?.title}"</strong>? This action cannot be undone.
          </p>
        </div>
              </Modal>
            </div>
          );
        };

export default ExamTypes;