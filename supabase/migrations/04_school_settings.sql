CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year INT NOT NULL,
  promotions_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Insert initial record for 2024
INSERT INTO school_settings (academic_year, promotions_completed) VALUES (2024, FALSE);