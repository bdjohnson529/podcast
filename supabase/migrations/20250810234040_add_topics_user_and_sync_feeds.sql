-- Migration: add user ownership to topics and enforce consistency with feeds
-- Generated at 2025-08-10T23:40:40Z

BEGIN;

-- 1) Ensure topics has user ownership
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add FK if not present and make NOT NULL
DO $$
BEGIN
  -- Add FK if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'topics_user_id_fkey' AND t.relname = 'topics'
  ) THEN
    ALTER TABLE public.topics
      ADD CONSTRAINT topics_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  -- Make NOT NULL if any rows are NULL-free; otherwise leave nullable for backfill
  IF NOT EXISTS (SELECT 1 FROM public.topics WHERE user_id IS NULL) THEN
    ALTER TABLE public.topics ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS topics_user_id_idx ON public.topics(user_id);

-- 2) Enable RLS and per-user policies on topics (idempotent)
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Topics select own" ON public.topics;
CREATE POLICY "Topics select own"
  ON public.topics FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Topics insert own" ON public.topics;
CREATE POLICY "Topics insert own"
  ON public.topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Topics update own" ON public.topics;
CREATE POLICY "Topics update own"
  ON public.topics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Topics delete own" ON public.topics;
CREATE POLICY "Topics delete own"
  ON public.topics FOR DELETE
  USING (auth.uid() = user_id);

-- 3) Keep feeds.user_id for now but enforce that topic_id (if provided) belongs to same user
-- Update feeds policies to restrict topic_id assignment to user's own topics
DROP POLICY IF EXISTS "Feeds insert own" ON public.feeds;
CREATE POLICY "Feeds insert own"
  ON public.feeds FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      topic_id IS NULL OR EXISTS (
        SELECT 1 FROM public.topics t
        WHERE t.id = topic_id AND t.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Feeds update own" ON public.feeds;
CREATE POLICY "Feeds update own"
  ON public.feeds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      topic_id IS NULL OR EXISTS (
        SELECT 1 FROM public.topics t
        WHERE t.id = topic_id AND t.user_id = auth.uid()
      )
    )
  );

-- 4) Trigger to synchronize feeds.user_id from topics when topic_id is set/changed
CREATE OR REPLACE FUNCTION public.feeds_sync_user_from_topic()
RETURNS TRIGGER AS $$
DECLARE
  t_user UUID;
BEGIN
  IF NEW.topic_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO t_user FROM public.topics WHERE id = NEW.topic_id;

  IF t_user IS NULL THEN
    RAISE EXCEPTION 'Topic % not found when assigning to feed %', NEW.topic_id, NEW.id;
  END IF;

  -- If user_id provided and mismatches the topic owner, block
  IF NEW.user_id IS NOT NULL AND NEW.user_id <> t_user THEN
    RAISE EXCEPTION 'Feed user_id (%) must match topic owner (%)', NEW.user_id, t_user;
  END IF;

  NEW.user_id := t_user;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feeds_sync_user_from_topic ON public.feeds;
CREATE TRIGGER trg_feeds_sync_user_from_topic
  BEFORE INSERT OR UPDATE OF topic_id ON public.feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.feeds_sync_user_from_topic();

COMMIT;

