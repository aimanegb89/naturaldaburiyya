ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS weekly_hours jsonb NOT NULL DEFAULT '{"0":[["09:00","22:00"]],"1":[["09:00","22:00"]],"2":[["09:00","22:00"]],"3":[["09:00","22:00"]],"4":[["09:00","22:00"]],"5":[["09:00","22:00"]],"6":[["09:00","22:00"]]}'::jsonb,
  ADD COLUMN IF NOT EXISTS date_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS manual_mode text NOT NULL DEFAULT 'auto';

ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_manual_mode_chk CHECK (manual_mode IN ('auto','open','closed'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS locale text;

CREATE TABLE public.order_push_tokens (
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, token)
);
GRANT ALL ON public.order_push_tokens TO service_role;
ALTER TABLE public.order_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.store_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_audit_log TO authenticated;
GRANT ALL ON public.store_audit_log TO service_role;
ALTER TABLE public.store_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit" ON public.store_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.audit_store_settings() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.manual_mode IS DISTINCT FROM OLD.manual_mode THEN
    INSERT INTO public.store_audit_log(actor, action, details) VALUES (auth.uid(), 'store_mode', jsonb_build_object('from', OLD.manual_mode, 'to', NEW.manual_mode));
  END IF;
  IF NEW.weekly_hours IS DISTINCT FROM OLD.weekly_hours OR NEW.date_overrides IS DISTINCT FROM OLD.date_overrides THEN
    INSERT INTO public.store_audit_log(actor, action, details) VALUES (auth.uid(), 'store_hours', jsonb_build_object('weekly_hours', NEW.weekly_hours, 'date_overrides', NEW.date_overrides));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER store_settings_audit AFTER UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.audit_store_settings();

-- Effective store status in Asia/Jerusalem. Slots are [open, close]; close <= open means it runs past midnight.
CREATE OR REPLACE FUNCTION public.store_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  st public.store_settings%ROWTYPE;
  tz text := 'Asia/Jerusalem';
  today date := (now() AT TIME ZONE tz)::date;
  d date; slots jsonb; sl jsonb; s timestamptz; e timestamptz;
  auto_open boolean := false; open_until timestamptz; next_open timestamptz;
BEGIN
  SELECT * INTO st FROM public.store_settings WHERE id = 1;
  FOR i IN -1..8 LOOP
    d := today + i;
    slots := COALESCE(st.date_overrides -> d::text, st.weekly_hours -> extract(dow FROM d)::int::text, '[]'::jsonb);
    IF jsonb_typeof(slots) <> 'array' THEN CONTINUE; END IF;
    FOR sl IN SELECT * FROM jsonb_array_elements(slots) LOOP
      BEGIN
        s := (d + (sl->>0)::time) AT TIME ZONE tz;
        e := (d + (sl->>1)::time) AT TIME ZONE tz;
        IF (sl->>1)::time <= (sl->>0)::time THEN e := ((d + 1) + (sl->>1)::time) AT TIME ZONE tz; END IF;
      EXCEPTION WHEN others THEN CONTINUE; END;
      IF s <= now() AND now() < e THEN auto_open := true; open_until := GREATEST(COALESCE(open_until, e), e); END IF;
      IF s > now() AND (next_open IS NULL OR s < next_open) THEN next_open := s; END IF;
    END LOOP;
  END LOOP;
  RETURN jsonb_build_object(
    'is_open', CASE st.manual_mode WHEN 'open' THEN true WHEN 'closed' THEN false ELSE auto_open END,
    'mode', st.manual_mode,
    'auto_open', auto_open,
    'open_until', CASE WHEN st.manual_mode = 'auto' AND auto_open THEN open_until END,
    'next_open', next_open,
    'today', COALESCE(st.date_overrides -> today::text, st.weekly_hours -> extract(dow FROM today)::int::text, '[]'::jsonb));
END $$;
GRANT EXECUTE ON FUNCTION public.store_status() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.auto_done_sweep()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE mins integer; c integer;
BEGIN
  SELECT auto_done_minutes INTO mins FROM public.store_settings WHERE id = 1;
  UPDATE public.orders SET status = 'done'
   WHERE status IN ('new','preparing') AND cancelled_at IS NULL AND updated_at < now() - make_interval(mins => coalesce(mins, 60));
  GET DIAGNOSTICS c = ROW_COUNT;
  RETURN c;
END $function$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;