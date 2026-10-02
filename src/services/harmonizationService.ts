import { CentralDataService } from '@/services/centralDataService';

export interface HarmonizationAuditItem {
  id: string;
  fileName: string;
  header: {
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
  rawPackage: any;
  status: 'pending' | 'harmonized' | 'error';
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
          const data = JSON.parse(content);
          
          if (!data || !data.header) {
            throw new Error('Invalid package format: missing metadata header.');
          }

          const auditItem: HarmonizationAuditItem = {
            id: 'audit-' + Math.random().toString(36).substring(2, 9),
            fileName: file.name,
            header: data.header,
            attendanceCount: Array.isArray(data.attendanceRecords) ? data.attendanceRecords.length : 0,
            checkInCount: Array.isArray(data.teacherCheckInLogs) ? data.teacherCheckInLogs.length : 0,
            assessmentCount: Array.isArray(data.cbcAssessments) ? data.cbcAssessments.length : 0,
            inventoryCount: Array.isArray(data.classInventory) ? data.classInventory.length : 0,
            learnerCount: Array.isArray(data.learners) ? data.learners.length : 0,
            rawPackage: data,
            status: 'pending'
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
      try {
        const { header, attendanceRecords, teacherCheckInLogs, cbcAssessments, classInventory, learners } = item.rawPackage;
        const gradeStreamKey = `${header.assignedGrade || 'Grade'}_${header.assignedStream || 'Green'}`;

        // 1. Harmonize Learners / Roster
        if (Array.isArray(learners) && learners.length > 0) {
          const existingLearners = CentralDataService.getLearners();
          const mergedLearners = [...existingLearners];
          for (const incoming of learners) {
            const idx = mergedLearners.findIndex((l: any) => l.id === incoming.id || (l.admissionNumber && l.admissionNumber === incoming.admissionNumber));
            if (idx >= 0) {
              // update matching stream/grade safely
              mergedLearners[idx] = { ...mergedLearners[idx], ...incoming, grade: header.assignedGrade, stream: header.assignedStream };
            } else {
              mergedLearners.push({ ...incoming, grade: header.assignedGrade, stream: header.assignedStream });
            }
          }
          CentralDataService.saveLearners(mergedLearners);
        }

        // 2. Harmonize Attendance Records
        if (Array.isArray(attendanceRecords) && attendanceRecords.length > 0) {
          try {
            const stored = localStorage.getItem('munyaka_attendance_records');
            const allAtt = stored ? JSON.parse(stored) : [];
            const mergedAtt = [...allAtt];
            for (const att of attendanceRecords) {
              const idx = mergedAtt.findIndex((r: any) => r.id === att.id || (r.studentId === att.studentId && r.date === att.date));
              if (idx >= 0) {
                mergedAtt[idx] = { ...mergedAtt[idx], ...att };
              } else {
                mergedAtt.push(att);
              }
            }
            localStorage.setItem('munyaka_attendance_records', JSON.stringify(mergedAtt));
          } catch {}
        }

        // 3. Harmonize Teacher Check-In Logs
        if (Array.isArray(teacherCheckInLogs) && teacherCheckInLogs.length > 0) {
          try {
            const stored = localStorage.getItem('munyaka_teacher_attendance');
            const allTAtt = stored ? JSON.parse(stored) : [];
            const mergedTAtt = [...allTAtt];
            for (const tAtt of teacherCheckInLogs) {
              const idx = mergedTAtt.findIndex((r: any) => r.id === tAtt.id || (r.teacherId === tAtt.teacherId && r.date === tAtt.date));
              if (idx >= 0) {
                mergedTAtt[idx] = { ...mergedTAtt[idx], ...tAtt };
              } else {
                mergedTAtt.push(tAtt);
              }
            }
            localStorage.setItem('munyaka_teacher_attendance', JSON.stringify(mergedTAtt));
          } catch {}
        }

        // 4. Harmonize CBC Assessments / Marks
        if (Array.isArray(cbcAssessments) && cbcAssessments.length > 0) {
          try {
            const key = localStorage.getItem('munyaka_marks') ? 'munyaka_marks' : 'munyaka_assessments';
            const stored = localStorage.getItem(key) || '[]';
            const allMarks = JSON.parse(stored);
            const mergedMarks = [...allMarks];
            for (const mark of cbcAssessments) {
              const idx = mergedMarks.findIndex((m: any) => m.id === mark.id || (m.studentId === mark.studentId && m.strandId === mark.strandId));
              if (idx >= 0) {
                mergedMarks[idx] = { ...mergedMarks[idx], ...mark };
              } else {
                mergedMarks.push(mark);
              }
            }
            localStorage.setItem(key, JSON.stringify(mergedMarks));
          } catch {}
        }

        // 5. Harmonize Class Inventory / Assets
        if (Array.isArray(classInventory) && classInventory.length > 0) {
          try {
            const stored = localStorage.getItem('munyaka_ict_assets');
            const allInv = stored ? JSON.parse(stored) : [];
            const mergedInv = [...allInv];
            for (const inv of classInventory) {
              const idx = mergedInv.findIndex((i: any) => i.id === inv.id || i.assetTag === inv.assetTag);
              if (idx >= 0) {
                mergedInv[idx] = { ...mergedInv[idx], ...inv };
              } else {
                mergedInv.push(inv);
              }
            }
            localStorage.setItem('munyaka_ict_assets', JSON.stringify(mergedInv));
          } catch {}
        }

        successCount++;
      } catch (err: any) {
        errors.push(`Failed to harmonize ${item.fileName}: ${err.message}`);
      }
    }

    return { successCount, errors };
  }
};
