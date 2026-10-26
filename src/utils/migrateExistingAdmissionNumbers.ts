export const migrateExistingAdmissionNumbers = () => {
  const students = JSON.parse(localStorage.getItem('munyaka_students') || '[]');
  if (!students.length) return;

  const updatedStudents = students.map((student: any) => {
    // Extract year suffix from existing admission number (e.g. MUN-005-2021 -> 2021)
    const yearMatch = (student.admissionNumber || student.admNo || '').match(/\d{4}$/);
    const entryYear = yearMatch ? yearMatch[0] : (student.admissionYear || '2026');

    // Generate unique random 4-char code
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newAdmNo = `MUN-${randomCode}-${entryYear}`;

    const oldAdmNo = student.admissionNumber || student.admNo;

    // Cascade updates into any saved exam submissions matching old admission number
    const submissions = JSON.parse(localStorage.getItem('munyaka_exam_submissions') || '[]');
    const updatedSubmissions = submissions.map((sub: any) => {
      if (sub.admissionNo === oldAdmNo || sub.studentId === student.id) {
        return { ...sub, admissionNo: newAdmNo };
      }
      return sub;
    });
    localStorage.setItem('munyaka_exam_submissions', JSON.stringify(updatedSubmissions));

    return {
      ...student,
      admissionNumber: newAdmNo,
      admNo: newAdmNo
    };
  });

  // Save updated master student list back to localStorage
  localStorage.setItem('munyaka_students', JSON.stringify(updatedStudents));
  window.location.reload(); // Refresh to reflect updated table state instantly
};
