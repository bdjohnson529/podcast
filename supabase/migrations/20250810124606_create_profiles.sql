-- Migration: create profiles table to store user configuration fields
-- Generated at 2025-08-10T12:46:06Z

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT,
  role TEXT,
  specialization TEXT,
  goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure idempotency
DROP POLICY IF EXISTS "Profiles select own row" ON public.profiles;
CREATE POLICY "Profiles select own row"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles insert own row" ON public.profiles;
CREATE POLICY "Profiles insert own row"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles update own row" ON public.profiles;
CREATE POLICY "Profiles update own row"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to set updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep updated_at current
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Optional backfill: uncomment to create a blank profile row for each existing auth user
-- INSERT INTO public.profiles(id)
-- SELECT id FROM auth.users
-- ON CONFLICT DO NOTHING;

-- Down migration (for reference):
-- DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
-- DROP FUNCTION IF EXISTS public.set_updated_at;
-- DROP POLICY IF EXISTS "Profiles select own row" ON public.profiles;
-- DROP POLICY IF EXISTS "Profiles insert own row" ON public.profiles;
-- DROP POLICY IF EXISTS "Profiles update own row" ON public.profiles;
-- DROP TABLE IF EXISTS public.profiles;

