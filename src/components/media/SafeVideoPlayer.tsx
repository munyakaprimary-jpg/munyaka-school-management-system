"use client";

/**
 * SafeVideoPlayer
 * ---------------
 * Cross-platform video player that:
 *   - Renders an <iframe> for embed URLs (YouTube / Vimeo / Google Drive)
 *   - Renders a native <video controls playsInline> for direct MP4/WebM
 *   - Logs every error event with its full code + message to the
 *     developer console
 *   - Always offers an "Open in Browser" fallback so the user is never
 *     stranded with a broken player
 *
 * Error-detection strategy:
 *   1. The <video> element's onError fires for any failure. The browser
 *      populates e.target.error with { code, message } — we log both
 *      and convert the code to a human-readable reason.
 *   2. When the URL is unreachable (404, DNS failure, blocked by CORS),
 *      the browser's MediaError often has code === 4
 *      (MEDIA_ERR_SRC_NOT_SUPPORTED) and an empty message. To get a
 *      real diagnosis we proactively HEAD-probe the URL before
 *      mounting the video — if the response isn't 200/206 we show a
 *      diagnostic instead of an opaque "Unknown playback error".
 *
 *   IMPORTANT: this component does NOT set crossOrigin on the video
 *   element. Setting crossOrigin="anonymous" triggers a CORS preflight
 *   against the video host, and if the host doesn't return
 *   Access-Control-Allow-Origin (most static file hosts don't), the
 *   browser refuses to load the file at all. crossOrigin is only
 *   needed for canvas / Web Audio use cases, which this player does
 *   not have.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ErrorBoundary from "@/components/media/VideoPlayerErrorBoundary";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  type VideoSource,
  type EmbedType,
  isKnownPlaceholderUrl,
} from "@/components/media/videoSources";

// ────────────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────────────

export type {
  VideoSource,
  EmbedType,
  VideoUrlClassification,
} from "@/components/media/videoSources";

export interface SafeVideoPlayerProps {
  /** Ordered list of video sources. The player uses sources[0] for the
   *  primary <video> element. */
  sources: VideoSource[];
  /** URL of the embed iframe (YouTube / Vimeo / Google Drive). When
   *  present, the player renders an <iframe> instead of a <video>. */
  embedUrl?: string;
  /** Embed platform — purely informational; controls which allow string
   *  we pass to the iframe. */
  embedType?: EmbedType;
  /** Poster image shown before / during buffering of a direct video. */
  poster?: string;
  /** Accessible title for the player. */
  title?: string;
  /** Auto-play once metadata is loaded. Defaults to true. */
  autoPlay?: boolean;
  /** Show native controls. Defaults to true. */
  controls?: boolean;
  /** Force muted playback (required for autoplay on most mobile browsers). */
  muted?: boolean;
  /** Loop the video. */
  loop?: boolean;
  /** Outer wrapper className. */
  className?: string;
  /** Optional callback when the native player errors out. Useful for
   *  telemetry. */
  onNativeError?: (reason: string, code?: number) => void;
  /** Optional callback when the iframe fails to load. */
  onEmbedError?: () => void;
}

// ────────────────────────────────────────────────────────────────────
// Player stages
// ────────────────────────────────────────────────────────────────────

type Stage = "probing" | "native" | "embed" | "external";

interface FailureInfo {
  source?: VideoSource;
  embedUrl?: string;
  /** Numeric MediaError code (1..4) or undefined for non-<video> errors. */
  code?: number;
  /** Human-readable, developer-facing reason (logged to console). */
  reason: string;
  /** Short, user-facing message shown in the error card. */
  message: string;
}

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

const FALLBACK_EXTERNAL_LABEL = "Open in Browser";

/** Detect a Capacitor / Cordova WebView (so we can show a contextual hint). */
const isNativeWebView = (): boolean => {
  if (typeof navigator === "undefined") return false;
  // @ts-expect-error injected by Capacitor at runtime
  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) {
    return true;
  }
  // @ts-expect-error injected by Cordova at runtime
  return Boolean((window as any).cordova);
};

/** Detect native HLS support (Safari / iOS WebViews). */
const supportsNativeHls = (): boolean => {
  if (typeof document === "undefined") return false;
  const v = document.createElement("video");
  return Boolean(
    v.canPlayType && v.canPlayType('application/vnd.apple.mpegurl'),
  );
};

/**
 * Decode a MediaError code into a human-readable reason and a user-facing
 * message. The browser sometimes leaves MediaError.message empty (notably
 * for MEDIA_ERR_SRC_NOT_SUPPORTED and CORS-blocked loads), so we have to
 * map the code by hand.
 */
function decodeMediaError(
  err: MediaError | null,
  url: string,
): { reason: string; message: string } {
  if (!err) {
    return {
      reason: "No MediaError object was attached to the <video> onError event. "
        + "This typically means the video file failed to load entirely "
        + "(404, DNS failure, or blocked by CORS without an "
        + "Access-Control-Allow-Origin header).",
      message:
        "The video file could not be loaded. The link may be broken, "
        + "the file may no longer exist on the server, or your network "
        + "is blocking the request.",
    };
  }

  // MediaError.message is empty for codes 2-4 in every shipping browser.
  // Code is the only reliable signal we have.
  switch (err.code) {
    case 1: // MEDIA_ERR_ABORTED
      return {
        reason: `MEDIA_ERR_ABORTED (1) for ${url}: playback was aborted by the user or a script.`,
        message: "Playback was interrupted.",
      };
    case 2: // MEDIA_ERR_NETWORK
      return {
        reason: `MEDIA_ERR_NETWORK (2) for ${url}: a network error prevented the file from downloading. `
          + "Usually a CORS preflight failure or a server that doesn't support byte-range requests.",
        message:
          "A network error prevented the video from loading. "
          + "This is usually a CORS policy or a slow/blocked connection.",
      };
    case 3: // MEDIA_ERR_DECODE
      return {
        reason: `MEDIA_ERR_DECODE (3) for ${url}: the file downloaded fine but cannot be decoded. `
          + "Most often a codec the device doesn't support (HEVC/H.265 on iOS, VP9 on old Safari, etc.).",
        message:
          "The video file uses a codec that this device cannot decode. "
          + "Re-encode it as H.264 baseline + AAC audio for universal playback.",
      };
    case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
      return {
        reason: `MEDIA_ERR_SRC_NOT_SUPPORTED (4) for ${url}: the file type isn't supported, the server returned 404, `
          + "or the response is blocked by CORS. The most common cause in production is "
          + "adding crossOrigin=\"anonymous\" to <video> when the host doesn't return "
          + "Access-Control-Allow-Origin headers.",
        message:
          "This video format is not supported on this device, or the server blocked the request. "
          + "Try opening it in your browser.",
      };
    default:
      return {
        reason: `Unknown MediaError code ${err.code} for ${url}: ${err.message || "(no message)"}`,
        message: "An unknown playback error occurred.",
      };
  }
}

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

const SafeVideoPlayer: React.FC<SafeVideoPlayerProps> = ({
  sources,
  embedUrl,
  embedType = "direct",
  poster,
  title = "Video",
  autoPlay = true,
  controls = true,
  muted = true,
  loop = false,
  className,
  onNativeError,
  onEmbedError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    // Tracks whether the component is still mounted. All setState calls
    // in async callbacks and post-event handlers MUST be gated on this.
    // Without it, closing the modal while a video is loading causes
    // "setState on unmounted component" crashes in React 18 strict mode.
    const isMountedRef = useRef(true);
    const [stage, setStage] = useState<Stage>("probing");
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [failure, setFailure] = useState<FailureInfo | null>(null);
    const [decoded, setDecoded] = useState(false);
  
    const inWebView = useMemo(isNativeWebView, []);

  // First source becomes the active one. Direct embed URLs always
  // bypass the native stage and go straight to the iframe.
  const activeSource = sources[0];
  const isDirectVideo = embedType === "direct" && activeSource;

  // Filter out HLS sources on browsers that can't play them natively so
  // we fail fast and the user sees the embed/external fallback sooner.
  const playableSource = useMemo(() => {
    if (!activeSource) return undefined;
    if (activeSource.isHls && !supportsNativeHls()) return undefined;
    return activeSource;
  }, [activeSource]);

  // ──────────────────────────────────────────────────────────────────
  // Network probe — pre-flight HEAD request to surface real HTTP
  // statuses (404, 403, 5xx) before the <video> element wastes time
  // trying to load an unreachable URL.
  // ──────────────────────────────────────────────────────────────────

  const probeUrl = useCallback(async (url: string): Promise<boolean> => {
    try {
      // We use Range: bytes=0-0 — every compliant video host supports
      // this and it avoids downloading the entire file just to check
      // reachability.
      const res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        mode: "cors",
      });
      // 200 = full file; 206 = partial content (range honoured). Both
      // mean the resource exists and is reachable.
      return res.ok || res.status === 206;
    } catch (e) {
      console.warn(
        "[SafeVideoPlayer] Network probe failed for",
        url,
        "→",
        e instanceof Error ? e.message : String(e),
      );
      return false;
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────
  // Stage transitions
  // ──────────────────────────────────────────────────────────────────

  const transitionToNative = useCallback(() => {
      if (!isMountedRef.current) return;
      if (!playableSource) {
        // No playable direct source — go to embed or external.
        if (embedUrl) setStage("embed");
        else setStage("external");
        setIsLoading(false);
        return;
      }
      setStage("native");
      setIsLoading(true);
    }, [playableSource, embedUrl]);

  const handleNativeError = useCallback(
      (rawErr: MediaError | null) => {
        // Guard: never call setState after unmount.
        if (!isMountedRef.current) return;
        const src = playableSource;
        const { reason, message } = decodeMediaError(rawErr, src?.url ?? "");

      // ALWAYS log the full error object so devs can diagnose it.
      // MediaError objects don't serialise well — we extract the
      // useful fields ourselves.
      console.error("[SafeVideoPlayer] Native <video> error", {
        url: src?.url,
        mediaError: rawErr
          ? {
              code: rawErr.code,
              message: rawErr.message,
              // 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
              codeMeaning: [
                "MEDIA_ERR_ABORTED",
                "MEDIA_ERR_NETWORK",
                "MEDIA_ERR_DECODE",
                "MEDIA_ERR_SRC_NOT_SUPPORTED",
              ][rawErr.code - 1] ?? `code(${rawErr.code})`,
            }
          : null,
        reason,
      });
      onNativeError?.(reason, rawErr?.code);

      // If an embed URL was provided as a fallback, prefer it.
      if (embedUrl) {
        setStage("embed");
        setIsLoading(false);
        setFailure(null);
        return;
      }

      setStage("external");
      setIsLoading(false);
      setFailure({ source: src, code: rawErr?.code, reason, message });
    },
    [playableSource, embedUrl, onNativeError],
  );

  const handleEmbedError = useCallback(() => {
      if (!isMountedRef.current) return;
      console.error("[SafeVideoPlayer] Embed iframe failed to load", {
        embedUrl,
        embedType,
      });
      onEmbedError?.();
      setStage("external");
      setIsLoading(false);
      setFailure({
        embedUrl,
        reason: `The ${embedType} embed could not be loaded.`,
        message:
          "The embedded video could not be loaded. The video may be private, age-restricted, or temporarily unavailable.",
      });
    }, [embedUrl, embedType, onEmbedError]);

  const handleRetry = useCallback(() => {
      if (!isMountedRef.current) return;
      setStage("probing");
      setFailure(null);
      setIsLoading(true);
      setDecoded(false);
      setIsPlaying(false);
      const v = videoRef.current;
      if (v) v.load();
    }, []);

  const openExternal = useCallback(() => {
    const url =
      failure?.source?.url ??
      failure?.embedUrl ??
      embedUrl ??
      activeSource?.url ??
      "";
    if (!url) return;
    console.info("[SafeVideoPlayer] Opening external fallback URL", url);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [failure, embedUrl, activeSource]);

  // ──────────────────────────────────────────────────────────────────
  // Lifecycle: probe the URL, then mount the appropriate player
  // ──────────────────────────────────────────────────────────────────

  useEffect(() => {
      // Reset mounted flag — the cleanup function sets this false on
      // unmount, but for effect re-runs (URL changed) we need to allow
      // setState again.
      isMountedRef.current = true;
      let cancelled = false;
      setStage("probing");
      setIsLoading(true);
      setFailure(null);
      setDecoded(false);
      setIsPlaying(false);

    const targetUrl = playableSource?.url ?? embedUrl;

    if (!targetUrl) {
      // No URL at all.
      setStage("external");
      setIsLoading(false);
      setFailure({
        reason: "SafeVideoPlayer received no URL.",
        message: "No video URL was provided.",
      });
      return;
    }

    // Known placeholder URLs (e.g. w3schools/html/movie.mp4 which 404s)
    // short-circuit straight to the error card with a clear hint.
    if (isDirectVideo && isKnownPlaceholderUrl(targetUrl)) {
      console.warn(
        "[SafeVideoPlayer] Known placeholder URL detected, skipping probe:",
        targetUrl,
      );
      if (!cancelled) {
        setStage("external");
        setIsLoading(false);
        setFailure({
          source: playableSource,
          reason: `Placeholder URL detected: ${targetUrl}`,
          message:
            "This video uses a placeholder URL that no longer resolves. "
            + "Replace it with a real, accessible video file.",
        });
      }
      return;
    }

    // For embeds we don't need to probe — the iframe will surface its
    // own errors via onLoad (success) / onError (block).
    if (!isDirectVideo) {
      if (!cancelled) setStage("embed");
      setIsLoading(false);
      return;
    }

    // For direct videos, probe the URL first so we can show a real
    // HTTP error instead of "Unknown playback error".
    probeUrl(targetUrl).then((ok) => {
      if (cancelled || !isMountedRef.current) return;
      if (ok) {
        transitionToNative();
      } else {
        const reason = `Network probe failed for ${targetUrl}: HTTP response was not 200/206. `
          + "The file may have moved (404), the server may be down, "
          + "or the request was blocked by CORS without an "
          + "Access-Control-Allow-Origin header.";
        console.error("[SafeVideoPlayer]", reason);
        if (embedUrl) {
          setStage("embed");
          setIsLoading(false);
          return;
        }
        setStage("external");
        setIsLoading(false);
        setFailure({
          source: playableSource,
          reason,
          message:
            "The video file could not be reached. "
            + "The link may be broken or the server may be temporarily down.",
        });
      }
    });

    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources[0]?.url, embedUrl]);

  // ──────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────

  return (
      <ErrorBoundary
        className={className}
        fallback={(err) => (
          <div
            className={cn(
              "relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-black",
              className,
            )}
            role="alert"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-4 ring-1 ring-rose-500/20">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-white font-black text-lg">Video Player Crashed</h3>
            <p className="text-slate-400 text-sm max-w-md mt-1">
              {err.message || "An unexpected error occurred while rendering the video player."}
            </p>
          </div>
        )}
      >
      <div
        className={cn(
          "relative w-full h-full bg-black overflow-hidden",
          className,
        )}
        data-testid="safe-video-player"
        data-stage={stage}
        data-embed-type={embedType}
      >
      {/* ── Probing overlay ───────────────────────────────────────── */}
      {stage === "probing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 text-white/90">
            <Loader2 size={36} className="animate-spin" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Connecting…
            </span>
          </div>
        </div>
      )}

      {/* ── STAGE: native <video> ─────────────────────────────────── */}
      {stage === "native" && playableSource && (
        // NOTE: no crossOrigin attribute. Adding crossOrigin="anonymous"
        // triggers a CORS preflight that most static file hosts don't
        // pass, causing MEDIA_ERR_SRC_NOT_SUPPORTED on otherwise valid
        // videos. Only add it if you intend to draw video frames to a
        // canvas or pipe audio through Web Audio.
        <video
          key={playableSource.url}
          ref={videoRef}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          // iOS WebViews need the legacy webkit attribute too.
          {...({
            "webkit-playsinline": "true",
            "x5-playsinline": "true",
          } as Record<string, string>)}
          poster={poster}
          preload="metadata"
          className="w-full h-full object-contain bg-black"
          title={title}
          onLoadedMetadata={() => {
                      if (!isMountedRef.current) return;
                      setIsLoading(false);
                      setDecoded(true);
                      const v = videoRef.current;
                      if (!v) return;
                      v.play().catch((e: unknown) => {
                        if (!isMountedRef.current) return;
                        const msg = e instanceof Error ? e.message : String(e);
                        console.warn("[SafeVideoPlayer] Autoplay rejected", msg);
                        // Don't treat autoplay rejection as a hard failure —
                        // the user can still tap play in the controls.
                      });
                    }}
                    onError={(e) => {
                      // e.currentTarget CAN be null when the <video> element has been
                      // removed from the DOM (e.g. modal closed mid-load). Guard first
                      // so we never read target.error from undefined.
                      const target = e.currentTarget as HTMLVideoElement | null;
                      if (!isMountedRef.current || !target) return;
                      handleNativeError(target.error ?? null);
                    }}
                    onStalled={() => { if (isMountedRef.current) setIsLoading(true); }}
                    onPlaying={() => { if (isMountedRef.current) { setIsPlaying(true); setIsLoading(false); } }}
                    onPause={() => { if (isMountedRef.current) setIsPlaying(false); }}
                    onCanPlay={() => { if (isMountedRef.current) setIsLoading(false); }}
                    onWaiting={() => { if (isMountedRef.current) setIsLoading(true); }}
        >
          <source
            src={playableSource.url}
            type={playableSource.mime ?? "video/mp4"}
          />
          {playableSource.codecs && (
            <source
              src={playableSource.url}
              type={`${playableSource.mime ?? "video/mp4"}; codecs="${playableSource.codecs}"`}
            />
          )}
          Your browser does not support the video tag.
        </video>
      )}

      {/* ── STAGE: embed iframe (YouTube / Vimeo / Drive) ─────────── */}
      {stage === "embed" && embedUrl && (
        <iframe
          key={embedUrl}
          ref={iframeRef}
          className="w-full h-full"
          src={embedUrl}
          title={title}
          // `sandbox` is intentionally permissive here: most embeds
          // require same-origin access to function (fullscreen API,
          // postMessage, etc.). The iframe is loaded from a trusted
          // platform domain.
          allow={
            embedType === "youtube"
              ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              : "autoplay; fullscreen; picture-in-picture"
          }
          allowFullScreen
          // Some browsers don't fire onError on blocked iframes, but
          // we still wire the handler so we can flip to the external
          // fallback if the platform returns an error document.
          onError={handleEmbedError}
        />
      )}

      {/* ── STAGE: external / "open in browser" card ──────────────── */}
      {stage === "external" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-black"
          role="alert"
        >
          <div className="w-20 h-20 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-5 ring-1 ring-rose-500/20">
            <AlertCircle size={36} />
          </div>

          <h3 className="text-white font-black text-xl sm:text-2xl tracking-tight">
            Unable to Play Video
          </h3>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mt-2 leading-relaxed">
            {failure?.message ?? "This video can't be played in the in-app player on this device."}
          </p>

          {/* Friendly diagnosis pill — helps users + support staff */}
          {failure?.code !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
              <Wifi size={14} className="text-amber-400" />
              Error code {failure.code} •{" "}
              {failure.code === 2
                ? "Network / CORS"
                : failure.code === 3
                  ? "Codec"
                  : failure.code === 4
                    ? "Format / CORS / 404"
                    : "Playback"}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-7">
            {/* The "Open in Browser" button — always present when there's
                a URL to open. window.open works in regular browsers and
                most WebViews; in a Capacitor app swap for
                `import { Browser } from '@capacitor/browser'`. */}
            {(failure?.source?.url || failure?.embedUrl || embedUrl || activeSource?.url) && (
              <Button
                onClick={openExternal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12 px-6 gap-2 shadow-lg shadow-indigo-600/20"
              >
                <ExternalLink size={18} />
                {FALLBACK_EXTERNAL_LABEL}
              </Button>
            )}
            <Button
              onClick={handleRetry}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-6 gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </Button>
          </div>

          {inWebView && (
            <p className="text-slate-500 text-xs mt-6 max-w-sm">
              You're viewing this in the app's built-in browser. Tap{" "}
              <strong className="text-slate-300">
                {FALLBACK_EXTERNAL_LABEL}
              </strong>{" "}
              to open it in your system browser.
            </p>
          )}
        </div>
      )}

      {/* ── Loading overlay ───────────────────────────────────────── */}
      {stage === "native" && isLoading && !decoded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 text-white/90">
            <Loader2 size={36} className="animate-spin" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Loading video…
            </span>
          </div>
        </div>
      )}

      {/* Tap-to-play hint when autoplay was blocked */}
      {stage === "native" && decoded && !isPlaying && autoPlay && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Play size={28} className="text-white" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
        </ErrorBoundary>
      );
    };
    
    export default SafeVideoPlayer;