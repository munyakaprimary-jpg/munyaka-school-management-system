import { CentralDataService } from '@/services/centralDataService';

export interface HarmonizationAuditItem {
  id: string;
  fileName: string;
  metadata: {
    senderName?: string;
    staffId: string;
    role?: string;
    departmentOrStream?: string;
    assignedClass?: string;
    assignedStream?: string;
    timestamp?: string;
    exportedAt?: string;
    packageType?: string;
    appVersion?: string;
  };
  header?: {
    teacherName: string;
    teacherId: string;
    assignedGrade: string;
    assignedStream: string;
    timestamp: string;
    exportVersion: string;
    deviceId: string;
  };
  attendanceCount: number;
  checkInCount: number;
  assessmentCount: number;
  inventoryCount: number;
  learnerCount: number;
  hasStreamMismatch?: boolean;
  streamMismatchReason?: string;
  rawPackage: any;
  status: 'pending' | 'harmonized' | 'error' | 'mismatch';
}

export const harmonizationService = {
  /**
   * Parse uploaded JSON file(s) and extract metadata header and item counts for audit review
   */
  async parseExportFile(file: File): Promise<HarmonizationAuditItem> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          
          if (!jsonData || typeof jsonData !== 'object' || !jsonData.metadata) {
            throw new Error('Invalid package format: missing root metadata property.');
          }

          const metadata = jsonData.metadata;
          const assignedClass = metadata.assignedClass || metadata.departmentOrStream || 'Grade 1';
          const assignedStream = metadata.assignedStream || metadata.departmentOrStream || 'Green';

          // Validate stream mismatch against authorized admin slots or system records
          let hasStreamMismatch = false;
          let streamMismatchReason = '';

          // Check if admin has defined authorized teacher slots in localStorage
          try {
            const authorizedSlotsRaw = localStorage.getItem('munyaka_teacher_slots') || localStorage.getItem('munyaka_class_assignments');
            if (authorizedSlotsRaw) {
              const slots = JSON.parse(authorizedSlotsRaw);
              if (Array.isArray(slots) && slots.length > 0) {
                const staffId = metadata.staffId;
                const match = slots.find((s: any) => 
                  String(s.staffId || s.teacherId || s.id) === String(staffId) ||
                  String(s.teacherName || s.name || '').toLowerCase() === String(metadata.senderName || '').toLowerCase()
                );
                if (match) {
                  const allowedClass = match.grade || match.class || match.assignedClass;
                  const allowedStream = match.stream || match.assignedStream;
                  if (allowedClass && allowedClass.toLowerCase() !== assignedClass.toLowerCase()) {
                    hasStreamMismatch = true;
                    streamMismatchReason = `Assigned class "${assignedClass}" differs from authorized slot "${allowedClass}".`;
                  } else if (allowedStream && allowedStream.toLowerCase() !== assignedStream.toLowerCase()) {
                    hasStreamMismatch = true;
                    streamMismatchReason = `Assigned stream "${assignedStream}" differs from authorized slot "${allowedStream}".`;
                  }
                }
              }
            }
          } catch {}

          const header = jsonData.header || {
            teacherName: metadata.senderName || metadata.staffId || 'Staff Member',
            teacherId: metadata.staffId || 'UNKNOWN',
            assignedGrade: assignedClass,
            assignedStream: assignedStream,
            timestamp: metadata.exportedAt || metadata.timestamp || new Date().toISOString(),
            exportVersion: metadata.appVersion || '1.0.0',
            deviceId: 'DEV-OFFLINE'
          };

          const auditItem: HarmonizationAuditItem = {
            id: 'audit-' + Math.random().toString(36).substring(2, 9),
            fileName: file.name,
            metadata,
            header,
            attendanceCount: Array.isArray(jsonData.data?.attendance) ? jsonData.data.attendance.length : (Array.isArray(jsonData.attendanceRecords) ? jsonData.attendanceRecords.length : 0),
            checkInCount: Array.isArray(jsonData.data?.checkIns) ? jsonData.data.checkIns.length : (Array.isArray(jsonData.teacherCheckInLogs) ? jsonData.teacherCheckInLogs.length : 0),
            assessmentCount: Array.isArray(jsonData.data?.marks) ? jsonData.data.marks.length : (Array.isArray(jsonData.cbcAssessments) ? jsonData.cbcAssessments.length : 0),
            inventoryCount: Array.isArray(jsonData.data?.inventory) ? jsonData.data.inventory.length : (Array.isArray(jsonData.classInventory) ? jsonData.classInventory.length : 0),
            learnerCount: Array.isArray(jsonData.data?.learners) ? jsonData.data.learners.length : (Array.isArray(jsonData.learners) ? jsonData.learners.length : 0),
            hasStreamMismatch,
            streamMismatchReason,
            rawPackage: jsonData,
            status: hasStreamMismatch ? 'mismatch' : 'pending'
          };

          resolve(auditItem);
        } catch (err: any) {
          reject(new Error(`Failed to parse ${file.name}: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsText(file);
    });
  },

  /**
   * Safely validate and route incoming records into the correct master database tables
   * ensuring stream isolation and no cross-stream mix-ups.
   */
  harmonizeAndMerge(items: HarmonizationAuditItem[]): { successCount: number; errors: string[] } {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      if (item.hasStreamMismatch && item.status !== 'harmonized') {
        errors.push(`File ${item.fileName} has unverified stream mismatch: ${item.streamMismatchReason}`);
        continue;
      }

      try {
        const raw = item.rawPackage;
        const data = raw.data || raw;
        const meta = item.metadata;
        const assignedClass = meta.assignedClass || item.header?.assignedGrade || 'Grade 1';
        const assignedStream = meta.assignedStream || item.header?.assignedStream || 'Green';

        // 1. Harmonize Learners / Roster
        const learners = data.learners || raw.learners;
        if (Array.isArray(learners) && learners.length > 0) {
          const existingLearners = CentralDataService.getLearners();
          const mergedLearners = [...existingLearners];
          for (const incoming of learners) {
            const idx = mergedLearners.findIndex((l: any) => l.id === incoming.id || (l.admissionNumber && l.admissionNumber === incoming.admissionNumber) || (l.admNo && l.admNo === incoming.admNo));
            if (idx >= 0) {
              mergedLearners[idx] = { ...mergedLearners[idx], ...incoming, grade: assignedClass, stream: assignedStream };
            } else {
              mergedLearners.push({ ...incoming, grade: assignedClass, stream: assignedStream });
            }
          }
          CentralDataService.saveLearners(mergedLearners);
        }

        // 2. Harmonize Attendance Records
        const attendance = data.attendance || raw.attendanceRecords;
        if (Array.isArray(attendance) && attendance.length > 0) {
          try {
            const stored = localStorage.getItem('munyaka_attendance_records');
            const allAtt = stored ? JSON.parse(stored) : [];
            const mergedAtt = [...allAtt];
            for (const att of attendance) {
              const idx = mergedAtt.findIndex((r: any) => r.id === att.id || (r.studentId === att.studentId && r.date === att.date));
              if (idx >= 0) {
                mergedAtt[idx] = { ...mergedAtt[idx], ...att, assignedClass, assignedStream };
              } else {
                mergedAtt.push({ ...att, assignedClass, assignedStream });
              }
            }
            localStorage.setItem('munyaka_attendance_records', JSON.stringify(mergedAtt));
          } catch {}
        }

        // 3. Harmonize Marks / Assessments
        const marks = data.marks || raw.cbcAssessments;
        if (Array.isArray(marks) && marks.length > 0) {
          try {
            const stored = localStorage.getItem('marked_student_submissions');
            const allMarks = stored ? JSON.parse(stored) : [];
            const mergedMarks = [...allMarks];
            for (const m of marks) {
              const idx = mergedMarks.findIndex((r: any) => r.id === m.id || (r.studentId === m.studentId && r.assessmentId === m.assessmentId));
              if (idx >= 0) {
                mergedMarks[idx] = { ...mergedMarks[idx], ...m, assignedClass, assignedStream };
              } else {
                mergedMarks.push({ ...m, assignedClass, assignedStream });
              }
            }
            localStorage.setItem('marked_student_submissions', JSON.stringify(mergedMarks));
          } catch {}
        }

        successCount++;
      } catch (err: any) {
        errors.push(`Failed to merge ${item.fileName}: ${err.message}`);
      }
    }

    return { successCount, errors };
  }
};
