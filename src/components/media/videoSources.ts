/**
 * videoSources.ts
 * ---------------
 * Helpers that turn a single video URL (or a YouTube/Vimeo URL) into the
 * ordered list of `VideoSource` objects that `SafeVideoPlayer` expects.
 *
 * The player always tries MP4 H.264/AAC first because that combination is
 * the *only* one that plays natively in every shipping browser AND every
 * shipping iOS/Android WebView. WebM (VP8/VP9 + Opus) is offered as a
 * secondary candidate for desktop Firefox / Chrome. HLS is added only
 * when the URL clearly looks like a manifest (.m3u8) — and the player
 * itself decides whether to use it based on browser support.
 */

/** Very small URL-extension → MIME lookup. Falls back to "video/mp4". */
const EXT_TO_MIME: Record<string, { mime: string; isHls?: boolean }> = {
  ".mp4": { mime: "video/mp4" },
  ".m4v": { mime: "video/mp4" },
  ".mov": { mime: "video/quicktime" },
  ".webm": { mime: "video/webm" },
  ".ogv": { mime: "video/ogg" },
  ".ogg": { mime: "video/ogg" },
  ".m3u8": { mime: "application/vnd.apple.mpegurl", isHls: true },
  ".mpd": { mime: "application/dash+xml" },
  ".ts": { mime: "video/mp2t" },
};

const getExt = (url: string): string => {
  try {
    const noQuery = url.split("?")[0].split("#")[0];
    const idx = noQuery.lastIndexOf(".");
    return idx >= 0 ? noQuery.slice(idx).toLowerCase() : "";
  } catch {
    return "";
  }
};

export interface VideoSource {
  url: string;
  mime?: string;
  codecs?: string;
  isHls?: boolean;
}

/**
 * Build a sensible source list from a URL. The same URL is offered
 * with a MIME hint first (the browser can decide whether to actually
 * play it), and we *don't* add synthetic fallbacks like webm→mp4 because
 * we don't know the server has both encodings.
 *
 * What we DO add: an explicit `codecs="avc1.42E01E, mp4a.40.2"` hint
 * for `.mp4` files, because some servers serve MP4 containers with
 * HEVC/H.265 video that iOS WebViews can't decode. The browser uses
 * the codec string to skip the source entirely, which lets us fall
 * back faster.
 */
export function buildSourcesFromUrl(url: string): VideoSource[] {
  if (!url) return [];
  const ext = getExt(url);
  const meta = EXT_TO_MIME[ext] ?? { mime: "video/mp4" };
  const sources: VideoSource[] = [
    {
      url,
      mime: meta.mime,
      isHls: meta.isHls,
      ...(meta.mime === "video/mp4"
        ? { codecs: "avc1.42E01E, mp4a.40.2" }
        : {}),
    },
  ];
  return sources;
}

/**
 * Extract a YouTube video id from a variety of URL shapes
 * (youtube.com/watch?v=, youtu.be/, youtube.com/embed/).
 * Returns undefined when no id can be found.
 */
export function extractYouTubeId(url: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1) || undefined;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/embed\/([\w-]+)/);
      if (m) return m[1];
    }
  } catch {
    // Fall through — input may not be a valid URL string.
  }
  return undefined;
}

/**
 * Detect whether a URL is obviously a YouTube resource. Used to skip
 * the native <video> stage entirely when the input is a YouTube link.
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /(^|\.)youtube\.com$/.test(u.hostname) || u.hostname === "youtu.be";
  } catch {
    return false;
  }
}

/**
 * A small "recommended headers & MIME-types" reference, exposed as a
 * string constant so it can be surfaced in the UI as a copy-paste
 * snippet for whoever owns the storage server (S3, Nginx, Cloudflare…).
 */
export const SERVER_CONFIG_GUIDE = `Recommended server configuration for direct video playback:

1) MIME types (nginx example):
   types {
     video/mp4                mp4 m4v;
     video/webm               webm;
     video/ogg                ogv ogg;
     application/vnd.apple.mpegurl  m3u8;
     video/mp2t               ts;
   }

2) CORS headers (required for cross-origin <video> + canvas / Web Audio):
   add_header "Access-Control-Allow-Origin"  "$http_origin" always;
   add_header "Access-Control-Allow-Methods" "GET, HEAD, OPTIONS" always;
   add_header "Access-Control-Allow-Headers" "Range, Content-Type, Origin" always;
   add_header "Access-Control-Expose-Headers" "Content-Length, Content-Range, Accept-Ranges" always;

3) Byte-range support (required for seeking):
   add_header "Accept-Ranges" "bytes" always;

4) Cache / CDN:
   - Use a CDN that supports HTTP/2 + Range requests.
   - Set Cache-Control: public, max-age=31536000 for immutable video files.

5) Encoding recipe (ffmpeg, 100% cross-platform output):
   ffmpeg -i input.mov \\
     -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p \\
     -c:a aac -b:a 128k -movflags +faststart \\
     output.mp4
`;