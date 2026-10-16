import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPermissionsMatrix } from '@/rbac/permissionMatrix';

export function getRoleLandingPage(role: string, customPermissions?: Record<string, boolean>): string {
  const normRole = String(role || '').trim().toUpperCase();

  // If custom permissions matrix is provided, check default fallback
  if (customPermissions) {
    const modules = [
      { key: 'dashboard', path: '/dashboard' },
      { key: 'assessments', path: '/assessments' },
      { key: 'fees', path: '/fees' },
      { key: 'students', path: '/learners' },
      { key: 'inventory', path: '/inventory' },
      { key: 'library', path: '/library' },
      { key: 'attendance', path: '/attendance' },
      { key: 'timetable', path: '/timetable' },
      { key: 'settings', path: '/settings' },
    ];

    for (const mod of modules) {
      if (customPermissions[mod.key] || customPermissions[`view_${mod.key}`] || customPermissions[`manage_${mod.key}`]) {
        return mod.path;
      }
    }
  }

  // 1. Post-Login Landing Page Mapping as requested:
  // - ADMIN / HOI / DHOI -> /dashboard (Full Access Overview)
  // - TEACHER -> /assessments (CBC Marks & Roll Call / Attendance)
  // - ACCOUNTANT / BURSAR -> /fees (Fees & Financial Ledgers)
  // - SECRETARY -> /learners (Student Admissions & Profiles)
  // - ICT / INVENTORY -> /inventory (ICT Lab & Hardware Inventory)
  // - DEFAULT FALLBACK -> Route to the first available module checked in their RBAC settings.
  if (normRole === 'ADMIN' || normRole === 'HOI' || normRole === 'DHOI' || normRole === 'OWNER' || normRole === 'SUPER_ADMIN') {
    return '/dashboard';
  }
  if (normRole === 'TEACHER' || normRole.includes('TEACHER')) {
    return '/assessments';
  }
  if (normRole === 'ACCOUNTANT' || normRole === 'BURSAR') {
    return '/fees';
  }
  if (normRole === 'SECRETARY' || normRole === 'CLERK') {
    return '/students';
  }
  if (normRole === 'ICT' || normRole === 'INVENTORY' || normRole.includes('ICT') || normRole.includes('STORE')) {
    return '/inventory';
  }

  // Check stored RBAC matrix for this role
  try {
    const matrix = getPermissionsMatrix();
    const roleMatrix = matrix[normRole] || matrix[normRole.toLowerCase()];
    if (roleMatrix) {
      if (roleMatrix.dashboard || roleMatrix.view_dashboard) return '/dashboard';
      if (roleMatrix.assessments || roleMatrix.enter_marks) return '/assessments';
      if (roleMatrix.fees || roleMatrix.manage_finances) return '/fees';
      if (roleMatrix.students || roleMatrix.manage_students) return '/students';
      if (roleMatrix.inventory || roleMatrix.manage_inventory) return '/inventory';
      if (roleMatrix.library) return '/library';
    }
  } catch (err) {
    console.error('Error reading permission matrix for landing page:', err);
  }

  return '/dashboard';
}

export function useRoleLandingPage(): string {
  const { user } = useAuth();
  if (!user) return '/login';
  return getRoleLandingPage(user.role);
}
