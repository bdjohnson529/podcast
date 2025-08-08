-- Check if the episodes table exists and create it if it doesn't

-- First, let's see what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Create the episodes table if it doesn't exist
CREATE TABLE IF NOT EXISTS episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  familiarity TEXT NOT NULL CHECK (familiarity IN ('new', 'some', 'expert')),
  industries TEXT[] DEFAULT '{}',
  use_case TEXT,
  duration INTEGER NOT NULL DEFAULT 8 CHECK (duration >= 1 AND duration <= 15),
  script JSONB NOT NULL,
  audio_url TEXT,
  audio_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS episodes_user_id_idx ON episodes(user_id);
CREATE INDEX IF NOT EXISTS episodes_created_at_idx ON episodes(created_at DESC);
CREATE INDEX IF NOT EXISTS episodes_topic_idx ON episodes USING GIN (to_tsvector('english', topic));

-- Row Level Security (RLS)
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own episodes" ON episodes;
DROP POLICY IF EXISTS "Users can insert own episodes" ON episodes;
DROP POLICY IF EXISTS "Users can update own episodes" ON episodes;
DROP POLICY IF EXISTS "Users can delete own episodes" ON episodes;

-- Allow anonymous users to insert episodes (since we don't have authentication yet)
CREATE POLICY "Allow anonymous episode creation" ON episodes
  FOR ALL USING (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_episodes_updated_at ON episodes;
CREATE TRIGGER update_episodes_updated_at 
  BEFORE UPDATE ON episodes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Test insert to verify everything works
INSERT INTO episodes (topic, familiarity, duration, script, industries, use_case) 
VALUES (
  'Test Topic', 
  'some', 
  5, 
  '{"title": "Test", "transcript": []}',
  ARRAY['Technology'],
  'Testing database connection'
);

-- Check if the insert worked
SELECT COUNT(*) as episode_count FROM episodes;
