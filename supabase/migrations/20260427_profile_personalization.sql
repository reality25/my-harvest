-- Harvest — profile personalization migration
-- Run once in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- All columns are nullable so existing rows keep working.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url            text,
  ADD COLUMN IF NOT EXISTS bio                   text,
  ADD COLUMN IF NOT EXISTS phone                 text,
  ADD COLUMN IF NOT EXISTS language              text         DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS farming_activities    text[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_crops         text[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS livestock_types       text[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests             text[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS farm_size             text,
  ADD COLUMN IF NOT EXISTS onboarding_completed  boolean      DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz  DEFAULT now();

-- Touch updated_at automatically
CREATE OR REPLACE FUNCTION public.profiles_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_set_updated_at();

-- Optional: storage bucket for avatars (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
