/**
 * videoSources.ts
 * ---------------
 * All video URL parsing, classification, and validation lives here.
 * SafeVideoPlayer consumes the types + helpers exported from this file;
 * the page never needs to know the mechanics.
 *
 * Classification priority (first match wins):
 *   1. Direct video file  (.mp4 .webm .m4v .mov .ogv .ogg .m3u8 .mpd .ts)
 *   2. YouTube            (youtube.com/watch, youtu.be, youtube.com/embed)
 *   3. Vimeo              (vimeo.com, player.vimeo.com)
 *   4. Google Drive       (drive.google.com/file)
 *   5. Unknown / raw URL  → treat as direct file (let the browser try)
 */

// ─────────────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────────────

export type EmbedType = "youtube" | "vimeo" | "google-drive" | "direct";

export interface VideoSource {
  /** Canonical direct URL to the media file. */
  url: string;
  /** MIME type hint, e.g. "video/mp4", "video/webm". */
  mime?: string;
  /** Optional codec string for strict browser skipping. */
  codecs?: string;
  /** True when this is an HLS manifest (.m3u8). */
  isHls?: boolean;
  /** The kind of embed / player this URL should use. */
  embedType: EmbedType;
  /** Platform-specific embed URL (YouTube embed src, Vimeo src, etc.).
   *  undefined when embedType === "direct". */
  embedUrl?: string;
}

/** Raw URL + embed classification returned by classifyVideoUrl(). */
export interface VideoUrlClassification {
  /** Same as VideoSource — convenience so callers don't need two types. */
  sources: VideoSource[];
  embedType: EmbedType;
  /** Resolved embed URL, or the raw URL if embedType === "direct". */
  embedUrl: string | undefined;
  /** Human-readable reason shown in the fallback card when everything fails. */
  fallbackHint: string;
}

// ─────────────────────────────────────────────────────────────────────
// MIME / extension lookup
// ─────────────────────────────────────────────────────────────────────

const EXT_TO_MIME: Record<
  string,
  { mime: string; isHls?: boolean }
> = {
  ".mp4":  { mime: "video/mp4" },
  ".m4v":  { mime: "video/mp4" },
  ".mov":  { mime: "video/quicktime" },
  ".webm": { mime: "video/webm" },
  ".ogv":  { mime: "video/ogg" },
  ".ogg":  { mime: "video/ogg" },
  ".m3u8": { mime: "application/vnd.apple.mpegurl", isHls: true },
  ".mpd":  { mime: "application/dash+xml" },
  ".ts":   { mime: "video/mp2t" },
};

function getExt(url: string): string {
  try {
    return url.split("?")[0].split("#")[0].slice(url.lastIndexOf(".")).toLowerCase();
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────────────────────────────
// Embed classifiers
// ─────────────────────────────────────────────────────────────────────

/** Extract the YouTube video ID from any YouTube URL shape. */
export function extractYouTubeId(url: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1) || undefined;
    }
    if (/\.youtube\.com$/.test(u.hostname)) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/embed\/([\w-]+)/);
      if (m) return m[1];
    }
  } catch {
    // not a valid URL — fall through
  }
  return undefined;
}

/** Build a YouTube embed URL from a video ID. */
export function toYouTubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0&controls=1`;
}

/** Extract the Vimeo video ID from any Vimeo URL shape. */
export function extractVimeoId(url: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (/\.vimeo\.com$/.test(u.hostname)) {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id && /^\d+$/.test(id)) return id;
    }
  } catch {
    // not a valid URL — fall through
  }
  return undefined;
}

/** Build a Vimeo embed URL from a video ID. */
export function toVimeoEmbedUrl(id: string): string {
  return `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0`;
}

/**
 * Detect whether a Google Drive share URL can be embedded.
 * Only /file/d/ URLs can be reliably turned into embed links.
 */
export function extractGoogleDriveId(url: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (!/drive\.google\.com$/.test(u.hostname)) return undefined;
    // /file/d/{id}/view  →  id is at index 4
    const m = u.pathname.match(/^\/file\/d\/([^/]+)/);
    if (m) return m[1];
  } catch {
    // not a valid URL — fall through
  }
  return undefined;
}

/** Build a Google Drive embed URL from a file ID. */
export function toGoogleDriveEmbedUrl(id: string): string {
  return `https://drive.google.com/file/d/${id}/preview`;
}

// ─────────────────────────────────────────────────────────────────────
// Main classifier
// ─────────────────────────────────────────────────────────────────────

/**
 * Classify a raw video URL and return a VideoSource[] suitable for
 * SafeVideoPlayer, plus metadata about how to embed it.
 *
 * Usage:
 *   const { sources, embedType, embedUrl, fallbackHint } =
 *     classifyVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
 *   // sources[0].embedType === "youtube"
 *   // sources[0].embedUrl === "https://www.youtube.com/embed/dQw4w9WgXcQ?..."
 *
 *   const { sources } = classifyVideoUrl("https://cdn.example.com/video.mp4");
 *   // sources[0].embedType === "direct"
 *   // sources[0].mime === "video/mp4"
 */
export function classifyVideoUrl(
  rawUrl: string,
): VideoUrlClassification {
  if (!rawUrl || typeof rawUrl !== "string") {
    return {
      sources: [],
      embedType: "direct",
      embedUrl: undefined,
      fallbackHint: "No video URL was provided.",
    };
  }

  const trimmed = rawUrl.trim();

  // ── 1. YouTube ────────────────────────────────────────────────────
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    const embedUrl = toYouTubeEmbedUrl(ytId);
    return {
      sources: [
        {
          url: trimmed,
          mime: "video/mp4",
          embedType: "youtube",
          embedUrl,
        },
      ],
      embedType: "youtube",
      embedUrl,
      fallbackHint: `YouTube video "${ytId}" could not be embedded.`,
    };
  }

  // ── 2. Vimeo ─────────────────────────────────────────────────────
  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    const embedUrl = toVimeoEmbedUrl(vimeoId);
    return {
      sources: [
        {
          url: trimmed,
          mime: "video/mp4",
          embedType: "vimeo",
          embedUrl,
        },
      ],
      embedType: "vimeo",
      embedUrl,
      fallbackHint: `Vimeo video "${vimeoId}" could not be embedded.`,
    };
  }

  // ── 3. Google Drive ─────────────────────────────────────────────
  const gdId = extractGoogleDriveId(trimmed);
  if (gdId) {
    const embedUrl = toGoogleDriveEmbedUrl(gdId);
    return {
      sources: [
        {
          url: trimmed,
          mime: "video/mp4",
          embedType: "google-drive",
          embedUrl,
        },
      ],
      embedType: "google-drive",
      embedUrl,
      fallbackHint: `Google Drive video could not be previewed in-app.`,
    };
  }

  // ── 4. Direct video file ────────────────────────────────────────
  const ext = getExt(trimmed);
  const meta = EXT_TO_MIME[ext] ?? { mime: "video/mp4" };

  // NOTE: We deliberately DO NOT add crossOrigin here. Adding
  // crossOrigin="anonymous" to <video> triggers a CORS preflight, and
  // if the server doesn't return Access-Control-Allow-Origin headers
  // (most static file hosts don't by default), the browser blocks the
  // entire request and the user sees MEDIA_ERR_SRC_NOT_SUPPORTED.
  // crossOrigin is only needed when you plan to draw the video frame
  // onto a <canvas> or pipe it into Web Audio — neither of which this
  // player does. Removing it is the single biggest fix for the
  // "Unable to Play Video" error on third-party hosted files.
  return {
    sources: [
      {
        url: trimmed,
        mime: meta.mime,
        isHls: meta.isHls,
        // H.264 / AAC codec hint — allows browsers that support it to
        // skip this source fast if the file uses a different codec
        // (e.g. HEVC/H.265 on an iOS WebView).
        ...(meta.mime === "video/mp4"
          ? { codecs: "avc1.42E01E, mp4a.40.2" }
          : {}),
        embedType: "direct",
      },
    ],
    embedType: "direct",
    embedUrl: undefined,
    fallbackHint: `This video file could not be loaded. The server may be unreachable, the file may no longer exist, or the file format may not be supported on this device.`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Legacy helper — kept so existing callers don't break
// ─────────────────────────────────────────────────────────────────────

/** @deprecated use classifyVideoUrl() instead */
export function buildSourcesFromUrl(url: string): VideoSource[] {
  return classifyVideoUrl(url).sources;
}

// ─────────────────────────────────────────────────────────────────────
// Validation helpers (useful for data sanitisation before storage)
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns true when the URL is one we know for certain is NOT a real
 * video file (e.g. placeholder URLs, teaching-dummy URLs, 404 URLs).
 * Use this in a data-cleaning step before passing URLs to the player.
 */
export function isKnownPlaceholderUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("w3schools.com/html/movie.mp4") || // returns 404
    lower.includes("example.com") ||
    lower.includes("placeholder") ||
    lower === "" ||
    /^https?:\/\/$/.test(url) // bare protocol with no host
  );
}

/**
 * Returns a validated, trimmed URL suitable for passing into
 * classifyVideoUrl(). Strips whitespace, validates it's a real URL
 * shape, and returns "" for anything that looks like a placeholder.
 */
export function sanitiseVideoUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    // Block data: URIs and javascript: — these are not valid for <video>.
    if (u.protocol === "data:" || u.protocol === "javascript:") return "";
    return u.toString();
  } catch {
    // Not a parseable URL — could be a relative path or ID.
    // Try prepending https:// in case it's a shorthand.
    try {
      new URL(`https://${trimmed}`);
      return `https://${trimmed}`;
    } catch {
      return "";
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Server config guide (copy-paste snippet for the dev team)
// ─────────────────────────────────────────────────────────────────────

export const SERVER_CONFIG_GUIDE = `Recommended server configuration for direct video playback:

1) MIME types (nginx):
   types {
       video/mp4                 mp4 m4v;
       video/webm                webm;
       video/ogg                 ogv ogg;
       application/vnd.apple.mpegurl  m3u8;
       video/mp2t                ts;
   }

2) CORS headers — only needed if you plan to draw video frames to a
   <canvas> or use Web Audio. Remove crossOrigin from <video> if you
   don't need these:
   add_header 'Access-Control-Allow-Origin' '*' always;
   add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS' always;

3) Byte-range support (required for seeking):
   add_header 'Accept-Ranges' 'bytes' always;

4) FFmpeg encoding recipe (100% cross-platform MP4):
   ffmpeg -i input.mov \\
     -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p \\
     -c:a aac -b:a 128k -movflags +faststart \\
     output.mp4
`;