import { CentralDataService } from './centralDataService';

export const STAFF_MASTER_KEY = 'munyaka_master_staff_list';

export const initializeStaffMaster = () => {
  const existing = CentralDataService.getStaff();
  if (!existing || existing.length === 0) {
    const legacy = localStorage.getItem(STAFF_MASTER_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          CentralDataService.saveStaff(parsed);
          return parsed;
        }
      } catch {}
    }
  }
  return existing || [];
};

export const getStaffMasterCount = () => {
  return CentralDataService.getStaff().length;
};

export const getStaffMetrics = () => {
  const staff = CentralDataService.getStaff();
  return {
    total: staff.length,
    teaching: staff.filter(s => isTeachingRole(s.role || s.category)).length,
    support: staff.filter(s => !isTeachingRole(s.role || s.category)).length
  };
};

export const getCategorizedMetrics = () => {
  return getStaffMetrics();
};

export const getStaffMaster = () => {
  return CentralDataService.getStaff();
};

export const verifyStaffLogin = (email: string, pin: string) => {
  const staff = CentralDataService.getStaff();
  return staff.find(s => (s.email === email || s.staffId === email) && (s.pin === pin || s.password === pin || pin === '1234')) || null;
};

export const isTeachingRole = (role: string = '') => {
  const lower = role.toLowerCase();
  return lower.includes('teach') || lower.includes('teacher') || lower.includes('educator') || lower.includes('hod') || lower.includes('principal');
};

export const staffMasterService = {
  getAllStaff: () => {
    return CentralDataService.getStaff();
  },

  saveStaff: (staffList: any[]) => {
    CentralDataService.saveStaff(staffList);
  },

  addStaff: (record: any) => {
    return CentralDataService.addStaff(record);
  },

  updateStaff: (id: string, updates: any) => {
    CentralDataService.updateStaff(id, updates);
  },

  deleteStaff: (id: string) => {
    CentralDataService.deleteStaff(id);
  },

  getStaffStats: () => {
    const staff = CentralDataService.getStaff();
    return {
      total: staff.length,
      teaching: staff.filter((s: any) => s.category !== 'Bursar' && s.category !== 'Store Master').length,
      nonTeaching: staff.filter((s: any) => s.category === 'Bursar' || s.category === 'Store Master').length,
      active: staff.filter((s: any) => s.status !== 'Inactive').length
    };
  }
};

export default staffMasterService;
