-- Migration: create feeds table for user-specific podcast feeds
-- Generated at 2025-08-10T15:06:20Z

-- Create table
CREATE TABLE IF NOT EXISTS public.feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS feeds_user_id_idx ON public.feeds(user_id);
CREATE INDEX IF NOT EXISTS feeds_created_at_idx ON public.feeds(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent)
DROP POLICY IF EXISTS "Feeds select own" ON public.feeds;
CREATE POLICY "Feeds select own"
  ON public.feeds FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Feeds insert own" ON public.feeds;
CREATE POLICY "Feeds insert own"
  ON public.feeds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Feeds update own" ON public.feeds;
CREATE POLICY "Feeds update own"
  ON public.feeds FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Feeds delete own" ON public.feeds;
CREATE POLICY "Feeds delete own"
  ON public.feeds FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to set updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feeds_updated_at ON public.feeds;
CREATE TRIGGER trg_feeds_updated_at
  BEFORE UPDATE ON public.feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

