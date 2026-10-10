export const filterByTeacherScope = (dataArray: any[], user: any) => {
  if (!Array.isArray(dataArray)) return [];
  if (!user) return dataArray;

  const role = String(user.role || '').toUpperCase();
  const designation = String(user.designation || user.specificRole || '').toUpperCase();

  // Global operational roles see all data
  if (
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'OWNER' ||
    designation.includes('ADMIN') ||
    designation.includes('HOI') ||
    designation.includes('DHOI') ||
    designation.includes('BURSAR') ||
    designation.includes('HEAD OF INSTITUTION') ||
    designation.includes('DEPUTY')
  ) {
    return dataArray;
  }

  // Class Teacher or assignedClass restriction
  if (
    role === 'CLASS_TEACHER' ||
    designation.includes('CLASS TEACHER') ||
    Boolean(user.assignedClass)
  ) {
    const targetClass = String(user.assignedClass || user.gradeStream || 'Grade 9 Venus').trim().toLowerCase();
    
    return dataArray.filter(item => {
      if (!item) return false;
      const itemClass = String(item.assignedClass || item.gradeStream || '').trim().toLowerCase();
      const itemGradeStream = `${item.grade || ''} ${item.stream || ''}`.trim().toLowerCase();
      
      return (
        itemClass === targetClass ||
        itemGradeStream === targetClass ||
        itemClass.includes(targetClass) ||
        targetClass.includes(itemClass)
      );
    });
  }

  return dataArray;
};

export const isGlobalRole = (user: any): boolean => {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  const des = String(user.designation || user.specificRole || '').toUpperCase();
  return (
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'OWNER' ||
    des.includes('ADMIN') ||
    des.includes('HOI') ||
    des.includes('DHOI') ||
    des.includes('BURSAR')
  );
};

export const getTeacherAssignedClass = (user: any): string => {
  if (!user) return 'Grade 9 Venus';
  return user.assignedClass || user.gradeStream || 'Grade 9 Venus';
};
