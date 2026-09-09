/**
 * Shared staff text formatting and transformation utilities.
 * Ensures strict Title Case formatting for names, roles, departments, and titles
 * across both the Staff Directory and System Access Master.
 */

export const toTitleCase = (str: string | null | undefined): string => {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (!trimmed) return '';

  // If already all caps or mixed, format nicely in Title Case
  // Handle special acronyms if needed or keep standard capitalize per word
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      // Capitalize first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const toRoleTitleCase = (roleOrTitle: string | null | undefined): string => {
  if (!roleOrTitle) return 'Staff';
  const clean = String(roleOrTitle).trim().toLowerCase();

  // Normalize common database role codes/names
  const roleMap: Record<string, string> = {
    'admin': 'Administrator',
    'administrator': 'Administrator',
    'head_teacher': 'Head Teacher',
    'headteacher': 'Head Teacher',
    'deputy_head': 'Deputy Head Teacher',
    'deputy_head_teacher': 'Deputy Head Teacher',
    'teacher': 'Teacher',
    'subject_teacher': 'Subject Teacher',
    'librarian': 'Librarian',
    'accountant': 'Accountant',
    'nurse': 'School Nurse',
    'support_staff': 'Support Staff',
    'security': 'Security Personnel',
    'ict_patrol': 'ICT Officer',
    'ict_officer': 'ICT Officer',
    'boc': 'Board of Management',
  };

  if (roleMap[clean]) {
    return roleMap[clean];
  }

  // Fallback to title case for any custom role or title
  return toTitleCase(clean.replace(/[_-]/g, ' '));
};
