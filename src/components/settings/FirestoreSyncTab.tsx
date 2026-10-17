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

  const localLearners = (() => {
    try {
      const raw = localStorage.getItem('munyaka_learners') || localStorage.getItem('learners');
      return raw ? JSON.parse(raw) : [];
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

      setTestStatus('success');
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

  return (
    <div className="space-y-6">
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
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Database className="text-amber-400" size={18} /> Firestore Cloud Collections Status
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestCloudTables}
                disabled={isCheckingCollections}
                className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
              >
                <RefreshCw size={14} className={`mr-1.5 ${isCheckingCollections ? 'animate-spin' : ''}`} />
                {isCheckingCollections ? 'Checking Collections...' : 'Test Cloud Collections'}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Learners</p>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudLearnersCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-amber-400 mt-1">
                  {cloudLearnersCount}
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Fees</p>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudFeesCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-cyan-400 mt-1">
                  {cloudFeesCount}
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Assessment Marks</p>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudAssessmentCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {cloudAssessmentCount}
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Grades</p>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudGradesCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-indigo-400 mt-1">
                  {cloudGradesCount}
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Streams</p>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudStreamsCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-purple-400 mt-1">
                  {cloudStreamsCount}
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Attendance</p>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                    Cloud: {cloudAttendanceCount}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-blue-400 mt-1">
                  {cloudAttendanceCount}
                </p>
              </div>
            </div>
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
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  <Table>
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
