import { getPermissionsMatrix, getDefaultLandingPage } from './permissionMatrix';

export function getRoleLandingPage(role: string, customPermissions?: Record<string, boolean>): string {
  const normRole = String(role || '').trim().toUpperCase();

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

  // Check stored matrix for role
  try {
    const matrix = getPermissionsMatrix();
    const roleMatrix = matrix[normRole];
    if (roleMatrix) {
      if (roleMatrix.dashboard) return '/dashboard';
      if (roleMatrix.assessments) return '/assessments';
      if (roleMatrix.fees) return '/fees';
      if (roleMatrix.learners) return '/learners';
      if (roleMatrix.inventory) return '/inventory';
      if (roleMatrix.library) return '/library';
      if (roleMatrix.communication) return '/communication';
      if (roleMatrix.settings) return '/settings';
    }
  } catch (err) {
    console.error('Error reading permission matrix for landing page:', err);
  }

  return getDefaultLandingPage(normRole);
}
