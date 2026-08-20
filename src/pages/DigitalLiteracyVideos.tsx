"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import BackButton from '@/components/ui/BackButton';
import { Play, Clock, RefreshCw, X, AlertCircle, ExternalLink, VideoOff } from 'lucide-react';
import { cn } from "@/lib/utils";

interface VideoResource {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
  youtubeId?: string;
}

const videoResources: VideoResource[] = [
  {
    id: '1',
    title: 'Introduction to Digital Literacy',
    description: 'Learn the fundamental concepts of digital literacy and why it is essential in the modern world.',
    duration: '5:30',
    category: 'Basics',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-40b859622351?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    youtubeId: 'Z_97OqS6H7U'
  },
  {
    id: '2',
    title: 'Internet Safety & Security',
    description: 'How to stay safe while browsing the web and protecting your personal information online.',
    duration: '8:45',
    category: 'Safety',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-b6a39a703328?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    youtubeId: 'HxySrSbSY7o'
  },
  {
    id: '3',
    title: 'Effective Online Communication',
    description: 'Master the art of professional and respectful communication in digital spaces.',
    duration: '6:15',
    category: 'Communication',
    thumbnail: 'https://images.unsplash.com/photo-1573164763594-331915333001?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    youtubeId: 'vP6G7zZzG3U'
  },
  {
    id: '4',
    title: 'Understanding Digital Footprints',
    description: 'Explore how your online actions leave a lasting impression and how to manage it.',
    duration: '7:20',
    category: 'Safety',
    thumbnail: 'https://images.unsplash.com/photo-1516322572675-6787144333d1?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
  {
    id: '5',
    title: 'Using Search Engines Effectively',
    description: 'Tips and tricks for finding the information you need quickly and accurately.',
    duration: '4:50',
    category: 'Basics',
    thumbnail: 'https://images.unsplash.com/photo-1544391492-51b39030093a?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
  },
  {
    id: '6',
    title: 'Identifying Misinformation',
    description: 'Learn how to distinguish between credible sources and fake news online.',
    duration: '9:10',
    category: 'Critical Thinking',
    thumbnail: 'https://images.unsplash.com/photo-1504711423350-71130003030a?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
  },
];

const DigitalLiteracyVideos = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoResource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [useYouTubeFallback, setUseYouTubeFallback] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const handleWatchVideo = (video: VideoResource) => {
    setSelectedVideo(video);
    setVideoError(null);
    setUseYouTubeFallback(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
    setVideoError(null);
    setUseYouTubeFallback(false);
  };

  const handleVideoError = () => {
    console.error("Video load error for:", selectedVideo?.title);
    setVideoError("The direct video file could not be loaded or is in an unsupported format.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoResources.map((video) => (
          <Card key={video.id} className="border-none shadow-lg rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white">
            <div 
              className="relative aspect-video overflow-hidden cursor-pointer"
              onClick={() => handleWatchVideo(video)}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
                <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-indigo-600 shadow-xl group-hover:scale-110 transition-all active:scale-95">
                  <Play size={24} fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                <Clock size={12} />
                {video.duration}
              </div>
            </div>
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none font-bold text-[8px] uppercase tracking-wider">
                  {video.category}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                {video.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-slate-500 text-sm line-clamp-2 mb-3">
                {video.description}
              </p>
              <Button
                className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold h-10 group-hover:bg-indigo-600 transition-colors"
                onClick={() => handleWatchVideo(video)}
              >
                Watch Video
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full max-w-3xl p-0 bg-slate-950 border-none rounded-[2rem] shadow-2xl overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
            <DialogTitle className="text-white text-lg font-black truncate max-w-[80%]">
              {selectedVideo?.title}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-9 w-9 shrink-0"
              >
                <X size={18} />
              </Button>
            </DialogClose>
          </DialogHeader>
          
          <div className="relative aspect-video bg-black flex items-center justify-center">
            {selectedVideo && !videoError && !useYouTubeFallback && (
              <video
                controls
                autoPlay
                className="w-full h-full"
                onError={handleVideoError}
                poster={selectedVideo.thumbnail}
              >
                <source src={selectedVideo.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            {videoError && !useYouTubeFallback && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-slate-900">
                <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-1">
                  <VideoOff size={24} />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-white font-bold text-base">Unable to Play Video</h3>
                  <p className="text-slate-400 text-sm">{videoError}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {selectedVideo?.youtubeId && (
                    <Button 
                      onClick={() => setUseYouTubeFallback(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-4 gap-2"
                    >
                      <Play size={16} fill="currentColor" /> Watch on Web Player
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handleCloseModal}
                    className="border-white/20 text-white hover:bg-white/10 rounded-xl h-10 px-4"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {useYouTubeFallback && selectedVideo?.youtubeId && (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>

          <div className="p-6 bg-slate-900">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-1">
                {selectedVideo?.category}
              </Badge>
              <Badge variant="outline" className="text-slate-400 border-white/10 font-bold text-[8px]">
                {selectedVideo?.duration} Mins
              </Badge>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              {selectedVideo?.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalLiteracyVideos;