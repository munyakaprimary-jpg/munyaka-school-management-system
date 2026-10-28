import { getPermissionsMatrix, getDefaultLandingPage } from './permissionMatrix';

export function getRoleLandingPage(role: string, customPermissions?: Record<string, boolean>, staffMember?: { title?: string; category?: string; assignedClass?: string; role?: string }): string {
  const normRole = String(role || '').trim().toUpperCase();
  const title = String(staffMember?.title || staffMember?.category || staffMember?.role || '').trim().toLowerCase();
  const assignedClass = String(staffMember?.assignedClass || '').trim();

  // Check specialized staff titles / roles / workstations first
  if (title.includes('library') || title.includes('librarian')) {
    return '/library';
  }
  if (title.includes('ict') || title.includes('computer') || normRole.includes('ICT')) {
    return '/inventory';
  }
  if (title.includes('bursar') || title.includes('accountant') || normRole.includes('ACCOUNTANT')) {
    return '/fees';
  }
  if (assignedClass || title.includes('class teacher') || normRole.includes('TEACHER')) {
    // If they have an assigned classroom or are a teacher, route to assessments/classroom portal or assessments
    return assignedClass ? '/assessments' : '/assessments';
  }

  if (customPermissions) {
    const modules = [
      { key: 'dashboard', path: '/dashboard' },
      { key: 'assessments', path: '/assessments' },
      { key: 'fees', path: '/fees' },
      { key: 'learners', path: '/learners' },
      { key: 'inventory', path: '/inventory' },
      { key: 'library', path: '/library' },
      { key: 'communication', path: '/communication' },
      { key: 'settings', path: '/settings' },
    ];

    for (const mod of modules) {
      if (customPermissions[mod.key]) {
        return mod.path;
      }
    }
  }

  return getDefaultLandingPage(normRole);
}
