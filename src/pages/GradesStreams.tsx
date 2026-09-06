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
import { sortGrades, GRADE_ORDER } from '@/utils/gradeSort';
import { notifyDataChanged } from '@/utils/storage';

// Primary canonical key — all readers should now use `configured_streams`.
const STORAGE_KEY = 'configured_streams';
// Legacy key kept so existing cross-tab listeners and other pages that
// watch `munyaka_grades` keep working without needing to be updated.
const LEGACY_STORAGE_KEY = 'munyaka_grades';
const SCHOOL_INFO_KEY = 'munyaka_school_info';

// Filter helper: detect "mock" grades and streams by checking against the
// known-default seed data shipped in @/lib/mock-data. Anything that came
// from GRADES_DATA — including the seeded stream objects like "ALPHA" /
// "BETA" / "Blue" / "Green" — is treated as a placeholder and filtered
// out. Real user-created entries (which have localStorage-only IDs and
// were never part of the seed list) survive this filter untouched.
const isSeedGrade = (g: Grade): boolean => {
  return GRADES_DATA.some((seed) => seed.id === g.id);
};

const isSeedStream = (g: Grade, s: Stream): boolean => {
  const seedGrade = GRADES_DATA.find((sg) => sg.id === g.id);
  if (!seedGrade) return false;
  return seedGrade.streams.some((ss) => ss.id === s.id);
};

const GradesStreams = () => {
  // Helper: filter out any grades / streams that originated from the
  // built-in mock seed. Only user-created entries (added via the "Add
  // Stream" / "Add Grade Level" buttons) survive.
  const stripSeedData = (rawGrades: Grade[]): Grade[] => {
    return rawGrades
      .filter((g) => !isSeedGrade(g))
      .map((g) => ({
        ...g,
        streams: (g.streams || []).filter((s) => !isSeedStream(g, s)),
      }));
  };

  // Initial state — reads from the canonical key first, then the legacy
  // key, so users don't lose data when the key name is unified. If both
  // are missing or corrupted, falls through to an empty array (the page
  // will show its friendly empty state rather than crashing).
  const [grades, setGrades] = useState<Grade[]>(() => {
    const keys = [STORAGE_KEY, LEGACY_STORAGE_KEY];
    for (const k of keys) {
      try {
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return stripSeedData(parsed);
          }
        }
      } catch {
        // Corrupted JSON — skip this key and try the next one
      }
    }
    return [];
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
    // Always persist to the canonical key AND the legacy key so that:
    //   1. New readers find data under the canonical name
    //   2. Existing pages listening on `munyaka_grades` still work
    // Including when grades becomes [] after a delete so we don't leave
    // stale entries in localStorage.
    try {
      const data = JSON.stringify(grades);
      localStorage.setItem(STORAGE_KEY, data);
      localStorage.setItem(LEGACY_STORAGE_KEY, data);
      notifyDataChanged(STORAGE_KEY);
      notifyDataChanged(LEGACY_STORAGE_KEY);
    } catch (e) {
      // localStorage quota exceeded — best-effort, fall through silently
    }
  }, [grades]);

  // Broadcast changes to other tabs/pages via a custom event
  useEffect(() => {
    window.dispatchEvent(new Event('munyaka_grades_updated'));
  }, [grades]);

  // Listen for storage changes (cross-tab sync) and the custom broadcast
  // event so changes made in the "Students" page filter dropdowns show up
  // here immediately without a full page reload.
  useEffect(() => {
    const refresh = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setGrades(stripSeedData(parsed));
          } else {
            setGrades([]);
          }
        } else {
          setGrades([]);
        }
      } catch {
        setGrades([]);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === STORAGE_KEY) refresh();
    };
    const handleCustom = () => refresh();
    const handleFocus = () => refresh();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('munyaka_grades_updated', handleCustom);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('munyaka_grades_updated', handleCustom);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // ── Strict grade ordering ───────────────────────────────────────────────
  // Rendered in canonical sequence: PP1 → PP2 → Grade 1 → … → Grade 9.
  // Any custom user-added grade not in GRADE_ORDER is pushed to the end
  // and sorted alphabetically. The sortGrades() helper from
  // @/utils/gradeSort enforces this via index lookup against GRADE_ORDER.
  const sortedGrades = useMemo(() => {
    return sortGrades(grades);
  }, [grades]);

  const normalizeGradeKey = (name: string) => {
      return String(name || '').trim().toLowerCase();
    };
  
    const handleAddGrade = () => {
      const trimmedName = String(newGradeName || '').trim();
    if (!trimmedName) {
      showError("Please enter a grade name.");
      return;
    }

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
      const trimmedStreamName = String(newStreamName || '').trim();

    if (!selectedGradeId) {
      showError("Please select a grade level.");
      return;
    }
    if (!trimmedStreamName) {
      showError("Please enter a stream name.");
      return;
    }

    const parentGrade = grades.find(g => g.id === selectedGradeId);
    if (parentGrade) {
      // Case-normalize the new stream name to deduplicate (e.g. "BLUE" vs "Blue")
      const normalizedNew = trimmedStreamName.charAt(0).toUpperCase() + trimmedStreamName.slice(1).toLowerCase();
      const streamExists = parentGrade.streams.some(
        s => String(s.name || '').trim().toLowerCase() === normalizedNew.toLowerCase()
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
          teacher: String(newStreamTeacher || '').trim() || "Unassigned",
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
    showSuccess(`Successfully added ${trimmedStreamName} stream!`);
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

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';

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

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
    setPendingDelete(null);
    setAuthPassword("");
    setAuthError("");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Grades & Streams</h1>
            <p className="text-muted-foreground">Configure school classes, streams, and assign class teachers.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-2xl border-slate-200 gap-2 disabled:opacity-50"
            onClick={() => setIsStreamOpen(true)}
            disabled={grades.length === 0}
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

      {/* Empty state — shown when the user has not yet added any grade */}
      {grades.length === 0 && (
        <Card className="border-none shadow-sm rounded-3xl bg-white p-12 text-center">
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <div className="p-4 bg-indigo-50 rounded-full">
              <Layers className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Custom Grades Yet</h3>
            <p className="text-sm text-slate-500">
              You haven't created any grade levels yet. Click
              <span className="font-bold text-indigo-600">"Add Grade Level"</span>
              above to start building your school's structure.
            </p>
            <Button
              onClick={() => setIsGradeOpen(true)}
              className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
            >
              <Plus size={18} /> Add Your First Grade
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8">
        {sortedGrades.map((grade) => (
          <Card key={grade.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group">
            <CardHeader className="p-8 border-b bg-slate-50/40 flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl font-black text-slate-900">{grade.name}</CardTitle>
                  <Badge className="bg-indigo-50 text-indigo-700 font-bold">{grade.category}</Badge>
                </div>
                <CardDescription className="mt-1">
                  Total Streams: {grade.streams.length} • Total Learners: {grade.streams.reduce((acc, s) => acc + s.studentsCount, 0)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-indigo-600 font-bold rounded-xl hover:bg-indigo-50"
                  onClick={() => { setSelectedGradeId(grade.id); setIsStreamOpen(true); }}
                >
                  <Plus size={16} className="mr-1" /> Add Stream
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 h-9 w-9"
                  onClick={() => requestDelete('grade', grade.id)}
                  title="Delete grade"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {grade.streams.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
                  <p className="text-sm font-bold text-slate-500">
                    No streams created yet for {grade.name}.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-indigo-600 font-bold"
                    onClick={() => { setSelectedGradeId(grade.id); setIsStreamOpen(true); }}
                  >
                    <Plus size={14} className="mr-1" /> Add the first stream
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grade.streams.map((stream) => (
                    <div
                      key={stream.id}
                      className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all relative group/stream"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{stream.name} Stream</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 h-8 w-8"
                          onClick={() => requestDelete('stream', grade.id, stream.id)}
                          title="Delete stream"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <User size={16} className="text-slate-400" />
                          <span className="font-medium">
                            Teacher: <strong className="text-slate-800">{stream.teacher}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-slate-600">
                          <Users size={16} className="text-slate-400" />
                          <span className="font-medium">
                            Students: <strong className="text-slate-800">{stream.studentsCount} Learners</strong>
                          </span>
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
              placeholder="e.g. Grade 9"
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
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              onClick={handleAddStream}
              disabled={!selectedGradeId}
            >
              Add Stream
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Grade Level</Label>
            <Select
              value={selectedGradeId}
              onValueChange={setSelectedGradeId}
              disabled={grades.length === 0}
            >
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder={grades.length === 0 ? "Create a grade first" : "Choose grade"} />
              </SelectTrigger>
              <SelectContent>
                {sortedGrades.map(g => (
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
              placeholder="e.g. Blue"
              className="rounded-xl h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>Class Teacher (Optional)</Label>
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
              min="0"
              value={newStreamStudents}
              onChange={(e) => setNewStreamStudents(e.target.value)}
              placeholder="e.g. 40"
              className="rounded-xl h-12"
            />
          </div>
        </div>
      </Modal>

      {/* Auth Modal for Deletion */}
      <Modal
        isOpen={isAuthOpen}
        onClose={handleCloseAuth}
        title="Admin Verification"
        description={`Please enter the admin password to delete this ${pendingDelete?.type}.`}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseAuth} className="rounded-xl font-bold flex-1">Cancel</Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex-1"
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
                onChange={(e) => { setAuthPassword(e.target.value); if (authError) setAuthError(""); }}
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