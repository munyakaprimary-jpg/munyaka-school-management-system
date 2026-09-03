"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Image as ImageIcon, 
  FileText, 
  Music, 
  Video, 
  Calendar, 
  User, 
  Eye, 
  Trash2 
} from 'lucide-react';
import { Artifact, getGradeBadgeClass } from '@/types/portfolio';

interface PortfolioCardProps {
  art: Artifact;
  onSelect: (art: Artifact) => void;
  onDelete: (id: string, title: string) => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  art,
  onSelect,
  onDelete
}) => {
  const getTypeIcon = (type: Artifact['type']) => {
    switch (type) {
      case 'Image': return <ImageIcon size={32} className="text-indigo-500" />;
      case 'Audio': return <Music size={32} className="text-purple-500" />;
      case 'Video': return <Video size={32} className="text-rose-500" />;
      default: return <FileText size={32} className="text-emerald-500" />;
    }
  };

  return (
    <Card className="group border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white flex flex-col justify-between">
      <div>
        <div 
          className="aspect-video bg-slate-50 flex items-center justify-center relative overflow-hidden cursor-pointer"
          onClick={() => onSelect(art)}
        >
          {art.fileUrl && art.type === 'Image' ? (
                      <img src={art.fileUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : art.fileUrl && art.type === 'Video' ? (
                      // Render a still thumbnail instead of auto-playing the video —
                      // autoplay-on-load is unreliable on mobile WebViews, blocks
                      // images from loading with bandwidth contention, and forces
                      // the user into a player they didn't ask for. The modal
                      // opens the real SafeVideoPlayer when the user taps "View".
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center relative">
                        <Video size={48} className="text-white/40 group-hover:text-white/60 group-hover:scale-110 transition-all duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                          <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center text-indigo-600 shadow-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : art.fileUrl && art.type === 'Audio' ? (
            <div className="p-4 w-full flex flex-col items-center gap-2">
              <Music size={32} className="text-purple-500 animate-pulse" />
              <audio controls src={art.fileUrl} className="w-11/12 h-8" onClick={(e) => e.stopPropagation()} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              {getTypeIcon(art.type)}
              {art.fileName && (
                <span className="text-[11px] font-bold text-slate-500 max-w-[180px] truncate bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {art.fileName}
                </span>
              )}
            </div>
          )}

          <Badge variant="outline" className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] uppercase font-black tracking-wider border-none shadow-sm z-10">
            {art.type}
          </Badge>
        </div>

        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              {art.learningArea}
            </Badge>
            <Badge className={getGradeBadgeClass(art.grade)}>{art.grade}</Badge>
          </div>
          <h3 
            className="font-bold text-lg mb-1 leading-tight cursor-pointer group-hover:text-indigo-600 transition-colors"
            onClick={() => onSelect(art)}
          >
            {art.title}
          </h3>
          <p className="text-sm text-slate-600 font-bold flex items-center gap-1.5 mt-2">
            <User size={14} className="text-slate-400" /> {art.student}
          </p>
        </CardContent>
      </div>

      <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-slate-50 mt-4">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Calendar size={12} /> {art.date}
        </span>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl h-8 px-3"
            onClick={() => onSelect(art)}
          >
            <Eye size={14} className="mr-1" /> View Content
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl h-8 w-8"
            onClick={() => onDelete(art.id, art.title)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
};