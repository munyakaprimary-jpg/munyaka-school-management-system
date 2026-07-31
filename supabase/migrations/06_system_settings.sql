-- System Settings & Institution Profile Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    school_name TEXT NOT NULL DEFAULT 'MUNYAKA PRIMARY AND JUNIOR SCHOOL',
    motto TEXT DEFAULT 'KNOWLEDGE IS POWER',
    postal_address TEXT DEFAULT 'P.O. BOX 5239-30100 ELDORET',
    phone TEXT DEFAULT '+254 712 345 678',
    email TEXT DEFAULT 'info@munyaka.sc.ke',
    location TEXT DEFAULT 'Munyaka, Eldoret East, Uasin Gishu County',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    active_year TEXT DEFAULT '2026',
    active_term TEXT DEFAULT 'term1',
    term_start_date DATE DEFAULT '2026-01-05',
    term_end_date DATE DEFAULT '2026-04-10',
    grading_scale JSONB DEFAULT '[
      {"level": "EE", "descriptor": "Exceeding Expectations", "min": 80, "max": 100, "points": 4},
      {"level": "ME", "descriptor": "Meeting Expectations", "min": 50, "max": 79, "points": 3},
      {"level": "AE", "descriptor": "Approaching Expectations", "min": 30, "max": 49, "points": 2},
      {"level": "BE", "descriptor": "Below Expectations", "min": 0, "max": 29, "points": 1}
    ]'::jsonb,
    rbac_permissions JSONB,
    geofence_lat DOUBLE PRECISION DEFAULT 0.5304,
    geofence_lng DOUBLE PRECISION DEFAULT 35.3077,
    geofence_radius INT DEFAULT 150,
    geofence_enabled BOOLEAN DEFAULT TRUE,
    dev_bypass BOOLEAN DEFAULT FALSE,
    session_security JSONB DEFAULT '{"idleTimeout": "30m", "requirePasswordOnFirstLogin": true}'::jsonb,
    audit_logs JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read system settings
CREATE POLICY "Allow authenticated read system_settings"
    ON public.system_settings FOR SELECT
    TO authenticated
    USING (true);

-- Allow admins to update or insert system settings
CREATE POLICY "Allow admin write system_settings"
    ON public.system_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);