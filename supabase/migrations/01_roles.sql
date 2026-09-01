-- Role Definitions for Munyaka School Management System
-- Cleaned up: SUPERADMIN is the platform owner tier with full access including platform billing,
-- global system settings, user account creation, and multi-school metrics.
-- ADMIN is the school manager tier with operational dashboard, student transfers,
-- active rosters, attendance tracking, and recent activity alerts.

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read role definitions
CREATE POLICY "Allow authenticated read roles"
    ON public.roles FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- PERMISSION MODULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.permission_modules (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.permission_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read permission_modules"
    ON public.permission_modules FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- ROLE PERMISSIONS TABLE (RBAC matrix)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id SERIAL PRIMARY KEY,
    role_slug TEXT NOT NULL REFERENCES public.roles(slug) ON DELETE CASCADE,
    module_slug TEXT NOT NULL REFERENCES public.permission_modules(slug) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    UNIQUE(role_slug, module_slug)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read role_permissions"
    ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin write role_permissions"
    ON public.role_permissions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- INSERT ROLE DEFINITIONS
-- ============================================================================
INSERT INTO roles (id, name, slug, description) VALUES
(0, 'Super Admin', 'super_admin', 'Platform Owner tier. Platform billing, global system settings, user account creation, and multi-school metrics.'),
(1, 'School Manager / Admin', 'admin', 'Operational dashboard, student transfers, active rosters, attendance tracking, and recent activity alerts.'),
(2, 'Head Teacher', 'head_teacher', 'Manages academic structures, staff reports, and overall school administration.'),
(3, 'Teacher', 'teacher', 'Manages class attendance, grades, subjects, and student performance.'),
(4, 'Bursar / Accountant', 'bursar', 'Handles daily student fee payments, invoicing, financial reports, and expense tracking.'),
(5, 'Parent / Guardian', 'parent', 'Views child academic progress, fee statements, and school announcements.'),
(6, 'Student', 'student', 'Views personal timetables, grades, and assignments.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description;

-- ============================================================================
-- INSERT PERMISSION MODULES
-- ============================================================================
INSERT INTO permission_modules (id, name, slug, description) VALUES
(1, 'System Configuration & Security', 'sys_config', 'RBAC, Audit Logs, System Backups'),
(2, 'Academic & CBC Grading Setup', 'academic_grading', 'Assessments, Report Cards, Grade Bounds'),
(3, 'Student & Guardian Records', 'student_records', 'Enrollment, Bio Data, Attendance'),
(4, 'Fee Management & Finance', 'finance_fees', 'Billing, Invoices, Daily Student Fee Collections'),
(5, 'Platform Billing & Subscriptions', 'payment_subscriptions', 'Platform billing, global system settings, user account creation, and multi-school metrics'),
(6, 'Staff Management & Geofence', 'staff_mgmt', 'Staff Profiles, Compound GPS Tracking')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- ============================================================================
-- INSERT DEFAULT RBAC PERMISSIONS
-- ============================================================================
INSERT INTO role_permissions (role_slug, module_slug, can_read, can_create, can_update, can_delete) VALUES
-- Super Admin: full access on all modules including platform billing & multi-school metrics
('super_admin', 'sys_config', TRUE, TRUE, TRUE, TRUE),
('super_admin', 'academic_grading', TRUE, TRUE, TRUE, TRUE),
('super_admin', 'student_records', TRUE, TRUE, TRUE, TRUE),
('super_admin', 'finance_fees', TRUE, TRUE, TRUE, TRUE),
('super_admin', 'payment_subscriptions', TRUE, TRUE, TRUE, TRUE),
('super_admin', 'staff_mgmt', TRUE, TRUE, TRUE, TRUE),
-- Admin (School Manager): operational dashboard, student transfers, active rosters, attendance tracking, and recent activity alerts
('admin', 'sys_config', TRUE, FALSE, TRUE, FALSE),
('admin', 'academic_grading', TRUE, TRUE, TRUE, TRUE),
('admin', 'student_records', TRUE, TRUE, TRUE, TRUE),
('admin', 'finance_fees', TRUE, TRUE, TRUE, FALSE),
('admin', 'payment_subscriptions', FALSE, FALSE, FALSE, FALSE),
('admin', 'staff_mgmt', TRUE, TRUE, TRUE, FALSE),
-- Head Teacher: all except payment_subscriptions
('head_teacher', 'sys_config', TRUE, TRUE, TRUE, FALSE),
('head_teacher', 'academic_grading', TRUE, TRUE, TRUE, FALSE),
('head_teacher', 'student_records', TRUE, TRUE, TRUE, FALSE),
('head_teacher', 'finance_fees', TRUE, TRUE, TRUE, FALSE),
('head_teacher', 'payment_subscriptions', FALSE, FALSE, FALSE, FALSE),
('head_teacher', 'staff_mgmt', TRUE, TRUE, TRUE, FALSE)
ON CONFLICT (role_slug, module_slug) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete;
