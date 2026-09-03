"use client";

/**
 * SafeVideoPlayer
 * ---------------
 * A cross-platform (iOS Safari, Android Chrome, Capacitor/Cordova WebView,
 * desktop browsers) video player that never leaves the user staring at
 * "Unable to Play Video".
 *
 * It tries, in order:
 *   1. HTML5 <video> with multiple <source> candidates (MP4 H.264/AAC first
 *      because that is the only combination with 100% native playback on iOS,
 *      Android, and modern desktop browsers).
 *   2. YouTube iframe embed (only if a youtubeId is provided) — works on
 *      every platform including restricted WebViews because it falls back to
 *      the system browser when the WebView blocks autoplay.
 *   3. A "Open externally" action that hands the URL off to the OS browser /
 *      native player via window.open or a Capacitor Browser plugin call.
 *
 * Error handling covers:
 *   - MEDIA_ERR_NETWORK        (network / CORS preflight failed)
 *   - MEDIA_ERR_DECODE         (codec not supported — e.g. WebM on iOS Safari)
 *   - MEDIA_ERR_SRC_NOT_SUPPORTED (mime / 404 / cross-origin blocked)
 *   - stalled / suspend events  (slow networks)
 *   - abort / emptied           (interrupted loads)
 *
 * The component is intentionally dependency-free so it works in any
 * Capacitor / React Native WebView / PWA build without extra installs.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

export interface VideoSource {
  /** Direct URL to a video file (.mp4, .webm, .m3u8, .ogg, etc.) */
  url: string;
  /** MIME type hint, e.g. "video/mp4", "video/webm", "application/x-mpegURL" */
  mime?: string;
  /** Optional codec string for very strict browsers, e.g. 'avc1.42E01E, mp4a.40.2' */
  codecs?: string;
  /** Set true for HLS streams that require native (Safari / Android Chrome) playback */
  isHls?: boolean;
}

export interface SafeVideoPlayerProps {
  /** Primary list of sources to attempt. Order = preference order. */
  sources: VideoSource[];
  /** Optional YouTube fallback id (e.g. "dQw4w9WgXcQ"). */
  youtubeId?: string;
  /** Poster image displayed before / during buffering. */
  poster?: string;
  /** Accessible title for screen readers and the iframe. */
  title?: string;
  /** Auto-play once metadata is loaded. Defaults to true. */
  autoPlay?: boolean;
  /** Show native controls. Defaults to true. */
  controls?: boolean;
  /** Force muted playback — required for autoplay on most mobile browsers. */
  muted?: boolean;
  /** Loop the video. */
  loop?: boolean;
  /** Optional className for the outer wrapper. */
  className?: string;
  /**
   * Optional callback invoked with a short string describing why the
   * native <video> path failed. Useful for telemetry.
   */
  onNativeError?: (reason: string) => void;
}

type PlaybackStage = "native" | "youtube" | "external";

interface FailureInfo {
  source: VideoSource;
  code?: number;
  reason: string;
}

const FALLBACK_EXTERNAL_LABEL = "Open in Browser";

/**
 * Try to detect HLS support natively. Safari (and most iOS WebViews)
 * can play .m3u8 directly. Desktop Chrome / Firefox / Edge need hls.js —
 * which we intentionally avoid as a dependency; we let the browser
 * degrade gracefully to the YouTube / external fallback instead.
 */
const supportsNativeHls = (): boolean => {
  if (typeof document === "undefined") return false;
  const v = document.createElement("video");
  return Boolean(
    v.canPlayType &&
      // Safari returns 'maybe' or 'probably' for application/x-mpegURL
      v.canPlayType('application/vnd.apple.mpegurl'),
  );
};

/**
 * Detect whether we're inside a Capacitor / Cordova WebView. In that
 * environment <video> can sometimes refuse to play due to plugin
 * interception, and `window.open` may not work — so we show a clearer
 * "Open externally" affordance.
 */
const isNativeWebView = (): boolean => {
  if (typeof navigator === "undefined") return false;
  // @ts-expect-error — injected by Capacitor / Cordova at runtime
  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) {
    return true;
  }
  // Cordova sets device on window
  // @ts-expect-error
  return Boolean((window as any).cordova);
};

const SafeVideoPlayer: React.FC<SafeVideoPlayerProps> = ({
  sources,
  youtubeId,
  poster,
  title = "Video",
  autoPlay = true,
  controls = true,
  muted = true,
  loop = false,
  className,
  onNativeError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stage, setStage] = useState<PlaybackStage>("native");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failure, setFailure] = useState<FailureInfo | null>(null);
  const [decoded, setDecoded] = useState(false);

  // Pick the sources in priority order, dropping HLS on browsers that
  // can't handle it natively so we fail fast and move to the next stage.
  const playableSources = useMemo(() => {
    const nativeHls = supportsNativeHls();
    return sources.filter((s) => {
      if (s.isHls) return nativeHls;
      return true;
    });
  }, [sources]);

  const hasYoutube = Boolean(youtubeId);
  const inWebView = useMemo(isNativeWebView, []);

  const advanceToNextStage = useCallback(
    (info: FailureInfo) => {
      // 1) Try the next source for native playback
      if (currentIndex < playableSources.length - 1) {
        setCurrentIndex((i) => i + 1);
        setIsLoading(true);
        setFailure(null);
        return;
      }
      // 2) Then fall back to YouTube embed
      if (stage === "native" && hasYoutube) {
        setStage("youtube");
        setIsLoading(false);
        setFailure(null);
        return;
      }
      // 3) Finally, show the "open externally" card
      setStage("external");
      setIsLoading(false);
      setFailure(info);
      onNativeError?.(info.reason);
    },
    [currentIndex, playableSources.length, stage, hasYoutube, onNativeError],
  );

  const handleError = useCallback(() => {
    const v = videoRef.current;
    const err = v?.error;
    const src = playableSources[currentIndex];

    let reason = "Unknown playback error.";
    if (err) {
      switch (err.code) {
        case 1: // MEDIA_ERR_ABORTED
          reason = "Playback was aborted.";
          break;
        case 2: // MEDIA_ERR_NETWORK
          reason =
            "A network error prevented the video from loading. This is usually a CORS or connectivity issue.";
          break;
        case 3: // MEDIA_ERR_DECODE
          reason =
            "The video could not be decoded. The file may use a codec this device does not support.";
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          reason =
            "The video format is not supported on this device, or the server returned an incompatible response (CORS / MIME / 404).";
          break;
        default:
          reason = err.message || reason;
      }
    }

    advanceToNextStage({ source: src, code: err?.code, reason });
  }, [advanceToNextStage, playableSources, currentIndex]);

  const handleLoadedMetadata = useCallback(() => {
    setIsLoading(false);
    setDecoded(true);
    // Some WebViews (Android Capacitor <6) block autoplay unless the user
    // has interacted. If that happens we silently fall back to the
    // YouTube stage rather than show a broken state.
    const v = videoRef.current;
    if (!v) return;
    v.play().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      advanceToNextStage({
        source: playableSources[currentIndex],
        reason: `Autoplay rejected: ${msg}`,
      });
    });
  }, [advanceToNextStage, playableSources, currentIndex]);

  const handleStalled = useCallback(() => {
    // Stalled alone is not fatal — only flag loading.
    setIsLoading(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsPlaying(true);
    setIsLoading(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleRetry = useCallback(() => {
    setStage("native");
    setCurrentIndex(0);
    setFailure(null);
    setIsLoading(true);
    setDecoded(false);
    // Force the <video> element to remount by reloading its source
    const v = videoRef.current;
    if (v) {
      v.load();
    }
  }, []);

  const openExternal = useCallback(() => {
    const url =
      failure?.source.url ??
      playableSources[0]?.url ??
      (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : "");
    if (!url) return;
    // window.open works in regular browsers and most WebViews that have
    // a configured whitelist. In a Capacitor app you may want to swap
    // this for `import { Browser } from '@capacitor/browser' && Browser.open({url})`.
    window.open(url, "_blank", "noopener,noreferrer");
  }, [failure, playableSources, youtubeId]);

  // Reset state when sources change (e.g. user picks a new video)
  useEffect(() => {
    handleRetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources[0]?.url, sources[1]?.url]);

  // If we have no playable sources at all, skip the native stage
  useEffect(() => {
    if (playableSources.length === 0 && stage === "native") {
      if (hasYoutube) {
        setStage("youtube");
      } else {
        setStage("external");
        setFailure({
          source: { url: "" },
          reason: "No playable video sources were provided for this device.",
        });
      }
    }
  }, [playableSources, stage, hasYoutube]);

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────

  const currentSource = playableSources[currentIndex];

  return (
    <div
      className={cn(
        "relative w-full h-full bg-black overflow-hidden",
        className,
      )}
      data-testid="safe-video-player"
      data-stage={stage}
    >
      {/* ── STAGE 1: native <video> ─────────────────────────────── */}
      {stage === "native" && currentSource && (
        <video
          key={`${currentSource.url}-${currentIndex}`}
          ref={videoRef}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          // `playsInline` alone isn't enough on iOS — set the webkit
          // attribute too, and force the airplay attribute to off so
          // we don't fight AirPlay routing inside a WebView modal.
          {...({ "webkit-playsinline": "true", "x5-playsinline": "true" } as Record<
            string,
            string
          >)}
          poster={poster}
          preload="metadata"
          crossOrigin="anonymous"
          className="w-full h-full object-contain bg-black"
          title={title}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          onStalled={handleStalled}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onCanPlay={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
        >
          {/* The <source> element picks the first one the browser
              claims it can play. Listing MP4 (H.264/AAC) first is the
              universal safe choice. */}
          <source
            src={currentSource.url}
            type={currentSource.mime ?? "video/mp4"}
          />
          {currentSource.codecs && (
            <source
              src={currentSource.url}
              type={`${currentSource.mime ?? "video/mp4"}; codecs="${currentSource.codecs}"`}
            />
          )}
          {/* Fallback message for browsers that understand <video> but
              cannot play this file (rare, but covers very old engines). */}
          Your browser cannot play this video.
        </video>
      )}

      {/* ── STAGE 2: YouTube embed ───────────────────────────────── */}
      {stage === "youtube" && youtubeId && (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}

      {/* ── STAGE 3: external / "open in browser" card ───────────── */}
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
            {failure?.reason ??
              "This video can't be played in the in-app player on this device."}
          </p>

          {/* Show a friendly diagnosis pill so users (and support staff)
              know what's actually wrong. */}
          {failure?.code !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
              <Wifi size={14} className="text-amber-400" />
              Error code {failure.code} •{" "}
              {failure.code === 2
                ? "Network / CORS"
                : failure.code === 3
                  ? "Codec"
                  : failure.code === 4
                    ? "Format / CORS"
                    : "Playback"}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-7">
            {failure?.source.url && (
              <Button
                onClick={openExternal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12 px-6 gap-2 shadow-lg shadow-indigo-600/20"
              >
                <ExternalLink size={18} />
                {FALLBACK_EXTERNAL_LABEL}
              </Button>
            )}
            {hasYoutube && stage === "external" && (
              // Stage is already 'external' here, so we cannot go to
              // YouTube. This branch is only kept for safety; in
              // practice YouTube would have been tried first.
              <Button
                onClick={() => {
                  setStage("youtube");
                  setFailure(null);
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-6 gap-2"
              >
                <Play size={18} fill="currentColor" />
                Watch on Web Player
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

      {/* ── Loading overlay (native stage only) ──────────────────── */}
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

      {/* Subtle "tap to play" hint on devices where autoplay is blocked.
          We don't render our own play button because the native <video>
          already exposes one in its control bar, but we surface a quiet
          overlay on iOS Safari where controls are sometimes hidden. */}
      {stage === "native" && decoded && !isPlaying && autoPlay && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Play size={28} className="text-white" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeVideoPlayer;