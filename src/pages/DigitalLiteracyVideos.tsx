"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BackButton from '@/components/ui/BackButton';
import { Play, Clock, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

interface VideoResource {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
}

const videoResources: VideoResource[] = [
  {
    id: '1',
    title: 'Introduction to Digital Literacy',
    description: 'Learn the fundamental concepts of digital literacy and why it is essential in the modern world.',
    duration: '5:30',
    category: 'Basics',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-40b859622351?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '2',
    title: 'Internet Safety & Security',
    description: 'How to stay safe while browsing the web and protecting your personal information online.',
    duration: '8:45',
    category: 'Safety',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-b6a39a703328?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '3',
    title: 'Effective Online Communication',
    description: 'Master the art of professional and respectful communication in digital spaces.',
    duration: '6:15',
    category: 'Communication',
    thumbnail: 'https://images.unsplash.com/photo-1573164763594-331915333001?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '4',
    title: 'Understanding Digital Footprints',
    description: 'Explore how your online actions leave a lasting impression and how to manage it.',
    duration: '7:20',
    category: 'Safety',
    thumbnail: 'https://images.unsplash.com/photo-1516322572675-6787144333d1?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '5',
    title: 'Using Search Engines Effectively',
    description: 'Tips and tricks for finding the information you need quickly and accurately.',
    duration: '4:50',
    category: 'Basics',
    thumbnail: 'https://images.unsplash.com/photo-1544391492-51b39030093a?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '6',
    title: 'Identifying Misinformation',
    description: 'Learn how to distinguish between credible sources and fake news online.',
    duration: '9:10',
    category: 'Critical Thinking',
    thumbnail: 'https://images.unsplash.com/photo-1504711423350-71130003030a?auto=format&fit=crop&q=80&w=800',
  },
];

const DigitalLiteracyVideos = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/digital-hub" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Digital Literacy Videos</h1>
            <p className="text-muted-foreground font-medium">Enhance your digital skills with our curated video library.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 h-10"
        >
          <RefreshCw size={16} className={cn("mr-2", isSyncing && "animate-spin text-indigo-600")} />
          {isSyncing ? "Syncing..." : "Refresh Library"}
        </Button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videoResources.map((video) => (
          <Card key={video.id} className="border-none shadow-lg rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="relative aspect-video overflow-hidden">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
              <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                <Clock size={14} />
                {video.duration}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl">
                  <Play size={28} fill="currentColor" />
                </div>
              </div>
            </div>
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none font-bold text-[10px] uppercase tracking-wider">
                  {video.category}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                {video.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                {video.description}
              </p>
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold h-10 group-hover:bg-indigo-600 transition-colors">
                Watch Video
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DigitalLiteracyVideos;