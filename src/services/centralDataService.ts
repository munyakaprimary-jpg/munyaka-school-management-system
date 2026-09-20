/**
 * centralDataService.ts — Definitive unified data storage service
 * All menus, dashboards, and pages read and write exclusively from this service.
 */

import { UnifiedDataStorage } from './unifiedDataStorage';

export const CentralDataService = {
  getLearners: () => UnifiedDataStorage.getLearners(),
  saveLearners: (learners: any[]) => UnifiedDataStorage.saveLearners(learners),
  getStudents: () => UnifiedDataStorage.getLearners(),
  saveStudents: (learners: any[]) => UnifiedDataStorage.saveLearners(learners),
  
  getStaff: () => UnifiedDataStorage.getStaff(),
  saveStaff: (staff: any[]) => UnifiedDataStorage.saveStaff(staff),
  addStaff: (record: any) => UnifiedDataStorage.addStaff(record),
  updateStaff: (id: string, updates: any) => UnifiedDataStorage.updateStaff(id, updates),
  deleteStaff: (id: string) => UnifiedDataStorage.deleteStaff(id),
  clearStaff: () => UnifiedDataStorage.clearStaff(),

  getAttendance: () => UnifiedDataStorage.getAttendance(),
  saveAttendance: (records: any[]) => UnifiedDataStorage.saveAttendance(records),
  
  getFees: () => UnifiedDataStorage.getFees(),
  saveFees: (records: any[]) => UnifiedDataStorage.saveFees(records),
  getTransactions: () => UnifiedDataStorage.getFees(),
  saveTransactions: (records: any[]) => UnifiedDataStorage.saveFees(records),

  getData: <T>(key: string, fallback: T): T => UnifiedDataStorage.get<T>(key, fallback),
  setData: <T>(key: string, value: T): void => { UnifiedDataStorage.set(key, value); },

  generateFullSnapshot: async () => {
    const backup = {
      students: UnifiedDataStorage.getLearners(),
      staff: UnifiedDataStorage.getStaff(),
      attendance: UnifiedDataStorage.getAttendance(),
      fees: UnifiedDataStorage.getFees(),
    };
    return JSON.stringify(backup, null, 2);
  },
  
  restoreSnapshot: async (snapshot: string) => {
    try {
      const data = JSON.parse(snapshot);
      if (data.students) UnifiedDataStorage.saveLearners(data.students);
      if (data.staff) UnifiedDataStorage.saveStaff(data.staff);
      if (data.attendance) UnifiedDataStorage.saveAttendance(data.attendance);
      if (data.fees) UnifiedDataStorage.saveFees(data.fees);
      return true;
    } catch {
      return false;
    }
  }
};

export const getLearners = CentralDataService.getLearners;
export const saveLearners = CentralDataService.saveLearners;
export const getStudents = CentralDataService.getStudents;
export const saveStudents = CentralDataService.saveStudents;
export const getStaff = CentralDataService.getStaff;
export const saveStaff = CentralDataService.saveStaff;

export default CentralDataService;
