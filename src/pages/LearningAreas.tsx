"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { BookOpen, Plus, Trash2, Edit3, Layers, GraduationCap, CheckCircle2, X } from 'lucide-react';
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
      { id: "pp-1", name: "Mathematical Activities", periodsPerWeek: 5, type: "Core", description: "Basic number concepts and shapes" },
      { id: "pp-2", name: "Language Activities", periodsPerWeek: 5, type: "Core", description: "Pre-reading and communication skills" },
      { id: "pp-3", name: "Environmental Activities", periodsPerWeek: 4, type: "Core", description: "Exploring the immediate environment" },
      { id: "pp-4", name: "Psychomotor and Creative Activities", periodsPerWeek: 5, type: "Core", description: "Art, craft, music, and physical play" },
      { id: "pp-5", name: "Religious Education Activities", periodsPerWeek: 2, type: "Core", description: "Moral and spiritual values" }
    ]
  },
  {
    id: "lower-primary",
    name: "Lower Primary",
    description: "Foundational learning areas for Grades 1, 2, and 3",
    learningAreas: [
      { id: "lp-1", name: "Mathematics Activities", periodsPerWeek: 5, type: "Core", description: "Arithmetic and problem solving" },
      { id: "lp-2", name: "English Language Activities", periodsPerWeek: 5, type: "Core", description: "Reading, writing, and grammar" },
      { id: "lp-3", name: "Kiswahili Language Activities / KSL", periodsPerWeek: 4, type: "Core", description: "Lugha na kusoma" },
      { id: "lp-4", name: "Environmental Activities", periodsPerWeek: 4, type: "Core", description: "Science, geography, and social studies basics" },
      { id: "lp-5", name: "Hygiene and Nutrition Activities", periodsPerWeek: 2, type: "Core", description: "Healthy living and personal care" },
      { id: "lp-6", name: "Movement and Creative Activities", periodsPerWeek: 4, type: "Core", description: "Physical education, art, and music" },
      { id: "lp-7", name: "Religious Education (CRE/IRE/HRE)", periodsPerWeek: 3, type: "Core", description: "Spiritual and moral guidance" }
    ]
  },
  {
    id: "upper-primary",
    name: "Upper Primary",
    description: "Intermediate learning areas for Grades 4, 5, and 6",
    learningAreas: [
      { id: "up-1", name: "Mathematics", periodsPerWeek: 5, type: "Core", description: "Advanced arithmetic, geometry, and algebra" },
      { id: "up-2", name: "English", periodsPerWeek: 5, type: "Core", description: "Comprehension, creative writing, and literature" },
      { id: "up-3", name: "Kiswahili / Kenya Sign Language", periodsPerWeek: 4, type: "Core", description: "Insha, sarufi na fasihi simulizi" },
      { id: "up-4", name: "Science and Technology", periodsPerWeek: 4, type: "Core", description: "Scientific inquiry, digital literacy, and coding" },
      { id: "up-5", name: "Agriculture and Nutrition", periodsPerWeek: 4, type: "Core", description: "Farming practices and food preparation" },
      { id: "up-6", name: "Creative Arts (Art, Craft & Music)", periodsPerWeek: 3, type: "Core", description: "Visual arts, crafts, and performing arts" },
      { id: "up-7", name: "Social Studies", periodsPerWeek: 3, type: "Core", description: "History, citizenship, and geography" },
      { id: "up-8", name: "Religious Education (CRE/IRE/HRE)", periodsPerWeek: 2, type: "Core", description: "Moral values and spiritual growth" }
    ]
  },
  {
    id: "junior-school",
    name: "Junior School",
    description: "Secondary preparation learning areas for Grades 7, 8, and 9",
    learningAreas: [
      { id: "js-1", name: "Mathematics", periodsPerWeek: 5, type: "Core", description: "Secondary-level mathematics foundations" },
      { id: "js-2", name: "English", periodsPerWeek: 5, type: "Core", description: "Advanced communication and literary analysis" },
      { id: "js-3", name: "Kiswahili / Kenya Sign Language", periodsPerWeek: 4, type: "Core", description: "Uandishi wa insha na uchambuzi wa vitabu" },
      { id: "js-4", name: "Integrated Science", periodsPerWeek: 5, type: "Core", description: "Physics, Chemistry, and Biology concepts" },
      { id: "js-5", name: "Health Education", periodsPerWeek: 2, type: "Core", description: "Community health, hygiene, and wellness" },
      { id: "js-6", name: "Pre-Technical Studies", periodsPerWeek: 4, type: "Core", description: "Engineering, woodwork, metalwork, and technical drawing" },
      { id: "js-7", name: "Social Studies", periodsPerWeek: 3, type: "Core", description: "Global geography, history, and government" },
      { id: "js-8", name: "Agriculture", periodsPerWeek: 3, type: "Core", description: "Crop production, animal husbandry, and agribusiness" },
      { id: "js-9", name: "Business Studies", periodsPerWeek: 3, type: "Core", description: "Entrepreneurship, accounting, and economics" },
      { id: "js-10", name: "Computer Science", periodsPerWeek: 3, type: "Elective", description: "Programming, networking, and hardware basics" },
      { id: "js-11", name: "Foreign Languages (French/German)", periodsPerWeek: 3, type: "Elective", description: "Introductory foreign language skills" }
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

  // Form states
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
        return {
          ...cluster,
          learningAreas: [...cluster.learningAreas, newArea]
        };
      }
      return cluster;
    });

    setClusters(updatedClusters);
    setIsOpen(false);
    setName("");
    setDescription("");
    setPeriods("4");
    setType("Core");
    showSuccess(`Successfully added "${newArea.name}" to ${clusters.find(c => c.id === selectedClusterId)?.name}!`);
  };

  const handleDeleteLearningArea = (clusterId: string, areaId: string, areaName: string) => {
    const updatedClusters = clusters.map(cluster => {
      if (cluster.id === clusterId) {
        return {
          ...cluster,
          learningAreas: cluster.learningAreas.filter(la => la.id !== areaId)
        };
      }
      return cluster;
    });

    setClusters(updatedClusters);
    showSuccess(`Removed "${areaName}" successfully.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learning Area Manager</h1>
          <p className="text-muted-foreground">Manage CBC subjects, lessons per week, and core/elective classifications.</p>
        </div>
        <Button 
          className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => {
            setSelectedClusterId(activeTab);
            setIsOpen(true);
          }}
        >
          <Plus size={18} /> Add Learning Area
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8 flex overflow-x-auto">
          {clusters.map(cluster => (
            <TabsTrigger 
              key={cluster.id} 
              value={cluster.id} 
              className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-bold shrink-0 text-xs"
            >
              {cluster.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {clusters.map(cluster => (
          <TabsContent key={cluster.id} value={cluster.id} className="space-y-6">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-indigo-900">{cluster.name} Cluster</h3>
                <p className="text-sm text-indigo-700/80">{cluster.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cluster.learningAreas.map(area => (
                <Card key={area.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group relative">
                  <CardContent className="p-8 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={
                          area.type === 'Core' 
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold" 
                            : "bg-amber-50 text-amber-700 hover:bg-amber-50 border-none font-bold"
                        }>
                          {area.type}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteLearningArea(cluster.id, area.id, area.name)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      <h4 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                        {area.name}
                      </h4>
                      
                      {area.description && (
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          {area.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lessons / Week</span>
                      <Badge variant="outline" className="rounded-lg font-black text-slate-700 border-slate-200 bg-slate-50 px-2.5 py-1">
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

      {/* Add Learning Area Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 relative">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Learning Area</DialogTitle>
            <DialogDescription>
              Create a new subject or learning area for a specific CBC cluster.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddLearningArea} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>CBC Cluster</Label>
              <Select value={selectedClusterId} onValueChange={setSelectedClusterId}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select Cluster" />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Learning Area Name</Label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Creative Arts, Pre-Technical Studies"
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Periods per Week</Label>
                <Input 
                  type="number"
                  value={periods}
                  onChange={(e) => setPeriods(e.target.value)}
                  placeholder="e.g. 4"
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Core">Core Subject</SelectItem>
                    <SelectItem value="Elective">Elective Subject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description / Scope (Optional)</Label>
              <Input 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Basic programming and digital literacy"
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
                Add Learning Area
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearningAreas;