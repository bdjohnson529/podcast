-- Migration: drop feeds.user_id and switch to topic-based ownership/uniqueness
-- Generated at 2025-08-11T12:34:03Z

BEGIN;

-- 1) Drop trigger and helper function that referenced feeds.user_id
DROP TRIGGER IF EXISTS trg_feeds_sync_user_from_topic ON public.feeds;
DROP FUNCTION IF EXISTS public.feeds_sync_user_from_topic();

-- 2) Replace per-user unique constraint with per-topic unique constraint
-- Drop old unique index that used (user_id, feed_url)
DROP INDEX IF EXISTS feeds_user_feed_url_uniq;
-- Create new unique index per topic (still partial to allow NULL feed_url)
CREATE UNIQUE INDEX IF NOT EXISTS feeds_topic_feed_url_uniq
  ON public.feeds (topic_id, feed_url)
  WHERE feed_url IS NOT NULL;

-- 3) Drop old user_id index
DROP INDEX IF EXISTS feeds_user_id_idx;

-- 4) Update RLS policies on feeds to authorize via topics.user_id
-- Ensure RLS remains enabled
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Feeds select own" ON public.feeds;
DROP POLICY IF EXISTS "Feeds insert own" ON public.feeds;
DROP POLICY IF EXISTS "Feeds update own" ON public.feeds;
DROP POLICY IF EXISTS "Feeds delete own" ON public.feeds;

-- Recreate policies using topic ownership
-- Note: Feeds must belong to a topic the user owns to be visible/mutable/creatable
CREATE POLICY "Feeds select via topic ownership"
  ON public.feeds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Feeds insert via topic ownership"
  ON public.feeds FOR INSERT
  WITH CHECK (
    topic_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Feeds update via topic ownership"
  ON public.feeds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    topic_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Feeds delete via topic ownership"
  ON public.feeds FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND t.user_id = auth.uid()
    )
  );

-- 5) Finally, drop the user_id column from feeds
ALTER TABLE public.feeds
  DROP COLUMN IF EXISTS user_id;

COMMIT;

