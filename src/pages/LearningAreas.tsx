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
import { Plus, Trash2, GraduationCap, Sparkles, Edit, BookOpen } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { DEFAULT_CBC_CLUSTERS, buildDefaultClusters } from '@/data/initialSeedData';
import { notifyDataChanged } from '@/utils/storage';
import type { LearningArea, ClusterData } from '@/types/assessments';

const STORAGE_KEY = 'munyaka_learning_areas';

const hydrateClusters = (savedClusters: ClusterData[]): ClusterData[] => {
  return DEFAULT_CBC_CLUSTERS.map((defaultCluster) => {
    const saved = savedClusters.find((c) => c.id === defaultCluster.id);
    if (saved && saved.learningAreas.length > 0) {
      return {
        ...saved,
        description: defaultCluster.description,
        learningAreas: saved.learningAreas.map((la) => ({
          ...la,
          isDefault: defaultCluster.learningAreas.some(
            (d) => d.name.toLowerCase() === la.name.toLowerCase()
          )
            ? true
            : la.isDefault ?? false,
        })),
      };
    }
    return {
      ...defaultCluster,
      description: defaultCluster.description ?? '',
      learningAreas: defaultCluster.learningAreas.map((area, index) => ({
        id: `default-${defaultCluster.id}-${index}-${Date.now().toString(36)}`,
        name: area.name,
        periodsPerWeek: 4,
        type: (area as any).type || 'Core',
        isDefault: true,
      })),
    };
  });
};

export default function LearningAreasPage() {
  const [clusters, setClusters] = useState<ClusterData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return hydrateClusters(JSON.parse(saved) as ClusterData[]);
      } catch {
        return buildDefaultClusters() as unknown as ClusterData[];
      }
    }
    return buildDefaultClusters() as unknown as ClusterData[];
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [targetClusterId, setTargetClusterId] = useState<string>('pre-primary');
  const [targetAreaId, setTargetAreaId] = useState<string>('');
  
  const [name, setName] = useState('');
  const [periods, setPeriods] = useState('4');
  const [type, setType] = useState<'Core' | 'Elective'>('Core');
  const [description, setDescription] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState<string>('pre-primary');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clusters));
    window.dispatchEvent(new Event('learning_areas_updated'));
    notifyDataChanged('munyaka_learning_areas');
  }, [clusters]);

  const handleAddLearningArea = () => {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      showError('Please enter a learning area name.');
      return;
    }

    const cluster = clusters.find((c) => c.id === selectedClusterId);
    if (cluster && cluster.learningAreas.some((la) => la.name.toLowerCase() === trimmedName.toLowerCase())) {
      showError(`A learning area named "${trimmedName}" already exists in ${cluster.name}.`);
      return;
    }

    const newArea: LearningArea = {
      id: `la-${Date.now()}`,
      name: trimmedName,
      periodsPerWeek: parseInt(periods, 10) || 4,
      type,
      description: String(description || '').trim() || undefined,
      isDefault: false,
    };

    setClusters((prev) =>
      prev.map((c) =>
        c.id === selectedClusterId
          ? { ...c, learningAreas: [...c.learningAreas, newArea] }
          : c
      )
    );

    setIsAddOpen(false);
    setName('');
    setDescription('');
    setPeriods('4');
    setType('Core');
    showSuccess(`Successfully added "${trimmedName}"!`);
  };

  const handleEditLearningArea = () => {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      showError('Please enter a learning area name.');
      return;
    }

    const cluster = clusters.find((c) => c.id === targetClusterId);
    if (
      cluster &&
      cluster.learningAreas.some(
        (la) => la.name.toLowerCase() === trimmedName.toLowerCase() && la.id !== targetAreaId
      )
    ) {
      showError(`A learning area named "${trimmedName}" already exists in ${cluster.name}.`);
      return;
    }

    setClusters((prev) =>
      prev.map((c) =>
        c.id === targetClusterId
          ? {
              ...c,
              learningAreas: c.learningAreas.map((la) =>
                la.id === targetAreaId
                  ? {
                      ...la,
                      name: trimmedName,
                      periodsPerWeek: parseInt(periods, 10) || 4,
                      type,
                      description: String(description || '').trim() || undefined,
                    }
                  : la
              ),
            }
          : c
      )
    );

    setIsEditOpen(false);
    setTargetAreaId('');
    setName('');
    setDescription('');
    setPeriods('4');
    setType('Core');
    showSuccess(`Successfully updated "${trimmedName}"!`);
  };

  const startEdit = (area: LearningArea, clusterId: string) => {
    setTargetAreaId(area.id);
    setTargetClusterId(clusterId);
    setName(area.name);
    setPeriods(String(area.periodsPerWeek || 4));
    setType(area.type);
    setDescription(area.description || '');
    setIsEditOpen(true);
  };

  const startDelete = (areaId: string, clusterId: string) => {
    setTargetAreaId(areaId);
    setTargetClusterId(clusterId);
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
      setClusters((prev) =>
        prev.map((c) =>
          c.id === targetClusterId
            ? {
                ...c,
                learningAreas: c.learningAreas.filter((la) => la.id !== targetAreaId),
              }
            : c
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
              Complete CBC subject directory organized in flat sections by educational level.
            </p>
          </div>
        </div>
        <Button
          className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-bold"
          onClick={() => {
            setSelectedClusterId('pre-primary');
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
          <h3 className="font-bold text-indigo-900 text-sm">Flat Educational Level Directory</h3>
          <p className="text-xs text-indigo-700/80 mt-0.5 leading-relaxed">
            Subjects are displayed directly under clean headings for Pre-Primary, Lower Primary, Upper Primary, and Junior School. Manage periods, classifications, and custom subjects instantly.
          </p>
        </div>
      </div>

      {/* Flat Sections by Educational Level */}
      <div className="space-y-16">
        {clusters.map((cluster) => (
          <div key={cluster.id} className="space-y-6">
            {/* Clean Educational Level Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 bg-indigo-600 rounded-full" />
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{cluster.name}</h2>
                  <p className="text-xs text-slate-500 font-medium">{cluster.description || 'CBC curriculum level'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 font-bold px-3 py-1 text-xs rounded-xl">
                  {cluster.learningAreas.length} {cluster.learningAreas.length === 1 ? 'Subject' : 'Subjects'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold gap-1.5 h-9 px-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  onClick={() => {
                    setSelectedClusterId(cluster.id);
                    setName('');
                    setDescription('');
                    setPeriods('4');
                    setType('Core');
                    setIsAddOpen(true);
                  }}
                >
                  <Plus size={14} /> Add Subject
                </Button>
              </div>
            </div>

            {/* Subject Cards Grid */}
            {cluster.learningAreas.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">No subjects listed under {cluster.name}.</p>
                <p className="text-xs mt-1">Click &ldquo;Add Subject&rdquo; to add a learning area.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cluster.learningAreas.map((area) => (
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
                              onClick={() => startEdit(area, cluster.id)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => startDelete(area.id, cluster.id)}
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
            <Label className="font-bold text-slate-700">Educational Level</Label>
            <Select value={selectedClusterId} onValueChange={setSelectedClusterId}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {clusters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
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
            <Label className="font-bold text-slate-700">Educational Level</Label>
            <Select value={targetClusterId} onValueChange={setTargetClusterId}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {clusters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
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
