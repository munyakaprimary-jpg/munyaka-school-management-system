-- Enable Row Level Security
ALTER TABLE school_records ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read for authenticated users" 
ON school_records FOR SELECT 
TO authenticated 
USING (true);

-- Allow modifications ONLY if the user's role is admin
CREATE POLICY "Allow mutations for admins only" 
ON school_records FOR ALL 
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'admin' 
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);