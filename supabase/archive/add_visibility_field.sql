-- Add visibility field to episodes table
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public'));

-- Index for performance
CREATE INDEX IF NOT EXISTS episodes_visibility_idx ON episodes(visibility);

-- Update RLS policies to allow public episodes to be readable by anyone
CREATE POLICY "Anyone can view public episodes" ON episodes
  FOR SELECT USING (visibility = 'public');

-- Update the episode_summaries view to include visibility
CREATE OR REPLACE VIEW episode_summaries AS
SELECT 
  id,
  user_id,
  topic,
  familiarity,
  duration,
  script->>'title' as title,
  script->>'estimatedDuration' as estimated_duration,
  CASE WHEN audio_url IS NOT NULL THEN true ELSE false END as has_audio,
  visibility,
  created_at,
  updated_at
FROM episodes
ORDER BY created_at DESC;
