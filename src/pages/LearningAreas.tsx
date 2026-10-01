"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import BackButton from "@/components/ui/BackButton";
import { Plus, Trash2, Edit, BookOpen, Sparkles } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';

export interface LearningAreaItem {
  id: string;
  name: string;
  periodsPerWeek: number;
  type: 'Core' | 'Elective';
  description?: string;
  isDefault?: boolean;
}

export interface EducationalLevelSection {
  id: string;
  name: string;
  description: string;
  learningAreas: LearningAreaItem[];
}

const STORAGE_KEY = 'munyaka_flat_learning_areas_v2';

const DEFAULT_LEVELS: EducationalLevelSection[] = [
  {
    id: 'pre-primary',
    name: 'Pre-Primary Learning Areas',
    description: 'PP1 & PP2 foundational curriculum areas',
    learningAreas: [
      { id: 'pp-1', name: 'Mathematical Activities', periodsPerWeek: 5, type: 'Core', description: 'Number work, measurement, geometry, and spatial awareness', isDefault: true },
      { id: 'pp-2', name: 'Language Activities', periodsPerWeek: 5, type: 'Core', description: 'Listening, speaking, reading readiness, and pre-writing', isDefault: true },
      { id: 'pp-3', name: 'Environmental Activities', periodsPerWeek: 4, type: 'Core', description: 'Natural environment, health, and hygiene', isDefault: true },
      { id: 'pp-4', name: 'Psychomotor & Creative Activities', periodsPerWeek: 5, type: 'Core', description: 'Fine motor skills, movement, music, and art', isDefault: true },
      { id: 'pp-5', name: 'Religious Education (CRE/IRE/HRE)', periodsPerWeek: 2, type: 'Core', description: 'Moral values and spiritual foundation', isDefault: true },
    ],
  },
  {
    id: 'lower-primary',
    name: 'Lower Primary Learning Areas',
    description: 'Grades 1, 2, and 3 foundation subjects',
    learningAreas: [
      { id: 'lp-1', name: 'Literacy / English Language', periodsPerWeek: 5, type: 'Core', description: 'Reading, grammar, composition, and comprehension', isDefault: true },
      { id: 'lp-2', name: 'Kiswahili Language / Lugha ya Kiswahili', periodsPerWeek: 4, type: 'Core', description: 'Kusikiliza, kuzungumza, kusoma na kuandika', isDefault: true },
      { id: 'lp-3', name: 'Mathematics Activities', periodsPerWeek: 5, type: 'Core', description: 'Numbers, measurements, geometry, and basic arithmetic', isDefault: true },
      { id: 'lp-4', name: 'Environmental Activities', periodsPerWeek: 4, type: 'Core', description: 'Science, social studies, and environmental care', isDefault: true },
      { id: 'lp-5', name: 'Hygiene & Nutrition Activities', periodsPerWeek: 3, type: 'Core', description: 'Personal hygiene, food, and safe nutrition', isDefault: true },
      { id: 'lp-6', name: 'Religious Education (CRE/IRE/HRE)', periodsPerWeek: 3, type: 'Core', description: 'Christian, Islamic, or Hindu Religious Education', isDefault: true },
      { id: 'lp-7', name: 'Movement & Creative Activities', periodsPerWeek: 5, type: 'Core', description: 'Physical education, music, art, and crafts', isDefault: true },
    ],
  },
  {
    id: 'upper-primary',
    name: 'Upper Primary Learning Areas',
    description: 'Grades 4, 5, and 6 intermediate curriculum subjects',
    learningAreas: [
      { id: 'up-1', name: 'English', periodsPerWeek: 4, type: 'Core', description: 'Advanced grammar, literary appreciation, and writing', isDefault: true },
      { id: 'up-2', name: 'Kiswahili', periodsPerWeek: 4, type: 'Core', description: 'Fasihi, sarufi, na ukuzaji wa lugha', isDefault: true },
      { id: 'up-3', name: 'Mathematics', periodsPerWeek: 6, type: 'Core', description: 'Algebraic thinking, geometry, fractions, and statistics', isDefault: true },
      { id: 'up-4', name: 'Science and Technology', periodsPerWeek: 4, type: 'Core', description: 'Living things, environment, matter, and computing', isDefault: true },
      { id: 'up-5', name: 'Social Studies', periodsPerWeek: 3, type: 'Core', description: 'History, citizenship, geography, and resources', isDefault: true },
      { id: 'up-6', name: 'Agriculture & Nutrition', periodsPerWeek: 4, type: 'Core', description: 'Crop production, domestic animal rearing, and foods', isDefault: true },
      { id: 'up-7', name: 'Creative Arts', periodsPerWeek: 3, type: 'Core', description: 'Visual arts, performing arts, music, and drama', isDefault: true },
      { id: 'up-8', name: 'Religious Education (CRE/IRE/HRE)', periodsPerWeek: 3, type: 'Core', description: 'Moral and spiritual development', isDefault: true },
      { id: 'up-9', name: 'Indigenous Language', periodsPerWeek: 2, type: 'Elective', description: 'Local community language and cultural heritage', isDefault: true },
    ],
  },
  {
    id: 'junior-school',
    name: 'Junior School Learning Areas',
    description: 'Grades 7, 8, and 9 advanced junior secondary subjects',
    learningAreas: [
      { id: 'js-1', name: 'English', periodsPerWeek: 5, type: 'Core', description: 'Advanced literature, communication, and formal writing', isDefault: true },
      { id: 'js-2', name: 'Kiswahili', periodsPerWeek: 4, type: 'Core', description: 'Fasihi ya Kiswahili na mawasiliano ya kina', isDefault: true },
      { id: 'js-3', name: 'Mathematics', periodsPerWeek: 5, type: 'Core', description: 'Advanced arithmetic, algebra, and geometry', isDefault: true },
      { id: 'js-4', name: 'Integrated Science', periodsPerWeek: 4, type: 'Core', description: 'Physics, chemistry, and biology combined', isDefault: true },
      { id: 'js-5', name: 'Social Studies', periodsPerWeek: 3, type: 'Core', description: 'World history, geography, and governance', isDefault: true },
      { id: 'js-6', name: 'Pre-Technical Studies', periodsPerWeek: 4, type: 'Core', description: 'Technical drawing, woodwork, metalwork, and electricity', isDefault: true },
      { id: 'js-7', name: 'Agriculture', periodsPerWeek: 3, type: 'Core', description: 'Agribusiness, soil science, and modern farming', isDefault: true },
      { id: 'js-8', name: 'Business Studies', periodsPerWeek: 3, type: 'Core', description: 'Entrepreneurship, bookkeeping, and economics', isDefault: true },
      { id: 'js-9', name: 'Religious Education (CRE/IRE/HRE)', periodsPerWeek: 3, type: 'Core', description: 'Ethical and religious studies', isDefault: true },
      { id: 'js-10', name: 'Health Education', periodsPerWeek: 2, type: 'Core', description: 'First aid, human anatomy, and wellness', isDefault: true },
      { id: 'js-11', name: 'Visual & Performing Arts', periodsPerWeek: 3, type: 'Elective', description: 'Advanced arts, design, and performance', isDefault: true },
      { id: 'js-12', name: 'Foreign Language (French/German/Mandarin/Arabic)', periodsPerWeek: 3, type: 'Elective', description: 'International languages', isDefault: true },
    ],
  },
];

export default function LearningAreasPage() {
  const [sections, setSections] = useState<EducationalLevelSection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      } catch {}
    }
    return DEFAULT_LEVELS;
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [targetSectionId, setTargetSectionId] = useState<string>('pre-primary');
  const [targetAreaId, setTargetAreaId] = useState<string>('');

  const [name, setName] = useState('');
  const [periods, setPeriods] = useState('4');
  const [type, setType] = useState<'Core' | 'Elective'>('Core');
  const [description, setDescription] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('pre-primary');

  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    window.dispatchEvent(new Event('learning_areas_updated'));
    notifyDataChanged('munyaka_learning_areas');
  }, [sections]);

  const handleAddLearningArea = () => {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
      showError('Please enter a learning area name.');
      return;
    }

    const sec = sections.find((s) => s.id === selectedSectionId);
    if (sec && sec.learningAreas.some((la) => la.name.toLowerCase() === trimmed.toLowerCase())) {
      showError(`A subject named "${trimmed}" already exists in ${sec.name}.`);
      return;
    }

    const newArea: LearningAreaItem = {
      id: `la-${Date.now()}`,
      name: trimmed,
      periodsPerWeek: parseInt(periods, 10) || 4,
      type,
      description: String(description || '').trim() || undefined,
      isDefault: false,
    };

    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId
          ? { ...s, learningAreas: [...s.learningAreas, newArea] }
          : s
      )
    );

    setIsAddOpen(false);
    setName('');
    setDescription('');
    setPeriods('4');
    setType('Core');
    showSuccess(`Successfully added "${trimmed}"!`);
  };

  const handleEditLearningArea = () => {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
      showError('Please enter a learning area name.');
      return;
    }

    const sec = sections.find((s) => s.id === targetSectionId);
    if (
      sec &&
      sec.learningAreas.some(
        (la) => la.name.toLowerCase() === trimmed.toLowerCase() && la.id !== targetAreaId
      )
    ) {
      showError(`A subject named "${trimmed}" already exists in ${sec.name}.`);
      return;
    }

    setSections((prev) =>
      prev.map((s) =>
        s.id === targetSectionId
          ? {
              ...s,
              learningAreas: s.learningAreas.map((la) =>
                la.id === targetAreaId
                  ? {
                      ...la,
                      name: trimmed,
                      periodsPerWeek: parseInt(periods, 10) || 4,
                      type,
                      description: String(description || '').trim() || undefined,
                    }
                  : la
              ),
            }
          : s
      )
    );

    setIsEditOpen(false);
    setTargetAreaId('');
    setName('');
    setDescription('');
    setPeriods('4');
    setType('Core');
    showSuccess(`Successfully updated "${trimmed}"!`);
  };

  const startEdit = (area: LearningAreaItem, sectionId: string) => {
    setTargetAreaId(area.id);
    setTargetSectionId(sectionId);
    setName(area.name);
    setPeriods(String(area.periodsPerWeek || 4));
    setType(area.type);
    setDescription(area.description || '');
    setIsEditOpen(true);
  };

  const startDelete = (areaId: string, sectionId: string) => {
    setTargetAreaId(areaId);
    setTargetSectionId(sectionId);
    setAuthPassword('');
    setAuthError('');
    setIsAuthOpen(true);
  };

  const confirmDelete = async () => {
    if (!authPassword.trim()) {
      setAuthError('Admin password is required');
      return;
    }

    setIsVerifying(true);
    setAuthError('');
    await new Promise((r) => setTimeout(r, 400));

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';
    if (authPassword === currentAdminPass) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === targetSectionId
            ? {
                ...s,
                learningAreas: s.learningAreas.filter((la) => la.id !== targetAreaId),
              }
            : s
        )
      );
      setIsAuthOpen(false);
      setTargetAreaId('');
      setAuthPassword('');
      showSuccess('Learning area removed successfully.');
    } else {
      setAuthError('Invalid admin password');
      showError('Authorization failed');
    }
    setIsVerifying(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-12 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Learning Area Manager</h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete CBC subject directory grouped strictly by the four main educational levels.
            </p>
          </div>
        </div>
        <Button
          className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-bold"
          onClick={() => {
            setSelectedSectionId('pre-primary');
            setName('');
            setDescription('');
            setPeriods('4');
            setType('Core');
            setIsAddOpen(true);
          }}
        >
          <Plus size={18} /> Add Learning Area
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-100 rounded-3xl p-5 flex items-start gap-4">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl shrink-0 shadow-md shadow-indigo-200">
          <BookOpen size={20} />
        </div>
        <div>
          <h3 className="font-bold text-indigo-900 text-sm">Four Main Educational Level Sections</h3>
          <p className="text-xs text-indigo-700/80 mt-0.5 leading-relaxed">
            All subjects are grouped directly under Pre-Primary, Lower Primary, Upper Primary, and Junior School. No intermediate grouping banners or tabs are used.
          </p>
        </div>
      </div>

      {/* Four Distinct Educational Level Sections */}
      <div className="space-y-16">
        {sections.map((section) => (
          <div key={section.id} className="space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-9 bg-indigo-600 rounded-full" />
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{section.name}</h2>
                  <p className="text-xs text-slate-500 font-medium">{section.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-indigo-50/60 text-indigo-700 border-indigo-200 font-bold px-3 py-1 text-xs rounded-xl">
                  {section.learningAreas.length} {section.learningAreas.length === 1 ? 'Subject' : 'Subjects'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold gap-1.5 h-9 px-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setName('');
                    setDescription('');
                    setPeriods('4');
                    setType('Core');
                    setIsAddOpen(true);
                  }}
                >
                  <Plus size={14} /> Add to {section.name.replace(' Learning Areas', '')}
                </Button>
              </div>
            </div>

            {/* Subject Cards Grid */}
            {section.learningAreas.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">No subjects listed in {section.name}.</p>
                <p className="text-xs mt-1">Click &ldquo;Add&rdquo; to add a learning area.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {section.learningAreas.map((area) => (
                  <Card
                    key={area.id}
                    className="border-none shadow-sm hover:shadow-md transition-all rounded-[1.75rem] bg-white group overflow-hidden border border-slate-100 flex flex-col justify-between"
                  >
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              className={
                                area.type === 'Core'
                                  ? 'bg-emerald-50 text-emerald-700 font-bold border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 font-bold border-amber-100'
                              }
                            >
                              {area.type}
                            </Badge>
                            {area.isDefault && (
                              <Badge className="bg-slate-50 text-slate-500 font-bold border border-slate-200 gap-1 text-[10px]">
                                <Sparkles size={10} className="text-indigo-500" /> CBC Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => startEdit(area, section.id)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => startDelete(area.id, section.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {area.name}
                        </h3>

                        {area.description ? (
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                            {area.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic mt-2">No description provided.</p>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Weekly Allocation
                        </span>
                        <Badge variant="outline" className="font-bold text-slate-700 bg-slate-50 px-3 py-1 text-xs rounded-xl">
                          {area.periodsPerWeek} Periods / Wk
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Add Learning Area Modal ── */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Learning Area"
        description="Add a new subject or learning area to the CBC curriculum."
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-100"
              onClick={handleAddLearningArea}
            >
              Add Learning Area
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Educational Level Section</Label>
            <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select level section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Subject / Learning Area Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Visual Arts & Crafts"
              className="rounded-xl h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Periods Per Week</Label>
              <Input
                type="number"
                value={periods}
                onChange={(e) => setPeriods(e.target.value)}
                placeholder="4"
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Classification</Label>
              <Select value={type} onValueChange={(val: 'Core' | 'Elective') => setType(val)}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Core">Core Subject</SelectItem>
                  <SelectItem value="Elective">Elective Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Description / Scope (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Practical skills and creative expression"
              className="rounded-xl h-12"
            />
          </div>
        </div>
      </Modal>

      {/* ── Edit Learning Area Modal ── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Learning Area"
        description="Modify subject details and curriculum settings."
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-100"
              onClick={handleEditLearningArea}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Educational Level Section</Label>
            <Select value={targetSectionId} onValueChange={setTargetSectionId}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select level section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Subject / Learning Area Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics"
              className="rounded-xl h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Periods Per Week</Label>
              <Input
                type="number"
                value={periods}
                onChange={(e) => setPeriods(e.target.value)}
                placeholder="4"
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Classification</Label>
              <Select value={type} onValueChange={(val: 'Core' | 'Elective') => setType(val)}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Core">Core Subject</SelectItem>
                  <SelectItem value="Elective">Elective Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Description / Scope (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Number work, measurement, geometry"
              className="rounded-xl h-12"
            />
          </div>
        </div>
      </Modal>

      {/* ── Admin Password Authorization Modal ── */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Admin Authorization Required"
        description="Please enter the admin password to remove this learning area."
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsAuthOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-lg shadow-red-100"
              onClick={confirmDelete}
              disabled={isVerifying}
            >
              Confirm Deletion
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100">
              {authError}
            </div>
          )}
          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Admin Password</Label>
            <Input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Enter admin password"
              className="rounded-xl h-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmDelete();
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
