-- Migration: add feed_url and site_url to feeds table, plus uniqueness per user
-- Generated at 2025-08-10T23:21:04Z

ALTER TABLE public.feeds
  ADD COLUMN IF NOT EXISTS feed_url TEXT,
  ADD COLUMN IF NOT EXISTS site_url TEXT;

-- Backfill note: existing rows will have NULL feed_url/site_url; new inserts can set them.

-- Add a partial unique index to prevent duplicate feed_url per user when feed_url is provided
-- Use COALESCE to allow multiple NULLs but enforce uniqueness when not null
DROP INDEX IF EXISTS feeds_user_feed_url_uniq;
CREATE UNIQUE INDEX feeds_user_feed_url_uniq
  ON public.feeds (user_id, feed_url)
  WHERE feed_url IS NOT NULL;

-- Optional indexes to speed up lookups
CREATE INDEX IF NOT EXISTS feeds_feed_url_idx ON public.feeds (feed_url) WHERE feed_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS feeds_site_url_idx ON public.feeds (site_url) WHERE site_url IS NOT NULL;

