/**
 * Landing Page Mapping Utility
 * Determines the correct default dashboard/landing route for each user role.
 */

export function getRoleLandingPage(role: string | undefined | null): string {
  const norm = String(role || '').trim().toLowerCase();
  
  if (norm === 'platform_owner' || norm === 'owner' || norm === 'super_admin' || norm === 'superadmin') {
    return '/jamlyan-analytics';
  }
  
  if (norm === 'admin' || norm === 'school_admin' || norm === 'administrator' || norm === 'hoi' || norm === 'dhoi') {
    return '/dashboard';
  }
  
  if (norm === 'bursar' || norm === 'accountant' || norm === 'finance') {
    return '/fees';
  }
  
  if (norm === 'librarian' || norm === 'library_teacher') {
    return '/library';
  }
  
  if (norm.includes('ict') || norm.includes('tech')) {
    return '/ict';
  }
  
  if (norm === 'student' || norm === 'learner' || norm === 'pupil') {
    return '/student-assessment';
  }
  
  return '/dashboard';
}
