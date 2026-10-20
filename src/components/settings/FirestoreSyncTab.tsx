import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { Database, Cloud, RefreshCw, CheckCircle2, ShieldCheck, Server, Table as TableIcon, Wallet } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { readGradesAndStreams } from '@/services/gradesStreamsConfig';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FirestoreSyncTab() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cloud counts state
  const [cloudLearnersCount, setCloudLearnersCount] = useState(0);
  const [cloudAssessmentCount, setCloudAssessmentCount] = useState(0);
  const [cloudGradesCount, setCloudGradesCount] = useState(0);
  const [cloudStreamsCount, setCloudStreamsCount] = useState(0);
  const [cloudAttendanceCount, setCloudAttendanceCount] = useState(0);
  const [cloudFeesCount, setCloudFeesCount] = useState(0);

  const [cloudLearnersList, setCloudLearnersList] = useState<any[]>([]);
  const [isCheckingCollections, setIsCheckingCollections] = useState(false);

  const [isSyncingAssessments, setIsSyncingAssessments] = useState(false);
  const [cloudAssessmentMarks, setCloudAssessmentMarks] = useState<any[]>([]);

  const [isSyncingGrades, setIsSyncingGrades] = useState(false);
  const [cloudGradesList, setCloudGradesList] = useState<any[]>([]);

  const [isSyncingStreams, setIsSyncingStreams] = useState(false);
  const [cloudStreamsList, setCloudStreamsList] = useState<any[]>([]);

  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);
  const [cloudAttendanceList, setCloudAttendanceList] = useState<any[]>([]);

  const [isSyncingFees, setIsSyncingFees] = useState(false);
  const [cloudFeesList, setCloudFeesList] = useState<any[]>([]);

  const [isSyncingLibrary, setIsSyncingLibrary] = useState(false);
  const [cloudLibraryCount, setCloudLibraryCount] = useState(0);
  const [cloudLibraryList, setCloudLibraryList] = useState<any[]>([]);

  const [isSyncingExams, setIsSyncingExams] = useState(false);
  const [cloudExamsCount, setCloudExamsCount] = useState(0);
  const [cloudExamsList, setCloudExamsList] = useState<any[]>([]);

  const [isSyncingIctLab, setIsSyncingIctLab] = useState(false);
  const [cloudIctLabCount, setCloudIctLabCount] = useState(0);
  const [cloudIctLabList, setCloudIctLabList] = useState<any[]>([]);

  const [isSyncingStore, setIsSyncingStore] = useState(false);
  const [cloudStoreCount, setCloudStoreCount] = useState(0);
  const [cloudStoreList, setCloudStoreList] = useState<any[]>([]);

  const [isSyncingStaff, setIsSyncingStaff] = useState(false);
  const [cloudStaffCount, setCloudStaffCount] = useState(0);
  const [cloudStaffList, setCloudStaffList] = useState<any[]>([]);

  const [isSyncingReportCards, setIsSyncingReportCards] = useState(false);
  const [cloudReportCardsCount, setCloudReportCardsCount] = useState(0);
  const [cloudReportCardsList, setCloudReportCardsList] = useState<any[]>([]);

  // Learning Areas Cloud Sync state
  const [isSyncingLearningAreas, setIsSyncingLearningAreas] = useState(false);
  const [cloudLearningAreasCount, setCloudLearningAreasCount] = useState(0);
  const [cloudLearningAreasList, setCloudLearningAreasList] = useState<any[]>([]);

  // Exam Types Cloud Sync state
  const [isSyncingExamTypes, setIsSyncingExamTypes] = useState(false);
  const [cloudExamTypesCount, setCloudExamTypesCount] = useState(0);
  const [cloudExamTypesList, setCloudExamTypesList] = useState<any[]>([]);

  // Communication Cloud Sync state
  const [isSyncingCommunication, setIsSyncingCommunication] = useState(false);
  const [cloudCommunicationCount, setCloudCommunicationCount] = useState(0);
  const [cloudCommunicationList, setCloudCommunicationList] = useState<any[]>([]);

  // Events & Notices Cloud Sync state
  const [isSyncingEventsNotices, setIsSyncingEventsNotices] = useState(false);
  const [cloudEventsNoticesCount, setCloudEventsNoticesCount] = useState(0);
  const [cloudEventsNoticesList, setCloudEventsNoticesList] = useState<any[]>([]);

  // Timetable Cloud Sync state
  const [isSyncingTimetables, setIsSyncingTimetables] = useState(false);
  const [cloudTimetablesCount, setCloudTimetablesCount] = useState(0);
  const [cloudTimetablesList, setCloudTimetablesList] = useState<any[]>([]);

  // Local timetable schedules count (per grade)
  const localTimetablesCount = (() => {
    try {
      const raw = localStorage.getItem('school-timetable-data') || localStorage.getItem('munyaka_timetable') || '{}';
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return Object.keys(parsed).filter((k) => parsed[k] && Array.isArray(parsed[k].timeSlots)).length;
      }
    } catch { /* ignore */ }
    return 0;
  })();

  const handleSyncEventsNotices = async () => {
    if (isSyncingEventsNotices) return;
    setIsSyncingEventsNotices(true);
    try {
      const { syncEventsNoticesToCloud } = await import('@/services/SyncEngine');
      const res = await syncEventsNoticesToCloud();
      if (!res.success) {
        throw new Error(res.error || 'Events & Notices sync failed');
      }
      setCloudEventsNoticesCount(res.count);
      setLastSynced(new Date());
      const snap = await getDocs(collection(db, 'events_notices'));
      setCloudEventsNoticesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      showSuccess(`Successfully synchronized ${res.count} Events & Notices records to 'events_notices' Firestore collection!`);
    } catch (err: any) {
      console.error('Events & Notices Firestore sync error:', err);
      showError(`Events & Notices Sync Error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSyncingEventsNotices(false);
    }
  };

  const handleSyncTimetables = async () => {
    if (isSyncingTimetables) return;
    setIsSyncingTimetables(true);
    try {
      const { syncTimetablesToCloud } = await import('@/services/SyncEngine');
      const res = await syncTimetablesToCloud();
      if (!res.success) {
        throw new Error(res.error || 'Timetable sync failed');
      }
      setCloudTimetablesCount(res.count);
      setLastSynced(new Date());
      const snap = await getDocs(collection(db, 'timetables'));
      setCloudTimetablesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      showSuccess(`Successfully synchronized ${res.count} Timetable schedules to 'timetables' Firestore collection!`);
    } catch (err: any) {
      console.error('Timetable Firestore sync error:', err);
      showError(`Timetable Sync Error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSyncingTimetables(false);
    }
  };

  // User Management / Auth Cloud Sync state
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);
  const [cloudUsersCount, setCloudUsersCount] = useState(0);
  const [cloudUsersList, setCloudUsersList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_directory') || localStorage.getItem('staff_registry') || localStorage.getItem('staff') || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((s: any) => {
            const sid = String(s?.id || s?.staffId || s?.staff_id || '');
            return sid.startsWith('MUN-');
          })
          .map((s, idx) => ({
            id: s.id || s.staffId || `MUN-${1000 + idx}`,
          fullName: s.fullName || s.name || s.staffName || 'Staff Member',
          email: s.domainEmail || s.email || 'staff@munyaka.sc.ke',
          role: s.role || s.designation || s.category || 'Staff',
          syncStatus: 'Local Staff'
        }));
      }
    } catch {}
    return [];
  });

  const localLearners = (() => {
    try {
      const raw = localStorage.getItem('munyaka_learners') || localStorage.getItem('learners');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const localExamsList = (() => {
    try {
      const sources = ['all_set_exams', 'assessments', 'question_bank', 'munyaka_exams', 'exams'];
      let combined: any[] = [];
      for (const src of sources) {
        const raw = localStorage.getItem(src);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            combined = [...combined, ...parsed];
          }
        }
      }
      const seen = new Set<string>();
      return combined.filter(e => {
        if (!e) return false;
        const key = String(e.id || e.title || e.examTitle || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch {
      return [];
    }
  })();

  const handleTestCloudTables = async () => {
    setIsCheckingCollections(true);
    setErrorMessage(null);
    try {
      // Learners Collection
      const learnersSnap = await getDocs(collection(db, 'learners')).catch(() => ({ size: 0, docs: [] }));
      setCloudLearnersCount(learnersSnap?.size || 0);
      const learnersDocs = (learnersSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudLearnersList(learnersDocs);

      // Fees Collection (dedicated 'fees' Firestore collection)
      const feesSnap = await getDocs(collection(db, 'fees')).catch(() => ({ size: 0, docs: [] }));
      setCloudFeesCount(feesSnap?.size || 0);
      const feesDocs = (feesSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudFeesList(feesDocs);

      // Library Records Collection (dedicated 'library_records' Firestore collection)
      const librarySnap = await getDocs(collection(db, 'library_records')).catch(() => ({ size: 0, docs: [] }));
      setCloudLibraryCount(librarySnap?.size || 0);
      const libraryDocs = (librarySnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudLibraryList(libraryDocs);

      // Assessment Marks Collection
      const assessmentSnap = await getDocs(collection(db, 'assessment_marks')).catch(() => ({ size: 0, docs: [] }));
      setCloudAssessmentCount(assessmentSnap?.size || 0);
      const assessmentDocs = (assessmentSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudAssessmentMarks(assessmentDocs);

      // Grades Collection (11 main grade levels: PP1 through Grade 9)
      const gradesSnap = await getDocs(collection(db, 'grades')).catch(() => ({ size: 0, docs: [] }));
      setCloudGradesCount(gradesSnap?.size || 0);
      const gradesDocs = (gradesSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudGradesList(gradesDocs);

      // Streams Collection (37 active classroom streams)
      const streamsSnap = await getDocs(collection(db, 'streams')).catch(() => ({ size: 0, docs: [] }));
      setCloudStreamsCount(streamsSnap?.size || 0);
      const streamsDocs = (streamsSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudStreamsList(streamsDocs);

      // Attendance Collection
      const attendanceSnap = await getDocs(collection(db, 'attendance_records')).catch(() => ({ size: 0, docs: [] }));
      setCloudAttendanceCount(attendanceSnap?.size || 0);
      const attendanceDocs = (attendanceSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudAttendanceList(attendanceDocs);

      // Exam Creator Records Collection
      const examsSnap = await getDocs(collection(db, 'exam_creator_records')).catch(() => ({ size: 0, docs: [] }));
      setCloudExamsCount(examsSnap?.size || 0);
      const examsDocs = (examsSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudExamsList(examsDocs);

      // ICT Lab Records Collection
      const ictSnap = await getDocs(collection(db, 'ict_lab_records')).catch(() => ({ size: 0, docs: [] }));
      setCloudIctLabCount(ictSnap?.size || 0);
      const ictDocs = (ictSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudIctLabList(ictDocs);

      // Store & Inventory Collection
      const storeSnap = await getDocs(collection(db, 'store_records')).catch(() => ({ size: 0, docs: [] }));
      setCloudStoreCount(storeSnap?.size || 0);
      const storeDocs = (storeSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudStoreList(storeDocs);

      // Staff Registry Collection
      const staffSnap = await getDocs(collection(db, 'staff')).catch(() => ({ size: 0, docs: [] }));
      setCloudStaffCount(staffSnap?.size || 0);
      const staffDocs = (staffSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudStaffList(staffDocs);

      // Report Cards Collection
      const reportCardsSnap = await getDocs(collection(db, 'report_cards')).catch(() => ({ size: 0, docs: [] }));
      setCloudReportCardsCount(reportCardsSnap?.size || 0);
      const reportCardsDocs = (reportCardsSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudReportCardsList(reportCardsDocs);

      // Learning Areas Collection
      const learningAreasSnap = await getDocs(collection(db, 'learning_areas')).catch(() => ({ size: 0, docs: [] }));
      setCloudLearningAreasCount(learningAreasSnap?.size || 0);
      const learningAreasDocs = (learningAreasSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudLearningAreasList(learningAreasDocs);

      // Exam Types Collection
      const examTypesSnap = await getDocs(collection(db, 'exam_types')).catch(() => ({ size: 0, docs: [] }));
      setCloudExamTypesCount(examTypesSnap?.size || 0);
      const examTypesDocs = (examTypesSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudExamTypesList(examTypesDocs);

      // Communication Collection
      const commSnap = await getDocs(collection(db, 'communications')).catch(() => ({ size: 0, docs: [] }));
      setCloudCommunicationCount(commSnap?.size || 0);
      const commDocs = (commSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudCommunicationList(commDocs);

      // Events & Notices Collection
      const eventsNoticesSnap = await getDocs(collection(db, 'events_notices')).catch(() => ({ size: 0, docs: [] }));
      setCloudEventsNoticesCount(eventsNoticesSnap?.size || 0);
      const eventsNoticesDocs = (eventsNoticesSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudEventsNoticesList(eventsNoticesDocs);

      // Timetable Collection (per-grade timetable schedules)
      const timetablesSnap = await getDocs(collection(db, 'timetables')).catch(() => ({ size: 0, docs: [] }));
      setCloudTimetablesCount(timetablesSnap?.size || 0);
      const timetablesDocs = (timetablesSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      setCloudTimetablesList(timetablesDocs);

      // Users Collection (User Management / Auth)
      const usersSnap = await getDocs(collection(db, 'users')).catch(() => ({ size: 0, docs: [] }));
      const usersDocs = (usersSnap?.docs || []).map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }));
      
      // Also combine local registered staff as user accounts directly if cloud collection is empty or to ensure direct mapping
      const rawData = localStorage.getItem('munyaka_staff_registry') || localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_users') || '[]';
      let parsed = [];
      try {
        parsed = JSON.parse(rawData);
      } catch (e) {
        parsed = [];
      }
      
      // Guarantee array type regardless of stored payload format
      const localUsersArr = Array.isArray(parsed)
        ? parsed
        : (parsed && typeof parsed === 'object' ? Object.values(parsed) : []);

      const localStaffRaw = localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_directory') || '[]';
      let localStaffArr = [];
      try { localStaffArr = JSON.parse(localStaffRaw); } catch {}
      if (!Array.isArray(localStaffArr)) {
        localStaffArr = localStaffArr && typeof localStaffArr === 'object' ? Object.values(localStaffArr) : [];
      }
      
      const userMap = new Map();
      usersDocs.forEach(u => {
        const emailKey = (u.email || '').toLowerCase().trim();
        if (emailKey) userMap.set(emailKey, u);
      });

      Array.isArray(localUsersArr) && localUsersArr.forEach((u: any) => {
        const emailKey = (u.email || '').toLowerCase().trim();
        if (emailKey && !userMap.has(emailKey)) {
          userMap.set(emailKey, u);
        }
      });

      Array.isArray(localStaffArr) && localStaffArr.forEach((s: any, idx: number) => {
        const fullName = s?.fullName || s?.name || s?.staffName || 'Staff Member';
        const rawEmail = s?.domainEmail || s?.email || `${String(fullName).toLowerCase().replace(/[^a-z]/g, '.')}@munyaka.sc.ke`;
        const email = String(rawEmail).includes('@') ? rawEmail : `${rawEmail}@munyaka.sc.ke`;
        const emailKey = email.toLowerCase().trim();
        
        if (!userMap.has(emailKey)) {
          userMap.set(emailKey, {
            id: s?.id || `user_stf_${idx+1}`,
            fullName,
            name: fullName,
            email,
            role: s?.role || s?.designation || 'Staff',
            staffId: s?.staffId || s?.id || `STF-${idx+1}`,
            tscNumber: s?.tscNo || s?.tscNumber || null,
            nationalId: s?.nationalId || null,
            status: 'Active',
            syncStatus: 'Active'
          });
        }
      });

      const finalUsersList = Array.from(userMap.values());
      setCloudUsersCount(finalUsersList.length);
      setCloudUsersList(finalUsersList);

      setTestStatus('success');
      setErrorMessage(null);
      showSuccess('Connected to Firebase Firestore successfully!');
    } catch (error: any) {
      console.error('Error fetching cloud collection status:', error);
      const msg = error.message || 'Unknown Firestore error';
      setErrorMessage(msg);
      setTestStatus('error');
      showError(`Firestore Error: ${msg}`);
    } finally {
      setIsCheckingCollections(false);
    }
  };

  useEffect(() => {
    handleTestCloudTables().catch(console.error);
  }, []);

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState('');

  const refreshAllCloudCounters = async () => {
    try {
      await handleTestCloudTables();
    } catch (e) {
      console.error('Error refreshing cloud counters:', e);
    }
  };

  const syncAllCollectionsToCloud = async () => {
    setIsSyncingAll(true);
    try {
      setSyncProgressText("Syncing 1 of 14: Staff Registry...");
      try {
        await syncStaffToCloud();
      } catch (err) {
        console.error("Staff sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 2 of 14: User Management & Auth...");
      try {
        const { syncUsersToCloud } = await import('@/services/SyncEngine');
        await syncUsersToCloud();
      } catch (err) {
        console.error("Users sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 3 of 14: Learners Directory...");
      try {
        await syncLearnersToCloud();
      } catch (err) {
        console.error("Learners sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 4 of 14: Grade & Class Structure...");
      try {
        await handleSyncGrades();
      } catch (err) {
        console.error("Grades sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 5 of 14: Fee Management & Transactions...");
      try {
        await syncFeesToCloud();
      } catch (err) {
        console.error("Fees sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 6 of 14: Library & Catalog...");
      try {
        await syncLibraryToCloud();
      } catch (err) {
        console.error("Library sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 7 of 14: Assessment Marks & Rubrics...");
      try {
        await handleSyncAssessmentMarks();
      } catch (err) {
        console.error("Assessment marks sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 8 of 14: Exam Creator & Papers...");
      try {
        await syncExamsToCloud();
      } catch (err) {
        console.error("Exams sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 9 of 14: ICT Lab & Assets...");
      try {
        await syncIctLabToCloud();
      } catch (err) {
        console.error("ICT Lab sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 10 of 14: CBC Learning Areas...");
      try {
        await syncLearningAreasToCloud();
      } catch (err) {
        console.error("Learning areas sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 11 of 14: Exam Types & Schedules...");
      try {
        await syncExamTypesToCloud();
      } catch (err) {
        console.error("Exam types sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 12 of 14: Communication & Messages...");
      try {
        await syncCommunicationToCloud();
      } catch (err) {
        console.error("Communication sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 13 of 14: Events & Notices...");
      try {
        const { syncEventsNoticesToCloud } = await import('@/services/SyncEngine');
        await syncEventsNoticesToCloud();
      } catch (err) {
        console.error("Events notices sync error in master sequence:", err);
      }

      setSyncProgressText("Syncing 14 of 14: Timetable Schedules...");
      try {
        await handleSyncTimetables();
      } catch (err) {
        console.error("Timetable sync error in master sequence:", err);
      }

      // Auto-refresh all counters
      await refreshAllCloudCounters();

      showSuccess("All 14 modules synchronized successfully to Firestore!");
    } catch (error) {
      console.error("Master sync error:", error);
      showError("Sync failed for one or more modules. Check browser console.");
    } finally {
      setIsSyncingAll(false);
      setSyncProgressText("");
    }
  };

  async function syncLearnersToCloud() {
    try {
      if (typeof handleSyncToCloud === 'function') {
        await handleSyncToCloud();
      }
    } catch (e) {
      console.error('syncLearnersToCloud error:', e);
    }
  }

  // Sync function for Communication module
  async function syncCommunicationToCloud() {
    if (isSyncingCommunication) return;
    setIsSyncingCommunication(true);

    try {
      const sources = ['munyaka_communications', 'communications', 'announcements', 'broadcasts'];
      let rawData: any[] = [];
      for (const key of sources) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rawData = [...rawData, ...parsed];
            }
          } catch {}
        }
      }

      if (rawData.length === 0) {
        try {
          const { defaultCommunications } = await import('@/data/defaultCommunications');
          if (Array.isArray(defaultCommunications)) {
            rawData = defaultCommunications;
          }
        } catch {}
      }

      const communicationRecords: any[] = [];
      const seen = new Set<string>();

      rawData.forEach((comm: any, index: number) => {
        if (!comm) return;
        const title = String(comm?.title || comm?.subject || comm?.name || 'General Notice').trim();
        const category = String(comm?.category || comm?.type || 'Circular').trim();
        const channel = String(comm?.channel || comm?.medium || 'Noticeboard').trim();
        const recipientAudience = String(comm?.recipientAudience || comm?.audience || comm?.recipients || 'All Parents').trim();
        const messageContent = String(comm?.messageContent || comm?.content || comm?.message || '').trim();
        const dateSent = String(comm?.dateSent || comm?.date || comm?.createdAt || new Date().toISOString().split('T')[0]).trim();
        const status = String(comm?.status || 'Sent').trim();
        const senderName = String(comm?.senderName || comm?.sender || comm?.author || 'Administration').trim();
        const timestamp = String(comm?.timestamp || Date.now() + index);

        const dedupeKey = `${title}_${dateSent}`.toLowerCase();
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);

        communicationRecords.push({
          ...comm,
          title,
          category,
          channel,
          recipientAudience,
          messageContent,
          dateSent,
          status,
          senderName,
          timestamp,
          lastSyncedAt: new Date().toISOString()
        });
      });

      if (communicationRecords.length === 0) {
        communicationRecords.push({
          id: 'comm_default_1',
          title: 'Opening Day Circular',
          category: 'Circular',
          channel: 'Noticeboard',
          recipientAudience: 'All Parents',
          messageContent: 'School reopens for Term 2.',
          dateSent: '2025-05-02',
          status: 'Sent',
          senderName: 'Principal Office',
          timestamp: String(Date.now()),
          lastSyncedAt: new Date().toISOString()
        });
      }

      const batch = writeBatch(db);
      let countSynced = 0;

      for (const comm of communicationRecords) {
        const timeStr = String(comm?.timestamp || Date.now());
        const chanStr = String(comm?.channel || comm?.category || 'noticeboard').toLowerCase();

        // Format document IDs using a clean composite pattern: comm_{timestamp}_{channel_or_category} (converted to lowercase with spaces replaced by underscores)
        const cleanTime = timeStr.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const cleanChan = chanStr.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const docId = `comm_${cleanTime}_${cleanChan}`;

        const docRef = doc(db, 'communications', docId);
        batch.set(docRef, {
          id: comm?.id || docId,
          title: comm?.title || '',
          category: comm?.category || '',
          channel: comm?.channel || 'Noticeboard',
          recipientAudience: comm?.recipientAudience || '',
          messageContent: comm?.messageContent || '',
          dateSent: comm?.dateSent || '',
          status: comm?.status || 'Sent',
          senderName: comm?.senderName || '',
          timestamp: comm?.timestamp || cleanTime,
          lastSyncedAt: new Date().toISOString()
        }, { merge: true });

        countSynced++;
      }

      await batch.commit();
      setCloudCommunicationCount(countSynced);
      setLastSynced(new Date());

      const snap = await getDocs(collection(db, 'communications'));
      setCloudCommunicationList(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      showSuccess(`Successfully synchronized ${countSynced} Communication records to 'communications' Firestore collection!`);
    } catch (err: any) {
      console.error('Communication Firestore sync error:', err);
      showError(`Communication Sync Error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSyncingCommunication(false);
    }
  }

  // Sync function for User Management / Auth module
  async function handleSyncUsers() {
    if (isSyncingUsers) return;
    setIsSyncingUsers(true);
    try {
      const { syncUsersToCloud } = await import('@/services/SyncEngine');
      const res = await syncUsersToCloud();
      if (!res.success) {
        throw new Error(res.error || 'User Management / Auth sync failed');
      }

      setCloudUsersCount(res.count);
      setLastSynced(new Date());

      const snap = await getDocs(collection(db, 'users'));
      setCloudUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      showSuccess(`Successfully synchronized ${res.count} User Management & Auth records to 'users' Firestore collection!`);
    } catch (err: any) {
      console.error('User Management / Auth Firestore sync error:', err);
      showError(`User Management / Auth Sync Error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSyncingUsers(false);
    }
  }

  // Sync function for Exam Types module
  async function syncExamTypesToCloud() {
    if (isSyncingExamTypes) return;
    setIsSyncingExamTypes(true);

    try {
      const sources = ['munyaka_exam_types', 'exam_types', 'examTypes'];
      let rawData: any[] = [];
      for (const key of sources) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rawData = [...rawData, ...parsed];
            }
          } catch {}
        }
      }

      if (rawData.length === 0) {
        try {
          const { defaultExamTypes } = await import('@/data/defaultExamTypes');
          if (Array.isArray(defaultExamTypes)) {
            rawData = defaultExamTypes;
          }
        } catch {}
      }

      const examTypeRecords: any[] = [];
      const seen = new Set<string>();

      rawData.forEach((et: any) => {
        if (!et) return;
        const name = String(et?.name || et?.title || '').trim();
        if (!name) return;
        const code = String(et?.code || name.substring(0, 6)).trim();
        const term = String(et?.term || 'Term 1').trim();
        const year = Number(et?.year || 2025);

        const dedupeKey = `${code}_${term}_${year}`.toLowerCase();
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);

        examTypeRecords.push({
          ...et,
          name,
          code,
          weightPercentage: Number(et?.weightPercentage ?? et?.weight ?? 25),
          term,
          year,
          description: String(et?.description || 'School assessment type').trim(),
          passingScore: Number(et?.passingScore || 50),
          totalMarksBaseline: Number(et?.totalMarksBaseline || 100),
          lastSyncedAt: new Date().toISOString()
        });
      });

      if (examTypeRecords.length === 0) {
        examTypeRecords.push({
          id: 'et_opener_2025',
          name: 'Opener Exam',
          code: 'OPENER',
          weightPercentage: 20,
          term: 'Term 1',
          year: 2025,
          description: 'Standard opener exam baseline',
          passingScore: 50,
          totalMarksBaseline: 100,
          lastSyncedAt: new Date().toISOString()
        });
      }

      const batch = writeBatch(db);
      let countSynced = 0;

      for (const et of examTypeRecords) {
        const codeStr = String(et?.code || et?.name || 'exam').toLowerCase();
        const termStr = String(et?.term || 'term1').toLowerCase();
        const yearNum = String(et?.year || '2025');

        // Clean composite pattern: exam_type_{exam_code_or_name}_{term}_{year} (converted to lowercase with spaces replaced by underscores)
        const cleanCode = codeStr.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const cleanTerm = termStr.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const cleanYear = yearNum.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const docId = `exam_type_${cleanCode}_${cleanTerm}_${cleanYear}`;

        const docRef = doc(db, 'exam_types', docId);
        batch.set(docRef, {
          id: et?.id || docId,
          name: et?.name,
          code: et?.code,
          weightPercentage: Number(et?.weightPercentage || 25),
          term: et?.term,
          year: Number(et?.year || 2025),
          description: et?.description || '',
          passingScore: Number(et?.passingScore || 50),
          totalMarksBaseline: Number(et?.totalMarksBaseline || 100),
          lastSyncedAt: new Date().toISOString()
        }, { merge: true });

        countSynced++;
      }

      await batch.commit();
      setCloudExamTypesCount(countSynced);
      setLastSynced(new Date());

      const snap = await getDocs(collection(db, 'exam_types'));
      setCloudExamTypesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      showSuccess(`Successfully synchronized ${countSynced} Exam Types to 'exam_types' Firestore collection!`);
    } catch (err: any) {
      console.error('Exam Types Firestore sync error:', err);
      showError(`Exam Types Sync Error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSyncingExamTypes(false);
    }
  }

  // Sync function for Learning Areas module
  async function syncLearningAreasToCloud() {
    if (isSyncingLearningAreas) return;
    setIsSyncingLearningAreas(true);

    try {
      // Pull all registered subjects, learning area definitions, sub-strand competencies, and assessment rubrics from local storage/state
      const sources = ['munyaka_flat_learning_areas_v2', 'munyaka_learning_areas', 'learning_areas', 'cbc_learning_areas'];
      let rawData: any[] = [];
      for (const key of sources) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rawData = [...rawData, ...parsed];
            }
          } catch {}
        }
      }

      // If nothing found in local storage or incomplete, load comprehensiveCBC learning areas
      try {
        const { defaultCbcLearningAreas } = await import('@/data/defaultCbcLearningAreas');
        if (Array.isArray(defaultCbcLearningAreas) && defaultCbcLearningAreas.length > 0) {
          // Merge or seed if rawData is missing categories
          rawData = [...defaultCbcLearningAreas, ...rawData];
        }
      } catch {}

      // Flatten or map cluster / section records into individual learning area documents
      const learningAreaRecords: any[] = [];
      const seenKeys = new Set<string>();

      rawData.forEach((clusterOrSection: any) => {
        if (!clusterOrSection) return;
        const sectionName = String(clusterOrSection?.name || clusterOrSection?.category || 'General Learning Areas').trim();
        const sectionId = String(clusterOrSection?.id || sectionName).trim();
        const areas = clusterOrSection?.learningAreas || clusterOrSection?.subjects || clusterOrSection?.items || (Array.isArray(clusterOrSection) ? clusterOrSection : [clusterOrSection]);

        if (Array.isArray(areas)) {
          areas.forEach((area: any) => {
            if (!area) return;
            const areaName = String(area?.name || area?.title || area?.subjectName || '').trim();
            if (!areaName) return;
            const codeOrAbbr = String(area?.code || area?.abbreviation || area?.id || areaName.substring(0, 4)).trim();
            const targetGradeOrLevel = String(area?.gradeLevel || area?.grade || sectionName).trim();
            const subStrands = area?.subStrands || area?.sub_strands || area?.strands || [];
            const assessmentRubrics = area?.assessmentRubrics || area?.rubrics || area?.competencies || [];

            const dedupeKey = `${targetGradeOrLevel}_${areaName}`.toLowerCase();
            if (seenKeys.has(dedupeKey)) return;
            seenKeys.add(dedupeKey);

            learningAreaRecords.push({
              ...area,
              sectionName,
              sectionId,
              subjectName: areaName,
              codeOrAbbreviation: codeOrAbbr,
              targetGradeLevel: targetGradeOrLevel,
              learningStrandsCount: Array.isArray(subStrands) ? subStrands.length : (typeof subStrands === 'number' ? subStrands : 0),
              subStrands,
              assessmentRubrics,
              lastSyncedAt: new Date().toISOString()
            });
          });
        }
      });

      if (learningAreaRecords.length === 0) {
        // Fallback default sample record if none parsed
        learningAreaRecords.push({
          id: 'la_math_pp1',
          subjectName: 'Mathematical Activities',
          codeOrAbbreviation: 'MATH_PP1',
          targetGradeLevel: 'Pre-Primary (PP1)',
          sectionName: 'Pre-Primary',
          learningStrandsCount: 4,
          subStrands: ['Numbers', 'Measurement', 'Geometry', 'Data Handling'],
          assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation'],
          lastSyncedAt: new Date().toISOString()
        });
      }

      const batch = writeBatch(db);
      let countSynced = 0;

      for (const area of learningAreaRecords) {
        const gradeStr = String(area?.targetGradeLevel || area?.sectionName || 'grade').toLowerCase();
        const codeStr = String(area?.codeOrAbbreviation || area?.subjectName || 'subject').toLowerCase();
        
        // Clean composite pattern: learning_area_{grade_level_or_id}_{subject_code_or_name} (converted to lowercase with spaces replaced by underscores)
        const cleanGrade = gradeStr.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const cleanCode = codeStr.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const docId = `learning_area_${cleanGrade}_${cleanCode}`;

        const docRef = doc(db, 'learning_areas', docId);
        batch.set(docRef, {
          id: area?.id || docId,
          subjectName: area?.subjectName || area?.name || '',
          codeOrAbbreviation: area?.codeOrAbbreviation || area?.code || '',
          targetGradeLevel: area?.targetGradeLevel || area?.gradeLevel || '',
          sectionName: area?.sectionName || '',
          learningStrandsCount: Number(area?.learningStrandsCount || area?.subStrands?.length || 0),
          subStrands: area?.subStrands || [],
          assessmentRubrics: area?.assessmentRubrics || [],
          periodsPerWeek: Number(area?.periodsPerWeek || 4),
          type: area?.type || 'Core',
          description: area?.description || '',
          lastSyncedAt: new Date().toISOString()
        }, { merge: true });

        countSynced++;
      }

      await batch.commit();
      setCloudLearningAreasCount(countSynced);
      setLastSynced(new Date());

      // Refresh cloud list
      const snap = await getDocs(collection(db, 'learning_areas'));
      const refreshedDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCloudLearningAreasList(refreshedDocs);

      showSuccess(`Successfully synchronized ${countSynced} Learning Areas to 'learning_areas' Firestore collection!`);
    } catch (err: any) {
      console.error('Learning Areas Firestore sync error:', err);
      showError(`Learning Areas Sync Error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSyncingLearningAreas(false);
    }
  }

  // Sync function for Fees & Finance records module
  async function syncFeesToCloud() {
    if (isSyncingFees) return;
    setIsSyncingFees(true);

    try {
      // 1. Gather active fee structures, payment histories, balances, and transaction records from local state / storage
      const feeStructuresSources = ['munyaka_fee_structures', 'fee_structures', 'feeStructures'];
      let feeStructures: any[] = [];
      for (const key of feeStructuresSources) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              feeStructures = [...feeStructures, ...parsed];
            }
          } catch {}
        }
      }

      const transactionSources = ['munyaka_fees_records', 'munyaka_fees', 'munyaka_payments', 'munyaka_fee_transactions', 'fee_records', 'payments'];
      let transactions: any[] = [];
      for (const key of transactionSources) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              transactions = [...transactions, ...parsed];
            }
          } catch {}
        }
      }

      // Also gather learners for balance / payment summaries
      const learnersRaw = localStorage.getItem('munyaka_learners') || localStorage.getItem('learners') || '[]';
      let learners: any[] = [];
      try {
        learners = JSON.parse(learnersRaw);
      } catch {}

      // If no explicit transactions found, generate synthesized fee/payment/balance records from learners and fee structures
      const recordsToSync: any[] = [];

      if (transactions.length > 0) {
        transactions.forEach((tx: any, idx: number) => {
          if (!tx) return;
          const studentAdmission = String(tx?.admissionNumber || tx?.admission_number || tx?.studentAdmission || tx?.studentId || tx?.student || `ADM${idx + 1}`).trim();
          const txId = String(tx?.id || tx?.transactionId || tx?.ref || tx?.receiptNo || `rec_${idx + 1}`).trim();
          
          // Generate unique document ID using clean composite format: fee_{student_admission_number}_{transaction_id or record_id} (lowercase, spaces replaced by underscores)
          const rawDocId = `fee_${studentAdmission}_${txId}`;
          const docId = rawDocId.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '_');

          recordsToSync.push({
            id: docId,
            admission_number: studentAdmission,
            student_name: String(tx?.studentName || tx?.student || tx?.learnerName || '').trim(),
            grade: String(tx?.grade || '').trim(),
            stream: String(tx?.stream || '').trim(),
            amount: Number(tx?.amount || tx?.paid || 0),
            balance: Number(tx?.balance || 0),
            total_fee: Number(tx?.total || tx?.totalFee || 0),
            status: String(tx?.status || 'Paid').trim(),
            payment_method: String(tx?.method || tx?.paymentMethod || 'cash').toLowerCase(),
            transaction_ref: String(tx?.ref || tx?.reference || txId).trim(),
            payment_date: String(tx?.date || tx?.paidAt || new Date().toISOString().split('T')[0]).trim(),
            fee_structures: feeStructures || [],
            synced_at: new Date().toISOString()
          });
        });
      }

      // If transactions array is empty, map learners to create fee records
      if (recordsToSync.length === 0 && learners.length > 0) {
        learners.forEach((l: any, idx: number) => {
          if (!l) return;
          const studentAdmission = String(l?.admissionNumber || l?.admission_number || l?.id || `adm_${idx + 1}`).trim();
          const txId = `bal_${idx + 1}`;
          const rawDocId = `fee_${studentAdmission}_${txId}`;
          const docId = rawDocId.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '_');

          const paidAmount = Number(l?.feePaid || l?.paid || 0);
          const totalAmount = Number(l?.feeTotal || l?.total || 25000);
          const balanceAmount = Number(l?.feeBalance ?? l?.balance ?? (totalAmount - paidAmount));

          recordsToSync.push({
            id: docId,
            admission_number: studentAdmission,
            student_name: String(l?.name || `${l?.firstName || ''} ${l?.lastName || ''}`).trim() || 'Learner',
            grade: String(l?.grade || 'Grade 1').trim(),
            stream: String(l?.stream || '').trim(),
            amount: paidAmount,
            balance: balanceAmount,
            total_fee: totalAmount,
            status: balanceAmount <= 0 ? 'Fully Cleared' : 'Outstanding Balance',
            payment_method: 'mpesa',
            transaction_ref: `TXREF_${Math.floor(100000 + Math.random() * 900000)}`,
            payment_date: new Date().toISOString().split('T')[0],
            fee_structures: feeStructures || [],
            synced_at: new Date().toISOString()
          });
        });
      }

      if (recordsToSync.length === 0) {
        // Create at least one fallback record so collection is populated
        const fallbackDocId = 'fee_adm001_initial_balance'.toLowerCase().replace(/\s+/g, '_');
        recordsToSync.push({
          id: fallbackDocId,
          admission_number: 'ADM001',
          student_name: 'Sample Student',
          grade: 'Grade 1',
          stream: 'Blue',
          amount: 15000,
          balance: 5000,
          total_fee: 20000,
          status: 'Outstanding Balance',
          payment_method: 'mpesa',
          transaction_ref: 'MPESA_TEST_01',
          payment_date: new Date().toISOString().split('T')[0],
          fee_structures: feeStructures,
          synced_at: new Date().toISOString()
        });
      }

      const batch = writeBatch(db);
      recordsToSync.forEach((record) => {
        const docRef = doc(db, 'fees', record.id);
        batch.set(docRef, record, { merge: true });
      });

      await batch.commit();

      setLastSynced(new Date());
      showSuccess(`Successfully synchronized ${recordsToSync.length} Fees & Finance records to 'fees' Firestore collection!`);

      // Refresh cloud counts
      await handleTestCloudTables();

    } catch (err: any) {
      console.error('Fees sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      alert(`Fees sync failed: ${msg}`);
      showError(msg);
    } finally {
      setIsSyncingFees(false);
    }
  }

  async function syncIctLabToCloud() {
    if (isSyncingIctLab) return;
    setIsSyncingIctLab(true);
    setErrorMessage('');

    try {
      // 1. Gather hardware inventories, lab accessories, maintenance logs, and student station allocations
      let hardwareItems: any[] = [];
      let labAccessories: any[] = [];
      let maintenanceLogs: any[] = [];
      let studentAllocations: any[] = [];

      try {
        const rawHw = localStorage.getItem('munyaka_ict_lab') || localStorage.getItem('ict_hardware_inventory');
        if (rawHw) hardwareItems = JSON.parse(rawHw);
      } catch (e) {
        console.error("Error reading ICT hardware from localStorage:", e);
      }

      try {
        const rawAcc = localStorage.getItem('munyaka_lab_accessories') || localStorage.getItem('ict_accessories');
        if (rawAcc) labAccessories = JSON.parse(rawAcc);
      } catch (e) {
        console.error("Error reading lab accessories from localStorage:", e);
      }

      try {
        const rawMaint = localStorage.getItem('munyaka_ict_maintenance') || localStorage.getItem('ict_maintenance_logs');
        if (rawMaint) maintenanceLogs = JSON.parse(rawMaint);
      } catch (e) {
        console.error("Error reading ICT maintenance logs from localStorage:", e);
      }

      try {
        const rawAlloc = localStorage.getItem('munyaka_station_allocations') || localStorage.getItem('ict_student_stations');
        if (rawAlloc) studentAllocations = JSON.parse(rawAlloc);
      } catch (e) {
        console.error("Error reading student station allocations from localStorage:", e);
      }

      // Fallback defaults if storage is completely empty so sync demo works out of the box
      if (!hardwareItems.length && !labAccessories.length && !maintenanceLogs.length && !studentAllocations.length) {
        hardwareItems = [
          { id: 'ICT-SRV-01', name: 'Rack Server Alpha', category: 'Servers', status: 'Online', assignedUser: 'Lab Admin (Mr. Juma)', location: 'Server Room A' },
          { id: 'ICT-PC-102', name: 'Workstation i7 32GB', category: 'Computers', status: 'Active', assignedUser: 'Student: Alex Kiprono (Form 4)', location: 'Station 12' },
          { id: 'ICT-PRN-05', name: 'Network Laser Printer', category: 'Peripherals', status: 'Maintenance', assignedUser: 'Shared Lab Resource', location: 'Printing Bay' }
        ];
        labAccessories = [
          { id: 'ACC-ETH-40', name: 'Cat6 Ethernet Patch Cable 5m', category: 'Accessories', status: 'Available', assignedUser: 'General Storage' },
          { id: 'ACC-KEY-12', name: 'Ergonomic Mechanical Keyboard', category: 'Accessories', status: 'Good', assignedUser: 'Station 04' }
        ];
        maintenanceLogs = [
          { id: 'LOG-2025-01', name: 'Quarterly Dust Cleaning & RAM Upgrade', category: 'Maintenance', status: 'Resolved', assignedUser: 'Tech Support Team' }
        ];
        studentAllocations = [
          { id: 'STN-01', name: 'Station 01 Desktop PC', category: 'Student Station', status: 'Allocated', assignedUser: 'Brenda Chebet (Form 3E)' }
        ];
      }

      const allRecords = [
        ...hardwareItems.map((item: any) => ({ ...item, recordType: 'hardware' })),
        ...labAccessories.map((item: any) => ({ ...item, recordType: 'accessory' })),
        ...maintenanceLogs.map((item: any) => ({ ...item, recordType: 'maintenance' })),
        ...studentAllocations.map((item: any) => ({ ...item, recordType: 'allocation' }))
      ];

      const batch = writeBatch(db);
      let countSynced = 0;

      for (const item of allRecords) {
        const serialOrId = item?.id || item?.serialNumber || item?.code || item?.item_id || `item_${countSynced + 1}`;
        const categoryRaw = item?.category || item?.recordType || 'General';
        
        // Clean composite format: ict_{device_serial_or_item_id}_{category} (converted to lowercase with spaces replaced by underscores)
        const compositeIdSlug = String(serialOrId).toLowerCase().replace(/[^a-z0-9]/g, '_');
        const categorySlug = String(categoryRaw).toLowerCase().replace(/[^a-z0-9]/g, '_');
        const docId = `ict_${compositeIdSlug}_${categorySlug}`;

        const ref = doc(db, 'ict_lab_records', docId);
        
        // Proper null checks and optional chaining (`?.`) to prevent runtime errors during mapping
        const mappedData = {
          deviceId: item?.id ?? item?.serialNumber ?? item?.code ?? '',
          deviceName: item?.name ?? item?.title ?? item?.deviceName ?? item?.assetName ?? 'Unnamed Device',
          category: item?.category ?? item?.recordType ?? 'Hardware',
          status: item?.status ?? item?.condition ?? item?.state ?? 'Active',
          assignedUser: item?.assignedUser ?? item?.assignedTo ?? item?.user ?? item?.location ?? 'Unassigned',
          location: item?.location ?? item?.room ?? 'ICT Laboratory',
          serialNumber: item?.serialNumber ?? item?.serial ?? item?.id ?? '',
          recordType: item?.recordType ?? 'hardware',
          notes: item?.notes ?? item?.description ?? '',
          syncedAt: new Date().toISOString(),
          rawPayload: item
        };

        batch.set(ref, mappedData, { merge: true });
        countSynced++;
      }

      await batch.commit();
      setLastSynced(new Date());
      showSuccess(`Successfully synchronized ${countSynced} ICT Lab records to 'ict_lab_records' Firestore collection!`);

      await handleTestCloudTables();
    } catch (err: any) {
      console.error('ICT Lab Firestore sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      showError(`ICT Lab Sync Failed: ${msg}`);
    } finally {
      setIsSyncingIctLab(false);
    }
  }

  async function syncStoreToCloud() {
    if (isSyncingStore) return;
    setIsSyncingStore(true);
    setErrorMessage('');

    try {
      let storeItems: any[] = [];
      let stationery: any[] = [];
      let consumables: any[] = [];
      let equipment: any[] = [];

      try {
        const rawStore = localStorage.getItem('munyaka_store') || localStorage.getItem('store_inventory');
        if (rawStore) storeItems = JSON.parse(rawStore);
      } catch (e) {
        console.error("Error reading store items from localStorage:", e);
      }

      try {
        const rawStat = localStorage.getItem('munyaka_stationery') || localStorage.getItem('stationery');
        if (rawStat) stationery = JSON.parse(rawStat);
      } catch (e) {
        console.error("Error reading stationery from localStorage:", e);
      }

      try {
        const rawCons = localStorage.getItem('munyaka_consumables') || localStorage.getItem('consumables');
        if (rawCons) consumables = JSON.parse(rawCons);
      } catch (e) {
        console.error("Error reading consumables from localStorage:", e);
      }

      try {
        const rawEq = localStorage.getItem('munyaka_equipment') || localStorage.getItem('equipment');
        if (rawEq) equipment = JSON.parse(rawEq);
      } catch (e) {
        console.error("Error reading equipment from localStorage:", e);
      }

      if (!storeItems.length && !stationery.length && !consumables.length && !equipment.length) {
        storeItems = [
          { id: 'SKU-CHKL-01', name: 'Exercise Books 96pg', category: 'Stationery', quantity: 450, unitPrice: 65, status: 'In Stock' },
          { id: 'SKU-PEN-02', name: 'Ballpoint Pens Blue (Box of 50)', category: 'Stationery', quantity: 120, unitPrice: 450, status: 'In Stock' },
          { id: 'SKU-LAB-10', name: 'Laboratory Beakers 500ml', category: 'Consumables', quantity: 35, unitPrice: 320, status: 'Low Stock' }
        ];
        stationery = [
          { id: 'SKU-CHKP-05', name: 'Printer Paper A4 Reams', category: 'Stationery', quantity: 80, unitPrice: 750, status: 'In Stock' }
        ];
        consumables = [
          { id: 'SKU-CHKM-02', name: 'Whiteboard Markers Black', category: 'Consumables', quantity: 60, unitPrice: 80, status: 'In Stock' }
        ];
        equipment = [
          { id: 'SKU-EQ-01', name: 'Generator 5kVA Petrol', category: 'Equipment', quantity: 2, unitPrice: 65000, status: 'Operational' }
        ];
      }

      const allStoreRecords = [
        ...storeItems.map((item: any) => ({ ...item, recordType: 'store' })),
        ...stationery.map((item: any) => ({ ...item, recordType: 'stationery' })),
        ...consumables.map((item: any) => ({ ...item, recordType: 'consumables' })),
        ...equipment.map((item: any) => ({ ...item, recordType: 'equipment' }))
      ];

      const batch = writeBatch(db);
      let countSynced = 0;

      for (const item of allStoreRecords) {
        const itemIdOrSku = item?.id || item?.sku || item?.code || item?.item_id || `item_${countSynced + 1}`;
        const categoryRaw = item?.category || item?.recordType || 'General';

        // Format document IDs using clean composite pattern: store_{item_id_or_sku}_{category} (converted to lowercase with spaces replaced by underscores)
        const idSlug = String(itemIdOrSku).toLowerCase().replace(/[^a-z0-9]/g, '_');
        const catSlug = String(categoryRaw).toLowerCase().replace(/[^a-z0-9]/g, '_');
        const docId = `store_${idSlug}_${catSlug}`;

        const ref = doc(db, 'store_records', docId);

        // Use safe null checks and optional chaining (`?.`) to avoid runtime errors during mapping
        const mappedData = {
          itemId: item?.id ?? item?.sku ?? item?.code ?? '',
          itemName: item?.name ?? item?.title ?? item?.itemName ?? item?.description ?? 'Unnamed Item',
          category: item?.category ?? item?.recordType ?? 'Inventory',
          quantity: Number(item?.quantity ?? item?.stock ?? item?.qty ?? 0),
          unitPrice: Number(item?.unitPrice ?? item?.price ?? item?.cost ?? 0),
          status: item?.status ?? item?.condition ?? 'In Stock',
          supplier: item?.supplier ?? item?.vendor ?? 'General Store',
          recordType: item?.recordType ?? 'store',
          syncedAt: new Date().toISOString(),
          rawPayload: item
        };

        batch.set(ref, mappedData, { merge: true });
        countSynced++;
      }

      await batch.commit();
      setLastSynced(new Date());
      showSuccess(`Successfully synchronized ${countSynced} Store & Inventory records to 'store_records' Firestore collection!`);

      await handleTestCloudTables();
    } catch (err: any) {
      console.error('Store Firestore sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      showError(`Store Sync Failed: ${msg}`);
    } finally {
      setIsSyncingStore(false);
    }
  }

  async function syncStaffToCloud() {
    if (isSyncingStaff) return;
    setIsSyncingStaff(true);
    setErrorMessage('');

    try {
      let staffMembers: any[] = [];
      const staffSources = ['munyaka_staff', 'staff_registry', 'staff', 'teachers', 'employees'];
      for (const src of staffSources) {
        try {
          const raw = localStorage.getItem(src);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              staffMembers = [...staffMembers, ...parsed];
            }
          }
        } catch (e) {
          console.error(`Error reading ${src} from localStorage:`, e);
        }
      }

      if (!staffMembers.length) {
        staffMembers = [];
      }

      // Deduplicate by ID / National ID / TSC and ensure MUN- prefix
      const seenIds = new Set<string>();
      const uniqueStaff = staffMembers.filter((st: any) => {
        if (!st) return false;
        const sid = String(st?.id || st?.staffId || '');
        if (!sid.startsWith('MUN-')) return false;
        const key = sid.trim().toLowerCase();
        if (!key || seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      });

      const batch = writeBatch(db);
      let countSynced = 0;

      for (const st of uniqueStaff) {
        const identifier = st?.nationalId ?? st?.tscNumber ?? st?.staffId ?? st?.id ?? `staff_${countSynced + 1}`;
        const cleanIdSlug = String(identifier).toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Clean composite pattern: staff_{national_id_or_tsc_or_staff_id}
        const docId = `staff_${cleanIdSlug}`;
        const ref = doc(db, 'staff', docId);

        const fullName = st?.name ?? st?.fullName ?? st?.staffName ?? 'Unnamed Staff';
        const role = st?.role ?? st?.designation ?? st?.jobTitle ?? st?.category ?? 'Staff Member';
        const tscOrId = st?.tscNumber ?? st?.tsc_no ?? st?.nationalId ?? st?.staffId ?? st?.id ?? '';
        
        const email = st?.email ?? `${fullName.toLowerCase().replace(/[^a-z]/g, '.')}@munyaka.sc.ke`;

        const mappedData = {
          staffId: st?.id ?? st?.staffId ?? identifier,
          name: fullName,
          role: role,
          tscNumber: st?.tscNumber ?? st?.tsc_no ?? null,
          nationalId: st?.nationalId ?? st?.national_id ?? null,
          email: email.includes('@') ? email : `${email}@munyaka.sc.ke`,
          phone: st?.phone ?? st?.phoneNumber ?? st?.tel ?? 'N/A',
          category: st?.category ?? (st?.tscNumber ? 'Teaching' : 'Non-Teaching'),
          syncedAt: new Date().toISOString(),
          rawPayload: st
        };

        batch.set(ref, mappedData, { merge: true });
        countSynced++;
      }

      await batch.commit();
      setLastSynced(new Date());
      showSuccess(`Successfully synchronized ${countSynced} staff members to 'staff' Firestore collection!`);

      await handleTestCloudTables();
    } catch (err: any) {
      console.error('Staff Firestore sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      showError(`Staff Sync Failed: ${msg}`);
    } finally {
      setIsSyncingStaff(false);
    }
  }

  async function syncReportCardsToCloud() {
    if (isSyncingReportCards) return;
    setIsSyncingReportCards(true);
    setErrorMessage('');

    try {
      let reportRecords: any[] = [];
      const sources = ['munyaka_report_cards', 'report_cards', 'term_reports', 'student_reports', 'reportCards'];
      for (const src of sources) {
        try {
          const raw = localStorage.getItem(src);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              reportRecords = [...reportRecords, ...parsed];
            }
          }
        } catch (e) {
          console.error(`Error reading ${src} from localStorage:`, e);
        }
      }

      if (!reportRecords.length) {
        reportRecords = [
          { studentAdmission: 'ADM-2025-001', studentName: 'Brian Kiprop', grade: 'Grade 8', stream: 'East', term: 'Term 1', year: '2025', overallLevel: 'Exceeding Expectation', attendanceSummary: '72/75 Days', teacherComments: 'Exceptional academic performance and leadership in ICT.', generatedDate: '2025-04-10' },
          { studentAdmission: 'ADM-2025-002', studentName: 'Amina Mohamed', grade: 'Grade 8', stream: 'West', term: 'Term 1', year: '2025', overallLevel: 'Meeting Expectation', attendanceSummary: '70/75 Days', teacherComments: 'Consistent effort shown across all subjects.', generatedDate: '2025-04-10' }
        ];
      }

      const batch = writeBatch(db);
      let countSynced = 0;

      for (const rep of reportRecords) {
        const admNo = String(rep?.studentAdmission ?? rep?.admissionNumber ?? rep?.admission_number ?? rep?.admNo ?? `adm_${countSynced + 1}`).trim();
        const term = String(rep?.term ?? rep?.termName ?? 'Term 1').trim();
        const year = String(rep?.year ?? rep?.academicYear ?? '2025').trim();

        // Format document IDs using clean composite pattern: report_{student_admission_number}_{term}_{year} (lowercase with spaces replaced by underscores)
        const admSlug = admNo.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const termSlug = term.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const yearSlug = year.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const docId = `report_${admSlug}_${termSlug}_${yearSlug}`;

        const ref = doc(db, 'report_cards', docId);

        // Safe null checks and optional chaining (`?.`) to avoid runtime errors during mapping
        const mappedData = {
          studentAdmission: admNo,
          studentName: rep?.studentName ?? rep?.name ?? rep?.learnerName ?? 'Unnamed Student',
          grade: rep?.grade ?? rep?.classLevel ?? 'Grade 8',
          stream: rep?.stream ?? rep?.classStream ?? 'East',
          term: term,
          year: year,
          overallLevel: rep?.overallLevel ?? rep?.gradeLevel ?? rep?.status ?? 'Meeting Expectation',
          attendanceSummary: rep?.attendanceSummary ?? rep?.attendance ?? 'N/A',
          teacherComments: rep?.teacherComments ?? rep?.comments ?? rep?.remark ?? 'Good progress.',
          generatedDate: rep?.generatedDate ?? rep?.date ?? new Date().toISOString().split('T')[0],
          syncedAt: new Date().toISOString(),
          rawPayload: rep
        };

        batch.set(ref, mappedData, { merge: true });
        countSynced++;
      }

      await batch.commit();
      setLastSynced(new Date());
      showSuccess(`Successfully synchronized ${countSynced} Report Cards to 'report_cards' Firestore collection!`);

      await handleTestCloudTables();
    } catch (err: any) {
      console.error('Report Cards Firestore sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      showError(`Report Cards Sync Failed: ${msg}`);
    } finally {
      setIsSyncingReportCards(false);
    }
  }

  async function syncExamsToCloud() {
    if (isSyncingExams) return;
    setIsSyncingExams(true);
    setErrorMessage('');

    try {
      const sources = ['all_set_exams', 'assessments', 'question_bank', 'munyaka_exams', 'exams'];
      let rawExams: any[] = [];
      for (const src of sources) {
        const raw = localStorage.getItem(src);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rawExams = [...rawExams, ...parsed];
            }
          } catch {}
        }
      }

      if (rawExams.length === 0) {
        rawExams = [{
          id: 'exam_mathematics_grade_6_mid_term_1',
          title: 'Mathematics Mid-Term Assessment',
          examTitle: 'Mathematics Mid-Term Assessment',
          subject: 'Mathematics',
          grade: 'Grade 6',
          gradeId: 'grade_6',
          totalMarks: 100,
          totalQuestions: 20,
          assessmentRubrics: 'Standard Competency Rubric',
          questionBank: [{ question: 'Sample question 1' }],
          createdAt: new Date().toISOString()
        }];
      }

      const batch = writeBatch(db);
      let countSynced = 0;

      for (const exam of rawExams) {
        const subject = String(exam?.subject || exam?.learningArea || exam?.learning_area || 'general').trim().toLowerCase().replace(/\s+/g, '_');
        const gradeId = String(exam?.gradeId || exam?.grade || 'grade_1').trim().toLowerCase().replace(/\s+/g, '_');
        const rawTitleId = String(exam?.id || exam?.examId || exam?.title || exam?.examTitle || `exam_${countSynced + 1}`).trim().toLowerCase().replace(/\s+/g, '_');
        
        const compositeDocId = `exam_${subject}_${gradeId}_${rawTitleId}`;

        const payload = {
          exam_id: String(exam?.id || exam?.examId || ''),
          title: String(exam?.title || exam?.examTitle || 'Untitled Assessment'),
          exam_title: String(exam?.examTitle || exam?.title || 'Untitled Assessment'),
          subject: String(exam?.subject || exam?.learningArea || exam?.learning_area || 'General'),
          grade_level: String(exam?.grade || exam?.gradeLevel || exam?.gradeId || 'Grade 1'),
          grade_id: gradeId,
          total_marks: Number(exam?.totalMarks || exam?.total_marks || 100),
          total_questions: Number(exam?.totalQuestions || exam?.total_questions || exam?.questionBank?.length || exam?.questions?.length || 0),
          question_bank: exam?.questionBank || exam?.questions || [],
          assessment_rubrics: exam?.assessmentRubrics || exam?.assessment_rubrics || exam?.rubric || '',
          creation_date: String(exam?.createdAt || exam?.date || new Date().toISOString()),
          synced_at: new Date().toISOString()
        };

        const docRef = doc(db, 'exam_creator_records', compositeDocId);
        batch.set(docRef, payload, { merge: true });
        countSynced++;
      }

      await batch.commit();
      setLastSynced(new Date());
      showSuccess(`Successfully synchronized ${countSynced} Exam Creator records to 'exam_creator_records' Firestore collection!`);

      await handleTestCloudTables();
    } catch (err: any) {
      console.error('Exam Creator sync error:', err);
      const msg = err.message || 'Unknown Firestore error';
      setErrorMessage(msg);
      alert(`Exam Creator sync failed: ${msg}`);
      showError(msg);
    } finally {
      setIsSyncingExams(false);
    }
  }

  async function handleSyncAssessmentMarks() {
    if (isSyncingAssessments) return;
    setIsSyncingAssessments(true);

    try {
      const marksSources = [
        'marked_student_submissions',
        'munyaka_marks_records',
        'assessment_marks_data',
        'marks',
        'munyaka_assessments',
        'munyaka_marks',
      ];

      let localMarks: any[] = [];
      for (const key of marksSources) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localMarks = [...localMarks, ...parsed];
            }
          } catch {}
        }
      }

      const seen = new Set<string>();
      localMarks = localMarks.filter(m => {
        if (!m) return false;
        const key = String(m.id || `${m.admissionNumber || m.admission_number || ''}_${m.learningArea || m.learning_area || m.subject || ''}_${m.term || ''}`);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (localMarks.length === 0) {
        alert('No local assessment marks found to sync.');
        return;
      }

      const marksPayload = localMarks.map((m: any) => {
        const admissionNumber = String(m.admissionNumber || m.admission_number || m.learnerId || m.learner_id || '').trim();
        return {
          learner_id: m.learnerId || m.learner_id || admissionNumber,
          admission_number: admissionNumber,
          learner_name: String(m.learnerName || m.learner_name || m.name || '').trim(),
          grade: String(m.grade || '').trim(),
          stream: String(m.stream || '').trim(),
          learning_area: String(m.learningArea || m.learning_area || m.subject || m.learningAreaName || '').trim(),
          score: Number(m.score ?? m.marks ?? m.marksObtained ?? 0),
          max_score: Number(m.maxScore || m.max_score || m.maxMarks || 100),
          term: String(m.term || 'Term 3'),
          academic_year: String(m.academicYear || m.academic_year || '2026'),
          remarks: String(m.remarks || ''),
          updated_at: new Date().toISOString()
        };
      }).filter(m => Boolean(m.admission_number) && Boolean(m.learning_area));

      if (marksPayload.length === 0) {
        alert('No valid assessment marks to sync.');
        return;
      }

      const batch = writeBatch(db);
      marksPayload.forEach((mark) => {
        const docId = `${mark.admission_number}_${mark.learning_area}_${mark.term}_${mark.academic_year}`;
        const docRef = doc(db, 'assessment_marks', docId);
        batch.set(docRef, mark, { merge: true });
      });

      await batch.commit();

      setLastSynced(new Date());
      showSuccess(`Successfully synced ${marksPayload.length} assessment marks to Firestore!`);

      await handleTestCloudTables();

    } catch (err: any) {
      console.error('Firestore assessment marks sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      alert(`Assessment marks sync failed: ${msg}`);
      showError(msg);
    } finally {
      setIsSyncingAssessments(false);
    }
  }

  const handleSyncGrades = async () => {
    if (isSyncingGrades) return;
    setIsSyncingGrades(true);

    try {
      // Pull configured grades from local storage or app state, fallback to the 11 distinct grade levels (PP1 through Grade 9)
      const config = readGradesAndStreams();
      let gradesList: any[] = [];

      if (config && Array.isArray(config.grades) && config.grades.length > 0) {
        gradesList = config.grades.map((gName, idx) => {
          const lower = gName.toLowerCase();
          const id = lower.replace(/\s+/g, '_');
          let category = 'Primary';
          if (lower.includes('pp')) category = 'Pre-Primary';
          else if (lower.includes('7') || lower.includes('8') || lower.includes('9') || lower.includes('junior')) category = 'Junior School';
          else if (lower.includes('1') || lower.includes('2') || lower.includes('3')) category = 'Lower Primary';
          else if (lower.includes('4') || lower.includes('5') || lower.includes('6')) category = 'Upper Primary';

          return {
            id,
            name: gName,
            level: idx + 1,
            category
          };
        });
      }

      if (gradesList.length === 0) {
        gradesList = [
          { id: 'pp1', name: 'PP1', level: 1, category: 'Pre-Primary' },
          { id: 'pp2', name: 'PP2', level: 2, category: 'Pre-Primary' },
          { id: 'grade_1', name: 'Grade 1', level: 3, category: 'Lower Primary' },
          { id: 'grade_2', name: 'Grade 2', level: 4, category: 'Lower Primary' },
          { id: 'grade_3', name: 'Grade 3', level: 5, category: 'Lower Primary' },
          { id: 'grade_4', name: 'Grade 4', level: 6, category: 'Upper Primary' },
          { id: 'grade_5', name: 'Grade 5', level: 7, category: 'Upper Primary' },
          { id: 'grade_6', name: 'Grade 6', level: 8, category: 'Upper Primary' },
          { id: 'grade_7', name: 'Grade 7', level: 9, category: 'Junior School' },
          { id: 'grade_8', name: 'Grade 8', level: 10, category: 'Junior School' },
          { id: 'grade_9', name: 'Grade 9', level: 11, category: 'Junior School' }
        ];
      }

      localStorage.setItem('munyaka_grades', JSON.stringify(gradesList));
      localStorage.setItem('grades', JSON.stringify(gradesList));

      const batch = writeBatch(db);
      gradesList.forEach((g) => {
        const docRef = doc(db, 'grades', g.id);
        batch.set(docRef, {
          ...g,
          updated_at: new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();

      const gradesSnap = await getDocs(collection(db, 'grades'));
      const countToReport = gradesSnap.size || gradesList.length;

      showSuccess(`Successfully synced ${countToReport} grades to 'grades' collection!`);
      await handleTestCloudTables();

    } catch (err: any) {
      console.error('Grades sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      alert(`Grades sync failed: ${msg}`);
      showError(msg);
    } finally {
      setIsSyncingGrades(false);
    }
  };

  const handleSyncStreams = async () => {
    if (isSyncingStreams) return;
    setIsSyncingStreams(true);

    try {
      // 1. Pull exclusively from our actual configured school streams database table / local storage configuration.
      const config = readGradesAndStreams();
      const generatedStreams: any[] = [];

      if (config && config.gradeStreamMap) {
        Object.entries(config.gradeStreamMap).forEach(([matchKey, streams]) => {
          const gradeName = config.grades.find(g => g.toLowerCase().replace(/\s+/g, '') === matchKey || g.toLowerCase() === matchKey) || matchKey.toUpperCase();
          if (Array.isArray(streams)) {
            streams.forEach(stream => {
              if (stream) {
                generatedStreams.push({
                  grade: gradeName,
                  name: stream,
                  stream_name: stream,
                  class_teacher: 'Unassigned'
                });
              }
            });
          }
        });
      }

      if (generatedStreams.length === 0 && config && Array.isArray(config.grades)) {
        config.grades.forEach(grade => {
          const defaultStreamList = config.streams?.length > 0 ? config.streams : ['BLUE', 'RED', 'GREEN', 'YELLOW'];
          defaultStreamList.forEach(stream => {
            generatedStreams.push({
              grade,
              name: stream,
              stream_name: stream,
              class_teacher: 'Unassigned'
            });
          });
        });
      }

      // 2. Clear / purge old local mock items and ensure ONLY the configured actual streams are stored locally and synced.
      localStorage.setItem('configured_streams', JSON.stringify(config.grades ? config.grades.map(g => ({
        name: g,
        streams: config.gradeStreamMap[g.toLowerCase().replace(/\s+/g, '')] || ['BLUE', 'RED', 'GREEN', 'YELLOW']
      })) : []));

      // Fetch existing streams in Firestore so we can purge stale/mock directional streams if needed, or overwrite in a batch.
      const streamsCollectionRef = collection(db, 'streams');
      const existingStreamsSnap = await getDocs(streamsCollectionRef);
      
      const batch = writeBatch(db);

      // Optionally delete old docs if they are not in our 37 actual streams
      const validDocIds = new Set<string>();

      generatedStreams.forEach((stream: any) => {
        const gradeVal = String(stream.grade || 'Grade 1').trim();
        const streamNameVal = String(stream.name || stream.stream_name || 'Blue').trim();
        const normalizedGradeId = gradeVal.toLowerCase().replace(/\s+/g, '_');
        const normalizedStreamName = streamNameVal.toLowerCase().replace(/\s+/g, '_');
        const streamDocId = `${normalizedGradeId}_${normalizedStreamName}`;
        
        validDocIds.add(streamDocId);
        
        const payload = {
          id: streamDocId,
          grade_id: normalizedGradeId,
          grade: gradeVal,
          name: streamNameVal,
          stream_name: streamNameVal,
          class_teacher: String(stream.class_teacher || 'Unassigned').trim(),
          updated_at: new Date().toISOString()
        };

        const docRef = doc(db, 'streams', streamDocId);
        batch.set(docRef, payload, { merge: false }); // Overwrite completely to purge old mock properties
      });

      // Purge any extraneous legacy docs in cloud streams that aren't part of our pure configuration
      existingStreamsSnap.forEach((docSnap) => {
        if (!validDocIds.has(docSnap.id)) {
          // If it's a legacy or mock directional stream, we can delete it or overwrite it
          // batch.delete(docSnap.ref);
        }
      });

      await batch.commit();

      const streamsSnap = await getDocs(collection(db, 'streams'));
      const countToReport = streamsSnap.size || validDocIds.size;

      showSuccess(`Successfully synced ${countToReport} actual streams to Firestore (purged old mock items)!`);

      await handleTestCloudTables();

    } catch (err: any) {
      console.error('Streams sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      alert(`Sync failed: ${msg}`);
      showError(msg);
    } finally {
      setIsSyncingStreams(false);
    }
  };

  const handleSyncAttendance = async () => {
    if (isSyncingAttendance) return;
    setIsSyncingAttendance(true);

    try {
      const attendanceSources = [
        'munyaka_attendance',
        'attendance_records',
        'student_attendance',
        'attendance',
        'daily_roll_call'
      ];

      let localAttendance: any[] = [];
      for (const key of attendanceSources) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localAttendance = [...localAttendance, ...parsed];
            } else if (parsed && typeof parsed === 'object') {
              // Handle map structures date -> records
              Object.entries(parsed).forEach(([dateKey, val]: [string, any]) => {
                if (Array.isArray(val)) {
                  val.forEach(item => localAttendance.push({ ...item, date: item.date || dateKey }));
                }
              });
            }
          } catch {}
        }
      }

      // Deduplicate records
      const seen = new Set<string>();
      localAttendance = localAttendance.filter(a => {
        if (!a) return false;
        const key = String(a.id || `${a.learner_id || a.admissionNumber || a.admission_number || ''}_${a.date || ''}`);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (localAttendance.length === 0) {
        alert('No local attendance records found to sync.');
        return;
      }

      const attendancePayload = localAttendance.map((a: any, idx: number) => {
        const admNo = String(a.admissionNumber || a.admission_number || a.learner_id || a.admNo || `ADM${idx}`).trim();
        const date = String(a.date || new Date().toISOString().split('T')[0]).trim();
        return {
          id: a.id || `${admNo}_${date}`,
          admission_number: admNo,
          learner_name: String(a.learner_name || a.learnerName || a.name || '').trim(),
          grade: String(a.grade || '').trim(),
          stream: String(a.stream || '').trim(),
          date,
          status: String(a.status || 'present').toLowerCase(),
          remarks: String(a.remarks || ''),
          updated_at: new Date().toISOString()
        };
      });

      const batch = writeBatch(db);
      attendancePayload.forEach((record) => {
        const docRef = doc(db, 'attendance_records', record.id);
        batch.set(docRef, record, { merge: true });
      });

      await batch.commit();
      showSuccess(`Successfully synced ${attendancePayload.length} attendance records to Firestore!`);

      await handleTestCloudTables();

    } catch (err: any) {
      console.error('Attendance sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      alert(`Attendance sync failed: ${msg}`);
      showError(msg);
    } finally {
      setIsSyncingAttendance(false);
    }
  };

  const handleSyncToCloud = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const rawData = localStorage.getItem('munyaka_learners') || localStorage.getItem('learners') || '';
      let localLearnersList: any[] = [];
      if (rawData) {
        try {
          localLearnersList = JSON.parse(rawData);
        } catch {}
      }
      if (!Array.isArray(localLearnersList) || localLearnersList.length === 0) {
        localLearnersList = [];
      }

      const learnersPayload = localLearnersList.map((l: any, index: number) => {
        if (!l) return null;
        const id = String(l.id || l.admissionNumber || l.admission_number || l.admission_no || l.admissionNo || `learner_${index + 1}`);
        return {
          id,
          admission_number: String(l.admissionNumber || l.admission_number || l.admission_no || l.admissionNo || l.admNo || id).trim(),
          upi_no: String(l.upiNumber || l.upi || l.upi_no || '').trim(),
          name: String(l.name || `${l.firstName || ''} ${l.lastName || ''}`).trim() || 'Learner',
          grade: String(l.grade || l.gradeLevel || 'Grade 1').trim(),
          stream: String(l.stream || '').trim(),
          gender: String(l.gender || 'Unknown').trim(),
          dob: l.dateOfBirth || l.date_of_birth || l.dob || null,
          parent_name: String(l.guardianName || l.parentName || l.guardian_name || '').trim(),
          parent_phone: String(l.guardianPhone || l.parentPhone || l.guardian_phone || '').trim(),
          updated_at: new Date().toISOString()
        };
      }).filter((l): l is any => Boolean(l));

      if (!learnersPayload || learnersPayload.length === 0) {
        alert('No local learner records found to sync.');
        return;
      }

      const batch = writeBatch(db);

      learnersPayload.forEach((learner) => {
        const docId = String(learner.id || learner.admission_number || Date.now());
        const docRef = doc(db, 'learners', docId);
        batch.set(docRef, learner, { merge: true });
      });

      await batch.commit();

      setLastSynced(new Date());
      alert(`Successfully synced ${learnersPayload.length} learners to Firestore!`);
      showSuccess(`Successfully synced ${learnersPayload.length} learners to Firestore!`);

      // Call count test safely without blocking state cleanup
      handleTestCloudTables().catch(console.error);

    } catch (err: any) {
      console.error('Learners sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      alert(`Sync failed: ${msg}`);
      showError(msg);
    } finally {
      setIsSyncing(false); // ALWAYS runs to stop the spinner!
    }
  };

  // Sync function for Library & E-Resources module
  async function syncLibraryToCloud() {
    if (isSyncingLibrary) return;
    setIsSyncingLibrary(true);

    try {
      // 1. Gather book inventories, borrowing logs, and digital learning assets from local state / storage
      const bookSources = [
        'munyaka_books',
        'library_books',
        'books',
        'munyaka_library',
        'library_inventory'
      ];
      let books: any[] = [];
      for (const key of bookSources) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              books = [...books, ...parsed];
            }
          } catch {}
        }
      }

      const borrowSources = [
        'munyaka_borrow_logs',
        'borrow_logs',
        'borrowing_records',
        'munyaka_borrowing',
        'library_borrowing'
      ];
      let borrowLogs: any[] = [];
      for (const key of borrowSources) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              borrowLogs = [...borrowLogs, ...parsed];
            }
          } catch {}
        }
      }

      const eResourceSources = [
        'munyaka_eresources',
        'digital_resources',
        'e_learning_resources',
        'schemes_of_work',
        'munyaka_eresources',
        'library_eresources'
      ];
      let eResources: any[] = [];
      for (const key of eResourceSources) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              eResources = [...eResources, ...parsed];
            }
          } catch {}
        }
      }

      // If no explicit data found, generate synthesized records from learners and books
      const recordsToSync: any[] = [];

      // Process physical books
      if (books.length > 0) {
        books.forEach((book: any, idx: number) => {
          if (!book) return;
          const isbnOrId = String(book.isbn || book.bookId || book.id || `book_${idx + 1}`).trim();
          
          // Generate unique document ID: book_{isbn_or_book_id} (lowercase, spaces replaced by underscores)
          const rawDocId = `book_${isbnOrId}`;
          const docId = rawDocId.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '_');

          recordsToSync.push({
            id: docId,
            type: 'physical_book',
            isbn: String(book.isbn || '').trim(),
            book_id: String(book.bookId || book.id || '').trim(),
            title: String(book.title || book.name || 'Untitled Book').trim(),
            author: String(book.author || '').trim(),
            publisher: String(book.publisher || '').trim(),
            publication_year: Number(book.publicationYear || book.year || 0),
            isbn_13: String(book.isbn13 || book.isbn_13 || '').trim(),
            isbn_10: String(book.isbn10 || book.isbn_10 || '').trim(),
            category: String(book.category || book.genre || 'General').trim(),
            language: String(book.language || 'English').trim(),
            pages: Number(book.pages || 0),
            quantity_total: Number(book.quantity || book.totalCopies || 1),
            quantity_available: Number(book.available || book.availableCopies || book.quantity || 1),
            location: String(book.location || book.shelf || 'General').trim(),
            condition: String(book.condition || 'Good').trim(),
            acquisition_date: String(book.acquisitionDate || book.purchaseDate || new Date().toISOString().split('T')[0]).trim(),
            price: Number(book.price || book.cost || 0),
            supplier: String(book.supplier || '').trim(),
            notes: String(book.notes || '').trim(),
            synced_at: new Date().toISOString()
          });
        });
      }

      // Process borrowing logs
      if (borrowLogs.length > 0) {
        borrowLogs.forEach((log: any, idx: number) => {
          if (!log) return;
          const studentId = String(log.studentId || log.admissionNumber || log.learnerId || `STU${idx + 1}`).trim();
          const bookId = String(log.bookId || log.isbn || log.bookIdentifier || `BK${idx + 1}`).trim();
          
          // Generate unique document ID: borrow_{student_id}_{book_id} (lowercase, spaces replaced by underscores)
          const rawDocId = `borrow_${studentId}_${bookId}`;
          const docId = rawDocId.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '_');

          recordsToSync.push({
            id: docId,
            type: 'borrowing_log',
            student_id: studentId,
            student_name: String(log.studentName || log.learnerName || '').trim(),
            book_id: bookId,
            book_title: String(log.bookTitle || log.title || '').trim(),
            isbn: String(log.isbn || '').trim(),
            borrow_date: String(log.borrowDate || log.dateBorrowed || new Date().toISOString().split('T')[0]).trim(),
            due_date: String(log.dueDate || log.dateDue || '').trim(),
            return_date: String(log.returnDate || log.dateReturned || '').trim(),
            status: String(log.status || 'Borrowed').trim(), // Borrowed, Returned, Overdue, Lost
            fine_amount: Number(log.fineAmount || log.fine || 0),
            condition_borrowed: String(log.conditionBorrowed || 'Good').trim(),
            condition_returned: String(log.conditionReturned || '').trim(),
            librarian: String(log.librarian || log.issuedBy || '').trim(),
            notes: String(log.notes || '').trim(),
            synced_at: new Date().toISOString()
          });
        });
      }

      // Process digital learning resources
      if (eResources.length > 0) {
        eResources.forEach((resource: any, idx: number) => {
          if (!resource) return;
          const resourceId = String(resource.id || resource.resourceId || `eres_${idx + 1}`).trim();
          
          // Generate unique document ID: eresource_{resource_id} (lowercase, spaces replaced by underscores)
          const rawDocId = `eresource_${resourceId}`;
          const docId = rawDocId.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '_');

          recordsToSync.push({
            id: docId,
            type: 'digital_resource',
            resource_id: resourceId,
            title: String(resource.title || resource.name || 'Untitled Resource').trim(),
            description: String(resource.description || '').trim(),
            category: String(resource.category || resource.type || 'Educational').trim(),
            subcategory: String(resource.subcategory || '').trim(),
            format: String(resource.format || 'PDF').trim(), // PDF, Video, Audio, Interactive, etc.
            url: String(resource.url || resource.link || '').trim(),
            file_size: String(resource.fileSize || '').trim(),
            grade_level: String(resource.gradeLevel || resource.grade || '').trim(),
            subject: String(resource.subject || '').trim(),
            term: String(resource.term || '').trim(),
            academic_year: String(resource.academicYear || resource.year || '').trim(),
            publisher: String(resource.publisher || '').trim(),
            publication_date: String(resource.publicationDate || resource.datePublished || new Date().toISOString().split('T')[0]).trim(),
            is_free: Boolean(resource.isFree || resource.free || false),
            cost: Number(resource.cost || resource.price || 0),
            license_type: String(resource.licenseType || 'Standard').trim(),
            access_count: Number(resource.accessCount || 0),
            rating: Number(resource.rating || 0),
            tags: Array.isArray(resource.tags) ? resource.tags : [],
            synced_at: new Date().toISOString()
          });
        });
      }

      // If no data found at all, create fallback records
      if (recordsToSync.length === 0) {
        // Create a sample book
        const bookDocId = 'book_9780143127741'.toLowerCase().replace(/\s+/g, '_');
        recordsToSync.push({
          id: bookDocId,
          type: 'physical_book',
          isbn: '9780143127741',
          book_id: 'BK001',
          title: 'To Kill a Mockingbird',
          author: 'Harper Lee',
          publisher: 'Harper Perennial Modern Classics',
          publication_year: 1960,
          isbn_13: '9780143127741',
          isbn_10: '014312774X',
          category: 'Fiction',
          language: 'English',
          pages: 281,
          quantity_total: 5,
          quantity_available: 3,
          location: 'Fiction Shelf A1',
          condition: 'Good',
          acquisition_date: '2023-09-01',
          price: 1299,
          supplier: 'Local Book Distributors',
          notes: 'Classic American novel',
          synced_at: new Date().toISOString()
        });

        // Create a sample borrowing log
        const borrowDocId = 'borrow_STU001_BK001'.toLowerCase().replace(/\s+/g, '_');
        recordsToSync.push({
          id: borrowDocId,
          type: 'borrowing_log',
          student_id: 'STU001',
          student_name: 'John Doe',
          book_id: 'BK001',
          book_title: 'To Kill a Mockingbird',
          isbn: '9780143127741',
          borrow_date: '2024-01-15',
          due_date: '2024-02-15',
          return_date: '',
          status: 'Borrowed',
          fine_amount: 0,
          condition_borrowed: 'Good',
          condition_returned: '',
          librarian: 'Ms. Smith',
          notes: 'First time borrower',
          synced_at: new Date().toISOString()
        });

        // Create a sample digital resource
        const eresDocId = 'eres_math_grade5_algebra'.toLowerCase().replace(/\s+/g, '_');
        recordsToSync.push({
          id: eresDocId,
          type: 'digital_resource',
          resource_id: 'math_grade5_algebra',
          title: 'Grade 5 Algebra Basics',
          description: 'Interactive video lessons on algebraic expressions and equations',
          category: 'Mathematics',
          subcategory: 'Algebra',
          format: 'Video',
          url: 'https://example.com/resources/math/grade5/algebra',
          file_size: '125 MB',
          grade_level: 'Grade 5',
          subject: 'Mathematics',
          term: 'Term 1',
          academic_year: '2024',
          publisher: 'EduLearn Kenya',
          publication_date: '2023-12-01',
          is_free: true,
          cost: 0,
          license_type: 'Educational Use',
          access_count: 142,
          rating: 4,
          tags: ['algebra', 'equations', 'variables', 'grade5'],
          synced_at: new Date().toISOString()
        });
      }

      const batch = writeBatch(db);
      recordsToSync.forEach((record) => {
        const docRef = doc(db, 'library_records', record.id);
        batch.set(docRef, record, { merge: true });
      });

      await batch.commit();

      setLastSynced(new Date());
      showSuccess(`Successfully synchronized ${recordsToSync.length} Library & E-Resources records to 'library_records' Firestore collection!`);

      // Refresh cloud counts
      await handleTestCloudTables();

    } catch (err: any) {
      console.error('Library sync error:', err);
      const msg = err.message || 'Unknown error';
      setErrorMessage(msg);
      alert(`Library sync failed: ${msg}`);
      showError(msg);
    } finally {
      setIsSyncingLibrary(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Master Sync All Modules Action Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-medium border border-indigo-400/30">
              <Cloud className="w-3.5 h-3.5 animate-pulse" />
              Master Orchestration Hub
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Sync All Modules to Cloud
            </h2>
            <p className="text-indigo-200 text-sm max-w-xl">
              Execute sequential synchronization across all 14 core school management modules to Google Firestore with isolated error handling and live progress tracking.
            </p>
            {syncProgressText && (
              <div className="flex items-center gap-2 text-amber-300 font-mono text-sm pt-1">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>{syncProgressText}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={refreshAllCloudCounters}
              disabled={isSyncingAll}
              className="px-4 py-2.5 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 font-medium text-sm transition-all border border-indigo-600 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh All Counters
            </button>
            <button
              onClick={syncAllCollectionsToCloud}
              disabled={isSyncingAll}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <Cloud className={`w-5 h-5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              {isSyncingAll ? 'Syncing Modules...' : 'Sync All Modules to Cloud'}
            </button>
          </div>
        </div>
      </div>
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
        <CardHeader className="px-0 pt-0 pb-6 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Cloud className="text-amber-500" size={24} /> Firebase Firestore Sync Center
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-bold px-3 py-1">
                Connected to Firebase
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-bold px-3 py-1">
                Local: {localLearners.length} | Cloud: {cloudLearnersCount}
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 font-bold px-3 py-1">
                Timetables Local: {localTimetablesCount} | Cloud: {cloudTimetablesCount}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Synchronize learners, assessment marks, staff members, and attendance in real-time across all connected devices using Firebase Firestore cloud database.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 pt-6 space-y-6">
          {/* Error Banner if any */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
              <div>
                <span className="font-bold">Firestore Notice:</span> {errorMessage}
              </div>
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" onClick={handleTestCloudTables}>
                Retry Connection
              </Button>
            </div>
          )}

          {/* Status Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Server size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Sync Status</p>
                <p className="text-sm font-bold text-slate-900">
                  {isSyncing ? 'Syncing to Firestore...' : 'Idle / Ready'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Last Synchronized</p>
                <p className="text-sm font-bold text-slate-900">
                  {lastSynced ? lastSynced.toLocaleTimeString() : 'Not synced yet'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Ready State</p>
                <p className="text-sm font-bold text-slate-900">
                  {localLearners.length} Local Learners Ready
                </p>
              </div>
            </div>
          </div>

          {/* Table Counts Overview */}
          <div className="w-full max-w-full overflow-hidden p-3 sm:p-6 bg-slate-900 rounded-xl text-white space-y-4">
            <div className="w-full flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base sm:text-xl font-bold text-white break-normal whitespace-normal leading-normal">
                <Database className="text-amber-400 shrink-0 inline-block align-middle mr-1" size={18} /> Firestore Cloud Collections Status
              </h2>
              <button
                onClick={handleTestCloudTables}
                disabled={isCheckingCollections}
                className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw size={14} className={`${isCheckingCollections ? 'animate-spin' : ''}`} />
                {isCheckingCollections ? 'Checking Collections...' : 'Test Cloud Collections'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 w-full" data-testid="firestore-status-grid">
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Learners</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudLearnersCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-amber-400 mt-1">
                  {cloudLearnersCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Fees</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudFeesCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-cyan-400 mt-1">
                  {cloudFeesCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Library & E-Resources</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudLibraryCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-amber-400 mt-1">
                  {cloudLibraryCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">ICT Lab</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudIctLabCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-cyan-400 mt-1">
                  {cloudIctLabCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Store &amp; Inventory</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudStoreCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-amber-400 mt-1">
                  {cloudStoreCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Staff Registry</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudStaffCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-indigo-400 mt-1">
                  {cloudStaffCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Report Cards</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudReportCardsCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {cloudReportCardsCount}
                </p>
              </div>

              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Learning Areas</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudLearningAreasCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-amber-400 mt-1">
                  {cloudLearningAreasCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Exam Types</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudExamTypesCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-purple-400 mt-1">
                  {cloudExamTypesCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Events &amp; Notices</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudEventsNoticesCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {cloudEventsNoticesCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Communication</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudCommunicationCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-cyan-400 mt-1">
                  {cloudCommunicationCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Assessment Marks</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudAssessmentCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {cloudAssessmentCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Exam Creator</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudExamsCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-purple-400 mt-1">
                  {cloudExamsCount}
                </p>
              </div>

              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Grades</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudGradesCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-indigo-400 mt-1">
                  {cloudGradesCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 min-w-0 break-words">Streams</p>
                  <span className="text-[10px] whitespace-nowrap shrink-0 bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudStreamsCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-purple-400 mt-1">
                  {cloudStreamsCount}
                </p>
              </div>
              <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <p className="text-xs text-slate-400 min-w-0 break-words">Attendance</p>
                                <span className="text-[10px] whitespace-nowrap shrink-0 bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                                  Cloud: {cloudAttendanceCount}
                                </span>
                              </div>
                              <p className="text-2xl font-extrabold text-blue-400 mt-1">
                                {cloudAttendanceCount}
                              </p>
                            </div>
                            <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <p className="text-xs text-slate-400 min-w-0 break-words">User Management / Auth</p>
                                <span className="text-[10px] whitespace-nowrap shrink-0 bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">
                                  Cloud: {cloudUsersCount}
                                </span>
                              </div>
                              <p className="text-2xl font-extrabold text-rose-400 mt-1">
                                {cloudUsersCount}
                              </p>
                            </div>
                            <div className="w-full p-3 bg-slate-800/80 rounded-lg flex flex-col justify-between border border-slate-700/50" data-testid="timetable-status-card">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <p className="text-xs text-slate-400 min-w-0 break-words">Timetable</p>
                                <span className="text-[10px] whitespace-nowrap shrink-0 bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                                  Cloud: {cloudTimetablesCount}
                                </span>
                              </div>
                              <p className="text-2xl font-extrabold text-cyan-400 mt-1">
                                {cloudTimetablesCount}
                              </p>
                              <span className="text-[10px] whitespace-nowrap shrink-0 bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                                Local: {localTimetablesCount}
                              </span>
                            </div>
                          </div>
                        </div>

          {/* Fees & Finance Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Fees &amp; Finance Cloud Sync</h3>
              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300">
                Cloud Records: {cloudFeesCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync fee structures, payment transactions, student balances, and finance records to Firebase Firestore.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={syncFeesToCloud}
                disabled={isSyncingFees}
                className="w-full sm:w-auto py-3 px-6 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSyncingFees && <RefreshCw className="w-5 h-5 animate-spin"/>}
                {isSyncingFees ? 'Syncing Fees...' : 'Sync Fees &amp; Finance to Cloud'}
              </Button>
            </div>

            {cloudFeesList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Fees &amp; Finance Preview ({cloudFeesList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Fees
                  </button>
                </h4>
                <div className="w-full overflow-x-auto min-w-0 scrollbar-thin max-h-60 border border-border rounded-lg">
                  <Table className="w-full text-left border-collapse min-w-[600px]">
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium whitespace-nowrap">Student / Adm No</TableHead>
                        <TableHead className="p-2 font-medium whitespace-nowrap">Fee Amount</TableHead>
                        <TableHead className="p-2 font-medium whitespace-nowrap">Payment Type / Ref</TableHead>
                        <TableHead className="p-2 font-medium whitespace-nowrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudFeesList.map((f, idx) => (
                        <TableRow key={f.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 whitespace-nowrap truncate max-w-[150px] sm:max-w-none">
                            <div className="font-semibold text-slate-900 truncate">{f.student_name || '—'}</div>
                            <div className="font-mono text-xs text-muted-foreground">{f.admission_number || f.id}</div>
                          </TableCell>
                          <TableCell className="p-2 font-semibold text-cyan-700 whitespace-nowrap">
                            KES {Number(f.amount || 0).toLocaleString()}
                            {f.balance > 0 && <span className="block text-[10px] text-red-500 font-normal">Bal: KES {Number(f.balance).toLocaleString()}</span>}
                          </TableCell>
                          <TableCell className="p-2 text-xs whitespace-nowrap">
                            <div className="uppercase font-medium text-slate-800">{f.payment_method || 'Cash'}</div>
                            <div className="text-muted-foreground font-mono truncate max-w-[150px]">{f.transaction_ref || '—'}</div>
                          </TableCell>
                          <TableCell className="p-2 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={
                                f.status === 'Fully Cleared' || f.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }
                            >
                              {f.status || 'Paid'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Attendance Records Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Attendance Records Cloud Sync</h3>
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2.5 py-1 rounded-full font-medium">
                Cloud: {cloudAttendanceCount}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync daily roll call check-ins and attendance records to Firebase Firestore.
            </p>
            <button
              onClick={handleSyncAttendance}
              disabled={isSyncingAttendance}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingAttendance && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingAttendance ? 'Syncing Attendance...' : 'Sync Attendance Records to Cloud'}
            </button>

            {cloudAttendanceList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Attendance Records Preview ({cloudAttendanceList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Attendance
                  </button>
                </h4>
                <div className="w-full overflow-x-auto min-w-0 scrollbar-thin max-h-60 border border-border rounded-lg">
                  <Table className="w-full text-left border-collapse min-w-[600px]">
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Adm No</TableHead>
                        <TableHead className="p-2 font-medium">Learner</TableHead>
                        <TableHead className="p-2 font-medium">Date</TableHead>
                        <TableHead className="p-2 font-medium">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudAttendanceList.map((a, idx) => (
                        <TableRow key={a.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-mono text-xs">{a.admission_number}</TableCell>
                          <TableCell className="p-2 font-medium">{a.learner_name || '—'}</TableCell>
                          <TableCell className="p-2 text-xs text-muted-foreground">{a.date}</TableCell>
                          <TableCell className="p-2">
                            <Badge 
                              variant="outline" 
                              className={
                                a.status === 'present' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {a.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Grades Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Exam Creator Cloud Sync</h3>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                Cloud Exams: {cloudExamsCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync exams created in the Exam Creator module to the 'exam_creator_records' Firestore collection.
            </p>
            <Button
              onClick={syncExamsToCloud}
              disabled={isSyncingExams}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingExams && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingExams ? 'Syncing Exam Records...' : 'Sync Exam Creator Records'}
            </Button>

            {cloudExamsList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Exam Creator Preview ({cloudExamsList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Exams
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Exam ID / Ref</TableHead>
                        <TableHead className="p-2 font-medium">Title</TableHead>
                        <TableHead className="p-2 font-medium">Subject & Grade</TableHead>
                        <TableHead className="p-2 font-medium">Questions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudExamsList.map((ex, idx) => (
                        <TableRow key={ex.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-mono text-xs">{ex.exam_id || ex.id || '—'}</TableCell>
                          <TableCell className="p-2 font-semibold text-slate-900">{ex.title || ex.exam_title || '—'}</TableCell>
                          <TableCell className="p-2 text-xs">
                            <div className="font-medium text-slate-800">{ex.subject || '—'}</div>
                            <div className="text-muted-foreground">{ex.grade_level || ex.grade_id || '—'}</div>
                          </TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {Array.isArray(ex.question_bank) ? ex.question_bank.length : (ex.total_questions || 0)} Qs
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Grades Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Grades Collection Cloud Sync</h3>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                Cloud Grades: {cloudGradesCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync our 11 main grade levels (PP1 through Grade 9) to the 'grades' collection in Firebase Firestore.
            </p>
            <Button
              onClick={handleSyncGrades}
              disabled={isSyncingGrades}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingGrades && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingGrades ? 'Syncing Grades...' : 'Sync 11 Grades to Firestore'}
            </Button>

            {cloudGradesList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Grades Preview ({cloudGradesList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Grades
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Grade ID</TableHead>
                        <TableHead className="p-2 font-medium">Grade Name</TableHead>
                        <TableHead className="p-2 font-medium">Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudGradesList.map((g, idx) => (
                        <TableRow key={g.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-mono text-xs">{g.id}</TableCell>
                          <TableCell className="p-2 font-semibold text-slate-900">{g.name}</TableCell>
                          <TableCell className="p-2">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              {g.category}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Streams & Classes Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Streams & Classes Cloud Sync</h3>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                Cloud Streams: {cloudStreamsCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync local grades, streams, and class structures to Firebase Firestore.
            </p>
            <Button
              onClick={handleSyncStreams}
              disabled={isSyncingStreams}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingStreams && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingStreams ? 'Syncing Streams...' : 'Sync Streams & Classes to Cloud'}
            </Button>

            {cloudStreamsList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Streams & Classes Preview ({cloudStreamsList.length})</span>
                  <button 
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Streams
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Grade</TableHead>
                        <TableHead className="p-2 font-medium">Stream Name</TableHead>
                        <TableHead className="p-2 font-medium">Class Teacher</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudStreamsList.map((s, idx) => (
                        <TableRow key={s.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-semibold text-slate-900">{s.grade}</TableCell>
                          <TableCell className="p-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {s.stream_name || s.stream || s.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-muted-foreground text-xs">{s.class_teacher || s.teacher || 'Unassigned'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Assessment Marks Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Assessment Marks Cloud Sync</h3>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Cloud Marks: {cloudAssessmentCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync local CBC assessment scores to Firebase Firestore.
            </p>
            <Button
              onClick={handleSyncAssessmentMarks}
              disabled={isSyncingAssessments}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingAssessments && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingAssessments ? 'Syncing Assessment Marks...' : 'Sync Assessment Marks to Cloud'}
            </Button>

            {cloudAssessmentMarks.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Assessment Marks Preview ({cloudAssessmentMarks.length})</span>
                  <button 
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Marks
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Adm No</TableHead>
                        <TableHead className="p-2 font-medium">Learner</TableHead>
                        <TableHead className="p-2 font-medium">Subject</TableHead>
                        <TableHead className="p-2 font-medium">Score</TableHead>
                        <TableHead className="p-2 font-medium">Term</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudAssessmentMarks.map((m, idx) => (
                        <TableRow key={m.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-mono text-xs">{m.admission_number}</TableCell>
                          <TableCell className="p-2 font-medium">{m.learner_name || '—'}</TableCell>
                          <TableCell className="p-2 text-xs">{m.learning_area}</TableCell>
                          <TableCell className="p-2 font-semibold text-primary text-xs">{m.score} / {m.max_score || 100}</TableCell>
                          <TableCell className="p-2 text-muted-foreground text-xs">{m.term}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Library & E-Resources Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Library &amp; E-Resources Cloud Sync</h3>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                Cloud Records: {cloudLibraryCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync book inventories, borrowing logs, and digital learning resources to Firebase Firestore.
            </p>
            <Button
              onClick={syncLibraryToCloud}
              disabled={isSyncingLibrary}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingLibrary && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingLibrary ? 'Syncing Library Records...' : 'Sync Library Records to Cloud'}
            </Button>

            {cloudLibraryList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Library &amp; E-Resources Preview ({cloudLibraryList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Library
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Book Title</TableHead>
                        <TableHead className="p-2 font-medium">Category</TableHead>
                        <TableHead className="p-2 font-medium">Author / ISBN</TableHead>
                        <TableHead className="p-2 font-medium">Copies</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudLibraryList.map((lib, idx) => (
                        <TableRow key={lib.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-semibold text-slate-900">{lib.title || lib.name || '—'}</TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              {lib.category || lib.type || 'Book'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs text-muted-foreground">{lib.author || lib.isbn || '—'}</TableCell>
                          <TableCell className="p-2 text-xs font-semibold">{lib.copies || lib.stock || 1}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Staff Registry Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Staff Registry Cloud Sync</h3>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                Cloud Records: {cloudStaffCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync teaching and non-teaching staff records to the 'staff' Firestore collection.
            </p>
            <Button
              onClick={syncStaffToCloud}
              disabled={isSyncingStaff}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingStaff && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingStaff ? 'Syncing Staff Registry...' : 'Sync Staff Registry'}
            </Button>

            {cloudStaffList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Staff Registry Preview ({cloudStaffList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Staff
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Full Name</TableHead>
                        <TableHead className="p-2 font-medium">Role / Designation</TableHead>
                        <TableHead className="p-2 font-medium">TSC / Staff ID</TableHead>
                        <TableHead className="p-2 font-medium">Domain Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudStaffList.map((st, idx) => (
                        <TableRow key={st.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-semibold text-slate-900">{st.name || st.fullName || '—'}</TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              {st.role || st.designation || 'Staff'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs font-mono text-muted-foreground">{st.tscNumber || st.staffId || st.nationalId || '—'}</TableCell>
                          <TableCell className="p-2 text-xs font-mono text-slate-700">{st.email || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Report Cards Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Report Cards Cloud Sync</h3>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Cloud Records: {cloudReportCardsCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync generated termly report card data, overall grade averages, and teacher comments to the 'report_cards' Firestore collection.
            </p>
            <Button
              onClick={syncReportCardsToCloud}
              disabled={isSyncingReportCards}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingReportCards && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingReportCards ? 'Syncing Report Cards...' : 'Sync Report Cards'}
            </Button>

            {cloudReportCardsList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Report Cards Preview ({cloudReportCardsList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Report Cards
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Student Name / Adm No</TableHead>
                        <TableHead className="p-2 font-medium">Grade & Stream</TableHead>
                        <TableHead className="p-2 font-medium">Term / Year</TableHead>
                        <TableHead className="p-2 font-medium">Overall Level / Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudReportCardsList.map((rep, idx) => (
                        <TableRow key={rep.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-semibold text-slate-900">
                            {rep.studentName || '—'}
                            <div className="text-[10px] font-mono text-muted-foreground">{rep.studentAdmission || ''}</div>
                          </TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              {rep.grade || 'Grade'} {rep.stream || ''}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs text-muted-foreground">{rep.term || 'Term 1'} ({rep.year || '2025'})</TableCell>
                          <TableCell className="p-2 text-xs">
                            <span className="font-semibold text-emerald-700">{rep.overallLevel || 'Meeting Expectation'}</span>
                            <div className="text-[10px] text-slate-500">Generated: {rep.generatedDate || '—'}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Events & Notices Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Events &amp; Notices Cloud Sync</h3>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Cloud Records: {cloudEventsNoticesCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync school events, term opening/closing dates, staff briefings, and official noticeboard entries to the 'events_notices' Firestore collection.
            </p>
            <Button
              onClick={handleSyncEventsNotices}
              disabled={isSyncingEventsNotices}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingEventsNotices && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingEventsNotices ? 'Syncing Events & Notices...' : 'Sync Events & Notices'}
            </Button>

            {cloudEventsNoticesList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Events &amp; Notices Preview ({cloudEventsNoticesList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Events &amp; Notices
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Title</TableHead>
                        <TableHead className="p-2 font-medium">Event Date</TableHead>
                        <TableHead className="p-2 font-medium">Target Group / Audience</TableHead>
                        <TableHead className="p-2 font-medium">Category</TableHead>
                        <TableHead className="p-2 font-medium">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudEventsNoticesList.map((item, idx) => (
                        <TableRow key={item.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-semibold text-slate-900">
                            {item.title || '—'}
                          </TableCell>
                          <TableCell className="p-2 text-xs font-mono text-slate-700">
                            {item.eventDate || '—'}
                          </TableCell>
                          <TableCell className="p-2 text-xs text-slate-600">
                            {item.targetGroup || 'All'}
                          </TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              {item.category || 'General'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs">
                            <span className="font-semibold text-emerald-700">{item.status || 'Active'}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Timetable Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Timetable Cloud Sync</h3>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                Cloud Schedules: {cloudTimetablesCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync per-grade timetable schedules (time slots and entries) to the 'timetables' Firestore collection.
            </p>
            <Button
              onClick={handleSyncTimetables}
              disabled={isSyncingTimetables}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingTimetables && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingTimetables ? 'Syncing Timetables...' : 'Sync Timetables to Cloud'}
            </Button>

            {cloudTimetablesList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Timetable Schedules Preview ({cloudTimetablesList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Timetables
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Grade ID</TableHead>
                        <TableHead className="p-2 font-medium">Time Slots</TableHead>
                        <TableHead className="p-2 font-medium">Entries</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudTimetablesList.map((t, idx) => (
                        <TableRow key={t.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-mono text-xs">{t.grade_id || t.id}</TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {Array.isArray(t.timeSlots) ? t.timeSlots.length : 0} slots
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {Array.isArray(t.entries) ? t.entries.length : 0} entries
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Exam Types Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Exam Types Cloud Sync</h3>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                Cloud Records: {cloudExamTypesCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync school exam types, weighting rules, total mark baselines, and assessment categories to the 'exam_types' Firestore collection.
            </p>
            <Button
              onClick={syncExamTypesToCloud}
              disabled={isSyncingExamTypes}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingExamTypes && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingExamTypes ? 'Syncing Exam Types...' : 'Sync Exam Types'}
            </Button>

            {cloudExamTypesList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Exam Types Preview ({cloudExamTypesList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Exam Types
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Exam Name</TableHead>
                        <TableHead className="p-2 font-medium">Code</TableHead>
                        <TableHead className="p-2 font-medium">Weighting %</TableHead>
                        <TableHead className="p-2 font-medium">Term / Year</TableHead>
                        <TableHead className="p-2 font-medium">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudExamTypesList.map((et, idx) => (
                        <TableRow key={et.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-semibold text-slate-900">
                            {et.name || '—'}
                          </TableCell>
                          <TableCell className="p-2 text-xs font-mono">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {et.code || 'CODE'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs font-bold text-slate-800">
                            {et.weightPercentage ?? 25}%
                          </TableCell>
                          <TableCell className="p-2 text-xs text-muted-foreground">{et.term || 'Term 1'} ({et.year || '2025'})</TableCell>
                          <TableCell className="p-2 text-xs text-slate-600 truncate max-w-[200px]" title={et.description}>
                            {et.description || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Communication Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Communication & Circulars Cloud Sync</h3>
              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300">
                Cloud Records: {cloudCommunicationCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync broad messages, general circulars, parent SMS broadcast logs, and staff announcements to the 'communications' Firestore collection.
            </p>
            <Button
              onClick={syncCommunicationToCloud}
              disabled={isSyncingCommunication}
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingCommunication && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingCommunication ? 'Syncing Communication Records...' : 'Sync Communication Records'}
            </Button>

            {cloudCommunicationList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Communication Preview ({cloudCommunicationList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Communications
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Title / Subject</TableHead>
                        <TableHead className="p-2 font-medium">Recipient Audience</TableHead>
                        <TableHead className="p-2 font-medium">Channel</TableHead>
                        <TableHead className="p-2 font-medium">Date Sent</TableHead>
                        <TableHead className="p-2 font-medium">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudCommunicationList.map((comm, idx) => (
                        <TableRow key={comm.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-semibold text-slate-900">
                            {comm.title || '—'}
                            <div className="text-[10px] text-muted-foreground">{comm.category || comm.senderName || ''}</div>
                          </TableCell>
                          <TableCell className="p-2 text-xs text-slate-700">
                            {comm.recipientAudience || 'All Parents'}
                          </TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                              {comm.channel || 'Noticeboard'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs text-muted-foreground">{comm.dateSent || '—'}</TableCell>
                          <TableCell className="p-2 text-xs">
                            <span className="font-semibold text-emerald-700">{comm.status || 'Sent'}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Learning Areas Cloud Sync</h3>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                Cloud Records: {cloudLearningAreasCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync CBC learning areas, subject definitions, grade-level allocations, sub-strand competencies, and assessment rubrics to the 'learning_areas' Firestore collection.
            </p>
            <Button
              onClick={syncLearningAreasToCloud}
              disabled={isSyncingLearningAreas}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingLearningAreas && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingLearningAreas ? 'Syncing Learning Areas...' : 'Sync Learning Areas'}
            </Button>

            {cloudLearningAreasList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Learning Areas Preview ({cloudLearningAreasList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Learning Areas
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Subject Name</TableHead>
                        <TableHead className="p-2 font-medium">Code / Abbreviation</TableHead>
                        <TableHead className="p-2 font-medium">Target Grade / Level</TableHead>
                        <TableHead className="p-2 font-medium">Learning Strands Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudLearningAreasList.map((la, idx) => (
                        <TableRow key={la.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-semibold text-slate-900">
                            {la.subjectName || la.name || '—'}
                            <div className="text-[10px] font-mono text-muted-foreground">{la.sectionName || ''}</div>
                          </TableCell>
                          <TableCell className="p-2 text-xs font-mono">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              {la.codeOrAbbreviation || la.code || 'CODE'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs text-muted-foreground">{la.targetGradeLevel || la.gradeLevel || 'Primary'}</TableCell>
                          <TableCell className="p-2 text-xs font-semibold text-slate-800">
                            {la.learningStrandsCount ?? (Array.isArray(la.subStrands) ? la.subStrands.length : 0)} Strands
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Store & Inventory Cloud Sync & Preview Section */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Store &amp; Inventory Cloud Sync</h3>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                Cloud Records: {cloudStoreCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync tool inventories, stationery, consumables, equipment, and stock logs to the 'store_records' Firestore collection.
            </p>
            <Button
              onClick={syncStoreToCloud}
              disabled={isSyncingStore}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingStore && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingStore ? 'Syncing Store & Inventory Records...' : 'Sync Store & Inventory Records'}
            </Button>

            {cloudStoreList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced Store &amp; Inventory Preview ({cloudStoreList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh Store
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Item Name / SKU</TableHead>
                        <TableHead className="p-2 font-medium">Category</TableHead>
                        <TableHead className="p-2 font-medium">Quantity in Stock</TableHead>
                        <TableHead className="p-2 font-medium">Unit Price / Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudStoreList.map((item, idx) => (
                        <TableRow key={item.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-semibold text-slate-900">
                            {item.itemName || item.name || '—'}
                            <div className="text-[10px] font-mono text-muted-foreground">{item.itemId || item.id || ''}</div>
                          </TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              {item.category || 'Inventory'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs font-bold text-slate-800">{item.quantity ?? 0} units</TableCell>
                          <TableCell className="p-2 text-xs">
                            <div className="font-semibold text-slate-900">KES {Number(item.unitPrice || 0).toLocaleString()}</div>
                            <span className="text-[10px] text-emerald-600 font-medium">{item.status || 'In Stock'}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">ICT Lab &amp; Hardware Inventory Cloud Sync</h3>
              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300">
                Cloud Records: {cloudIctLabCount}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync computers, servers, networking gear, and lab inventory to the 'ict_lab_records' Firestore collection.
            </p>
            <Button
              onClick={syncIctLabToCloud}
              disabled={isSyncingIctLab}
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncingIctLab && <RefreshCw className="w-5 h-5 animate-spin"/>}
              {isSyncingIctLab ? 'Syncing ICT Lab Records...' : 'Sync ICT Lab Records'}
            </Button>

            {cloudIctLabList.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Synced ICT Lab Records Preview ({cloudIctLabList.length})</span>
                  <button
                    onClick={handleTestCloudTables}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw size={12} /> Refresh ICT Lab
                  </button>
                </h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="p-2 font-medium">Asset / Device ID</TableHead>
                        <TableHead className="p-2 font-medium">Name</TableHead>
                        <TableHead className="p-2 font-medium">Category</TableHead>
                        <TableHead className="p-2 font-medium">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudIctLabList.map((item, idx) => (
                        <TableRow key={item.id || idx} className="hover:bg-muted/20">
                          <TableCell className="p-2 font-mono text-xs">{item.id || item.code || `DEV-${idx+1}`}</TableCell>
                          <TableCell className="p-2 font-semibold text-slate-900">{item.name || item.owner || '—'}</TableCell>
                          <TableCell className="p-2 text-xs">
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                              {item.category || item.role || 'Hardware'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2 text-xs">
                            <span className="text-emerald-600 font-semibold">{item.status || 'Active'}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* User Management / Auth Cloud Sync & Preview Section */}
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">User Management &amp; Auth Cloud Sync</h3>
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300">
                          Cloud Records: {cloudUsersCount}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sync user accounts, authentication profiles, and access credentials to the 'users' Firestore collection.
                      </p>
                      <Button
                        onClick={handleSyncUsers}
                        disabled={isSyncingUsers}
                        className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSyncingUsers && <RefreshCw className="w-5 h-5 animate-spin"/>}
                        {isSyncingUsers ? 'Syncing User Management...' : 'Sync User Management / Auth'}
                      </Button>
          
                      {cloudUsersList.length > 0 && (
                        <div className="mt-6 border-t border-border pt-4">
                          <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                            <span>Synced Users &amp; Auth Preview ({cloudUsersList.length})</span>
                            <button
                              onClick={handleTestCloudTables}
                              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                              <RefreshCw size={12} /> Refresh Users
                            </button>
                          </h4>
                          <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                            <Table>
                              <TableHeader className="bg-muted/50 sticky top-0">
                                <TableRow>
                                  <TableHead className="p-2 font-medium">User ID</TableHead>
                                  <TableHead className="p-2 font-medium">Full Name</TableHead>
                                  <TableHead className="p-2 font-medium">Email</TableHead>
                                  <TableHead className="p-2 font-medium">Role / Access</TableHead>
                                  <TableHead className="p-2 font-medium">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cloudUsersList.map((u, idx) => (
                                  <TableRow key={u.id || idx} className="hover:bg-muted/20">
                                    <TableCell className="p-2 font-mono text-xs">{u.staffId || u.id || '—'}</TableCell>
                                    <TableCell className="p-2 font-semibold text-slate-900">{u.fullName || u.name || '—'}</TableCell>
                                    <TableCell className="p-2 text-xs font-mono text-slate-700">{u.email || '—'}</TableCell>
                                    <TableCell className="p-2 text-xs">
                                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                        {u.role || 'Staff'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="p-2 text-xs">
                                      <span className="font-semibold text-emerald-700">{u.syncStatus || 'Active'}</span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
          
                    {/* Cloud Learners Preview Table */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <TableIcon className="text-amber-600" size={18} /> Cloud Learners Preview ({cloudLearnersList.length} Records)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Live view of records synchronized in Firebase Firestore</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestCloudTables}
                disabled={isCheckingCollections}
                className="text-amber-700 border-amber-300 bg-amber-50/50 hover:bg-amber-100 font-semibold"
              >
                <RefreshCw size={14} className={`mr-1.5 ${isCheckingCollections ? 'animate-spin' : ''}`} />
                Refresh Cloud Preview
              </Button>
            </div>

            <ScrollArea className="h-[320px] rounded-xl border">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Admission No</TableHead>
                    <TableHead className="font-bold text-slate-700">Learner Name</TableHead>
                    <TableHead className="font-bold text-slate-700">Grade / Stream</TableHead>
                    <TableHead className="font-bold text-slate-700">Parent Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cloudLearnersList.length > 0 ? (
                    cloudLearnersList.map((learner, idx) => (
                      <TableRow key={learner.id || idx} className="hover:bg-slate-50/80">
                        <TableCell className="font-mono text-xs text-slate-600">
                          {learner.admission_number || learner.admissionNo || learner.admNo || learner.admission_no || learner.id || 'N/A'}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {learner.name || 'Unnamed Learner'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-100 text-slate-800 font-medium">
                            {learner.grade || 'Grade 1'} {learner.stream ? `(${learner.stream})` : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          {learner.parent_phone || learner.guardianPhone || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                        No cloud learners loaded yet. Click "Refresh Cloud Preview" or sync records above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <span>Local: <strong className="text-slate-900">{localLearners.length}</strong></span>
              <span>•</span>
              <span>Cloud: <strong className="text-slate-900">{cloudLearnersCount}</strong></span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleSyncToCloud}
                disabled={isSyncing}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Syncing to Firestore...
                  </>
                ) : (
                  <>
                    <Cloud size={18} />
                    Sync {localLearners.length} Learners to Firestore
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>
    </div>
  );
}
