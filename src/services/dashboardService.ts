import { CentralDataService } from './centralDataService';

export const dashboardService = {
  getDashboardStats: () => {
    const learners = CentralDataService.getLearners();
    const staff = CentralDataService.getStaff();

    // Flexible teaching staff matching
    const teachingStaff = staff.filter((s: any) => {
      const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''}`.toLowerCase();
      return roleStr.includes('teach');
    });

    const nonTeachingStaff = staff.filter((s: any) => {
      const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''}`.toLowerCase();
      return !roleStr.includes('teach');
    });

    return {
      registeredStudents: learners.length,
      teachingStaff: teachingStaff.length,
      nonTeachingStaff: nonTeachingStaff.length,
      totalStaff: staff.length,
      primaryStudents: learners.filter((l: any) => !l.grade?.toLowerCase().includes('junior')).length,
      juniorStudents: learners.filter((l: any) => l.grade?.toLowerCase().includes('junior')).length,
    };
  }
};

export default dashboardService;