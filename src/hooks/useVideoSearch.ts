/**
 * useVideoSearch
 * --------------
 * One self-contained hook that powers the Digital Literacy Videos screen.
 * It handles:
 *
 *   - Local curated library (VideoResource[])
 *   - Real-time text + category filtering (debounced for the YouTube API)
 *   - Optional YouTube Data API v3 search (live results)
 *   - Loading / error states for the live tab
 *   - "Refresh" semantics (re-runs the underlying fetch)
 *
 * Usage:
 *
 *   const {
 *     filteredLibrary,
 *     activeCategory, setActiveCategory,
 *     searchQuery, setSearchQuery,
 *     sourceTab, setSourceTab,
 *     youtubeResults, youtubeLoading, youtubeError,
 *     refresh,
 *     isRefreshing,
 *     noResults,
 *   } = useVideoSearch({
 *     library: videoResources,
 *     categories: ["All", "Basics", "Safety", ...],
 *     youtubeApiKey: "AIza...", // optional
 *   });
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface VideoResource {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
  youtubeId?: string;
}

/** What we expose from the live YouTube API call. */
export interface YouTubeVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  duration: string;
  channelTitle: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
}

export type SourceTab = "library" | "youtube";

interface UseVideoSearchOptions {
  /** Curated library to filter against. */
  library: VideoResource[];
  /** Ordered list of categories. Should start with "All". */
  categories: string[];
  /** Optional YouTube Data API v3 key. When omitted the YouTube tab
   *  is hidden and only the library tab is exposed. */
  youtubeApiKey?: string;
  /** Debounce window (ms) for the YouTube API search. Defaults to 400. */
  youtubeDebounceMs?: number;
  /** Default search query. */
  initialQuery?: string;
}

export interface UseVideoSearchResult {
  /** Curated library filtered by search + category. */
  filteredLibrary: VideoResource[];
  /** Live YouTube API results (already filtered by active category). */
  youtubeResults: YouTubeVideo[];
  /** True while a YouTube API call is in flight. */
  youtubeLoading: boolean;
  /** Network / quota / key errors from the YouTube API. */
  youtubeError: string | null;

  /** Currently selected category (matches `categories` exactly). */
  activeCategory: string;
  setActiveCategory: (c: string) => void;

  /** Current search query (controlled input value). */
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  /** Which tab/source is currently shown. */
  sourceTab: SourceTab;
  setSourceTab: (t: SourceTab) => void;

  /** Re-runs the underlying fetch (library sync OR YouTube search). */
  refresh: () => void;
  isRefreshing: boolean;

  /** True when the user has typed/selected something but got zero results. */
  noResults: boolean;

  /** True when the YouTube tab is configured but currently no key was supplied. */
  youtubeDisabled: boolean;
}

const ALL_CATEGORY = "All";

// ────────────────────────────────────────────────────────────────────
// Pure filter helpers (exported so the UI can also call them in tests
// or for highlights).
// ────────────────────────────────────────────────────────────────────

export function filterByCategory<T extends { category: string }>(
  items: T[],
  category: string,
): T[] {
  if (!category || category === ALL_CATEGORY) return items;
  return items.filter(
    (i) => i.category.toLowerCase() === category.toLowerCase(),
  );
}

export function matchesQuery<T extends { title: string; description: string }>(
  item: T,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.title.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q)
  );
}

// ────────────────────────────────────────────────────────────────────
// YouTube Data API v3 helpers
// ────────────────────────────────────────────────────────────────────

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      categoryId?: string;
      thumbnails?: {
        medium?: { url?: string };
        high?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
  error?: { message?: string; code?: number };
}

/** ISO 8601 duration → "m:ss" or "h:mm:ss". Returns "Live" for live streams. */
function formatYouTubeDuration(iso: string | undefined): string {
  if (!iso) return "";
  if (iso === "P0D") return "Live";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const [, h, m, s] = match;
  const hh = parseInt(h ?? "0", 10);
  const mm = parseInt(m ?? "0", 10);
  const ss = parseInt(s ?? "0", 10);
  if (hh > 0) return `${hh}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

/** Map YouTube videoCategoryId → human category label. Only the
 *  categories that are relevant to digital literacy are mapped. */
const YOUTUBE_CATEGORY_MAP: Record<string, string> = {
  "27": "Education",
  "28": "Science",
  "26": "Productivity",
  "22": "Communication",
  "20": "Productivity",
};
function mapCategory(categoryId: string | undefined): string {
  if (!categoryId) return "Education";
  return YOUTUBE_CATEGORY_MAP[categoryId] ?? "Education";
}

async function searchYouTube(
  query: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<YouTubeVideo[]> {
  if (!query.trim()) return [];

  // We hit two endpoints in parallel: search (videos.list snippets) and
  // videos.list (durations). videos.list doesn't accept search terms so
  // we need ids from the search call first.
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: "12",
    safeSearch: "strict",
    relevanceLanguage: "en",
    key: apiKey,
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    { signal },
  );
  if (!searchRes.ok) {
    const body = (await searchRes.json().catch(() => ({}))) as YouTubeSearchResponse;
    throw new Error(
      body.error?.message ?? `YouTube API error (${searchRes.status})`,
    );
  }
  const searchJson = (await searchRes.json()) as YouTubeSearchResponse;
  const items = searchJson.items ?? [];
  const ids = items.map((i) => i.id?.videoId).filter(Boolean) as string[];
  if (ids.length === 0) return [];

  // Second call — durations.
  const durParams = new URLSearchParams({
    part: "contentDetails",
    id: ids.join(","),
    key: apiKey,
  });
  const durRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${durParams.toString()}`,
    { signal },
  );
  const durJson = durRes.ok
    ? ((await durRes.json()) as {
        items?: Array<{ id: string; contentDetails?: { duration?: string } }>;
      })
    : { items: [] };

  const durationById = new Map<string, string>();
  (durJson.items ?? []).forEach((it) => {
    if (it.contentDetails?.duration) {
      durationById.set(it.id, it.contentDetails.duration);
    }
  });

  return items
    .map<YouTubeVideo | null>((it) => {
      const vid = it.id?.videoId;
      const sn = it.snippet;
      if (!vid || !sn) return null;
      return {
        id: vid,
        youtubeId: vid,
        title: sn.title ?? "",
        description: sn.description ?? "",
        duration: formatYouTubeDuration(durationById.get(vid)),
        channelTitle: sn.channelTitle ?? "",
        category: mapCategory(sn.categoryId),
        thumbnail:
          sn.thumbnails?.high?.url ??
          sn.thumbnails?.medium?.url ??
          sn.thumbnails?.default?.url ??
          "",
        videoUrl: `https://www.youtube.com/watch?v=${vid}`,
      };
    })
    .filter((v): v is YouTubeVideo => v !== null);
}

// ────────────────────────────────────────────────────────────────────
// The hook itself
// ────────────────────────────────────────────────────────────────────

export function useVideoSearch(
  options: UseVideoSearchOptions,
): UseVideoSearchResult {
  const {
    library,
    categories,
    youtubeApiKey,
    youtubeDebounceMs = 400,
    initialQuery = "",
  } = options;

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(
    categories[0] ?? ALL_CATEGORY,
  );
  const [sourceTab, setSourceTab] = useState<SourceTab>("library");

  // Library tab can simulate a remote refresh.
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // YouTube API state.
  const [youtubeResults, setYoutubeResults] = useState<YouTubeVideo[]>([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const youtubeDisabled = !youtubeApiKey;

  // ── Library filtering ──────────────────────────────────────────────
  const filteredLibrary = useMemo(() => {
    // libraryVersion is referenced so a refresh re-derives the memo.
    void libraryVersion;
    return library
      .filter((v) => matchesQuery(v, searchQuery))
      .filter((v) => filterByCategory([v], activeCategory).length > 0);
  }, [library, searchQuery, activeCategory, libraryVersion]);

  // ── YouTube search effect ───────────────────────────────────────────
  useEffect(() => {
    if (sourceTab !== "youtube") return;
    if (youtubeDisabled) return;

    // Clear any pending debounce / inflight request.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!searchQuery.trim()) {
      setYoutubeResults([]);
      setYoutubeError(null);
      setYoutubeLoading(false);
      return;
    }

    setYoutubeLoading(true);
    setYoutubeError(null);

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      searchYouTube(searchQuery, youtubeApiKey!, controller.signal)
        .then((results) => {
          setYoutubeResults(results);
          setYoutubeError(null);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          const msg =
            e instanceof Error ? e.message : "Failed to fetch YouTube results.";
          setYoutubeError(msg);
          setYoutubeResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setYoutubeLoading(false);
        });
    }, youtubeDebounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, sourceTab, youtubeApiKey, youtubeDebounceMs, youtubeDisabled]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Apply category filter to YouTube results client-side too.
  const filteredYouTube = useMemo(
    () => filterByCategory(youtubeResults, activeCategory),
    [youtubeResults, activeCategory],
  );

  // ── Refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    setIsRefreshing(true);
    if (sourceTab === "library") {
      // Simulated library re-sync.
      setLibraryVersion((v) => v + 1);
      setTimeout(() => setIsRefreshing(false), 1200);
    } else {
      // Force the YouTube effect to re-run by clearing then re-typing.
      const q = searchQuery;
      setSearchQuery("");
      // microtask flush, then restore
      setTimeout(() => {
        setSearchQuery(q);
        setIsRefreshing(false);
      }, 50);
    }
  }, [sourceTab, searchQuery]);

  // ── "No results" heuristic ─────────────────────────────────────────
  const noResults =
    (searchQuery ?? '').trim().length > 0 || activeCategory !== ALL_CATEGORY
      ? sourceTab === "library"
        ? filteredLibrary.length === 0
        : !youtubeLoading && filteredYouTube.length === 0 && !youtubeError
      : false;

  return {
    filteredLibrary,
    youtubeResults: filteredYouTube,
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
  };
}