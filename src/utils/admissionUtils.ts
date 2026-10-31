export const generateCohortAdmissionNumber = (studentGrade: string, existingLearners: any[] = []): string => {
  // Map each grade to its baseline entry year (assuming Grade 1 started in current year minus current grade offset)
  // For example in 2026: Grade 9 = 2018, Grade 8 = 2019, Grade 7 = 2020, Grade 6 = 2021, etc.
  const currentCalendarYear = new Date().getFullYear();
  
  // Extract grade number (e.g., "Grade 9" -> 9, or "9" -> 9)
  const gradeNumMatch = studentGrade.match(/\d+/);
  const gradeNum = gradeNumMatch ? parseInt(gradeNumMatch[0], 10) : 1;
  
  // Calculate join year: Grade N joined (Current Year - N) roughly, or map explicitly:
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

  // Filter existing learners belonging to this join year / grade cohort
  const cohortLearners = existingLearners.filter((l) => {
    const adm = l.admNo || l.admissionNumber || l.admissionNo || '';
    return adm.endsWith(`-${joinYear}`) || l.grade === studentGrade;
  });

  // Calculate next sequence number
  const nextSeq = cohortLearners.length + 1;
  const paddedSeq = String(nextSeq).padStart(3, '0');

  return `MUN-${paddedSeq}-${joinYear}`;
};
