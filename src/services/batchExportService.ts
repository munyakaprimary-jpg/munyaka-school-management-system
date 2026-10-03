import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { CentralDataService } from '@/services/centralDataService';

export interface ClassPackageHeader {
  teacherName: string;
  teacherId: string;
  assignedGrade: string;
  assignedStream: string;
  timestamp: string;
  exportVersion: string;
  deviceId: string;
}

export interface ClassPackageData {
  header: ClassPackageHeader;
  attendanceRecords: any[];
  teacherCheckInLogs: any[];
  cbcAssessments: any[];
  classInventory: any[];
  learners: any[];
}

export const batchExportService = {
  /**
   * Gather all local records for the specified teacher/stream and build a structured JSON package
   */
  async generateClassPackage(teacher: { id?: string; name?: string; assignedClass?: string; grade?: string; stream?: string }): Promise<ClassPackageData> {
    const teacherName = teacher?.name || 'Teacher';
    const teacherId = teacher?.id || 'TCH-' + Math.floor(1000 + Math.random() * 9000);
    const assignedGrade = teacher?.assignedClass || teacher?.grade || 'Grade 4';
    const assignedStream = teacher?.stream || 'Green';
    const timestamp = new Date().toISOString();

    // 1. Gather learners in this grade/stream
    const allLearners = CentralDataService.getLearners();
    const classLearners = allLearners.filter((l: any) => {
      const g = String(l.grade || l.class || '').toLowerCase();
      const s = String(l.stream || '').toLowerCase();
      const targetG = assignedGrade.toLowerCase();
      return g.includes(targetG) || targetG.includes(g);
    });

    // 2. Gather attendance records
    let attendanceRecords = [];
    try {
      const attStored = localStorage.getItem('munyaka_attendance_records');
      const allAtt = attStored ? JSON.parse(attStored) : [];
      attendanceRecords = allAtt.filter((r: any) => {
        // match by student in class or matching stream
        return classLearners.some((l: any) => l.id === r.studentId || l.admissionNumber === r.admissionNumber);
      });
    } catch {}

    // 3. Gather teacher check-in logs
    let teacherCheckInLogs = [];
    try {
      const tAttStored = localStorage.getItem('munyaka_teacher_attendance');
      const allTAtt = tAttStored ? JSON.parse(tAttStored) : [];
      teacherCheckInLogs = allTAtt.filter((r: any) => r.teacherId === teacherId || r.teacherName === teacherName);
    } catch {}

    // 4. Gather CBC assessment rubrics & marks
    let cbcAssessments = [];
    try {
      const marksStored = localStorage.getItem('munyaka_marks') || localStorage.getItem('munyaka_assessments');
      const allMarks = marksStored ? JSON.parse(marksStored) : [];
      cbcAssessments = allMarks.filter((m: any) => {
        return classLearners.some((l: any) => l.id === m.studentId || l.admissionNumber === m.admissionNumber);
      });
    } catch {}

    // 5. Gather class inventory / fees / assets
    let classInventory = [];
    try {
      const invStored = localStorage.getItem('munyaka_ict_assets');
      const allInv = invStored ? JSON.parse(invStored) : [];
      classInventory = allInv.filter((i: any) => {
        const target = assignedGrade.toLowerCase();
        return String(i.assignedTo || i.grade || i.location || '').toLowerCase().includes(target);
      });
    } catch {}

    const header: ClassPackageHeader = {
      teacherName,
      teacherId,
      assignedGrade,
      assignedStream,
      timestamp,
      exportVersion: '1.0.0',
      deviceId: 'DEV-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    };

    const metadata = {
      staffId: teacherId,
      role: 'teacher',
      timestamp,
      packageType: 'TEACHER_MASTER_PACKAGE'
    };

    return {
      metadata,
      header,
      attendanceRecords,
      teacherCheckInLogs,
      cbcAssessments,
      classInventory,
      learners: classLearners
    };
  },

  /**
   * Save the class package JSON file using Capacitor Filesystem or web Blob download fallback
   */
  async exportAndSavePackage(teacher: { id?: string; name?: string; assignedClass?: string; grade?: string; stream?: string }): Promise<{ success: boolean; fileName: string; size: number }> {
    const packageData = await this.generateClassPackage(teacher);
    const jsonString = JSON.stringify(packageData, null, 2);
    const safeName = (packageData.header.teacherName || 'Teacher').replace(/[^a-zA-Z0-9]/g, '_');
    const safeGrade = (packageData.header.assignedGrade || 'Grade').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Munyaka_MasterPackage_${safeName}_${safeGrade}_${Date.now()}.json`;

    // 1. Try Capacitor Native Share & Filesystem first
    try {
      const writeFileResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      if (writeFileResult && writeFileResult.uri) {
        await Share.share({
          title: 'Master Class Package Export',
          text: `Munyaka Master Package for ${packageData.header.teacherName} (${packageData.header.assignedGrade})`,
          files: [writeFileResult.uri],
          url: writeFileResult.uri,
          dialogTitle: 'Share Master Class Package'
        });
        return { success: true, fileName, size: jsonString.length };
      }
    } catch (nativeErr) {
      // Fall through to web blob download
    }

    // 2. Web Blob Download Fallback
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { success: true, fileName, size: jsonString.length };
    } catch (webErr) {
      throw new Error('Failed to save export file via Capacitor Share or browser download.');
    }
  }
};
