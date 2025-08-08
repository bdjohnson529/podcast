-- Migration to add duration field to episodes table
-- Run this after the main schema is created

-- Add the duration column with a default value
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 8 
CHECK (duration >= 1 AND duration <= 15);

-- Add a comment for documentation
COMMENT ON COLUMN episodes.duration IS 'Target podcast duration in minutes (1-15)';

-- Update the episode_summaries view to include duration
CREATE OR REPLACE VIEW episode_summaries AS
SELECT 
  id,
  topic,
  familiarity,
  duration,
  industries,
  script->>'title' as title,
  script->>'estimatedDuration' as estimated_duration,
  CASE WHEN audio_url IS NOT NULL THEN true ELSE false END as has_audio,
  created_at
FROM episodes
ORDER BY created_at DESC;
