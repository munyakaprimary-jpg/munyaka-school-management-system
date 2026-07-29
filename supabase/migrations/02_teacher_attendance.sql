CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS teacher_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  early_departure_reason TEXT,
  verified_lat FLOAT,
  verified_lng FLOAT,
  CONSTRAINT teacher_daily_unique UNIQUE (teacher_id, date)
);

COMMENT ON TABLE teacher_attendance IS 'Stores daily attendance records for teachers with geofence verification';