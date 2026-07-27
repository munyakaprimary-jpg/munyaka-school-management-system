"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Plus, Trash2, GraduationCap, X } from 'lucide-react';
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
  {
    id: "pre-primary",
    name: "Pre-Primary",
    description: "Early childhood development learning areas (PP1 & PP2)",
    learningAreas: [
      { id: "pp-1", name: "Mathematical Activities", periodsPerWeek: 5, type: "Core", description: "Basic number concepts" },
      { id: "pp-2", name: "Language Activities", periodsPerWeek: 5, type: "Core", description: "Pre-reading skills" },
      { id: "pp-3", name: "Environmental Activities", periodsPerWeek: 4, type: "Core", description: "Exploring environment" },
      { id: "pp-4", name: "Psychomotor Activities", periodsPerWeek: 5, type: "Core", description: "Art & music" },
      { id: "pp-5", name: "Religious Education", periodsPerWeek: 2, type: "Core", description: "Moral values" }
    ]
  },
  {
    id: "lower-primary",
    name: "Lower Primary",
    description: "Foundational learning areas for Grades 1-3",
    learningAreas: [
      { id: "lp-1", name: "Mathematics Activities", periodsPerWeek: 5, type: "Core", description: "Arithmetic" },
      { id: "lp-2", name: "English Language Activities", periodsPerWeek: 5, type: "Core", description: "Grammar & reading" },
      { id: "lp-3", name: "Kiswahili Language Activities", periodsPerWeek: 4, type: "Core", description: "Lugha na kusoma" },
      { id: "lp-4", name: "Environmental Activities", periodsPerWeek: 4, type: "Core", description: "Science & social" },
      { id: "lp-5", name: "Hygiene and Nutrition", periodsPerWeek: 2, type: "Core", description: "Personal care" }
    ]
  },
  {
    id: "upper-primary",
    name: "Upper Primary",
    description: "Intermediate learning areas for Grades 4-6",
    learningAreas: [
      { id: "up-1", name: "Mathematics", periodsPerWeek: 5, type: "Core", description: "Advanced arithmetic & geometry" },
      { id: "up-2", name: "English", periodsPerWeek: 5, type: "Core", description: "Comprehension & writing" },
      { id: "up-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core", description: "Sarufi na insha" },
      { id: "up-4", name: "Science and Technology", periodsPerWeek: 4, type: "Core", description: "Inquiry & digital skills" },
      { id: "up-5", name: "Agriculture and Nutrition", periodsPerWeek: 4, type: "Core", description: "Farming & food prep" }
    ]
  },
  {
    id: "junior-school",
    name: "Junior School",
    description: "Secondary preparation learning areas for Grades 7-9",
    learningAreas: [
      { id: "js-1", name: "Mathematics", periodsPerWeek: 5, type: "Core", description: "Secondary mathematics" },
      { id: "js-2", name: "English", periodsPerWeek: 5, type: "Core", description: "Advanced literature" },
      { id: "js-3", name: "Kiswahili", periodsPerWeek: 4, type: "Core", description: "Uandishi na uchambuzi" },
      { id: "js-4", name: "Integrated Science", periodsPerWeek: 5, type: "Core", description: "Physics, Chem & Bio" },
      { id: "js-5", name: "Pre-Technical Studies", periodsPerWeek: 4, type: "Core", description: "Engineering & drawing" }
    ]
  }
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

  const handleAddLearningArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newArea: LearningArea = {
      id: `la-${Date.now()}`,
      name: name.trim(),
      periodsPerWeek: parseInt(periods) || 4,
      type,
      description: description.trim() || undefined
    };

    const updatedClusters = clusters.map(cluster => {
      if (cluster.id === selectedClusterId) {
        return { ...cluster, learningAreas: [...cluster.learningAreas, newArea] };
      }
      return cluster;
    });

    setClusters(updatedClusters);
    setIsOpen(false);
    setName("");
    setDescription("");
    showSuccess(`Added "${newArea.name}"!`);
  };

  const handleDeleteLearningArea = (clusterId: string, areaId: string, areaName: string) => {
    const updatedClusters = clusters.map(cluster => {
      if (cluster.id === clusterId) {
        return { ...cluster, learningAreas: cluster.learningAreas.filter(la => la.id !== areaId) };
      }
      return cluster;
    });
    setClusters(updatedClusters);
    showSuccess(`Removed "${areaName}".`);
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Learning Area Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage CBC subjects and lesson allocations.</p>
        </div>
        <Button 
          className="rounded-xl gap-1.5 h-9 px-4 text-xs font-semibold shadow-sm bg-indigo-600 hover:bg-indigo-700"
          onClick={() => {
            setSelectedClusterId(activeTab);
            setIsOpen(true);
          }}
        >
          <Plus size={15} /> Add Learning Area
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border h-10 mb-4 flex overflow-x-auto">
          {clusters.map(cluster => (
            <TabsTrigger 
              key={cluster.id} 
              value={cluster.id} 
              className="rounded-lg px-5 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-semibold text-xs shrink-0"
            >
              {cluster.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {clusters.map(cluster => (
          <TabsContent key={cluster.id} value={cluster.id} className="space-y-4">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                <GraduationCap size={20} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-indigo-900">{cluster.name} Cluster</h3>
                <p className="text-[11px] text-indigo-700/80">{cluster.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cluster.learningAreas.map(area => (
                <Card key={area.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white overflow-hidden group">
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={
                          area.type === 'Core' 
                            ? "bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 border-none" 
                            : "bg-amber-50 text-amber-700 font-bold text-[10px] px-2 py-0.5 border-none"
                        }>
                          {area.type}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-lg text-slate-300 hover:text-red-500 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteLearningArea(cluster.id, area.id, area.name)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
                        {area.name}
                      </h4>
                      
                      {area.description && (
                        <p className="text-xs text-slate-500 leading-normal mb-3">
                          {area.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-50 flex justify-between items-center mt-auto">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lessons / Week</span>
                      <Badge variant="outline" className="rounded-md font-bold text-[11px] text-slate-700 border-slate-200 bg-slate-50 px-2 py-0.5">
                        {area.periodsPerWeek} Periods
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5 relative">
          <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full h-8 w-8 text-slate-400" onClick={() => setIsOpen(false)}>
            <X size={16} />
          </Button>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Learning Area</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLearningArea} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Learning Area Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Creative Arts" required className="rounded-xl h-10 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Periods per Week</Label>
                <Input type="number" value={periods} onChange={(e) => setPeriods(e.target.value)} required className="rounded-xl h-10 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Classification</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger className="rounded-xl h-10 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="Elective">Elective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" className="rounded-xl h-9 text-xs" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl h-9 text-xs bg-indigo-600 hover:bg-indigo-700">Add Area</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearningAreas;