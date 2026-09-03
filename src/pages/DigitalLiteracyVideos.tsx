"use client";

/**
 * DigitalLiteracyVideos
 * ---------------------
 * Upgraded screen that lets learners find videos faster:
 *
 *   - Real-time search bar (with magnifier icon + clear button)
 *   - Category filter pills (All, Basics, Safety, Productivity, ...)
 *   - Source toggle: Curated Library ⇆ YouTube Live Search
 *   - Empty state with "Clear Search" CTA
 *   - Loading skeletons + error message for the YouTube tab
 *   - Refresh Library button re-fetches the underlying list
 *
 * Filtering and YouTube API logic live in `useVideoSearch` so this file
 * stays focused on UI/UX.
 */

import React, { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import BackButton from "@/components/ui/BackButton";
import SafeVideoPlayer from "@/components/media/SafeVideoPlayer";
import { buildSourcesFromUrl } from "@/components/media/videoSources";
import {
  BookOpen,
  Clock,
  Globe,
  Library as LibraryIcon,
  RefreshCw,
  Search,
  SearchX,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useVideoSearch,
  type VideoResource,
  type YouTubeVideo,
} from "@/hooks/useVideoSearch";

const videoResources: VideoResource[] = [
  {
    id: "1",
    title: "Introduction to Digital Literacy",
    description:
      "Learn the fundamental concepts of digital literacy and why it is essential in the modern world.",
    duration: "5:30",
    category: "Basics",
    thumbnail:
      "https://images.unsplash.com/photo-1550751827-40b859622351?auto=format&fit=crop&q=80&w=800",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    youtubeId: "Z_97OqS6H7U",
  },
  {
    id: "2",
    title: "Internet Safety & Security",
    description:
      "How to stay safe while browsing the web and protecting your personal information online.",
    duration: "8:45",
    category: "Safety",
    thumbnail:
      "https://images.unsplash.com/photo-1563986768609-b6a39a703328?auto=format&fit=crop&q=80&w=800",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    youtubeId: "HxySrSbSY7o",
  },
  {
    id: "3",
    title: "Effective Online Communication",
    description:
      "Master the art of professional and respectful communication in digital spaces.",
    duration: "6:15",
    category: "Communication",
    thumbnail:
      "https://images.unsplash.com/photo-1573164763594-331915333001?auto=format&fit=crop&q=80&w=800",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    youtubeId: "vP6G7zZzG3U",
  },
  {
    id: "4",
    title: "Understanding Digital Footprints",
    description:
      "Explore how your online actions leave a lasting impression and how to manage it.",
    duration: "7:20",
    category: "Safety",
    thumbnail:
      "https://images.unsplash.com/photo-1516322572675-6787144333d1?auto=format&fit=crop&q=80&w=800",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  },
  {
    id: "5",
    title: "Using Search Engines Effectively",
    description:
      "Tips and tricks for finding the information you need quickly and accurately.",
    duration: "4:50",
    category: "Productivity",
    thumbnail:
      "https://images.unsplash.com/photo-1544391492-51b39030093a?auto=format&fit=crop&q=80&w=800",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
  },
  {
    id: "6",
    title: "Identifying Misinformation",
    description:
      "Learn how to distinguish between credible sources and fake news online.",
    duration: "9:10",
    category: "Critical Thinking",
    thumbnail:
      "https://images.unsplash.com/photo-1504711423350-71130003030a?auto=format&fit=crop&q=80&w=800",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
  },
  {
    id: "7",
    title: "Keeping Your Devices Healthy",
    description:
      "Routine maintenance, updates, and security checks that keep your laptop and phone running smoothly.",
    duration: "6:00",
    category: "Device Maintenance",
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  },
  {
    id: "8",
    title: "Cloud Storage & File Organization",
    description:
      "How to keep your files synced, backed up, and easy to find across every device you use.",
    duration: "7:40",
    category: "Productivity",
    thumbnail:
      "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&q=80&w=800",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
];

const CATEGORIES = [
  "All",
  "Basics",
  "Safety",
  "Productivity",
  "Communication",
  "Critical Thinking",
  "Device Maintenance",
];

// Optional: wire up a real key from env in a future build.
// When undefined, the YouTube tab is hidden and only the curated library shows.
const YOUTUBE_API_KEY: string | undefined = undefined;

const DigitalLiteracyVideos = () => {
  const {
    filteredLibrary,
    youtubeResults,
    youtubeLoading,
    youtubeError,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    sourceTab,
    setSourceTab,
    refresh,
    isRefreshing,
    noResults,
    youtubeDisabled,
  } = useVideoSearch({
    library: videoResources,
    categories: CATEGORIES,
    youtubeApiKey: YOUTUBE_API_KEY,
  });

  const [selectedVideo, setSelectedVideo] = useState<
    VideoResource | YouTubeVideo | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWatchVideo = useCallback(
    (video: VideoResource | YouTubeVideo) => {
      setSelectedVideo(video);
      setIsModalOpen(true);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("All");
  }, [setSearchQuery, setActiveCategory]);

  const sources = useMemo(
    () => buildSourcesFromUrl(selectedVideo?.videoUrl ?? ""),
    [selectedVideo?.videoUrl],
  );

  const visibleVideos: Array<VideoResource | YouTubeVideo> =
    sourceTab === "library" ? filteredLibrary : youtubeResults;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/digital-hub" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Digital Literacy Videos
            </h1>
            <p className="text-muted-foreground font-medium">
              Enhance your digital skills with our curated video library.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 h-10"
        >
          <RefreshCw
            size={16}
            className={cn("mr-2", isRefreshing && "animate-spin text-indigo-600")}
          />
          {isRefreshing ? "Syncing..." : "Refresh Library"}
        </Button>
      </div>

      {/* Search + Filter Controls */}
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative w-full">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              sourceTab === "library"
                ? "Search the curated library…"
                : "Search live videos on YouTube…"
            }
            className="w-full h-12 pl-12 pr-12 rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 text-base"
            aria-label="Search videos"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Source tab switcher (only when YouTube is configured) */}
        {!youtubeDisabled && (
          <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setSourceTab("library")}
              className={cn(
                "flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-bold transition-all",
                sourceTab === "library"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              <LibraryIcon size={15} />
              Curated Library
            </button>
            <button
              type="button"
              onClick={() => setSourceTab("youtube")}
              className={cn(
                "flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-bold transition-all",
                sourceTab === "youtube"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              <Globe size={15} />
              YouTube Live
            </button>
          </div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 inline-flex items-center px-4 h-9 rounded-full text-sm font-bold border transition-all active:scale-95",
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                )}
                aria-pressed={isActive}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result count (subtle) */}
      <div className="flex items-center justify-between -mt-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {sourceTab === "library"
            ? `${filteredLibrary.length} curated video${filteredLibrary.length === 1 ? "" : "s"}`
            : youtubeLoading
              ? "Searching YouTube…"
              : `${youtubeResults.length} live result${youtubeResults.length === 1 ? "" : "s"}`}
        </p>
        {(searchQuery || activeCategory !== "All") && (
          <button
            type="button"
            onClick={clearSearch}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Loading skeletons (YouTube only) */}
      {sourceTab === "youtube" && youtubeLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={`skeleton-${i}`}
              className="border-none shadow-md rounded-[2rem] overflow-hidden bg-white"
            >
              <div className="aspect-video bg-slate-100 animate-pulse" />
              <CardHeader className="p-6 pb-2">
                <div className="h-3 w-16 bg-slate-100 rounded-full animate-pulse mb-3" />
                <div className="h-5 w-3/4 bg-slate-100 rounded-lg animate-pulse" />
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-11 w-full bg-slate-100 rounded-xl animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* YouTube error state */}
      {sourceTab === "youtube" && youtubeError && !youtubeLoading && (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-[2rem] bg-rose-50 border border-rose-100">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <SearchX size={26} />
          </div>
          <h3 className="text-lg font-black text-rose-900">
            YouTube search failed
          </h3>
          <p className="text-sm text-rose-700 max-w-md mt-1">{youtubeError}</p>
          <Button
            onClick={refresh}
            variant="outline"
            className="mt-5 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-100 font-bold"
          >
            <RefreshCw size={16} className="mr-2" /> Try Again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {noResults && (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-full bg-white text-slate-400 flex items-center justify-center mb-4 shadow-sm">
            <SearchX size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            No videos found matching your search
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Try a different keyword or pick another category from the filter
            row above.
          </p>
          <Button
            onClick={clearSearch}
            className="mt-5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold h-11 px-6"
          >
            <X size={16} className="mr-2" /> Clear Search
          </Button>
        </div>
      )}

      {/* Video grid */}
      {!noResults && sourceTab === "library" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLibrary.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onWatch={handleWatchVideo}
              variant="library"
            />
          ))}
        </div>
      )}

      {!noResults && sourceTab === "youtube" && !youtubeLoading && !youtubeError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {youtubeResults.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onWatch={handleWatchVideo}
              variant="youtube"
            />
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full max-w-4xl p-0 bg-slate-950 border-none rounded-[2rem] shadow-2xl overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between p-5 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
            <DialogTitle className="text-white text-xl font-black truncate max-w-[80%]">
              {selectedVideo?.title}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10 shrink-0"
              >
                <X size={20} />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="relative aspect-video bg-black">
            {selectedVideo && (
              <SafeVideoPlayer
                sources={sources}
                youtubeId={selectedVideo.youtubeId}
                poster={selectedVideo.thumbnail}
                title={selectedVideo.title}
                autoPlay
                muted
                loop={false}
              />
            )}
          </div>

          <div className="p-8 bg-slate-900">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                {selectedVideo?.category}
              </Badge>
              {selectedVideo?.duration && (
                <Badge
                  variant="outline"
                  className="text-slate-400 border-white/10 font-bold text-[10px]"
                >
                  {selectedVideo.duration} Mins
                </Badge>
              )}
              {"channelTitle" in (selectedVideo ?? {}) && (
                <Badge
                  variant="outline"
                  className="text-slate-400 border-white/10 font-bold text-[10px]"
                >
                  {('channelTitle' in selectedVideo ? selectedVideo.channelTitle : '')}
                </Badge>
              )}
            </div>
            <p className="text-slate-300 text-base leading-relaxed font-medium">
              {selectedVideo?.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// Reusable card component
// ────────────────────────────────────────────────────────────────────

interface VideoCardProps {
  video: VideoResource | YouTubeVideo;
  onWatch: (v: VideoResource | YouTubeVideo) => void;
  variant: "library" | "youtube";
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onWatch, variant }) => {
  return (
    <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white">
      <div
        className="relative aspect-video overflow-hidden cursor-pointer"
        onClick={() => onWatch(video)}
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
          <div
            className={cn(
              "w-14 h-14 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-all active:scale-95",
              variant === "youtube"
                ? "bg-rose-600/95 text-white"
                : "bg-white/90 text-indigo-600",
            )}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-0.5"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
          <Clock size={14} />
          {video.duration}
        </div>
        {variant === "youtube" && (
          <div className="absolute top-3 left-3 bg-rose-600/95 text-white px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
            <Globe size={12} />
            LIVE
          </div>
        )}
      </div>
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full border-none font-bold text-[10px] uppercase tracking-wider",
              variant === "youtube"
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
            )}
          >
            {variant === "youtube" ? (
              <Sparkles size={10} className="mr-1" />
            ) : (
              <BookOpen size={10} className="mr-1" />
            )}
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
        <Button
          className={cn(
            "w-full text-white rounded-xl font-bold h-11 transition-colors",
            variant === "youtube"
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-slate-900 hover:bg-slate-800 group-hover:bg-indigo-600",
          )}
          onClick={() => onWatch(video)}
        >
          Watch Video
        </Button>
      </CardContent>
    </Card>
  );
};

export default DigitalLiteracyVideos;