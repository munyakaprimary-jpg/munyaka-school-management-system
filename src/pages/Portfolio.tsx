"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Upload, Download, Image, FileText, Video, Music } from 'lucide-react';
import { showSuccess } from "@/utils/toast";

const Portfolio = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const artifacts = [
    { id: "1", title: "Grade 4 Science Project", type: "Project", student: "Brian Kiptoo", date: "Oct 20, 2024", status: "Published" },
    { id: "2", title: "Artwork: My Family", type: "Artwork", student: "Mary Atieno", date: "Oct 18, 2024", status: "Published" },
    { id: "3", title: "Math Quiz Results", type: "Assessment", student: "Emmanuel Maina", date: "Oct 15, 2024", status: "Published" },
    { id: "4", title: "Story: The Brave Lion", type: "Writing", student: "Sheila Chepkoech", date: "Oct 12, 2024", status: "Draft" },
  ];

  const filteredArtifacts = artifacts.filter(artifact => 
    artifact.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedType === 'all' || artifact.type === selectedType)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Portfolios</h1>
          <p className="text-muted-foreground">View and manage student learning artifacts and achievements.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Portfolios exported!')}>
            <Download size={18} />
            Export All
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => showSuccess('Artifact uploaded!')}>
            <Plus size={18} />
            Upload Artifact
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Image size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Images</p>
              <h3 className="text-2xl font-bold text-slate-900">24</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documents</p>
              <h3 className="text-2xl font-bold text-slate-900">18</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
              <Video size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Videos</p>
              <h3 className="text-2xl font-bold text-slate-900">6</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <Music size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Audio</p>
              <h3 className="text-2xl font-bold text-slate-900">3</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Learning Artifacts</CardTitle>
          <CardDescription>Student work samples and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search artifacts..." 
                  className="rounded-xl h-12 pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="rounded-xl h-12 w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Artwork">Artwork</SelectItem>
                  <SelectItem value="Assessment">Assessment</SelectItem>
                  <SelectItem value="Writing">Writing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-slate-500">
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Title</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Type</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Student</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Date</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArtifacts.map((artifact) => (
                    <TableRow key={artifact.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{artifact.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                          {artifact.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{artifact.student}</TableCell>
                      <TableCell className="text-slate-600">{artifact.date}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={artifact.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                          {artifact.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;