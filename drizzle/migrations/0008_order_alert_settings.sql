ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS chime_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stale_warn_minutes integer NOT NULL DEFAULT 15 CHECK (stale_warn_minutes BETWEEN 1 AND 240),
  ADD COLUMN IF NOT EXISTS prep_time_text text NOT NULL DEFAULT '10–15' CHECK (char_length(prep_time_text) <= 20);