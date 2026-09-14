import { initialSeedData } from '../data/initialSeedData';
import { CentralDataService } from './centralDataService';

export const dashboardService = {
  getDashboardStats: () => {
    // Force sync learners from CentralDataService
    const learners = CentralDataService.getLearners();
    const staff = CentralDataService.getStaff();

    const seedLearners = initialSeedData?.students || initialSeedData?.learners || [];
    const finalLearners = learners.length >= seedLearners.length ? learners : seedLearners;

    return {
      registeredStudents: finalLearners.length,
      teachingStaff: staff.filter((s: any) => s.role === 'Teacher' || s.type === 'Teaching').length,
      nonTeachingStaff: staff.filter((s: any) => s.role !== 'Teacher' && s.type !== 'Teaching').length || staff.length,
      totalStaff: staff.length,
    };
  }
};

export default dashboardService;