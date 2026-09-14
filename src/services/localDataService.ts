import { CentralDataService } from './centralDataService';

export const localDataService = {
  getStudents: () => CentralDataService.getLearners(),
  getLearners: () => CentralDataService.getLearners(),
  getStaff: () => CentralDataService.getStaff(),
  saveStudents: (students: any[]) => CentralDataService.saveLearners(students),
  saveLearners: (learners: any[]) => CentralDataService.saveLearners(learners),
};

// Add named export aliases to support components importing { localData } or { localDataService }
export const localData = localDataService;
export const LocalDataService = localDataService;

export default localDataService;