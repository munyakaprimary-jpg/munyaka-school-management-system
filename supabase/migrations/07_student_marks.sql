CREATE TABLE student_marks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  learning_area_id INTEGER NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
  score NUMERIC,
  performance_level TEXT
);