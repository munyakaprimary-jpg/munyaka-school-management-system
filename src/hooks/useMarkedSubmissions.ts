/**
 * useMarkedSubmissions — React hook over the `marked_student_submissions`
 * localStorage ledger.
 *
 * Subscribes to the custom `submissions_updated` window event so any save
 * from another component (e.g. the grading dashboard) immediately refreshes
 * consumers. Exposes a memoised list (newest-first) and the full CRUD
 * surface so the "Marked Scripts" management view can stay reactive.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteMarkedSubmission as deleteMarkedSubmissionRaw,
  listMarkedSubmissions,
  readMarkedSubmissions,
  saveMarkedSubmission as saveMarkedSubmissionRaw,
  saveMarkedSubmissions as saveMarkedSubmissionsRaw,
  StudentSubmission,
} from "@/types/assessment";

interface UseMarkedSubmissionsResult {
  /** Newest-first list of marked submissions. */
  submissions: StudentSubmission[];
  /** True while the hook is performing the initial read. */
  isLoading: boolean;
  /** Re-read the localStorage ledger (also fired automatically on the event). */
  refresh: () => void;
  /** Upsert a single submission. */
  saveSubmission: (submission: StudentSubmission) => boolean;
  /** Upsert many submissions in a single transaction. */
  saveMany: (submissions: StudentSubmission[]) => boolean;
  /** Delete a submission by id. Returns true if a record was removed. */
  deleteSubmission: (id: string) => boolean;
}

export function useMarkedSubmissions(): UseMarkedSubmissionsResult {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setSubmissions(listMarkedSubmissions());
  }, []);

  // Initial read + subscription to the cross-component change event.
  useEffect(() => {
    setSubmissions(listMarkedSubmissions());
    setIsLoading(false);

    const handleUpdate = () => {
      setSubmissions(listMarkedSubmissions());
    };

    if (typeof window !== "undefined") {
      window.addEventListener("submissions_updated", handleUpdate);
      // Also re-read on the generic `storage` event so updates from other
      // tabs (e.g. teacher vs. admin) are picked up.
      const handleStorage = (e: StorageEvent) => {
        if (e.key === "marked_student_submissions") {
          setSubmissions(listMarkedSubmissions());
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => {
        window.removeEventListener("submissions_updated", handleUpdate);
        window.removeEventListener("storage", handleStorage);
      };
    }
    return undefined;
  }, []);

  const saveSubmission = useCallback((submission: StudentSubmission) => {
    const ok = saveMarkedSubmissionRaw(submission);
    if (ok) {
      // Local state update is also driven by the event; reading here keeps
      // the hook idempotent in tests where the event listener may not be
      // attached yet.
      setSubmissions((prev) => {
        const idx = prev.findIndex((p) => p.id === submission.id);
        if (idx === -1) return [submission, ...prev];
        const next = [...prev];
        next[idx] = submission;
        return next;
      });
    }
    return ok;
  }, []);

  const saveMany = useCallback((items: StudentSubmission[]) => {
    const ok = saveMarkedSubmissionsRaw(items);
    if (ok) {
      setSubmissions(listMarkedSubmissions());
    }
    return ok;
  }, []);

  const deleteSubmission = useCallback((id: string) => {
    const ok = deleteMarkedSubmissionRaw(id);
    if (ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    return ok;
  }, []);

  // Memoised, sorted output (newest-first). Re-sort only when the
  // underlying list changes.
  const sorted = useMemo(
    () =>
      [...submissions].sort((a, b) => {
        const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return tb - ta;
      }),
    [submissions]
  );

  return {
    submissions: sorted,
    isLoading,
    refresh,
    saveSubmission,
    saveMany,
    deleteSubmission,
  };
}

export type { StudentSubmission };

/**
 * Standalone re-export of the raw reader so components that only need a
 * one-shot read (e.g. inside an effect that doesn't need a subscription)
 * can pull it from the same module.
 */
export { readMarkedSubmissions };
