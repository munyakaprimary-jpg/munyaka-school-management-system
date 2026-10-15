import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

export function useSupabaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync Learners from Supabase
  const fetchLearnersFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('learners').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        // Map database schema back to app Student format
        const mapped = data.map((item: any) => ({
          id: item.id,
          admissionNumber: item.admission_number,
          name: item.name,
          grade: item.grade,
          stream: item.stream,
          gender: item.gender,
          guardianPhone: item.guardian_phone,
          guardianName: item.guardian_name,
          assessmentNumber: item.assessment_number,
          upiNumber: item.upi_number,
          status: item.status || 'Active',
          photoUrl: item.photo_url,
          dateOfBirth: item.date_of_birth,
        }));
        localStorage.setItem('munyaka_students', JSON.stringify(mapped));
        localStorage.setItem('school_learners_data', JSON.stringify(mapped));
        window.dispatchEvent(new Event('students-updated'));
        window.dispatchEvent(new Event('storage'));
        return mapped;
      }
    } catch (err: any) {
      console.warn('Failed to fetch learners from Supabase:', err.message);
    }
    return null;
  }, []);

  // Sync Grades & Streams from Supabase
  const fetchStreamsFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('grades_streams').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        localStorage.setItem('configured_streams', JSON.stringify(data));
        window.dispatchEvent(new Event('munyaka_grades_updated'));
        return data;
      }
    } catch (err: any) {
      console.warn('Failed to fetch grades/streams from Supabase:', err.message);
    }
    return null;
  }, []);

  // Sync Grades / Marks from Supabase
  const fetchGradesFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('grades').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          learnerId: item.learner_id,
          admissionNumber: item.admission_number,
          learnerName: item.learner_name,
          grade: item.grade,
          stream: item.stream,
          learningArea: item.learning_area,
          score: item.score,
          maxScore: item.max_score,
          term: item.term,
          academicYear: item.academic_year,
          remarks: item.remarks,
        }));
        localStorage.setItem('munyaka_marks_records', JSON.stringify(mapped));
        window.dispatchEvent(new Event('storage'));
        return mapped;
      }
    } catch (err: any) {
      console.warn('Failed to fetch grades from Supabase:', err.message);
    }
    return null;
  }, []);

  // Master sync function
  const syncWithCloud = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await Promise.all([
        fetchLearnersFromSupabase(),
        fetchStreamsFromSupabase(),
        fetchGradesFromSupabase(),
      ]);
      setLastSynced(new Date());
      showSuccess('Cloud synchronized successfully with Supabase!');
    } catch (err: any) {
      setSyncError(err.message || 'Sync failed');
      showError('Cloud sync warning: running on local cache.');
    } finally {
      setIsSyncing(false);
    }
  }, [fetchLearnersFromSupabase, fetchStreamsFromSupabase, fetchGradesFromSupabase]);

  // Push local learner to Supabase
  const saveLearnerToCloud = async (learner: any) => {
    try {
      const payload = {
        admission_number: learner.admissionNumber || learner.admNo || `ADM-${Date.now()}`,
        name: learner.name,
        grade: learner.grade,
        stream: learner.stream,
        gender: learner.gender,
        guardian_phone: learner.guardianPhone,
        guardian_name: learner.guardianName,
        assessment_number: learner.assessmentNumber,
        upi_number: learner.upiNumber,
        status: learner.status || 'Active',
        photo_url: learner.photoUrl,
        date_of_birth: learner.dateOfBirth,
      };

      const { error } = await supabase.from('learners').upsert(payload, { onConflict: 'admission_number' });
      if (error) throw error;
      window.dispatchEvent(new Event('students-updated'));
    } catch (err: any) {
      console.error('Error saving learner to Supabase:', err.message);
    }
  };

  // Push grade/mark to Supabase
  const saveGradeToCloud = async (gradeRecord: any) => {
    try {
      const payload = {
        learner_id: gradeRecord.learnerId,
        admission_number: gradeRecord.admissionNumber,
        learner_name: gradeRecord.learnerName,
        grade: gradeRecord.grade,
        stream: gradeRecord.stream,
        learning_area: gradeRecord.learningArea,
        score: gradeRecord.score,
        max_score: gradeRecord.maxScore || 100,
        term: gradeRecord.term || 'Term 3',
        academic_year: gradeRecord.academicYear || '2026',
        remarks: gradeRecord.remarks,
      };

      const { error } = await supabase.from('grades').insert(payload);
      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving grade to Supabase:', err.message);
    }
  };

  // Push stream to Supabase
  const saveStreamToCloud = async (streamName: string, gradeName: string) => {
    try {
      const payload = {
        stream_name: streamName,
        grade_name: gradeName,
      };
      const { error } = await supabase.from('grades_streams').upsert(payload, { onConflict: 'stream_name,grade_name' });
      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving stream to Supabase:', err.message);
    }
  };

  // Real-time subscriptions setup
  useEffect(() => {
    syncWithCloud();

    const channel = supabase
      .channel('public-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'learners' },
        () => {
          fetchLearnersFromSupabase();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grades' },
        () => {
          fetchGradesFromSupabase();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grades_streams' },
        () => {
          fetchStreamsFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLearnersFromSupabase, fetchGradesFromSupabase, fetchStreamsFromSupabase, syncWithCloud]);

  return {
    isSyncing,
    lastSynced,
    syncError,
    syncWithCloud,
    saveLearnerToCloud,
    saveGradeToCloud,
    saveStreamToCloud,
  };
}
