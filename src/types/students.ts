export interface STUDENT {
  id: string;
  name: string;
  assessment: string;
  grade: string;
  stream: string;
  gender: string;
  dob: string;
  guardian: string;
  phone: string;
  email: string;
  health: string;
  needs: string;
}

export interface StudentFilters {
  searchTerm: string;
  filterGrade: string;
  filterStream: string;
}

export interface RegistrationForm {
  fullName: string;
  assessmentNo: string;
  regGrade: string;
  regStream: string;
  guardianName: string;
  phone: string;
  address: string;
}
