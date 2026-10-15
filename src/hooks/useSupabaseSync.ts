import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

export function useSupabaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync Learners from Supabase directly into state/storage on load
  const fetchLearnersFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('learners').select('*');
      if (error) throw error;
      if (data) {
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

  // Sync Staff Members from Supabase
  const fetchStaffFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('staff_members').select('*');
      if (error) throw error;
      if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone,
          role: item.role,
          tscNumber: item.tsc_number,
          assignedClass: item.assigned_class,
          status: item.status || 'Active',
        }));
        localStorage.setItem('munyaka_staff_members', JSON.stringify(mapped));
        localStorage.setItem('school_staff_data', JSON.stringify(mapped));
        window.dispatchEvent(new Event('staff-updated'));
        window.dispatchEvent(new Event('storage'));
        return mapped;
      }
    } catch (err: any) {
      console.warn('Failed to fetch staff members from Supabase:', err.message);
    }
    return null;
  }, []);

  // Sync Assessment Marks from Supabase
  const fetchAssessmentMarksFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('assessment_marks').select('*');
      if (error) throw error;
      if (data) {
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
        localStorage.setItem('assessment_marks_data', JSON.stringify(mapped));
        window.dispatchEvent(new Event('storage'));
        return mapped;
      }
    } catch (err: any) {
      console.warn('Failed to fetch assessment marks from Supabase:', err.message);
    }
    return null;
  }, []);

  // Sync Attendance from Supabase
  const fetchAttendanceFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('attendance').select('*');
      if (error) throw error;
      if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          learnerId: item.learner_id,
          admissionNumber: item.admission_number,
          date: item.date,
          status: item.status,
          grade: item.grade,
          stream: item.stream,
        }));
        localStorage.setItem('munyaka_attendance_records', JSON.stringify(mapped));
        window.dispatchEvent(new Event('storage'));
        return mapped;
      }
    } catch (err: any) {
      console.warn('Failed to fetch attendance from Supabase:', err.message);
    }
    return null;
  }, []);

  // Sync Fee Settings & Payments from Supabase
  const fetchFeeSettingsFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('fee_settings').select('*');
      if (error) throw error;
      if (data) {
        localStorage.setItem('munyaka_fee_settings', JSON.stringify(data));
        window.dispatchEvent(new Event('storage'));
        return data;
      }
    } catch (err: any) {
      console.warn('Failed to fetch fee settings from Supabase:', err.message);
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
        fetchStaffFromSupabase(),
        fetchAssessmentMarksFromSupabase(),
        fetchAttendanceFromSupabase(),
        fetchFeeSettingsFromSupabase(),
      ]);
      setLastSynced(new Date());
    } catch (err: any) {
      setSyncError(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [
    fetchLearnersFromSupabase,
    fetchStaffFromSupabase,
    fetchAssessmentMarksFromSupabase,
    fetchAttendanceFromSupabase,
    fetchFeeSettingsFromSupabase,
  ]);

  // Push learner to Supabase
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

  // Push staff member to Supabase
  const saveStaffToCloud = async (staff: any) => {
    try {
      const payload = {
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        tsc_number: staff.tscNumber,
        assigned_class: staff.assignedClass,
        status: staff.status || 'Active',
      };
      const { error } = await supabase.from('staff_members').upsert(payload, { onConflict: 'email' });
      if (error) throw error;
      window.dispatchEvent(new Event('staff-updated'));
    } catch (err: any) {
      console.error('Error saving staff to Supabase:', err.message);
    }
  };

  // Push assessment mark to Supabase
  const saveAssessmentMarkToCloud = async (markRecord: any) => {
    try {
      const payload = {
        learner_id: markRecord.learnerId,
        admission_number: markRecord.admissionNumber,
        learner_name: markRecord.learnerName,
        grade: markRecord.grade,
        stream: markRecord.stream,
        learning_area: markRecord.learningArea,
        score: markRecord.score,
        max_score: markRecord.maxScore || 100,
        term: markRecord.term || 'Term 3',
        academic_year: markRecord.academicYear || '2026',
        remarks: markRecord.remarks,
      };

      const { error } = await supabase.from('assessment_marks').insert(payload);
      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving assessment mark to Supabase:', err.message);
    }
  };

  // Push attendance record to Supabase
  const saveAttendanceToCloud = async (attRecord: any) => {
    try {
      const payload = {
        learner_id: attRecord.learnerId,
        admission_number: attRecord.admissionNumber,
        date: attRecord.date,
        status: attRecord.status,
        grade: attRecord.grade,
        stream: attRecord.stream,
      };
      const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'admission_number,date' });
      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving attendance to Supabase:', err.message);
    }
  };

  // Push fee settings to Supabase
  const saveFeeSettingsToCloud = async (feeSetting: any) => {
    try {
      const { error } = await supabase.from('fee_settings').upsert(feeSetting);
      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving fee settings to Supabase:', err.message);
    }
  };

  // Real-time subscriptions setup across all tables
  useEffect(() => {
    syncWithCloud();

    const channel = supabase
      .channel('public-db-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'learners' },
        () => fetchLearnersFromSupabase()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_members' },
        () => fetchStaffFromSupabase()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assessment_marks' },
        () => fetchAssessmentMarksFromSupabase()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => fetchAttendanceFromSupabase()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fee_settings' },
        () => fetchFeeSettingsFromSupabase()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    fetchLearnersFromSupabase,
    fetchStaffFromSupabase,
    fetchAssessmentMarksFromSupabase,
    fetchAttendanceFromSupabase,
    fetchFeeSettingsFromSupabase,
    syncWithCloud,
  ]);

  return {
    isSyncing,
    lastSynced,
    syncError,
    syncWithCloud,
    saveLearnerToCloud,
    saveStaffToCloud,
    saveAssessmentMarkToCloud,
    saveAttendanceToCloud,
    saveFeeSettingsToCloud,
  };
}
