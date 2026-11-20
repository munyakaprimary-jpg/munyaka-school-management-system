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

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NUMBERS = '23456789';
const ALL_CHARS = LETTERS + NUMBERS;

export const generateRandom4Char = (): string => {
  // Ensure at least one letter and one number for a healthy alphanumeric mix (e.g., K7M4)
  const l1 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const n1 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  const c3 = ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)];
  const c4 = ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)];
  
  const chars = [l1, n1, c3, c4];
  // Shuffle array
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
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
  studentGrade: string = 'Grade 4',
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

// Main generator export expected by AddLearnerModal and TransferInModal
export const generateCohortAdmissionNumber = (studentGrade: string, existingLearners: any[] = []): string => {
  return generateUniqueCohortAdmissionNumber(studentGrade, existingLearners).admissionNumber;
};

export const findAssessmentBirthCertDuplicate = (learners: any[], submittedAssess: string, excludeId?: string): any | null => {
  const target = String(submittedAssess || '').trim().toLowerCase();
  if (!target) return null;
  for (const l of learners) {
    if (!l) continue;
    if (excludeId && String(l.id) === String(excludeId)) continue;
    const assess = String(l.assessmentNumber || l.assessmentNo || l.birthCertNo || '').trim().toLowerCase();
    if (assess && assess === target) {
      return l;
    }
  }
  return null;
};

export const formatAssessmentDuplicateError = (dup: any): string => {
  const name = dup?.fullName || dup?.name || 'another learner';
  const adm = dup?.admissionNumber || dup?.admissionNo || dup?.admNo || '';
  return `Assessment / Birth Certificate number is already registered to ${name}${adm ? ` (${adm})` : ''}.`;
};
