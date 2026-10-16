export function getNormalizedStaffRole(userOrStaff: any): string {
  if (!userOrStaff) return 'STAFF';
  
  const rawRole = (
    userOrStaff.role || 
    userOrStaff.designation || 
    userOrStaff.category || 
    userOrStaff.department || 
    ''
  ).toLowerCase().trim();

  if (rawRole.includes('ict') || rawRole.includes('computer')) return 'ICT';
  if (rawRole.includes('dhoi')) return 'DHOI';
  if (rawRole.includes('hoi')) return 'HOI';
  if (rawRole.includes('accountant') || rawRole.includes('bursar')) return 'ACCOUNTANT';
  if (rawRole.includes('secretary') || rawRole.includes('clerk')) return 'SECRETARY';
  if (rawRole.includes('admin')) return 'ADMIN';
  if (rawRole.includes('teacher')) return 'TEACHER';

  return rawRole.toUpperCase() || 'STAFF';
}

export function getFormattedRoleLabel(userOrStaff: any): string {
  const roleKey = getNormalizedStaffRole(userOrStaff);
  const labels: Record<string, string> = {
    ICT: 'ICT Teacher / Systems Admin',
    HOI: 'Head of Institution',
    DHOI: 'Deputy Head of Institution',
    ACCOUNTANT: 'Accountant / Bursar',
    SECRETARY: 'Institutional Secretary',
    ADMIN: 'Administrator',
    TEACHER: 'Subject / Class Teacher',
  };

  return labels[roleKey] || userOrStaff?.role || 'Staff Member';
}
