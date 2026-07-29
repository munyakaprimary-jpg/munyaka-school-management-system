CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS student_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  notes TEXT,
  verified_lat FLOAT,
  verified_lng FLOAT,
  CONSTRAINT student_daily_unique UNIQUE (student_id, date)
);

-- Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_attendance(student_id);

COMMENT ON TABLE student_attendance IS 'Stores daily attendance records for students with geofence verification';