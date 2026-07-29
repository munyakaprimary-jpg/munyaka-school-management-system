CREATE TABLE learning_areas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  grade_band_id INTEGER NOT NULL REFERENCES grade_bands(id) ON DELETE CASCADE
);

INSERT INTO learning_areas (name, grade_band_id) VALUES
  -- Lower Primary (1-3)
  ('Mathematical Activities', 1),
  ('Language Activities', 1),
  ('Environmental Activities', 1),
  ('Psychomotor and Creative Activities', 1),
  ('Religious Education Activities', 1),
  -- Upper Primary (4-6)
  ('Mathematics', 2),
  ('English', 2),
  ('Kiswahili', 2),
  ('Science and Technology', 2),
  ('Agriculture and Nutrition', 2),
  ('Creative Arts', 2),
  ('Social Studies', 2),
  -- Junior School (7-9)
  ('Mathematics', 3),
  ('English', 3),
  ('Kiswahili', 3),
  ('Integrated Science', 3),
  ('Health Education', 3),
  ('Pre-Technical Studies', 3),
  ('Social Studies', 3),
  ('Agriculture', 3),
  ('Business Studies', 3),
  ('Computer Science', 3);