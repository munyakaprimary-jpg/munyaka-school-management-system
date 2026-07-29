ALTER TABLE students ADD COLUMN IF NOT EXISTS grade_band_id INTEGER REFERENCES grade_bands(id);

CREATE OR REPLACE FUNCTION assign_grade_band()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_grade IS NOT NULL THEN
    SELECT id INTO NEW.grade_band_id FROM grade_bands
    WHERE NEW.current_grade >= 
      CASE WHEN grade_range LIKE '1-%' THEN 1
           WHEN grade_range LIKE '4-%' THEN 4
           WHEN grade_range LIKE '7-%' THEN 7 END
      AND NEW.current_grade <= 
      CASE WHEN grade_range LIKE '1-%' THEN 3
           WHEN grade_range LIKE '4-%' THEN 6
           WHEN grade_range LIKE '7-%' THEN 9;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_grade_band
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION assign_grade_band();