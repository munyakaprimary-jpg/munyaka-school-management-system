-- Create hypothetical messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id),
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  type TEXT CHECK (type IN ('SMS', 'Email')),
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Only users with the super_admin role can view or manage messages
CREATE POLICY "Strict Admin Access for Communication"
  ON messages
  AS RESTRICTIVE
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin'
  );