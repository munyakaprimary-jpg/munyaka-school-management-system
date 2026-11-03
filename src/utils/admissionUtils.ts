export const generateCohortAdmissionNumber = (studentGrade: string, existingLearners: any[] = []): string => {
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

  const joinYear = gradeJoinYearMap[gradeNum] || (currentCalendarYear - (gradeNum - 1));

  const cohortLearners = (existingLearners || []).filter((l) => {
    if (!l) return false;
    const adm = String(l.admNo || l.admissionNumber || l.admissionNo || '');
    return adm.endsWith(`-${joinYear}`) || l.grade === studentGrade;
  });

  const nextSeq = cohortLearners.length + 1;
  const paddedSeq = String(nextSeq).padStart(3, '0');

  return `MUN-${paddedSeq}-${joinYear}`;
};

