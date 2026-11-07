import { getPermissionsMatrix, getDefaultLandingPage } from './permissionMatrix';

export function getRoleLandingPage(role: string, customPermissions?: Record<string, boolean>, staffMember?: { title?: string; category?: string; assignedClass?: string; role?: string }): string {
  const normRole = String(role || staffMember?.role || '').trim();
  const lowerRole = normRole.toLowerCase();
  const title = String(staffMember?.title || staffMember?.category || '').trim().toLowerCase();

  // Route based on assigned role / title
  if (lowerRole.includes('bursar') || title.includes('bursar') || title.includes('accountant')) {
    return '/fees';
  }
  if (lowerRole.includes('ict') || lowerRole.includes('lab') || title.includes('ict') || title.includes('computer') || title.includes('lab')) {
    return '/server';
  }
  if (lowerRole.includes('store') || title.includes('store')) {
    return '/payments';
  }
  if (lowerRole.includes('library') || title.includes('library') || title.includes('librarian')) {
    return '/library';
  }
  if (lowerRole.includes('hoi') || lowerRole.includes('dhoi') || title.includes('hoi') || title.includes('head')) {
    return '/dashboard';
  }
  if (lowerRole.includes('teacher') || lowerRole.includes('staff') || normRole === 'Class Teacher') {
    return '/roll-call';
  }

  // Check specialized staff titles / roles first
  if (title.includes('library') || title.includes('librarian')) {
    return '/library';
  }
  if (title.includes('ict') || title.includes('computer') || title.includes('lab')) {
    return '/server';
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

  return getDefaultLandingPage(normRole.toUpperCase());
}
