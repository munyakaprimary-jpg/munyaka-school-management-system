-- Migration for 5-tier Roles, Schools, and Monthly Codes with Strict Month-End Expiration

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'teacher', 'bursar', 'librarian', 'storekeeper');

CREATE TYPE subscription_status_enum AS ENUM ('active', 'expired', 'unpaid');

CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  subscription_status subscription_status_enum DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL UNIQUE,
  month_year VARCHAR(20) NOT NULL, -- e.g. '08-2026'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL -- strictly 11:59:59 PM on the last day of the calendar month
);

-- Extend user accounts / profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  role user_role DEFAULT 'teacher',
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  access_valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for fast lookup
CREATE INDEX IF NOT EXISTS idx_monthly_codes_school ON monthly_codes(school_id);
CREATE INDEX IF NOT EXISTS idx_monthly_codes_code ON monthly_codes(code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_school ON user_profiles(school_id);
