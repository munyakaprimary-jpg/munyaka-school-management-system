import { getPermissionsMatrix, getDefaultLandingPage } from './permissionMatrix';

export function getRoleLandingPage(role: string, customPermissions?: Record<string, boolean>, staffMember?: { title?: string; category?: string; assignedClass?: string }): string {
  const normRole = String(role || '').trim().toUpperCase();
  const title = String(staffMember?.title || staffMember?.category || '').trim().toLowerCase();

  // Check specialized staff titles / roles first
  if (title.includes('library') || title.includes('librarian')) {
    return '/library';
  }
  if (title.includes('ict') || title.includes('computer')) {
    return '/inventory';
  }
  if (title.includes('bursar') || title.includes('accountant')) {
    return '/fees';
  }
  // Staff always land on dashboard; assignedClass no longer redirects to /portal
    if (normRole === 'STAFF' || normRole === 'STAFF_MEMBER') {
      return '/dashboard';
    }
    if (staffMember?.assignedClass) {
      // Fallback only for non-staff roles that still have assignedClass
      return '/dashboard';
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
