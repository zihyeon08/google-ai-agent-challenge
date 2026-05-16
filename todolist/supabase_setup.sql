-- Create the todos table
CREATE TABLE todos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  task text NOT NULL,
  difficulty text NOT NULL,
  is_completed boolean DEFAULT false NOT NULL
);

-- Optional: Enable Row Level Security (RLS) if needed
-- ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow anonymous read/write" ON todos FOR ALL USING (true);
