export const getCohortYear = (studentGrade: string): number => {
  const currentCalendarYear = new Date().getFullYear();
  const gradeNumMatch = studentGrade ? studentGrade.match(/\d+/) : null;
  const gradeNum = gradeNumMatch ? parseInt(gradeNumMatch[0], 10) : 1;
  
  const gradeJoinYearMap: Record<number, number> = {
    9: 2018,
    8: 2019,
    7: 2020,
    6: 2021,
    5: 2022,
    4: 2023,
    3: 2024,
    2: 2025,
    1: 2026,
  };

  return gradeJoinYearMap[gradeNum] || (currentCalendarYear - (gradeNum - 1));
};

const ALPHANUM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluding O, 0, I, 1

export const generateRandom4Char = (): string => {
  let result = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHANUM_CHARS.length);
    result += ALPHANUM_CHARS[randomIndex];
  }
  return result;
};

export const getAllExistingAdmissionNumbers = (existingLearners: any[] = []): Set<string> => {
  const set = new Set<string>();
  (existingLearners || []).forEach(l => {
    if (!l) return;
    const adm = String(l.admNo || l.admissionNumber || l.admissionNo || l.admission_number || l.id || '').trim();
    if (adm) set.add(adm.toUpperCase());
  });
  return set;
};

export const generateUniqueCohortAdmissionNumber = (
  studentGrade: string,
  existingLearners: any[] = [],
  currentCode?: string
): { admissionNumber: string; randomCode: string } => {
  const cohortYear = getCohortYear(studentGrade);
  const existingSet = getAllExistingAdmissionNumbers(existingLearners);

  let randomCode = currentCode ? currentCode.trim().toUpperCase() : '';
  if (!randomCode || randomCode.length !== 4) {
    let attempts = 0;
    do {
      randomCode = generateRandom4Char();
      const candidate = `MUN-${randomCode}-${cohortYear}`;
      if (!existingSet.has(candidate)) {
        break;
      }
      attempts++;
    } while (attempts < 100);
  }

  let admissionNumber = `MUN-${randomCode}-${cohortYear}`;
  // Ensure absolute uniqueness across existing learners
  if (existingSet.has(admissionNumber)) {
    let attempts = 0;
    do {
      randomCode = generateRandom4Char();
      admissionNumber = `MUN-${randomCode}-${cohortYear}`;
      attempts++;
    } while (existingSet.has(admissionNumber) && attempts < 200);
  }

  return { admissionNumber, randomCode };
};

// Legacy alias for backward compatibility
export const generateCohortAdmissionNumber = (studentGrade: string, existingLearners: any[] = []): string => {
  return generateUniqueCohortAdmissionNumber(studentGrade, existingLearners).admissionNumber;
};
