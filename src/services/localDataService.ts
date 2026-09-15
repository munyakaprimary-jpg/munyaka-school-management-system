import { CentralDataService } from './centralDataService';

export const localDataService = {
  getStudents: () => CentralDataService.getLearners(),
  getLearners: () => CentralDataService.getLearners(),
  getStaff: () => CentralDataService.getStaff(),
  saveStudents: (students: any[]) => CentralDataService.saveLearners(students),
  saveLearners: (learners: any[]) => CentralDataService.saveLearners(learners),
  studentAttend: {
    getAll: (params?: { studentId?: string; date?: string }) => {
      try {
        const stored = localStorage.getItem('munyaka_attendance_records');
        const records = stored ? JSON.parse(stored) : [];
        if (!params) return records;
        return records.filter((r: any) => {
          if (params.studentId && r.studentId !== params.studentId) return false;
          if (params.date && r.date !== params.date) return false;
          return true;
        });
      } catch { return []; }
    },
    save: (record: any) => {
      try {
        const stored = localStorage.getItem('munyaka_attendance_records');
        const records = stored ? JSON.parse(stored) : [];
        const idx = records.findIndex((r: any) => r.id === record.id || (r.studentId === record.studentId && r.date === record.date));
        if (idx >= 0) {
          records[idx] = { ...records[idx], ...record };
        } else {
          records.push({ id: 'att-' + Date.now(), ...record });
        }
        localStorage.setItem('munyaka_attendance_records', JSON.stringify(records));
        return true;
      } catch { return false; }
    }
  },
  teacherAttend: {
    getForToday: (teacherId: string) => {
      try {
        const stored = localStorage.getItem('munyaka_teacher_attendance');
        const records = stored ? JSON.parse(stored) : [];
        const today = new Date().toISOString().split('T')[0];
        return records.find((r: any) => r.teacherId === teacherId && r.date === today) || null;
      } catch { return null; }
    },
    save: (record: any) => {
      try {
        const stored = localStorage.getItem('munyaka_teacher_attendance');
        const records = stored ? JSON.parse(stored) : [];
        const idx = records.findIndex((r: any) => r.id === record.id || (r.teacherId === record.teacherId && r.date === record.date));
        if (idx >= 0) {
          records[idx] = { ...records[idx], ...record };
        } else {
          records.push({ id: 't-att-' + Date.now(), ...record });
        }
        localStorage.setItem('munyaka_teacher_attendance', JSON.stringify(records));
        return true;
      } catch { return false; }
    }
  },
  inventory: {
    getAll: () => {
      try {
        const stored = localStorage.getItem('munyaka_ict_assets');
        return stored ? JSON.parse(stored) : [];
      } catch { return []; }
    }
  }
};

// Add named export aliases to support components importing { localData } or { localDataService }
export const localData = localDataService;
export const LocalDataService = localDataService;

export default localDataService;