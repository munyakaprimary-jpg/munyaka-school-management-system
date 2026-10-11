import { CentralDataService } from './CentralDataService';

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
