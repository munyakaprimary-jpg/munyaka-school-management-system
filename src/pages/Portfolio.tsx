"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Image as ImageIcon, FileText, Music, Video } from 'lucide-react';
import { STUDENTS } from '@/lib/mock-data';

const Portfolio = () => {
  const artifacts = [
    { id: 1, student: "Brian Kiptoo", title: "Clay Modeling: Animals", type: "Image", date: "Oct 12, 2023", grade: "EE" },
    { id: 2, student: "Mary Atieno", title: "Oral Narrative Audio", type: "Audio", date: "Oct 15, 2023", grade: "ME" },
    { id: 3, student: "Emmanuel Maina", title: "Recycling Project Report", type: "Document", date: "Oct 18, 2023", grade: "EE" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learner Portfolio</h1>
          <p className="text-muted-foreground">Manage and showcase student artifacts and digital evidence.</p>
        </div>
        <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-primary/20">
          <Plus size={18} /> Upload Artifact
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search by student name or artifact title..." className="pl-10 rounded-2xl h-12 bg-white border-none shadow-sm" />
        </div>
        <select className="rounded-2xl h-12 bg-white border-none shadow-sm px-4 text-sm font-medium focus:ring-2 ring-primary/20 outline-none">
          <option>All Learning Areas</option>
          <option>Creative Arts</option>
          <option>English</option>
          <option>Science</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artifacts.map((art) => (
          <Card key={art.id} className="group border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white">
            <div className="aspect-video bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
               {art.type === 'Image' ? <ImageIcon size={40} className="text-slate-300" /> : 
                art.type === 'Audio' ? <Music size={40} className="text-slate-300" /> :
                <FileText size={40} className="text-slate-300" />}
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="rounded-lg bg-slate-50 text-[10px] uppercase font-bold tracking-wider">{art.type}</Badge>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">{art.grade}</Badge>
              </div>
              <h3 className="font-bold text-lg mb-1 leading-tight group-hover:text-primary transition-colors">{art.title}</h3>
              <p className="text-sm text-slate-600 font-medium">{art.student}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{art.date}</span>
                <Button variant="ghost" size="sm" className="text-primary font-bold rounded-xl h-8">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;