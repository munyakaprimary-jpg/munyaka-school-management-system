import React, { useEffect } from 'react';
import { useLearners } from '@/context/LearnerContext';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const CorruptedLearnerPurgeGuard: React.FC = () => {
  const { learners, refreshLearners } = useLearners();

  useEffect(() => {
    try {
      const keys = [
        'munyaka_learners_v2',
        'munyaka_learners',
        'munyaka_students',
        'munyaka_learners_directory',
        'cached_learners',
        'students'
      ];

      let cleanedAny = false;
      keys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((l: any) => {
                if (!l) return false;
                const name = String(l.fullName || l.name || l.studentName || '').trim();
                if (!name || name === 'undefined undefined' || name === 'null null' || name === 'Unnamed Learner' || name === 'Unregistered Learner' || name === 'Unregistered Name') {
                  return false;
                }
                const admNo = String(l.admissionNo || l.admissionNumber || l.admNo || '').trim();
                if (!admNo || admNo === '—' || admNo === '-' || admNo === 'N/A' || admNo === 'undefined') {
                  return false;
                }
                return true;
              });

              if (filtered.length !== parsed.length) {
                localStorage.setItem(key, JSON.stringify(filtered));
                cleanedAny = true;
              }
            }
          } catch (e) {
            console.error(`Error cleaning key ${key}:`, e);
          }
        }
      });

      // Also clean current context learners
      if (Array.isArray(learners)) {
        const validLearners = learners.filter((l: any) => {
          if (!l) return false;
          const name = String(l.fullName || l.name || l.studentName || '').trim();
          if (!name || name === 'undefined undefined' || name === 'null null' || name === 'Unnamed Learner' || name === 'Unregistered Learner' || name === 'Unregistered Name') {
            return false;
          }
          const admNo = String(l.admissionNo || l.admissionNumber || l.admNo || '').trim();
          if (!admNo || admNo === '—' || admNo === '-' || admNo === 'N/A' || admNo === 'undefined') {
            return false;
          }
          return true;
        });

        if (validLearners.length !== learners.length) {
          localStorage.setItem('munyaka_learners', JSON.stringify(validLearners));
          localStorage.setItem('munyaka_learners_directory', JSON.stringify(validLearners));
          localStorage.setItem('munyaka_students', JSON.stringify(validLearners));
          refreshLearners();
          cleanedAny = true;
        }
      }

      if (cleanedAny) {
        console.log('[CorruptedLearnerPurgeGuard] Successfully purged corrupted learners from storage & state.');
      }
    } catch (err) {
      console.error('[CorruptedLearnerPurgeGuard] Error cleaning corrupt learners:', err);
    }
  }, [learners, refreshLearners]);

  return null;
};
