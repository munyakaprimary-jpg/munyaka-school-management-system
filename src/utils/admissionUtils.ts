export const generateStandardAdmNo = (existingLearners: any[], year = '2026'): string => {
  const prefix = 'MUN';
  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomCode}-${year}`;
};

export const normalizeAllAdmissionNumbers = () => {
  const studentKeys = [
    'munyaka_students',
    'munyaka_pupils',
    'munyaka_fees_finance',
    'munyaka_learners',
    'school_learners_v1',
    'roll_call_records',
    'munyaka_attendance_records'
  ];
  
  studentKeys.forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          let seqCounter = 1;
          const updated = parsed.map((item) => {
            const currentAdm = item.admNo || item.admissionNumber || item.admissionNo || '';
            
            // If it's unpadded or random 4-digit format, standardize it
            if (/MUN-\d{4}-\d{4}/i.test(currentAdm) || !currentAdm.startsWith('MUN-')) {
              const year = currentAdm.split('-')[2] || new Date().getFullYear().toString();
              const paddedSeq = String(seqCounter++).padStart(3, '0');
              const newAdm = `MUN-${paddedSeq}-${year}`;
              return { ...item, admNo: newAdm, admissionNumber: newAdm };
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(updated));
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Object maps (like roll call records)
          let seqCounter = 1;
          const updated = { ...parsed };
          Object.keys(updated).forEach(recordKey => {
            const record = updated[recordKey];
            if (record && typeof record === 'object' && record.students) {
              const students = { ...record.students };
              Object.keys(students).forEach(studentId => {
                const student = students[studentId];
                const currentAdm = student.admissionNo || student.admissionNumber || '';
                if (/MUN-\d{4}-\d{4}/i.test(currentAdm) || !currentAdm.startsWith('MUN-')) {
                  const year = currentAdm.split('-')[2] || new Date().getFullYear().toString();
                  const paddedSeq = String(seqCounter++).padStart(3, '0');
                  const newAdm = `MUN-${paddedSeq}-${year}`;
                  students[studentId] = { ...student, admissionNo: newAdm, admissionNumber: newAdm };
                }
              });
              record.students = students;
            }
          });
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (e) {
        console.error(`Error normalizing key ${key}:`, e);
      }
    }
  });
};
