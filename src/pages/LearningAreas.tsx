"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

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
    const newArea: LearningArea = { id: `la-${Date.now()}`, name: name.trim(), periodsPerWeek: parseInt(periods) || 4, type, description: description.trim() || undefined };
    setClusters(clusters.map(c => c.id === selectedClusterId ? { ...c, learningAreas: [...c.learningAreas, newArea] } : c));
    setIsOpen(false);
    setName(""); setDescription(""); setPeriods("4"); setType("Core");
    showSuccess(`Successfully added "${newArea.name}"!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learning Area Manager</h1>
          <p className="text-muted-foreground">Manage CBC subjects and lesson classifications.</p>
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
                        <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={() => {
                          setClusters(clusters.map(c => c.id === cluster.id ? { ...c, learningAreas: c.learningAreas.filter(la => la.id !== area.id) } : c));
                          showSuccess(`Removed "${area.name}"`);
                        }}><Trash2 size={16} /></Button>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{area.name}</h4>
                      {area.description && <p className="text-xs text-slate-500 leading-relaxed mb-4">{area.description}</p>}
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lessons / Week</span>
                      <Badge variant="outline" className="rounded-lg font-black text-slate-700 bg-slate-50 px-2.5 py-1">{area.periodsPerWeek} Periods</Badge>
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
            <Label>Description / Scope (Optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Basic programming" className="rounded-xl h-12" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LearningAreas;