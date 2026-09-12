/**
 * useBackToAssessmentsMenu
 * ─────────────────────────
 * Shared back-navigation helper for assessment sub-views
 * (`SetExamsList`, `GradingReview`, `Assessments`, and any future
 * module mounted under `/assessments/*`).
 *
 * Goal: clicking the back arrow in any sub-view MUST
 *   1. Reset transient in-page view state (so re-entry starts clean).
 *   2. Switch the global sidebar / top-level navigation to the
 *      `assessments` tab when an `activeTab` / `setActiveTab` /
 *      `setSidebarTab` setter is available, OR fall back to
 *      `navigate('/assessments')` so the Sidebar's
 *      `useLocation()`-driven highlight activates correctly.
 *
 * The Sidebar's `isActive` check uses `location.pathname`, so
 * navigating to `/assessments` is enough on its own — the helper
 * additionally guards the active-tab state setters for the
 * module-style navigation pattern used in some routes.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface Setters {
  /** Preferred: module-style "active tab" state setter (e.g. setActiveTab). */
  setActiveTab?: (tab: string) => void;
  /** Alternative: sidebar tab state setter. */
  setSidebarTab?: (tab: string) => void;
}

interface Resetters {
  /** Optional list of state setters to call with their reset value. */
  resets?: Array<() => void>;
}

export function useBackToAssessmentsMenu(
  setters: Setters = {},
  resetters: Resetters = {}
) {
  const navigate = useNavigate();
  const { setActiveTab, setSidebarTab } = setters;
  const resets = resetters.resets;

  return useCallback(() => {
    // 1) Reset any nested view state so re-entry starts clean.
    resets?.forEach((reset) => {
      try {
        reset();
      } catch {
        /* swallow — a bad reset should never break back-navigation */
      }
    });

    // 2) Update the global active navigation state when the host
    //    exposes the matching setter; otherwise fall back to
    //    `navigate('/assessments')` so the Sidebar's pathname-based
    //    active highlight activates automatically.
    if (typeof setActiveTab === "function") {
      setActiveTab("assessments");
    } else if (typeof setSidebarTab === "function") {
      setSidebarTab("assessments");
    } else {
      navigate("/assessments");
    }
  }, [navigate, setActiveTab, setSidebarTab, resets]);
}
