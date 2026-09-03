"use client";

/**
 * VideoPlayerErrorBoundary
 * -----------------------
 * Lightweight React error boundary scoped to the video player only.
 *
 * Why this exists:
 *   The `<video>` and `<iframe>` elements sometimes throw asynchronously
 *   after the component has unmounted (e.g. when the parent Dialog closes
 *   while the video is still loading). The browser-level error then
 *   surfaces as a synthetic React event with a null `currentTarget`, and
 *   code that reads `e.currentTarget.error` blows up with
 *   "Cannot read properties of undefined (reading 'frame')".
 *
 *   Wrapping the player in an ErrorBoundary prevents that crash from
 *   taking down the entire page — the boundary catches the throw and
 *   shows the same "Unable to Play Video" fallback that the player
 *   already exposes.
 *
 * Keep this file dependency-free; it ships as part of the player bundle.
 */

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  /** Optional fallback override. When provided, used instead of the
   *  default error card. */
  fallback?: (
    error: Error,
    reset: () => void,
  ) => React.ReactNode;
  /** Optional className applied to the default fallback card. */
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class VideoPlayerErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Always log the full error to the console so devs can see what
    // crashed. Useful for tracking down "frame" / "currentTarget" issues.
    // eslint-disable-next-line no-console
    console.error(
      "[VideoPlayerErrorBoundary] Caught error inside video player:",
      error,
      info?.componentStack,
    );
  }

  private reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div
          className={
            "flex flex-col items-center justify-center text-center p-8 h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black " +
            (this.props.className ?? "")
          }
          role="alert"
        >
          <div className="w-16 h-16 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-4 ring-1 ring-rose-500/20">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-white font-black text-lg">Video Player Crashed</h3>
          <p className="text-slate-400 text-sm max-w-md mt-1">
            The video player ran into an unexpected error and was reset.
          </p>
          <Button
            onClick={this.reset}
            variant="outline"
            className="mt-4 border-white/20 text-white hover:bg-white/10 rounded-xl h-11 px-5 gap-2"
          >
            <RefreshCw size={16} />
            Restart Player
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default VideoPlayerErrorBoundary;