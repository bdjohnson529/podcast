-- Migration: create topics table and map feeds to topics via foreign key
-- Generated at 2025-08-10T23:38:27Z

BEGIN;

-- Create topics table
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT
);

-- Add topic_id to feeds and set up foreign key
ALTER TABLE public.feeds
  ADD COLUMN IF NOT EXISTS topic_id UUID;

-- Create the foreign key (idempotent-friendly)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'feeds_topic_id_fkey'
      AND t.relname = 'feeds'
  ) THEN
    ALTER TABLE public.feeds
      ADD CONSTRAINT feeds_topic_id_fkey
      FOREIGN KEY (topic_id)
      REFERENCES public.topics(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Index for faster lookups by topic
CREATE INDEX IF NOT EXISTS feeds_topic_id_idx ON public.feeds(topic_id);

COMMIT;

