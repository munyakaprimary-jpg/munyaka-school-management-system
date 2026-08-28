-- Migration 007: User Roles, Schools, and Monthly Access Codes
-- Creates a 5-tier role system with school management and strictly-timed monthly codes

-- 1. Create ENUM types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'teacher', 'bursar', 'librarian', 'storekeeper');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'expired', 'unpaid');

-- 2. Schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  subscription_status subscription_status_enum DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Monthly codes table
CREATE TABLE IF NOT EXISTS monthly_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  month_year VARCHAR(20) NOT NULL, -- format: 'MM-YYYY' e.g. '08-2026'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL -- strictly 11:59:59.999 PM on last day of month
);

-- 4. Extend auth.users with role, school reference, and access tracking
-- This uses the auth.users table. If your app uses a separate profiles table,
-- add these columns there instead.
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'teacher';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS access_valid_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_codes_school ON monthly_codes(school_id);
CREATE INDEX IF NOT EXISTS idx_monthly_codes_code ON monthly_codes(code);
CREATE INDEX IF NOT EXISTS idx_monthly_codes_expires ON monthly_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);
CREATE INDEX IF NOT EXISTS idx_users_school ON auth.users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_access_valid ON auth.users(access_valid_until);

-- 6. Seed default schools
INSERT INTO schools (id, school_name, contact_email, subscription_status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Munyaka Primary & Junior Secondary School', 'munyakaprimary@gmail.com', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'Eldoret West Academy', 'westacademy@gmail.com', 'unpaid')
ON CONFLICT DO NOTHING;

-- 7. Seed default owner account
-- Note: In Supabase, you should create this user via the dashboard or auth.admin.createUser()
-- This is a reference/placeholder for the migration:
-- INSERT INTO auth.users (id, email, role, school_id, access_valid_until, is_active) VALUES
--   ('00000000-0000-0000-0000-000000000100', 'owner@munyaka.ac.ke', 'owner', '00000000-0000-0000-0000-000000000001', NOW() + INTERVAL '1 year', TRUE);

-- 8. Function to validate a monthly code and activate user access
CREATE OR REPLACE FUNCTION validate_monthly_code_and_activate(p_code VARCHAR, p_email VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code RECORD;
  v_user RECORD;
  v_expiry TIMESTAMPTZ;
BEGIN
  -- Find the code
  SELECT * INTO v_code FROM monthly_codes
  WHERE UPPER(code) = UPPER(p_code)
  AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired monthly access code.');
  END IF;

  -- Find the user
  SELECT * INTO v_user FROM auth.users
  WHERE email = LOWER(p_email);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'User account not found for this email.');
  END IF;

  -- Activate user
  v_expiry := v_code.expires_at;
  UPDATE auth.users
  SET school_id = v_code.school_id,
      access_valid_until = v_expiry,
      updated_at = NOW()
  WHERE email = LOWER(p_email);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Access successfully activated until ' || TO_CHAR(v_expiry, 'FMMonth DD, YYYY') || ' at 11:59 PM!',
    'valid_until', v_expiry
  );
END;
$$;

-- 9. Function to auto-expire old codes
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Codes past their expiry are naturally filtered in queries using NOW()
  -- This function is here for manual cleanup if needed
  DELETE FROM monthly_codes WHERE expires_at < NOW() - INTERVAL '2 months';
END;
$$;

COMMENT ON TABLE schools IS 'Multi-tenant school accounts with subscription status';
COMMENT ON TABLE monthly_codes IS 'Monthly access codes — each expires at 11:59:59.999 PM on the last calendar day of month_year';
COMMENT ON COLUMN auth.users.role IS 'User role: owner (super-admin), admin (school-admin), teacher, bursar, librarian, storekeeper';
COMMENT ON COLUMN auth.users.school_id IS 'Reference to the school this user belongs to';
COMMENT ON COLUMN auth.users.access_valid_until IS 'ISO timestamp when individual user access expires (owner/admin exempt)';
