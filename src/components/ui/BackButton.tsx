"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  /**
   * Primary explicit path to navigate to.
   * Use this when you know exactly where the back button should go
   * (e.g., a module index page like /staff, /students).
   */
  to?: string;
  /**
   * Fallback path used when `to` is not provided and there is no browser
   * history to go back through. Defaults to "/" — prefer passing `to`
   * or `parentPath` whenever the parent route is known.
   */
  fallback?: string;
  /**
   * Alias for `to` — the explicit parent route to navigate to.
   * Takes priority over `to` when provided. Use this prop to make the
   * back button's intent clear: "go to the parent module index page".
   */
  parentPath?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  to,
  fallback = '/',
  parentPath,
  className
}) => {
  const navigate = useNavigate();

  /**
   * Navigation priority:
   *   1. `parentPath` (preferred — explicit parent route)
   *   2. `to`        (explicit route, useful for one-off overrides)
   *   3. `fallback`  (last resort, default "/")
   *
   * This replaces `navigate(-1)` history-back fallbacks because
   * browser history can include unrelated navigation events (e.g.,
   * redirects, external links, browser-back from a previous session),
   * sending users to unexpected places on Android WebView.
   */
  const handleBack = () => {
    const explicitPath = parentPath ?? to;
    navigate(explicitPath ?? fallback);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleBack}
      className={`rounded-xl h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all shrink-0 ${className || ''}`}
      title="Go back"
      aria-label="Go back"
    >
      <ArrowLeft size={20} />
    </Button>
  );
};

export default BackButton;