export function getRoleLandingPage(role: string | undefined | null, _unused?: any, _user?: any): string {
  if (!role) return '/dashboard';
  const cleanRole = role.toLowerCase().trim();
  if (cleanRole.includes('admin') || cleanRole.includes('principal') || cleanRole.includes('head')) {
    return '/dashboard';
  }
  if (cleanRole.includes('teacher') || cleanRole.includes('educator')) {
    return '/teacher-dashboard';
  }
  if (cleanRole.includes('student') || cleanRole.includes('pupil') || cleanRole.includes('learner')) {
    return '/student-portal';
  }
  if (cleanRole.includes('parent') || cleanRole.includes('guardian')) {
    return '/parent-portal';
  }
  if (cleanRole.includes('librarian') || cleanRole.includes('library')) {
    return '/library-dashboard';
  }
  if (cleanRole.includes('accountant') || cleanRole.includes('finance') || cleanRole.includes('bursar')) {
    return '/finance-dashboard';
  }
  if (cleanRole.includes('nurse') || cleanRole.includes('health') || cleanRole.includes('clinic')) {
    return '/clinic-dashboard';
  }
  if (cleanRole.includes('hostel') || cleanRole.includes('dorm') || cleanRole.includes('boarding')) {
    return '/hostel-dashboard';
  }
  if (cleanRole.includes('transport') || cleanRole.includes('driver')) {
    return '/transport-dashboard';
  }
  if (cleanRole.includes('inventory') || cleanRole.includes('store')) {
    return '/inventory-dashboard';
  }
  if (cleanRole.includes('cafeteria') || cleanRole.includes('canteen') || cleanRole.includes('kitchen')) {
    return '/cafeteria-dashboard';
  }
  if (cleanRole.includes('security') || cleanRole.includes('gate')) {
    return '/security-dashboard';
  }
  if (cleanRole.includes('hr') || cleanRole.includes('human')) {
    return '/hr-dashboard';
  }
  if (cleanRole.includes('exam') || cleanRole.includes('assessment')) {
    return '/exam-dashboard';
  }
  if (cleanRole.includes('counselor') || cleanRole.includes('guidance')) {
    return '/counselor-dashboard';
  }
  if (cleanRole.includes('extracurricular') || cleanRole.includes('club') || cleanRole.includes('sports')) {
    return '/extracurricular-dashboard';
  }
  if (cleanRole.includes('alumni')) {
    return '/alumni-dashboard';
  }
  if (cleanRole.includes('reception') || cleanRole.includes('front') || cleanRole.includes('desk')) {
    return '/reception-dashboard';
  }
  return '/dashboard';
}
