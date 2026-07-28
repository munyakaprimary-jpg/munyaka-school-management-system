-- Role Definitions for Munyaka School Management System
INSERT INTO roles (id, name, slug, description) VALUES
(1, 'Super Admin', 'super_admin', 'Full access to all system settings, configuration, and user management.'),
(2, 'Head Teacher', 'head_teacher', 'Manages academic structures, staff reports, and overall school administration.'),
(3, 'Teacher', 'teacher', 'Manages class attendance, grades, subjects, and student performance.'),
(4, 'Bursar / Accountant', 'bursar', 'Handles fee payments, invoicing, financial reports, and expense tracking.'),
(5, 'Parent / Guardian', 'parent', 'Views child academic progress, fee statements, and school announcements.'),
(6, 'Student', 'student', 'Views personal timetables, grades, and assignments.');