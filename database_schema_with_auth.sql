-- Update database schema to allow anonymous users temporarily
-- Run this in your Supabase SQL editor

-- First, make sure the episodes table exists with the updated schema
CREATE TABLE IF NOT EXISTS episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  familiarity TEXT NOT NULL CHECK (familiarity IN ('new', 'some', 'expert')),
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own episodes" ON episodes;
DROP POLICY IF EXISTS "Users can insert own episodes" ON episodes;
DROP POLICY IF EXISTS "Users can update own episodes" ON episodes;
DROP POLICY IF EXISTS "Users can delete own episodes" ON episodes;
DROP POLICY IF EXISTS "Allow anonymous episode creation" ON episodes;

-- New policies that allow both authenticated and anonymous users
-- Allow authenticated users to view their own episodes
CREATE POLICY "Authenticated users can view own episodes" ON episodes
  FOR SELECT USING (auth.uid() = user_id);

-- Allow anonymous users to view episodes without user_id
CREATE POLICY "Anonymous users can view public episodes" ON episodes
  FOR SELECT USING (user_id IS NULL);

-- Allow authenticated users to insert their own episodes
CREATE POLICY "Authenticated users can insert own episodes" ON episodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert episodes
CREATE POLICY "Anonymous users can insert episodes" ON episodes
  FOR INSERT WITH CHECK (user_id IS NULL);

-- Allow authenticated users to update their own episodes
CREATE POLICY "Authenticated users can update own episodes" ON episodes
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own episodes
CREATE POLICY "Authenticated users can delete own episodes" ON episodes
  FOR DELETE USING (auth.uid() = user_id);

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

-- Create or update the episode_summaries view
CREATE OR REPLACE VIEW episode_summaries AS
SELECT 
  id,
  topic,
  familiarity,
  duration,
  script->>'title' as title,
  script->>'estimatedDuration' as estimated_duration,
  CASE WHEN audio_url IS NOT NULL THEN true ELSE false END as has_audio,
  user_id,
  created_at
FROM episodes
ORDER BY created_at DESC;
