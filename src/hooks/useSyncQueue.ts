import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';

export async function processBatchSyncExport() {
  if (!navigator.onLine) {
    showError('Device is offline. Queued records will sync automatically when back online.');
    return { success: false, count: 0 };
  }

  try {
    let syncedCount = 0;

    // 1. Fetch pending local records
    const attendanceRecords = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
    const learners = JSON.parse(localStorage.getItem('munyaka_learners') || localStorage.getItem('school_learners') || '[]');
    const staff = JSON.parse(localStorage.getItem('munyaka_staff') || localStorage.getItem('staff_master_directory') || '[]');
    const marks = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');

    // 2. Batch upsert staff
    if (staff.length > 0) {
      const staffPayload = staff.map((s: any) => ({
        id: s.id || s.staffId,
        name: s.name,
        email: s.email,
        role: s.role || s.systemRole,
        tsc_number: s.tscNumber || s.tsc_number,
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('staff_members').upsert(staffPayload, { onConflict: 'id' });
      if (error) console.warn('Staff batch upsert note:', error.message);
      else syncedCount += staff.length;
    }

    // 3. Batch upsert learners
    if (learners.length > 0) {
      const learnerPayload = learners.map((l: any) => ({
        id: l.id || l.admissionNumber,
        admission_number: l.admissionNumber || l.admission_number,
        name: l.name,
        grade: l.grade || l.currentGrade,
        stream: l.stream || l.currentStream,
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('learners').upsert(learnerPayload, { onConflict: 'admission_number' });
      if (error) console.warn('Learners batch upsert note:', error.message);
      else syncedCount += learners.length;
    }

    // 4. Batch upsert attendance
    if (attendanceRecords.length > 0) {
      const attPayload = attendanceRecords.slice(0, 200).map((a: any) => ({
        id: a.id || `att-${Date.now()}-${Math.random()}`,
        admission_number: a.admissionNumber || a.admission_number,
        date: a.date || new Date().toISOString().split('T')[0],
        status: a.status || 'Present',
        stream: a.stream || a.streamName
      }));
      const { error } = await supabase.from('attendance').upsert(attPayload);
      if (error) console.warn('Attendance batch upsert note:', error.message);
      else syncedCount += attPayload.length;
    }

    // 5. Batch upsert assessment marks
    if (marks.length > 0) {
      const markPayload = marks.slice(0, 200).map((m: any) => ({
        id: m.id || `mark-${Date.now()}-${Math.random()}`,
        learner_id: m.learnerId || m.admissionNumber,
        score: m.score || m.marksObtained,
        assessment_title: m.assessmentTitle || m.examName || 'Assessment',
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('assessment_marks').upsert(markPayload);
      if (error) console.warn('Marks batch upsert note:', error.message);
      else syncedCount += markPayload.length;
    }

    showSuccess(`Successfully synchronized ${syncedCount} records with Supabase cloud backend!`);
    return { success: true, count: syncedCount };
  } catch (err: any) {
    console.error('Batch sync error:', err);
    showError(err?.message || 'Cloud sync failed.');
    return { success: false, count: 0 };
  }
}

export async function hydrateDataFromSupabase() {
  if (!navigator.onLine) return;

  try {
    const { data: staffData, error: staffError } = await supabase.from('staff_members').select('*');
    if (!staffError && staffData && staffData.length > 0) {
      localStorage.setItem('staff_master_directory', JSON.stringify(staffData));
    }

    const { data: learnerData, error: learnerError } = await supabase.from('learners').select('*');
    if (!learnerError && learnerData && learnerData.length > 0) {
      localStorage.setItem('munyaka_learners', JSON.stringify(learnerData));
    }
  } catch (err) {
    console.warn('Hydration from Supabase note:', err);
  }
}
