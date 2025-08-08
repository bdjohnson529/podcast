-- Add visibility field to episodes table
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public'));

-- Index for performance
CREATE INDEX IF NOT EXISTS episodes_visibility_idx ON episodes(visibility);

-- Update RLS policies to allow public episodes to be readable by anyone
DROP POLICY IF EXISTS "Anyone can view public episodes" ON episodes;
CREATE POLICY "Anyone can view public episodes" ON episodes
  FOR SELECT USING (visibility = 'public');
