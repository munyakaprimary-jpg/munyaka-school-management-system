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
import { Plus, Trash2, GraduationCap, AlertCircle, Lock, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Tabs, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Added missing Tabs import

interface LearningArea {
  id: string;
  name: string;
  periodsPerWeek: number;
  type: 'Core' | 'Elective';
  description?: string;
}

interface ClusterData {
  id: string;
  name: string;
  description: string;
  learningAreas: LearningArea[];
}

const DEFAULT_CLUSTERS: ClusterData[] = [
  { id: "pre-primary", name: "Pre-Primary", description: "Early childhood development learning areas", learningAreas: [] },
  { id: "lower-primary", name: "Lower Primary", description: "Foundational learning areas for Grades 1, 2, and 3", learningAreas: [] },
  { id: "upper-primary", name: "Upper Primary", description: "Intermediate learning areas for Grades 4, 5, and 6", learningAreas: [] },
  { id: "junior-school", name: "Junior School", description: "Secondary preparation learning areas", learningAreas: [] }
];

const LearningAreas = () => {
  const [clusters, setClusters] = useState<ClusterData[]>(() => {
    const saved = localStorage.getItem('munyaka_learning_areas');
    return saved ? JSON.parse(saved) : DEFAULT_CLUSTERS;
  });
  const [activeTab, setActiveTab] = useState<string>("pre-primary");
  const [isOpen, setIsOpen] = useState(false);

  // State for learning area deletion with admin auth
  const [deleteAreaId, setDeleteAreaId] = useState<string | null>(null);
  const [deleteAreaName, setDeleteAreaName] = useState<string | null>(null);
  const [deleteClusterId, setDeleteClusterId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedClusterId, setSelectedClusterId] = useState<string>("pre-primary");
  const [name, setName] = useState("");
  const [periods, setPeriods] = useState("4");
  const [type, setType] = useState<'Core' | 'Elective'>("Core");
  const [description, setDescription] = useState("");

  useEffect(() => {
    localStorage.setItem('munyaka_learning_areas', JSON.stringify(clusters));
  }, [clusters]);

  const handleAddLearningArea = () => {
    if (!name.trim()) return;
    const newArea: LearningArea = { 
      id: `la-${Date.now()}`, 
      name: name.trim(), 
      periodsPerWeek: parseInt(periods) || 4, 
      type, 
      description: description.trim() || undefined 
    };
    setClusters(clusters.map(c => 
      c.id === selectedClusterId 
        ? { ...c, learningAreas: [...c.learningAreas, newArea] } 
        : c
    ));
    setIsOpen(false);
    setName(""); 
    setDescription(""); 
    setPeriods("4"); 
    setType("Core");
    showSuccess(`Successfully added "${newArea.name}"!`);
  };

  const handleDeleteClick = (area: LearningArea, clusterId: string) => {
    setDeleteAreaId(area.id);
    setDeleteAreaName(area.name);
    setDeleteClusterId(clusterId);
    setDeletePassword("");
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }

    setIsDeleting(true);
    
    // Simulate async verification
    setTimeout(() => {
      const adminPassword = localStorage.getItem('munyaka_admin_pass') || 'admin123';
      
      if (deletePassword === adminPassword) {
        // Perform deletion
        setClusters(prevClusters => 
          prevClusters.map(cluster => 
            cluster.id === deleteClusterId 
              ? { 
                  ...cluster, 
                  learningAreas: cluster.learningAreas.filter(area => area.id !== deleteAreaId) 
                } 
              : cluster
          )
        );
        
        showSuccess(`Successfully deleted "${deleteAreaName}"`);
        setIsDeleteModalOpen(false);
        setIsDeleting(false);
      } else {
        setDeleteError("Invalid admin password");
        setIsDeleting(false);
      }
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learning Area Manager</h1>
            <p className="text-muted-foreground">Manage CBC subjects and lesson classifications.</p>
          </div>
        </div>
        <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={() => { setSelectedClusterId(activeTab); setIsOpen(true); }}>
          <Plus size={18} /> Add Learning Area
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8 flex overflow-x-auto">
          {clusters.map(c => <TabsTrigger key={c.id} value={c.id} className="rounded-xl px-6 h-full font-bold shrink-0 text-xs">{c.name}</TabsTrigger>)}
        </TabsList>
        {clusters.map(cluster => (
          <TabsContent key={cluster.id} value={cluster.id} className="space-y-6">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><GraduationCap size={24} /></div>
              <div><h3 className="font-bold text-indigo-900">{cluster.name} Cluster</h3><p className="text-sm text-indigo-700/80">{cluster.description}</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cluster.learningAreas.map(area => (
                <Card key={area.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white group overflow-hidden">
                  <CardContent className="p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={area.type === 'Core' ? "bg-emerald-50 text-emerald-700 font-bold" : "bg-amber-50 text-amber-700 font-bold"}>{area.type}</Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 h-9 w-9"
                          onClick={() => handleDeleteClick(area, cluster.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                        {area.name}
                      </h4>
                      {area.description && <p className="text-xs text-slate-500 leading-relaxed mb-4">{area.description}</p>}
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lessons / Week</span>
                      <Badge variant="outline" className="rounded-lg font-bold text-slate-700 bg-slate-50 px-2.5 py-1">{area.periodsPerWeek} Periods</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Learning Area"
        description="Create a new subject or learning area."
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100" onClick={handleAddLearningArea}>Add Learning Area</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>CBC Cluster</Label>
            <Select value={selectedClusterId} onValueChange={setSelectedClusterId}>
              <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select Cluster" /></SelectTrigger>
              <SelectContent>{clusters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Learning Area Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Creative Arts" className="rounded-xl h-12" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Periods per Week</Label>
              <Input type="number" value={periods} onChange={(e) => setPeriods(e.target.value)} placeholder="e.g. 4" className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label>Classification</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent><SelectItem value="Core">Core Subject</SelectItem><SelectItem value="Elective">Elective Subject</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Basic programming" className="rounded-xl h-12" />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal with Admin Password */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteAreaId(null);
          setDeleteAreaName(null);
          setDeleteClusterId(null);
          setDeletePassword("");
          setDeleteError("");
        }}
        title="Confirm Deletion"
        description={`Are you sure you want to delete "${deleteAreaName}"? This action requires admin authorization.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteAreaId(null);
              setDeleteAreaName(null);
              setDeleteClusterId(null);
              setDeletePassword("");
              setDeleteError("");
            }} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className={`rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 ${isDeleting ? 'opacity-50' : ''}`}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={14} /> {deleteError}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admin Password</Label>
            <div className="relative">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  if (deleteError) setDeleteError("");
                }}
                placeholder="Enter admin password"
                className="w-full pl-3 pr-10 rounded-xl h-12 bg-slate-50 border-none font-bold text-lg focus:bg-white"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setDeletePassword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                disabled={!deletePassword}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LearningAreas;